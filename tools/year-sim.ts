// Guild year simulator (PLAN §9b step 2, first slice: one guild, no rivals, three classes).
// Plays N seeded years with a fixed policy for the player's side, runs the guild and resolution
// invariants on every year and reports against PLAN §2 and §4 (targets in brackets).
// Usage: node tools/year-sim.ts [years=1000] [policy=default|cautious|bold]
// Every seed plays all three policies, because the last block compares them; the runtime row is
// one policy's year, so a full run costs about three times that.
import {
  GUILD_SIZE,
  POLICIES,
  POLICY_NAMES,
  playYear,
  rules,
  type YearResult,
} from './year-sim-play.ts';

const years = Number(process.argv[2] ?? 1000);
const policyName = process.argv[3] ?? 'default';
if (!Object.hasOwn(POLICIES, policyName)) throw new Error(`Unknown policy ${policyName}.`);

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return (
    sorted[Math.min(sorted.length - 1, Math.floor((p * (sorted.length - 1)) / 100 + 0.5))] ?? 0
  );
}

function line(label: string, values: number[], target: string, digits = 1): string {
  const f = (v: number) => v.toFixed(digits);
  return `${label.padEnd(44)} median ${f(percentile(values, 50)).padStart(9)}  p10 ${f(percentile(values, 10)).padStart(9)}  p90 ${f(percentile(values, 90)).padStart(9)}  [${target}]`;
}

const results = new Map<string, YearResult[]>();
for (const name of POLICY_NAMES) results.set(name, []);
for (let n = 0; n < years; n += 1) {
  for (const name of POLICY_NAMES) results.get(name)!.push(playYear(`year-${n}`, POLICIES[name]!)); // non-null: both keys exist.
}
const rs = results.get(policyName)!; // non-null: policyName was validated.
const parties = GUILD_SIZE / rules.partySize.max;
const col = (pick: (r: YearResult) => number) => rs.map(pick);

console.log(`${years} seeded years, policy ${policyName} ${JSON.stringify(POLICIES[policyName])}`);
console.log(
  'A drawn guild of 15 with the assault approach; the §4c death targets are for a well-built reference party (D-137).',
);
console.log(
  'Surplus and spending count every coin in and out except the starting chest; fees still owed at day 336 are not counted.',
);
console.log(
  line(
    'deaths a year',
    col((r) => r.deaths),
    '~2',
  ),
);
console.log(
  line(
    'lasting injuries per death',
    col((r) => r.injuries / Math.max(1, r.deaths)),
    '~5',
  ),
);
console.log(
  line(
    'quests a year per party',
    col((r) => r.quests / parties),
    '8-12',
  ),
);
const pooled = new Map<string, [number, number]>();
for (const r of rs)
  for (const [d, [a, k]] of r.byDanger) {
    const row = pooled.get(d) ?? [0, 0];
    pooled.set(d, [row[0] + a, row[1] + k]);
  }
const targetPct: Record<string, string> = {
  routine: '0.2',
  hazardous: '0.8',
  perilous: '2.5',
  deadly: '7',
};
for (const d of ['routine', 'hazardous', 'perilous', 'deadly']) {
  const [a, k] = pooled.get(d) ?? [0, 0];
  console.log(
    `deaths per adventurer-quest, ${d}`.padEnd(44) +
      ` pooled ${((100 * k) / Math.max(1, a)).toFixed(2)}% of ${a} adventurer-quests  [${targetPct[d]}% for the reference party, D-137]`,
  );
}
console.log(
  line(
    'wages share of spending (%)',
    col((r) => (100 * r.wagesCopper) / r.spendingCopper),
    '55-65',
  ),
);
console.log(
  line(
    'year-end surplus (% of spending)',
    col((r) => (100 * r.surplusCopper) / r.spendingCopper),
    '+10..20; tuned by fees, not a finding',
  ),
);
console.log(
  line(
    'lowest chest (copper)',
    col((r) => r.lowestChest),
    'not far below 0',
    0,
  ),
);
console.log(
  line(
    'weeks in debt',
    col((r) => r.weeksInDebt),
    'few',
  ),
);
console.log(
  line(
    'chest at week 37 (copper)',
    col((r) => r.winterStartChest),
    'enough for winter',
    0,
  ),
);
console.log(
  line(
    'lowest chest in winter (copper)',
    col((r) => r.winterLowestChest),
    '>= 0',
    0,
  ),
);
console.log(
  line(
    'recruits signed a year',
    col((r) => r.recruits),
    '~4',
  ),
);
console.log(
  line(
    'stop days a year, total',
    col((r) => r.stopDays),
    '~80, at most 100',
  ),
);
for (const key of [
  'must',
  'digest',
  'week-report',
  'assembly',
  'new-contracts',
  'death',
  'signing-window',
  'party-home',
])
  console.log(
    line(
      `  stop days: ${key}`,
      col((r) => r.stopDaysByKey.get(key) ?? 0),
      '',
      1,
    ),
  );
console.log(
  line(
    'runtime per simulated year (s)',
    col((r) => r.seconds),
    'under 1',
    3,
  ),
);

console.log(
  '\nNo dominant safe play (PLAN §9d): share of seeds where each policy ends with the most',
);
for (const metric of ['finalChest', 'renown'] as const) {
  const wins = new Map<string, number>(POLICY_NAMES.map((p) => [p, 0]));
  for (let n = 0; n < years; n += 1) {
    const values = POLICY_NAMES.map((p) => results.get(p)![n]![metric]); // non-null: n < years.
    const best = Math.max(...values);
    POLICY_NAMES.forEach((p, i) => {
      if (values[i] === best) wins.set(p, wins.get(p)! + 1); // non-null: seeded above.
    });
  }
  const label = metric === 'finalChest' ? 'money' : 'renown';
  console.log(
    `  ${label}: ` +
      POLICY_NAMES.map((p) => `${p} ${((100 * wins.get(p)!) / years).toFixed(1)}%`).join(', ') + // non-null: seeded above.
      ' (ties count for each)',
  );
}
for (const p of POLICY_NAMES) {
  const r = results.get(p)!;
  const med = (pick: (x: YearResult) => number) => percentile(r.map(pick), 50);
  console.log(
    `  ${p}: median chest ${med((x) => x.finalChest)}, renown ${med((x) => x.renown)}, deaths ${med((x) => x.deaths)}, quests ${med((x) => x.quests)}`,
  );
}
