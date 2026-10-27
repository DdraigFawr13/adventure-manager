// Career simulator (PLAN §9b step 2: R2, R3, R9, §9d; D-140, D-141): plays seeded guilds from
// their founding until the guildmaster's career ends (or a cap), with careers on, rivals abstract,
// and the one-year simulator's player policy. The invariants run over every career.
// Usage: node tools/career-sim.ts [careers=100] [maxYears=40] [policy=default|cautious|bold|compare]
//   [staff=off|compare] [size=15] [grants=take|refuse]
// With policy=compare, each seed is also played cautious and bold, for §9d's no-dominant-safe-play check.
// With staff=compare, each seed is played hands-on (the guildmaster runs training and recovery)
// and delegated (the best affordable hire runs both), and R6 compares the two (staff/SPEC.md).
import {
  AREAS,
  PLAYER_ID,
  stopDays,
  yearOf,
  type Area,
  type GameEvent,
} from '@adventure-manager/engine';
import { baseResolution, careerGuildRules, staffGuildRules } from '@adventure-manager/content';
import { GUILD_SIZE, POLICIES, rules, runYear } from './year-sim-play.ts';

const careers = Number(process.argv[2] ?? 100);
const maxYears = Number(process.argv[3] ?? 40);
const policyArg = process.argv[4] ?? 'default';
const comparePolicies = policyArg === 'compare';
const policyName = comparePolicies ? 'default' : policyArg;
const plan = POLICIES[policyName];
if (!plan) throw new Error(`Unknown policy ${policyName}.`);
const staffMode = process.argv[5] ?? 'off';
if (staffMode !== 'off' && staffMode !== 'compare')
  throw new Error(`Unknown staff mode ${staffMode}.`);
const size = Number(process.argv[6] ?? GUILD_SIZE);
const grantsArg = process.argv[7] ?? 'take';
if (grantsArg !== 'take' && grantsArg !== 'refuse')
  throw new Error(`Unknown grants mode ${grantsArg}.`);
const refuseGrants = grantsArg === 'refuse';
const content = {
  ...baseResolution,
  guild: staffMode === 'compare' ? staffGuildRules : careerGuildRules,
};
const yearDays = rules.weeksPerYear * rules.daysPerWeek;
const TIERS = ['bottom', 'middle', 'top'];

interface Career {
  years: number;
  end: string;
  firstPromotion: number | null;
  tierByYear: number[];
  placeByYear: number[];
  deathsByYear: number[];
  stopsByYear: number[];
  chestByYear: number[];
  topLeaders: string[];
  /** Per settled year: the player's renown, and the median rival's in the player's tier. */
  myRenown: number[];
  rivalRenown: number[];
  confidence: number[];
  /** R6: attribute points grown each year; days each lasting injury added to time out (`member.laid-up`); the skill running each area, summed over days. */
  growthByYear: number[];
  grants: number;
  /** The year of the first emergency grant, if any. */
  firstGrantYear: number | null;
  /** §9d bad starts: the year of the patron's first emergency offer (the guild in debt at a week start), and grant money received in years 1-2. */
  firstOfferYear: number | null;
  earlyGrantCopper: number;
  /** The crisis: the year it woke and the year it ended, if it did. */
  crisisYear: number | null;
  crisisEnded: number | null;
  injuryDays: number[];
  skillDays: Record<Area, number>;
  days: number;
  seconds: number;
}

function play(seed: string, delegate = false, planToUse = plan!): Career {
  const started = performance.now();
  const skillDays: Record<Area, number> = { training: 0, recovery: 0 };
  let days = 0;
  // runYear runs the guild and resolution invariants over the whole career and throws on a problem.
  const { events } = runYear(seed, planToUse, {
    content,
    size,
    lastDay: maxYears * yearDays,
    delegate,
    refuseGrants,
    onDay: (state) => {
      const staff = state.guild?.staff;
      if (!staff) return;
      days += 1;
      for (const area of AREAS) skillDays[area] += staff.staff[area]?.quality ?? staff.skills[area];
    },
  }); // non-null: checked above.
  const c: Career = {
    years: 0,
    end: 'cap',
    firstPromotion: null,
    tierByYear: [],
    placeByYear: [],
    deathsByYear: [],
    stopsByYear: [],
    chestByYear: [],
    topLeaders: [],
    myRenown: [],
    rivalRenown: [],
    confidence: [],
    growthByYear: [],
    grants: 0,
    firstGrantYear: null,
    firstOfferYear: null,
    earlyGrantCopper: 0,
    crisisYear: null,
    crisisEnded: null,
    injuryDays: [],
    skillDays,
    days,
    seconds: 0,
  };
  const yearOfEvent = (e: GameEvent) => yearOf(e.day, rules);
  for (const e of events) {
    if (e.type === 'year.settled') {
      c.tierByYear[e.year - 1] = e.tier;
      c.placeByYear[e.year - 1] = e.standings.findIndex((s) => s.id === PLAYER_ID) + 1;
      c.topLeaders[e.year - 1] = e.leaders[e.leaders.length - 1] ?? '';
      c.myRenown[e.year - 1] = e.standings.find((s) => s.id === PLAYER_ID)?.renown ?? 0;
      const others = e.standings.filter((s) => s.id !== PLAYER_ID).map((s) => s.renown);
      c.rivalRenown[e.year - 1] = pct(others, 50);
    }
    if (e.type === 'tier.changed' && e.to > e.from && c.firstPromotion === null)
      c.firstPromotion = yearOfEvent(e) - 1;
    if (e.type === 'patron.reviewed') c.confidence[yearOfEvent(e) - 2] = e.confidence;
    if (e.type === 'adventurer.died') {
      const y = yearOfEvent(e) - 1;
      c.deathsByYear[y] = (c.deathsByYear[y] ?? 0) + 1;
    }
    if (e.type === 'career.ended') {
      c.years = e.years;
      c.end = e.reason;
    }
    if (e.type === 'crisis.started') c.crisisYear ??= yearOfEvent(e);
    if (e.type === 'crisis.ended') c.crisisEnded ??= yearOfEvent(e);
    if (e.type === 'patron.granted') {
      c.grants += 1;
      c.firstGrantYear ??= yearOfEvent(e);
    }
    if (e.type === 'attribute.changed' && e.reason === 'growth') {
      const y = yearOfEvent(e) - 1;
      c.growthByYear[y] = (c.growthByYear[y] ?? 0) + 1;
    }
    if (e.type === 'member.laid-up') c.injuryDays.push(e.days);
    if (e.type === 'patron.offered') c.firstOfferYear ??= yearOfEvent(e);
    if (e.type === 'money.changed' && e.reason === 'emergency' && yearOfEvent(e) <= 2)
      c.earlyGrantCopper += e.amountCopper;
    if (e.type === 'money.changed') c.chestByYear[yearOfEvent(e) - 1] = e.chestCopper;
  }
  if (c.end === 'cap') c.years = maxYears;
  for (const day of stopDays(events)) {
    const y = yearOf(day, rules) - 1;
    c.stopsByYear[y] = (c.stopsByYear[y] ?? 0) + 1;
  }
  c.seconds = (performance.now() - started) / 1000;
  return c;
}

function pct(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return (
    sorted[Math.min(sorted.length - 1, Math.floor((p * (sorted.length - 1)) / 100 + 0.5))] ?? NaN
  );
}
const line = (label: string, values: number[], target: string, digits = 1) =>
  `${label.padEnd(46)} median ${pct(values, 50).toFixed(digits).padStart(7)}  p10 ${pct(values, 10).toFixed(digits).padStart(7)}  p90 ${pct(values, 90).toFixed(digits).padStart(7)}  [${target}]`;

const results: Career[] = [];
const delegated: Career[] = [];
const cautious: Career[] = [];
const bold: Career[] = [];
for (let n = 0; n < careers; n += 1) {
  results.push(play(`career-${n}`));
  if (staffMode === 'compare') delegated.push(play(`career-${n}`, true));
  if (comparePolicies) {
    cautious.push(play(`career-${n}`, false, POLICIES.cautious!)); // non-null: a fixed policy.
    bold.push(play(`career-${n}`, false, POLICIES.bold!)); // non-null: a fixed policy.
  }
}

console.log(
  `${careers} careers, policy ${policyName}, staff ${staffMode === 'compare' ? 'hands-on (delegated below)' : 'off'}, cap ${maxYears} years; a founded guild of ${size} in the bottom tier (assumptions: packages/content/src/base/career.ts)`,
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
  // Rivals only: the player topping the top tier is not a runaway rival.
  const span = r.topLeaders.slice(0, 30).filter((id) => id && id !== PLAYER_ID);
  if (span.length < 10) continue;
  const counts = new Map<string, number>();
  for (const id of span) counts.set(id, (counts.get(id) ?? 0) + 1);
  if (Math.max(...counts.values()) > (2 * span.length) / 3) runaway += 1;
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
const badStart = results.filter(
  // The same test whether grants are taken or refused: in debt at a week start in years 1-2, or
  // the chest after two years, less any grant money, below half the start.
  (r) =>
    (r.firstOfferYear !== null && r.firstOfferYear <= 2) ||
    (r.chestByYear[1] ?? r.chestByYear[0] ?? 0) - r.earlyGrantCopper <
      careerGuildRules.startingChestCopper / 2,
);
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
  `  emergency grants taken (D-146): ${results.filter((r) => r.grants > 0).length} careers took one; ${results.reduce((n, r) => n + r.grants, 0)} in all`,
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
    'R6 hands-on vs delegated, same seeds (staff/SPEC.md; assumptions: packages/content/src/base/staff.ts)',
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
console.log(
  line(
    'runtime per career (s)',
    results.map((r) => r.seconds),
    '',
    2,
  ),
);
