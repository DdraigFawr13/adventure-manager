// Balance runner (tools/balance/README.md): plays a named scenario's seeded careers and reports
// every metric with a 95% interval against its target; pairs seed by seed with the stored baseline
// (--compare) or sweeps one content number (--sweep); --save stores the run as the new baseline.
// Usage: node tools/balance/run.ts <scenario> [--careers N] [--years N] [--policy P] [--party P]
//   [--set path=value ...] [--sweep path=v1,v2,...] [--compare] [--save [--force]] [--json file] [--list]
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { contentFor, type Career, type CareerSetup } from '../career-play.ts';
import { POLICIES } from '../year-sim-play.ts';
import { baseFoundingRules } from '@adventure-manager/content';
import {
  hashCareer,
  hashContent,
  inHistory,
  loadBaseline,
  saveBaseline,
  treeIsDirty,
  type Settings,
} from './baseline.ts';
import { METRICS, metricsFor, type MetricContext } from './metrics.ts';
import { parseOverride, type Override } from './overrides.ts';
import { playCareers } from './pool.ts';
import { printRows, printSweep, rows } from './report.ts';
import { SCENARIOS } from './scenarios.ts';
import { resamples } from './stats.ts';

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    careers: { type: 'string' },
    years: { type: 'string' },
    policy: { type: 'string' },
    party: { type: 'string' },
    set: { type: 'string', multiple: true },
    sweep: { type: 'string' },
    compare: { type: 'boolean' },
    save: { type: 'boolean' },
    json: { type: 'string' },
    list: { type: 'boolean' },
    force: { type: 'boolean' },
  },
});

if (opts.list || positionals.length === 0) {
  console.log('Scenarios:');
  for (const [name, s] of Object.entries(SCENARIOS))
    console.log(`  ${name.padEnd(16)} ${s.description} (${s.careers} careers × ${s.years} years)`);
  console.log('Metrics:');
  for (const m of METRICS) console.log(`  ${m.id.padEnd(24)} ${m.label}`);
  process.exit(0);
}

const name = positionals[0]!; // non-null: checked above.
const scenario = SCENARIOS[name];
if (!scenario) throw new Error(`Unknown scenario ${name}; --list shows them.`);
const { description: _description, ...defaults } = scenario;
const count = (flag: string, text: string | undefined, fallback: number) => {
  if (text === undefined) return fallback;
  const n = Number(text);
  if (!Number.isInteger(n) || n < 1) throw new Error(`--${flag} needs a whole number above 0.`);
  return n;
};
const settings: Settings = {
  ...defaults,
  careers: count('careers', opts.careers, defaults.careers),
  years: count('years', opts.years, defaults.years),
  policy: opts.policy ?? defaults.policy,
  party: opts.party ?? defaults.party,
};
if (!Object.hasOwn(POLICIES, settings.policy))
  throw new Error(`Unknown policy ${settings.policy}.`);
if (!baseFoundingRules.characters.some((c) => c.id === settings.party))
  throw new Error(`Unknown party ${settings.party}.`);
if (settings.house === 'on' && settings.staff !== 'off')
  throw new Error('The house plays with staff off.');
if (settings.incidents === 'on' && settings.house !== 'on')
  throw new Error('Incidents need the house.');
const overrides = (opts.set ?? []).map(parseOverride);
if (opts.save) {
  if (overrides.length > 0 || opts.sweep)
    throw new Error('--save stores one plain run; drop --set and --sweep.');
  // A baseline is the scenario as defined, played on committed code, so later runs pair with it.
  if (!opts.force && (opts.careers || opts.years || opts.policy || opts.party))
    throw new Error(
      '--save stores the scenario as defined; drop --careers, --years, --policy and --party (or add --force).',
    );
  if (!opts.force && treeIsDirty())
    throw new Error(
      '--save needs committed code and content, so the baseline names a real commit (or add --force).',
    );
}

const setupFor = (s: Settings, o: readonly Override[]): CareerSetup => ({
  maxYears: s.years,
  staffMode: s.staff === 'off' ? 'off' : 'compare',
  size: s.size,
  refuseGrants: s.grants === 'refuse',
  houseMode: s.house,
  incidentsMode: s.incidents,
  ...(o.length > 0 ? { overrides: o } : {}),
});
const jobsFor = (s: Settings, o: readonly Override[]) => {
  const setup = setupFor(s, o);
  // Checks every override path before any thread starts.
  contentFor(setup);
  return Array.from({ length: s.careers }, (_, n) => ({
    setup,
    job: {
      seed: `career-${n}`,
      policy: s.policy,
      delegate: s.staff === 'delegated',
      party: s.party,
    },
  }));
};

const content = contentFor(setupFor(settings, overrides));
const contentHash = hashContent(contentFor(setupFor(settings, [])));
const ctx: MetricContext = {
  startCopper: content.guild.founding?.purseCopper ?? content.guild.startingChestCopper,
  house: settings.house === 'on',
  incidents: settings.incidents === 'on',
};
const metrics = metricsFor(ctx);
const draws = resamples(settings.careers);
const baseline = opts.save ? null : loadBaseline(name);
const started = performance.now();

console.log(`${name}: ${scenario.description}`);
console.log(
  `${settings.careers} careers × ${settings.years} years, policy ${settings.policy}${settings.house === 'on' ? `, ${settings.party} party` : ''}${overrides.length ? `; set ${overrides.map((o) => `${o.path}=${o.value}`).join(', ')}` : ''}`,
);

// How this run differs from the baseline: its settings, and the content as written.
const before: Record<string, unknown> = baseline?.settings ?? {};
const changed = baseline
  ? Object.entries(settings).filter(([k, v]) => k !== 'careers' && before[k] !== v)
  : [];
const contentMoved = baseline !== null && baseline.contentHash !== contentHash;

/** The baseline's first n careers, or the reason they can't be paired. */
function baselineCareers(n: number): Career[] | string {
  if (!baseline) return `no baseline for ${name}; run with --save on main first`;
  if (baseline.careers.length < n)
    return `the baseline has ${baseline.careers.length} careers; use --careers ${baseline.careers.length} or fewer`;
  const kept = baseline.careers.slice(0, n);
  const astray = kept.findIndex((c, i) => c.seed !== `career-${i}`);
  if (astray >= 0) return `the baseline's career ${astray} has seed ${kept[astray]!.seed}`; // non-null: an index of kept.
  return kept.map((c) => c.career);
}

/** The baseline's commit, and warnings that make its comparison mean something else. */
function describeBaseline(): void {
  if (!baseline) return;
  console.log(
    `baseline: commit ${baseline.commit}${inHistory(baseline.commit) ? '' : " (not in this branch's history)"}${changed.length ? `; this run changes ${changed.map(([k, v]) => `${k} ${String(before[k])} → ${v}`).join(', ')}` : ''}`,
  );
  if (contentMoved)
    console.log(
      "WARNING: the content as written differs from the baseline's; changes below include it (re-save the baseline if that change is merged).",
    );
}

if (opts.sweep) {
  const at = opts.sweep.indexOf('=');
  const path = opts.sweep.slice(0, at);
  const values = opts.sweep.slice(at + 1).split(',');
  if (at <= 0 || values.some((v) => v.trim() === ''))
    throw new Error('--sweep needs path=v1,v2,...');
  const variants = values.map((v) => [...overrides, parseOverride(`${path}=${v}`)]);
  // The reference is the run without the swept number changed: the baseline only when it is this
  // very run (same settings and content, no other --set); otherwise it is played here.
  const stored =
    overrides.length > 0
      ? 'other --set given'
      : changed.length > 0 || contentMoved
        ? 'the baseline was played another way'
        : baselineCareers(settings.careers);
  const reference = typeof stored === 'string' ? jobsFor(settings, overrides) : [];
  const items = [...reference, ...variants.flatMap((o) => jobsFor(settings, o))];
  const played = await playCareers(items);
  const ref = typeof stored === 'string' ? played.slice(0, settings.careers) : stored;
  const rest = played.slice(reference.length);
  console.log(
    `sweep ${path}; reference: ${typeof stored === 'string' ? `played this run (${stored})` : `baseline ${baseline?.commit}`}\n`,
  );
  printSweep(
    metrics,
    ctx,
    ref,
    values.map((v, i) => ({
      label: `${v}`,
      careers: rest.slice(i * settings.careers, (i + 1) * settings.careers),
    })),
    draws,
  );
  finish(items.length);
} else {
  const items = jobsFor(settings, overrides);
  const careers = await playCareers(items);
  const reference = opts.compare ? baselineCareers(settings.careers) : null;
  if (typeof reference === 'string') console.log(`(no comparison: ${reference})`);
  const paired = Array.isArray(reference) ? reference : undefined;
  if (paired && baseline) {
    describeBaseline();
    // Only a run of the same scenario and content asks whether a code change kept the balance.
    if (changed.length === 0 && overrides.length === 0) {
      const same = careers.filter((c, i) => hashCareer(c) === baseline.careers[i]!.hash).length; // non-null: baselineCareers checked the length.
      console.log(
        `identical to the baseline: ${same} of ${careers.length} careers${same === careers.length ? ' (every recorded number matches)' : ''}`,
      );
    }
  }
  console.log('');
  const table = rows(metrics, ctx, careers, draws, paired);
  printRows(table, metrics, paired ? 'baseline' : undefined);
  if (opts.json)
    writeFileSync(
      opts.json,
      `${JSON.stringify({ scenario: name, settings, overrides, rows: table }, null, 2)}\n`,
    );
  if (opts.save) {
    const file = saveBaseline({
      scenario: name,
      settings,
      contentHash,
      careers: careers.map((c, i) => ({ seed: `career-${i}`, hash: hashCareer(c), career: c })),
    });
    console.log(`\nsaved the baseline: ${file}`);
  }
  finish(items.length);
}

function finish(played: number): void {
  const seconds = (performance.now() - started) / 1000;
  console.log(
    `\n${played} careers played in ${seconds.toFixed(1)} s (intervals: ${draws.length} resamples of the seeds)`,
  );
}
