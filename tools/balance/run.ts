// Balance runner (tools/balance/README.md): plays a named scenario's seeded careers and reports
// every metric with a 95% interval against its target; pairs seed by seed with the stored baseline
// (--compare) or sweeps one content number (--sweep); --save stores the run as the new baseline.
// Usage: node tools/balance/run.ts <scenario> [--careers N] [--years N] [--policy P] [--party P]
//   [--set path=value ...] [--sweep path=v1,v2,...] [--compare] [--save] [--json file] [--list]
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { contentFor, type Career, type CareerSetup } from '../career-play.ts';
import { loadBaseline, saveBaseline, hashCareer, type Settings } from './baseline.ts';
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
const settings: Settings = {
  ...defaults,
  ...(opts.careers ? { careers: Number(opts.careers) } : {}),
  ...(opts.years ? { years: Number(opts.years) } : {}),
  ...(opts.policy ? { policy: opts.policy } : {}),
  ...(opts.party ? { party: opts.party } : {}),
};
if (settings.house === 'on' && settings.staff !== 'off')
  throw new Error('The house plays with staff off.');
if (settings.incidents === 'on' && settings.house !== 'on')
  throw new Error('Incidents need the house.');
const overrides = (opts.set ?? []).map(parseOverride);
if (opts.save && overrides.length > 0)
  throw new Error('--save stores the content as written; drop --set.');
if (opts.save && opts.sweep) throw new Error('--save and --sweep do not go together.');

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

/** The baseline's first n careers, or null with the reason it can't be paired. */
function baselineCareers(n: number): Career[] | string {
  if (!baseline) return `no baseline for ${name}; run with --save on main first`;
  if (baseline.careers.length < n)
    return `the baseline has ${baseline.careers.length} careers; use --careers ${baseline.careers.length} or fewer`;
  return baseline.careers.slice(0, n).map((c) => c.career);
}

if (opts.sweep) {
  const at = opts.sweep.indexOf('=');
  const path = opts.sweep.slice(0, at);
  const values = opts.sweep.slice(at + 1).split(',');
  if (at <= 0 || values.some((v) => v === '')) throw new Error('--sweep needs path=v1,v2,...');
  const variants = values.map((v) => [...overrides, parseOverride(`${path}=${v}`)]);
  // The reference: the run without the swept number changed, from the baseline when it pairs.
  const stored = overrides.length === 0 ? baselineCareers(settings.careers) : 'overrides set';
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
    const same = careers.filter((c, i) => hashCareer(c) === baseline.careers[i]!.hash).length; // non-null: baseline has at least as many careers.
    const before: Record<string, unknown> = baseline.settings;
    const changed = Object.entries(settings).filter(([k, v]) => k !== 'careers' && before[k] !== v);
    console.log(
      `baseline: commit ${baseline.commit}${changed.length ? `; this run changes ${changed.map(([k, v]) => `${k} ${String(before[k])} → ${v}`).join(', ')}` : ''}`,
    );
    // Only a run of the same scenario and content asks whether a code change kept the balance.
    if (changed.length === 0 && overrides.length === 0)
      console.log(
        `identical to the baseline: ${same} of ${careers.length} careers${same === careers.length ? ' (every recorded number matches)' : ''}`,
      );
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
      overrides: [],
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
