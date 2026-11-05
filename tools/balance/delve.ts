// Delve mode of the balance runner (spec "Balance"; tools/balance/README.md "Delves"): plays
// seeded barrow delves with the sample party and reports each metric with a 95% interval, paired
// with the stored baseline (--compare), with the careful player (--compare-policy careful), or
// across values of one content number (--sweep).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { gate1Content } from '@adventure-manager/content';
import type { ResolutionContent } from '@adventure-manager/engine';
import { inHistory, treeIsDirty } from './baseline.ts';
import { playDelve, type DelvePolicy, type DelveResult } from './delve-player.ts';
import { applyOverrides, parseOverride, type Override } from './overrides.ts';
import type { Target } from './metrics.ts';
import { estimate, paired, resamples, type Estimate } from './stats.ts';

export interface DelveScenario {
  readonly description: string;
  readonly policy: DelvePolicy;
  readonly delves: number;
}

export const DELVE_SCENARIOS: Readonly<Record<string, DelveScenario>> = {
  'delve-careful': {
    description: 'Barrow delves, sample party, the scripted careful player leads every fight.',
    policy: 'careful',
    delves: 1000,
  },
  'delve-auto': {
    description: 'Barrow delves, sample party, Auto (save skills for the boss) in every fight.',
    policy: 'auto',
    delves: 1000,
  },
};

interface DelveMetric {
  readonly id: string;
  readonly label: string;
  readonly digits: number;
  readonly compute: (rs: DelveResult[]) => number;
  readonly target?: Target;
  /** The policy the target is for; other policies show the metric without a verdict. */
  readonly policy?: DelvePolicy;
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN);
const share = (rs: DelveResult[], keep: (r: DelveResult) => boolean) =>
  rs.length ? (100 * rs.filter(keep).length) / rs.length : NaN;

export const DELVE_METRICS: readonly DelveMetric[] = [
  {
    id: 'deadly-delves',
    label: 'Delves that cost a life (%)',
    digits: 1,
    compute: (rs) => share(rs, (r) => r.deaths > 0),
    // Spec Goals (D-229): played well, 8–12% of delves cost at least one life.
    target: { min: 8, max: 12, source: 'spec Goals, D-229' },
    policy: 'careful',
  },
  {
    id: 'deaths',
    label: 'Deaths a delve',
    digits: 2,
    compute: (rs) => mean(rs.map((r) => r.deaths)),
  },
  {
    id: 'won',
    label: 'Won (%)',
    digits: 1,
    compute: (rs) => share(rs, (r) => r.outcome === 'won'),
  },
  {
    id: 'retreated',
    label: 'Retreated (%)',
    digits: 1,
    compute: (rs) => share(rs, (r) => r.outcome === 'retreated'),
  },
  {
    id: 'routed',
    label: 'Routed (%)',
    digits: 1,
    compute: (rs) => share(rs, (r) => r.outcome === 'routed'),
  },
  {
    id: 'health',
    label: 'Health left at the end (%)',
    digits: 1,
    compute: (rs) => mean(rs.map((r) => r.healthBp / 100)),
  },
  {
    id: 'uses',
    label: 'Skill uses left at the end',
    digits: 1,
    compute: (rs) => mean(rs.map((r) => r.skillUsesLeft)),
  },
  {
    id: 'rounds',
    label: 'Rounds a fight',
    digits: 2,
    compute: (rs) => mean(rs.flatMap((r) => r.rounds)),
    // D-218: a fight takes about 3–5 minutes; rounds are this runner's stand-in until timed.
  },
  {
    id: 'stalled',
    label: 'Stalled fights',
    digits: 0,
    compute: (rs) => rs.reduce((s, r) => s + r.stalled, 0),
    target: { max: 0, source: 'spec "Balance"' },
  },
  {
    id: 'injuries',
    label: 'Injuries a delve',
    digits: 2,
    compute: (rs) => mean(rs.map((r) => r.injuries)),
  },
  { id: 'parts', label: 'Parts a delve', digits: 2, compute: (rs) => mean(rs.map((r) => r.parts)) },
];

const DIR = new URL('./baselines/', import.meta.url);
const fileFor = (name: string) => new URL(`${name}.jsonl.gz`, DIR);
const hash = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);
const git = (...args: string[]) => execFileSync('git', args, { stdio: 'pipe' }).toString().trim();

interface Stored {
  readonly scenario: string;
  readonly policy: DelvePolicy;
  readonly contentHash: string;
  readonly commit: string;
  readonly results: DelveResult[];
}

function load(name: string): Stored | null {
  if (!existsSync(fileFor(name))) return null;
  const [head, ...lines] = gunzipSync(readFileSync(fileFor(name)))
    .toString('utf8')
    .trim()
    .split('\n');
  // cast-ok: written by save below, one header line then one result per seed.
  const header = JSON.parse(head ?? '{}') as Omit<Stored, 'results'>;
  // cast-ok: as above.
  return { ...header, results: lines.map((l) => JSON.parse(l) as DelveResult) };
}

function save(stored: Omit<Stored, 'commit'>): string {
  const commit = `${git('rev-parse', '--short', 'HEAD')}${treeIsDirty() ? '+changes' : ''}`;
  const { results, ...header } = stored;
  const text = [JSON.stringify({ ...header, commit }), ...results.map((r) => JSON.stringify(r))];
  mkdirSync(DIR, { recursive: true });
  writeFileSync(fileFor(stored.scenario), gzipSync(`${text.join('\n')}\n`, { level: 9 }));
  return fileFor(stored.scenario).pathname;
}

const play = (policy: DelvePolicy, n: number, content: ResolutionContent): DelveResult[] =>
  Array.from({ length: n }, (_, i) => playDelve(`delve-${i}`, policy, content));

const fmt = (v: number, d: number) => (Number.isFinite(v) ? v.toFixed(d) : '—');
const span = (e: Estimate, d: number) => `${fmt(e.low, d)}–${fmt(e.high, d)}`;
const signed = (v: number, d: number) => (v > 0 ? `+${fmt(v, d)}` : fmt(v, d));
const targetText = (t?: Target) =>
  !t
    ? ''
    : `${t.min !== undefined && t.max !== undefined ? `${t.min}–${t.max}` : t.min !== undefined ? `≥ ${t.min}` : `≤ ${t.max}`} (${t.source})`;

/** Spec J6: ok only when the whole 95% interval lies inside the band; near when it reaches it. */
function verdict(e: Estimate, t: Target | undefined): string {
  if (!t || ![e.value, e.low, e.high].every(Number.isFinite)) return '';
  const lowOk = t.min === undefined || e.low >= t.min;
  const highOk = t.max === undefined || e.high <= t.max;
  if (lowOk && highOk) return 'ok';
  const reaches =
    (t.min === undefined || e.high >= t.min) && (t.max === undefined || e.low <= t.max);
  return reaches ? 'near' : 'OFF';
}

/** D-220's checks of Auto against the careful player, paired by seed (spec Goals, J6). */
function printAutoChecks(careful: DelveResult[], auto: DelveResult[], draws: number[][]): void {
  const metric = (id: string) => DELVE_METRICS.find((m) => m.id === id)!;
  const change = (id: string) => paired(careful, auto, metric(id).compute, draws).change;
  const won = change('won');
  const health = change('health');
  const uses = change('uses');
  const line = (label: string, e: Estimate, ok: boolean) =>
    console.log(
      `  ${label.padEnd(44)} ${signed(e.value, 1)} [${span(e, 1)}]  ${ok ? 'ok' : 'NOT MET'}`,
    );
  console.log('\nD-220, Auto against the careful player (change = Auto minus careful):');
  line('Win rate within 5 points', won, won.low >= -5 && won.high <= 5);
  line('Less health left at the end', health, health.high < 0);
  line('Fewer skill uses left (reported, not tuned)', uses, uses.high < 0);
}

function printTable(
  policy: DelvePolicy,
  results: DelveResult[],
  draws: number[][],
  ref?: { name: string; results: DelveResult[] },
) {
  const w = Math.max(...DELVE_METRICS.map((m) => m.label.length));
  const target = (m: DelveMetric) =>
    m.policy === undefined || m.policy === policy ? m.target : undefined;
  for (const m of DELVE_METRICS) {
    if (ref) {
      const both = paired(ref.results, results, m.compute, draws);
      const moved = both.change.low > 0 || both.change.high < 0;
      console.log(
        `${m.label.padEnd(w)}  ${fmt(m.compute([...ref.results]), m.digits).padStart(8)} → ${`${fmt(both.now.value, m.digits)} [${span(both.now, m.digits)}]`.padEnd(24)} ${`${signed(both.change.value, m.digits)} [${span(both.change, m.digits)}]`.padEnd(24)} ${moved ? 'MOVED' : '     '}  ${verdict(both.now, target(m)).padEnd(4)} ${targetText(target(m))}`,
      );
    } else {
      const e = estimate(results, m.compute, draws);
      console.log(
        `${m.label.padEnd(w)}  ${`${fmt(e.value, m.digits)} [${span(e, m.digits)}]`.padEnd(26)} ${verdict(e, target(m)).padEnd(4)} ${targetText(target(m))}`,
      );
    }
  }
  if (ref)
    console.log(
      `\n${ref.name} → this run; change paired by seed, 95% interval. MOVED: the interval excludes 0.`,
    );
}

export interface DelveOptions {
  readonly delves?: string | undefined;
  readonly set?: readonly string[] | undefined;
  readonly sweep?: string | undefined;
  readonly compare?: boolean | undefined;
  readonly comparePolicy?: string | undefined;
  readonly save?: boolean | undefined;
  readonly force?: boolean | undefined;
  readonly json?: string | undefined;
}

export function runDelveScenario(name: string, opts: DelveOptions): void {
  const scenario = DELVE_SCENARIOS[name];
  if (!scenario) throw new Error(`Unknown delve scenario ${name}.`);
  const started = performance.now();
  const n = opts.delves === undefined ? scenario.delves : Number(opts.delves);
  if (!Number.isInteger(n) || n < 1) throw new Error('--delves needs a whole number above 0.');
  const overrides: Override[] = (opts.set ?? []).map(parseOverride);
  if (opts.save && (overrides.length || opts.sweep || opts.delves !== undefined))
    throw new Error('--save stores the scenario as defined; drop --set, --sweep and --delves.');
  if (opts.save && !opts.force && treeIsDirty())
    throw new Error('--save needs committed code and content (or add --force).');
  const contentFor = (o: readonly Override[]) => applyOverrides(gate1Content, o);
  const content = contentFor(overrides);
  const contentHash = hash(JSON.stringify(gate1Content));
  const draws = resamples(n);
  console.log(`${name}: ${scenario.description}`);
  console.log(
    `${n} delves (seeds delve-0 … delve-${n - 1})${overrides.length ? `; set ${overrides.map((o) => `${o.path}=${o.value}`).join(', ')}` : ''}\n`,
  );
  if (opts.sweep) {
    const at = opts.sweep.indexOf('=');
    const path = opts.sweep.slice(0, at);
    const values = opts.sweep.slice(at + 1).split(',');
    if (at <= 0 || values.some((v) => v.trim() === ''))
      throw new Error('--sweep needs path=v1,v2,...');
    const reference = play(scenario.policy, n, content);
    const variants = values.map((v) => ({
      label: v,
      results: play(scenario.policy, n, contentFor([...overrides, parseOverride(`${path}=${v}`)])),
    }));
    const w = Math.max(...DELVE_METRICS.map((m) => m.label.length));
    console.log(
      `sweep ${path}\n${''.padEnd(w)}  ${'now'.padStart(10)}${values.map((v) => v.padStart(20)).join('')}`,
    );
    for (const m of DELVE_METRICS) {
      const cells = variants.map((v) => {
        const c = paired(reference, v.results, m.compute, draws).change;
        return `${fmt(m.compute([...v.results]), m.digits)} (${signed(c.value, m.digits)})${c.low > 0 || c.high < 0 ? '*' : ' '}`.padStart(
          20,
        );
      });
      console.log(
        `${m.label.padEnd(w)}  ${fmt(m.compute([...reference]), m.digits).padStart(10)}${cells.join('')}  ${targetText(m.target)}`,
      );
    }
    console.log(
      '\n(change from now, paired by seed); * the 95% interval of the change excludes 0.',
    );
  } else {
    const results = play(scenario.policy, n, content);
    let ref: { name: string; results: DelveResult[] } | undefined;
    if (opts.comparePolicy) {
      const policy = opts.comparePolicy;
      if (policy !== 'careful' && policy !== 'auto')
        throw new Error('--compare-policy is careful or auto.');
      ref = { name: `the ${policy} player`, results: play(policy, n, content) };
    } else if (opts.compare) {
      const stored = load(name);
      if (!stored)
        console.log(`(no comparison: no baseline for ${name}; run with --save on main first)`);
      else if (stored.results.length < n)
        console.log(`(no comparison: the baseline has ${stored.results.length} delves)`);
      else {
        console.log(
          `baseline: commit ${stored.commit}${inHistory(stored.commit) ? '' : " (not in this branch's history)"}`,
        );
        if (stored.contentHash !== contentHash)
          console.log("WARNING: the content as written differs from the baseline's.");
        const base = stored.results.slice(0, n);
        const same = results.filter((r, i) => JSON.stringify(r) === JSON.stringify(base[i])).length;
        if (!overrides.length) console.log(`identical to the baseline: ${same} of ${n} delves`);
        ref = { name: 'baseline', results: base };
      }
      console.log('');
    }
    printTable(scenario.policy, results, draws, ref);
    if (opts.comparePolicy === 'careful' && scenario.policy === 'auto' && ref)
      printAutoChecks(ref.results, results, draws);
    if (opts.json)
      writeFileSync(
        opts.json,
        `${JSON.stringify({ scenario: name, n, overrides, results }, null, 2)}\n`,
      );
    if (opts.save)
      console.log(
        `\nsaved the baseline: ${save({ scenario: name, policy: scenario.policy, contentHash, results })}`,
      );
  }
  console.log(`\nplayed in ${((performance.now() - started) / 1000).toFixed(1)} s`);
}
