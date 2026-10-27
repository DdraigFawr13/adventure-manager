// Career simulator (PLAN §9b step 2: R2, R3, R9, §9d; D-140, D-141): plays seeded guilds from
// their founding until the guildmaster's career ends (or a cap), with careers on, rivals abstract,
// and the one-year simulator's player policy. The invariants run over every career.
// Usage: node tools/career-sim.ts [careers=100] [maxYears=40] [policy=default|cautious|bold|compare]
//   [staff=off|compare] [size=15, or 7 with house=on] [grants=take|refuse] [house=off|on]
//   [party=balanced|seasoned|green|compare] [incidents=off|on]
// With policy=compare, each seed is also played cautious and bold, for §9d's no-dominant-safe-play check.
// With staff=compare, each seed is played hands-on (the guildmaster runs training and recovery)
// and delegated (the best affordable hire runs both), and R6 compares the two (staff/SPEC.md).
// With house=on, the guild plays with the house rules and builds the content's fullHousePlan one
// job at a time (house/SPEC.md, D-172); the house lines are added to the report.
// With incidents=on (house=on only) the house has fire, theft and sickness incidents and inn lodgers
// (house/SPEC.md); the simulator never answers a letter, so every one takes the default (D-192).
// With house=on the guild is founded through the draft (D-188): the player picks the starter party of
// the character named by party (default balanced) and the 2 cheapest extras. With party=compare, each
// seed is played with all three characters and the report compares them (dismissals, year-1 chest,
// first-year renown, bad starts); the main report is the balanced party's. The size is unused then.
// Careers run on worker threads across the machine's cores (tools/balance/pool.ts, D-148).
// For named scenarios, targets with intervals and baselines, use tools/balance/run.ts.
import { PLAYER_ID } from '@adventure-manager/engine';
import {
  baseFoundingRules,
  careerGuildRules,
  fullHousePlan,
  houseGuildRules,
  houseIncidentGuildRules,
} from '@adventure-manager/content';
import { pct, type Career, type CareerJob, type CareerSetup } from './career-play.ts';
import { GUILD_SIZE, POLICIES } from './year-sim-play.ts';
import { playCareers } from './balance/pool.ts';

const careers = Number(process.argv[2] ?? 100);
const maxYears = Number(process.argv[3] ?? 40);
const policyArg = process.argv[4] ?? 'default';
const comparePolicies = policyArg === 'compare';
const policyName = comparePolicies ? 'default' : policyArg;
if (!Object.hasOwn(POLICIES, policyName)) throw new Error(`Unknown policy ${policyName}.`);
const staffMode = process.argv[5] ?? 'off';
if (staffMode !== 'off' && staffMode !== 'compare')
  throw new Error(`Unknown staff mode ${staffMode}.`);
// With the house on, the founded roster defaults to the house's start (D-187: one party and backups).
const HOUSE_START_SIZE = 7;
const size = Number(process.argv[6] ?? (process.argv[8] === 'on' ? HOUSE_START_SIZE : GUILD_SIZE));
const grantsArg = process.argv[7] ?? 'take';
if (grantsArg !== 'take' && grantsArg !== 'refuse')
  throw new Error(`Unknown grants mode ${grantsArg}.`);
const refuseGrants = grantsArg === 'refuse';
const houseMode = process.argv[8] ?? 'off';
if (houseMode !== 'off' && houseMode !== 'on') throw new Error(`Unknown house mode ${houseMode}.`);
if (houseMode === 'on' && staffMode !== 'off')
  throw new Error('house=on plays one side; use staff=off.');
const partyArg = process.argv[9] ?? 'balanced';
const CHARACTERS = baseFoundingRules.characters.map((c) => c.id);
const compareParties = partyArg === 'compare';
const partyName = compareParties ? 'balanced' : partyArg;
if (!CHARACTERS.includes(partyName)) throw new Error(`Unknown party ${partyName}.`);
const incidentsMode = process.argv[10] ?? 'off';
if (incidentsMode !== 'off' && incidentsMode !== 'on')
  throw new Error(`Unknown incidents mode ${incidentsMode}.`);
if (incidentsMode === 'on' && houseMode !== 'on') throw new Error('incidents=on needs house=on.');
const setup: CareerSetup = {
  maxYears,
  staffMode,
  size,
  refuseGrants,
  houseMode,
  incidentsMode,
};
const TIERS = ['bottom', 'middle', 'top'];

const line = (label: string, values: number[], target: string, digits = 1) =>
  `${label.padEnd(46)} median ${pct(values, 50).toFixed(digits).padStart(7)}  p10 ${pct(values, 10).toFixed(digits).padStart(7)}  p90 ${pct(values, 90).toFixed(digits).padStart(7)}  [${target}]`;

// Every career to play, in report order: each seed by the default (or chosen) policy, then as
// the comparisons ask.
const jobs: CareerJob[] = [];
for (let n = 0; n < careers; n += 1) {
  const seed = `career-${n}`;
  jobs.push({ seed, policy: policyName, delegate: false, party: partyName });
  if (compareParties && houseMode === 'on')
    for (const party of CHARACTERS.filter((c) => c !== partyName))
      jobs.push({ seed, policy: policyName, delegate: false, party });
  if (staffMode === 'compare')
    jobs.push({ seed, policy: policyName, delegate: true, party: partyName });
  if (comparePolicies) {
    jobs.push({ seed, policy: 'cautious', delegate: false, party: partyName });
    jobs.push({ seed, policy: 'bold', delegate: false, party: partyName });
  }
}
const played = await playAll(jobs);
const pick = (keep: (job: CareerJob) => boolean) => played.filter((_, i) => keep(jobs[i]!)); // non-null: one result per job.
const results = pick((j) => j.policy === policyName && !j.delegate && j.party === partyName);
const delegated = pick((j) => j.delegate);
const cautious = comparePolicies ? pick((j) => j.policy === 'cautious') : [];
const bold = comparePolicies ? pick((j) => j.policy === 'bold') : [];

function playAll(all: readonly CareerJob[]): Promise<Career[]> {
  return playCareers(all.map((job) => ({ setup, job })));
}

console.log(
  `${careers} careers, policy ${policyName}, staff ${staffMode === 'compare' ? 'hands-on (delegated below)' : 'off'}${houseMode === 'on' ? ', house on' : ''}, cap ${maxYears} years; a founded guild of ${houseMode === 'on' ? `the ${partyName} party and 2 extras` : size} in the bottom tier (assumptions: packages/content/src/base/career.ts)`,
);
console.log(
  line(
    'R9 guildmaster career (years)',
    results.map((r) => r.years),
    'median 20-30',
  ),
);
const ends = new Map<string, number>();
for (const r of results) ends.set(r.end, (ends.get(r.end) ?? 0) + 1);
console.log(
  `  how careers ended: ${[...ends].map(([k, v]) => `${k} ${((100 * v) / careers).toFixed(0)}%`).join(', ')}`,
);
const promoted = results.filter((r) => r.firstPromotion !== null).map((r) => r.firstPromotion!); // non-null: filtered.
console.log(
  line('R2 first promotion (year), of those promoted', promoted, 'a well-run founded guild: 3-5'),
);
console.log(
  `  promoted at least once: ${((100 * promoted.length) / careers).toFixed(0)}% of careers`,
);
const reachedTop = results.filter((r) => r.tierByYear.includes(2)).length;
console.log(
  `  reached the top tier: ${((100 * reachedTop) / careers).toFixed(0)}% (estimate in PLAN §4e: 8-12 years for a well-run guild)`,
);
const yearsIn = [0, 0, 0];
for (const r of results) for (const t of r.tierByYear) if (t !== undefined) yearsIn[t]! += 1; // non-null: three tiers.
const total = yearsIn.reduce((a, b) => a + b, 0);
console.log(
  `  share of settled years in each tier: ${TIERS.map((t, i) => `${t} ${((100 * yearsIn[i]!) / Math.max(1, total)).toFixed(0)}%`).join(', ')}`,
); // non-null: three tiers.

// Runaway rival (R2): in the first 30 years, one rival tops the top tier in more than 2/3 of them.
let runaway = 0;
for (const r of results) {
  // Every settled year counts, the player's wins included; only a rival can be the runaway.
  const span = r.topLeaders.slice(0, 30).filter(Boolean);
  if (span.length < 10) continue;
  const counts = new Map<string, number>();
  for (const id of span) if (id !== PLAYER_ID) counts.set(id, (counts.get(id) ?? 0) + 1);
  if (Math.max(0, ...counts.values()) > (2 * span.length) / 3) runaway += 1;
}
console.log(
  `R2 runaway rival (tops the top tier in over 2/3 of the first 30 years): ${runaway} of ${careers} careers [none]`,
);

const byTier = (pick: (r: Career, y: number) => number | undefined) =>
  TIERS.map((_, t) =>
    results.flatMap((r) =>
      r.tierByYear
        .map((tier, y) => (tier === t ? pick(r, y) : undefined))
        .filter((v): v is number => v !== undefined),
    ),
  );
const deaths = byTier((r, y) => r.deathsByYear[y] ?? 0);
const stops = byTier((r, y) => r.stopsByYear[y] ?? 0);
const mine = byTier((r, y) => r.myRenown[y]);
const theirs = byTier((r, y) => r.rivalRenown[y]);
TIERS.forEach((t, i) => {
  if (!deaths[i]!.length) return; // non-null: three tiers.
  console.log(line(`renown a year, ${t} tier: the player`, mine[i]!, 'tuning')); // non-null: as above.
  console.log(line(`renown a year, ${t} tier: the median rival`, theirs[i]!, 'tuning')); // non-null: as above.
  console.log(line(`deaths a year, ${t} tier`, deaths[i]!, '~2 for a well-built party (D-137)')); // non-null: as above.
  console.log(
    line(
      `stop days a year, ${t} tier`,
      stops[i]!,
      i === 2 ? 'top guild <= 130 (§9d)' : '~80, at most 100',
    ),
  ); // non-null: as above.
});
console.log(
  line(
    'chest at the end of year 1 (copper)',
    results.map((r) => r.chestByYear[0] ?? 0),
    'money tight early',
    0,
  ),
);
// D-187's aim, a guild's total growth near the house-off run's: points from quests and from training
// at home, a year per career, and per member on the roster at year ends.
{
  const sum = (v: (number | undefined)[]) => v.reduce<number>((a, b) => a + (b ?? 0), 0);
  const careerYears = results.reduce((n, r) => n + r.years, 0);
  const quests = sum(results.map((r) => sum(r.growthByYear)));
  const training = sum(results.map((r) => sum(r.trainingByYear)));
  // Per member: only the years whose end recorded a roster, so a dismissed career's last part-year
  // counts on neither side.
  const ended = (r: Career, v: number[]) => sum(v.slice(0, r.rosterByYear.length));
  const memberPoints = sum(
    results.map((r) => ended(r, r.growthByYear) + ended(r, r.trainingByYear)),
  );
  const memberYears = sum(results.map((r) => sum(r.rosterByYear)));
  console.log(
    `attribute points a year, mean per career-year: from quests ${(quests / Math.max(1, careerYears)).toFixed(1)}, from training at home ${(training / Math.max(1, careerYears)).toFixed(1)}, in all ${((quests + training) / Math.max(1, careerYears)).toFixed(1)}; per member on the roster at year ends ${(memberPoints / Math.max(1, memberYears)).toFixed(2)} [D-187: up to about a quarter above the house-off run's]`,
  );
}
/** §9d's bad start: the same test whether grants are taken or refused. */
const isBadStart = (r: Career) => {
  const rules =
    houseMode === 'on'
      ? incidentsMode === 'on'
        ? houseIncidentGuildRules
        : houseGuildRules
      : careerGuildRules;
  const start = rules.founding?.purseCopper ?? rules.startingChestCopper;
  // In debt at a week start in years 1-2, or the chest after two years, less any grant money,
  // below half the start.
  return (
    (r.firstOfferYear !== null && r.firstOfferYear <= 2) ||
    (r.chestByYear[1] ?? r.chestByYear[0] ?? 0) - r.earlyGrantCopper < start / 2
  );
};
const badStart = results.filter(isBadStart);
console.log(
  `§9d bad starts (in debt at a week start in years 1-2, or the chest less grants below half the start after 2 years): ${badStart.length}; of those, careers lasting 10+ years: ${badStart.filter((r) => r.years >= 10).length} [most recover, §4g]`,
);
{
  const ends = new Map<string, number>();
  for (const r of badStart) ends.set(r.end, (ends.get(r.end) ?? 0) + 1);
  const short = badStart.filter((r) => r.years < 10).map((r) => r.years);
  console.log(
    `  bad starts ended: ${[...ends].map(([k, v]) => `${k} ${v}`).join(', ')}; those under 10 years ended in year ${short.sort((a, b) => a - b).join(', ')}`,
  );
}
console.log(
  `  emergency grants taken (D-146): ${results.filter((r) => r.grants > 0).length} careers took one; ${results.reduce((n, r) => n + r.grants, 0)} in all; first grant in year ${pct(
    results.filter((r) => r.firstGrantYear !== null).map((r) => r.firstGrantYear!), // non-null: filtered.
    50,
  )} (median)`,
);
{
  const long = results.filter((r) => r.years >= 10);
  const woke = long.filter((r) => r.crisisYear !== null && r.crisisYear >= 5 && r.crisisYear <= 15);
  const ended = results.filter((r) => r.crisisEnded !== null);
  const took = ended.map((r) => r.crisisEnded! - r.crisisYear!); // non-null: ended after it woke.
  console.log(
    `§9d late goals: of ${long.length} careers reaching year 10, a crisis woke in years 5-15 in ${woke.length} (${((100 * woke.length) / Math.max(1, long.length)).toFixed(0)}%) [at least one]; ended in ${ended.length} of ${results.filter((r) => r.crisisYear !== null).length} that woke, median ${pct(took, 50)} years after waking`,
  );
}
if (comparePolicies) {
  console.log('§9d no dominant safe play: the share of seeds where each side ends ahead');
  ahead('cautious', cautious, 'bold', bold);
}
if (staffMode === 'compare') {
  reportR6();
  ahead('hands-on', results, 'delegated', delegated);
} else console.log('R6 delegated vs hands-on: run with staff=compare.');

/** Per seed: who earned more renown over the career, and who ended with the bigger chest. */
function ahead(aName: string, a: Career[], bName: string, b: Career[]): void {
  const renown = (r: Career) => r.myRenown.reduce((x, y) => x + (y ?? 0), 0);
  const chest = (r: Career) => r.chestByYear[r.years - 1] ?? 0;
  const share = (pick: (r: Career) => number) => {
    const wins = a.filter((r, i) => pick(r) > pick(b[i]!)).length; // non-null: same seeds.
    const losses = a.filter((r, i) => pick(r) < pick(b[i]!)).length; // non-null: same seeds.
    return `${aName} ${((100 * wins) / careers).toFixed(0)}%, ${bName} ${((100 * losses) / careers).toFixed(0)}%`;
  };
  console.log(
    `  career renown: ${share(renown)}; final chest: ${share(chest)} [each side ahead in some seeds]`,
  );
  // Over the first 10 years only, so a longer career does not win by lasting.
  const early = (r: Career) => r.myRenown.slice(0, 10).reduce((x, y) => x + (y ?? 0), 0);
  const chest10 = (r: Career) => r.chestByYear[Math.min(9, r.years - 1)] ?? 0;
  console.log(`  first 10 years: renown ${share(early)}; chest ${share(chest10)}`);
}

function reportR6(): void {
  const perYear = (rs: Career[], pick: (r: Career) => number[]) =>
    rs.flatMap((r) => Array.from({ length: r.years }, (_, y) => pick(r)[y] ?? 0));
  const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
  const sides = [
    ['hands-on', results],
    ['delegated', delegated],
  ] as const;
  console.log(
    'R6 hands-on vs delegated, same seeds; means over all career-years and all injuries (staff/SPEC.md; assumptions: packages/content/src/base/staff.ts)',
  );
  const rows = sides.map(([name, rs]) => ({
    name,
    trainingSkill: mean(rs.map((r) => r.skillDays.training / Math.max(1, r.days))),
    recoverySkill: mean(rs.map((r) => r.skillDays.recovery / Math.max(1, r.days))),
    growth: mean(perYear(rs, (r) => r.growthByYear)),
    injury: mean(rs.flatMap((r) => r.injuryDays)),
    stops: mean(perYear(rs, (r) => r.stopsByYear)),
    years: pct(
      rs.map((r) => r.years),
      50,
    ),
    chest: pct(
      rs.map((r) => r.chestByYear[r.years - 1] ?? 0),
      50,
    ),
  }));
  for (const r of rows)
    console.log(
      `  ${r.name.padEnd(10)} skill running training ${r.trainingSkill.toFixed(1)}, recovery ${r.recoverySkill.toFixed(1)}; growth ${r.growth.toFixed(1)} points a year; injury adds ${r.injury.toFixed(1)} days out; stop days ${r.stops.toFixed(1)} a year; career median ${r.years} years; final chest median ${r.chest}`,
    );
  const hands = rows[0]!; // non-null: two sides.
  const del = rows[1]!; // non-null: two sides.
  // Training as a share of the delegated side's growth; recovery likewise, below.
  const gain = (a: number, b: number) => `${((100 * (a - b)) / Math.max(1e-9, b)).toFixed(1)}%`;
  console.log(
    `  hands-on better by, as a share of delegated: training ${gain(hands.growth, del.growth)} (growth), recovery ${((100 * (del.injury - hands.injury)) / Math.max(1e-9, del.injury)).toFixed(1)}% (injury days saved) [10-25% each]; running both yourself costs ${(hands.stops - del.stops).toFixed(1)} stop days a year`,
  );
}
if (houseMode === 'on') reportHouse();
if (incidentsMode === 'on') reportIncidents();
if (compareParties && houseMode === 'on') reportParties();
else if (compareParties) console.log('party=compare needs house=on (the draft).');

function reportHouse(): void {
  const years = (pick: (r: Career) => number | null) => results.flatMap((r) => pick(r) ?? []);
  const started = years((r) => r.houseFirstStarted);
  const finished = years((r) => r.houseFirstFinished);
  const done = results.filter((r) => r.houseCompleted !== null);
  console.log(
    `House (fullHousePlan, ${fullHousePlan.length} jobs; assumptions: packages/content/src/base/house.ts); started a job in ${started.length} of ${careers} careers`,
  );
  const firstWeeks = results.flatMap((r) => r.houseFirstWeek ?? []);
  if (firstWeeks.length > 0)
    console.log(
      line(
        '  first plan step started (week from founding)',
        firstWeeks,
        'first room in season 1: week 48 or before',
        0,
      ),
    );
  if (finished.length > 0)
    console.log(line('  first plan step finished (year)', finished, 'year 1', 0));
  // D-187: what the yard and the quests grow, and how big the guild gets on its beds.
  const growth = (pick: (r: Career) => number[]) =>
    pct(
      results.flatMap((r) => Array.from({ length: r.years }, (_, y) => pick(r)[y] ?? 0)),
      50,
    );
  const rosterAt = (year: number) =>
    pct(
      results.flatMap((r) => r.rosterByYear[year - 1] ?? []),
      50,
    );
  console.log(
    `  attribute points a year, median per career-year: from training at home ${growth((r) => r.trainingByYear)}, from quests ${growth((r) => r.growthByYear)}; roster at the end of year 1 / 5 / 10 (median): ${rosterAt(1)} / ${rosterAt(5)} / ${rosterAt(10)}`,
  );
  console.log(
    `  plan completed in ${done.length} of ${careers} careers (${((100 * done.length) / careers).toFixed(0)}%)`,
  );
  // Yearly surplus before the house: the chest at a year end less the previous year end, plus what
  // that year paid for building and room upkeep, by the tier played that year (D-172 measures the
  // house against a mid guild's surplus; grants stay in, as they do in a house=off run).
  const gains = results.flatMap((r) =>
    r.tierByYear.flatMap((tier, y) => {
      const now = r.chestByYear[y];
      const before = r.chestByYear[y - 1];
      return tier === 1 && y >= 1 && now !== undefined && before !== undefined
        ? [{ gain: now - before + (r.houseMoneyByYear[y] ?? 0) }]
        : [];
    }),
  );
  const medianGain = pct(
    gains.map((g) => g.gain),
    50,
  );
  console.log(
    `  middle tier median yearly surplus before house money (building and room upkeep), this run: ${medianGain} copper over ${gains.length} career-years`,
  );
  if (done.length === 0) {
    console.log('  no career completed the plan: no completion year, cost or ratio to report');
  } else {
    console.log(
      line(
        '  plan completed (year)',
        done.map((r) => r.houseCompleted!), // non-null: filtered.
        'full house 8-12 years of surplus',
        0,
      ),
    );
    const costs = done.map((r) => r.houseCostCopper);
    console.log(line('  plan total cost (copper), plan finishers only', costs, 'tuning', 0));
    console.log(
      line(
        '  plan cost / middle-tier surplus (years), plan finishers only',
        costs.map((c) => c / medianGain),
        'full house 8-12 years of surplus',
      ),
    );
  }
  const share = results
    .filter((r) => r.spendingLateCopper > 0)
    .map((r) => (100 * r.roomsLateCopper) / r.spendingLateCopper);
  console.log(line('  room upkeep share of all spending, years 10+ (%)', share, 'tuning'));
}

/** Incidents (house/SPEC.md): a year by kind, fires that burned out a barracks cell, lodgers, and what they cost. */
function reportIncidents(): void {
  const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
  const careerYears = results.reduce((n, r) => n + r.years, 0);
  const kinds = Object.keys(results.reduce((all, r) => ({ ...all, ...r.incidentsByKind }), {}));
  console.log(
    `Incidents (assumptions: packages/content/src/base/house.ts; every letter takes the default answer); ${careerYears} career-years`,
  );
  console.log(
    `  incidents a year, mean over career-years [1-2 in all]: ${kinds.map((k) => `${k} ${(results.reduce((n, r) => n + (r.incidentsByKind[k] ?? 0), 0) / Math.max(1, careerYears)).toFixed(2)}`).join(', ')}; in all ${(results.reduce((n, r) => n + Object.values(r.incidentsByKind).reduce((a, b) => a + b, 0), 0) / Math.max(1, careerYears)).toFixed(2)}`,
  );
  const fires = results.reduce((n, r) => n + r.fires, 0);
  const burnt = results.reduce((n, r) => n + r.firesBurntBarracks, 0);
  console.log(
    `  fires that burned out a barracks cell: ${burnt} of ${fires} (${((100 * burnt) / Math.max(1, fires)).toFixed(0)}%)`,
  );
  const weeks = results.reduce((n, r) => n + r.weeks, 0);
  const lodged = results.reduce((n, r) => n + r.lodgerWeeks, 0);
  console.log(
    `  career-weeks with lodgers: ${lodged} of ${weeks} (${((100 * lodged) / Math.max(1, weeks)).toFixed(1)}%)`,
  );
  const late = results.filter((r) => r.spendingLateCopper > 0);
  const share = (pick: (r: Career) => number) =>
    late.map((r) => (100 * pick(r)) / r.spendingLateCopper);
  console.log(
    `  share of all spending, years 10+ (mean of careers): inn fees ${mean(share((r) => r.innLateCopper)).toFixed(2)}%, theft ${mean(share((r) => r.theftLateCopper)).toFixed(2)}%, repairs ${mean(share((r) => r.repairLateCopper)).toFixed(2)}%`,
  );
  console.log(
    `  dismissals (see how careers ended above): ${results.filter((r) => r.end === 'dismissed').length} of ${careers}`,
  );
}

console.log(
  line(
    'runtime per career (s)',
    results.map((r) => r.seconds),
    '',
    2,
  ),
);

/** The draft's three characters on the same seeds (D-188): how careers ended, year-1 chest, first-year renown, bad starts. */
function reportParties(): void {
  console.log(
    `Starter party compared, same ${careers} seeds each (assumptions: packages/content/src/base/founding.ts):`,
  );
  console.log(
    '  bad starts are measured against half the purse for every party, so a dear party starts nearer the line',
  );
  for (const party of CHARACTERS) {
    const rs = pick((j) => j.policy === policyName && !j.delegate && j.party === party);
    const ended = new Map<string, number>();
    for (const r of rs) ended.set(r.end, (ended.get(r.end) ?? 0) + 1);
    const bad = rs.filter(isBadStart).length;
    console.log(
      `  ${party.padEnd(9)} careers ended: ${[...ended].map(([k, v]) => `${k} ${((100 * v) / careers).toFixed(0)}%`).join(', ')}; chest at the end of year 1 median ${pct(
        rs.map((r) => r.chestByYear[0] ?? 0),
        50,
      ).toFixed(0)}; first-year renown median ${pct(
        rs.map((r) => r.myRenown[0] ?? 0),
        50,
      ).toFixed(0)}; bad starts ${bad}`,
    );
  }
  // Long-run payoff (D-188: the green party is cheap now and should pay later): over the first 10
  // years, so a longer career does not win by lasting.
  console.log('  long run, first 10 years (careers that ended sooner count the years they had):');
  for (const party of CHARACTERS) {
    const rs = pick((j) => j.policy === policyName && !j.delegate && j.party === party);
    const ten = (v: (number | undefined)[]) =>
      v.slice(0, 10).reduce<number>((a, b) => a + (b ?? 0), 0);
    console.log(
      `  ${party.padEnd(9)} attribute points median ${pct(
        rs.map((r) => ten(r.growthByYear) + ten(r.trainingByYear)),
        50,
      ).toFixed(0)}; renown median ${pct(
        rs.map((r) => ten(r.myRenown)),
        50,
      ).toFixed(0)}; chest at the end of year 10 median ${pct(
        rs.map((r) => r.chestByYear[Math.min(9, r.years - 1)] ?? 0),
        50,
      ).toFixed(
        0,
      )}; promoted by year 10 ${((100 * rs.filter((r) => r.firstPromotion !== null && r.firstPromotion <= 10).length) / careers).toFixed(0)}%; deaths median ${pct(
        rs.map((r) => ten(r.deathsByYear)),
        50,
      ).toFixed(0)}`,
    );
  }
}
