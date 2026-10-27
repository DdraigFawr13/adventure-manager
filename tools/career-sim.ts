// Career simulator (PLAN §9b step 2: R2, R3, R9, §9d; D-140, D-141): plays seeded guilds from
// their founding until the guildmaster's career ends (or a cap), with careers on, rivals abstract,
// and the one-year simulator's player policy. The invariants run over every career.
// Usage: node tools/career-sim.ts [careers=100] [maxYears=40] [policy=default|cautious|bold] [staff=off|compare]
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
import { POLICIES, rules, runYear } from './year-sim-play.ts';

const careers = Number(process.argv[2] ?? 100);
const maxYears = Number(process.argv[3] ?? 40);
const policyName = process.argv[4] ?? 'default';
const plan = POLICIES[policyName];
if (!plan) throw new Error(`Unknown policy ${policyName}.`);
const staffMode = process.argv[5] ?? 'off';
if (staffMode !== 'off' && staffMode !== 'compare')
  throw new Error(`Unknown staff mode ${staffMode}.`);
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
  /** R6: attribute points grown each year; days from each lasting injury to fit again; the skill running each area, summed over days. */
  growthByYear: number[];
  injuryDays: number[];
  skillDays: Record<Area, number>;
  days: number;
  seconds: number;
}

function play(seed: string, delegate = false): Career {
  const started = performance.now();
  const skillDays: Record<Area, number> = { training: 0, recovery: 0 };
  let days = 0;
  // runYear runs the guild and resolution invariants over the whole career and throws on a problem.
  const { events } = runYear(seed, plan!, {
    content,
    lastDay: maxYears * yearDays,
    delegate,
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
    injuryDays: [],
    skillDays,
    days,
    seconds: 0,
  };
  const injuredOn = new Map<string, number>();
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
    if (e.type === 'attribute.changed' && e.reason === 'growth') {
      const y = yearOfEvent(e) - 1;
      c.growthByYear[y] = (c.growthByYear[y] ?? 0) + 1;
    }
    if (e.type === 'injury.gained' && e.subjectIds[0]) injuredOn.set(e.subjectIds[0], e.day);
    if (e.type === 'member.recovered' && e.subjectIds[0] && injuredOn.has(e.subjectIds[0])) {
      c.injuryDays.push(e.day - injuredOn.get(e.subjectIds[0])!); // non-null: just checked.
      injuredOn.delete(e.subjectIds[0]);
    }
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
for (let n = 0; n < careers; n += 1) {
  results.push(play(`career-${n}`));
  if (staffMode === 'compare') delegated.push(play(`career-${n}`, true));
}

console.log(
  `${careers} careers, policy ${policyName}, staff ${staffMode === 'compare' ? 'hands-on (delegated below)' : 'off'}, cap ${maxYears} years; a founded guild of 15 in the bottom tier (assumptions: packages/content/src/base/career.ts)`,
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
  const span = r.topLeaders.slice(0, 30).filter(Boolean);
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
  (r) => (r.chestByYear[1] ?? 0) < careerGuildRules.startingChestCopper / 2,
);
console.log(
  `§9d bad starts (chest below half the start after 2 years): ${badStart.length}; of those, careers lasting 10+ years: ${badStart.filter((r) => r.years >= 10).length}`,
);
console.log(
  '§9d late goals (a crisis between years 5 and 15): not measurable yet; crises are not built (D-112).',
);
if (staffMode === 'compare') reportR6();
else console.log('R6 delegated vs hands-on: run with staff=compare.');

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
      `  ${r.name.padEnd(10)} skill running training ${r.trainingSkill.toFixed(1)}, recovery ${r.recoverySkill.toFixed(1)}; growth ${r.growth.toFixed(1)} points a year; injury to fit ${r.injury.toFixed(1)} days; stop days ${r.stops.toFixed(1)} a year; career median ${r.years} years; final chest median ${r.chest}`,
    );
  const hands = rows[0]!; // non-null: two sides.
  const del = rows[1]!; // non-null: two sides.
  const gain = (a: number, b: number) => `${((100 * (a - b)) / Math.max(1e-9, b)).toFixed(1)}%`;
  console.log(
    `  hands-on better by: training ${gain(hands.growth, del.growth)} (growth), recovery ${gain(del.injury, hands.injury)} (days to fit) [10-25% each]; running both yourself costs ${(hands.stops - del.stops).toFixed(1)} stop days a year`,
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
