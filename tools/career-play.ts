// One career played to its end and summed up for tools/career-sim.ts (D-148: the simulator runs
// these on worker threads, so everything a career needs comes in through CareerSetup).
import {
  AREAS,
  PLAYER_ID,
  stopDays,
  yearOf,
  type Area,
  type GameEvent,
} from '@adventure-manager/engine';
import {
  baseResolution,
  careerGuildRules,
  fullHousePlan,
  houseGuildRules,
  staffGuildRules,
} from '@adventure-manager/content';
import { POLICIES, rules, runYear } from './year-sim-play.ts';

export interface CareerSetup {
  readonly maxYears: number;
  readonly staffMode: 'off' | 'compare';
  readonly size: number;
  readonly refuseGrants: boolean;
  readonly houseMode: 'off' | 'on';
}

/** One career to play: its seed, the player policy's name, and whether staff run both areas. */
export interface CareerJob {
  readonly seed: string;
  readonly policy: string;
  readonly delegate: boolean;
  /** With founding rules: the character of the starter party to pick (D-188). */
  readonly party?: string;
}

const yearDays = rules.weeksPerYear * rules.daysPerWeek;

export interface Career {
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
  /** House line (D-187): points grown a year from training at home, and members at each year's end. */
  trainingByYear: number[];
  rosterByYear: number[];
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
  /** House mode: the year the first plan job started and finished, the year the whole plan was done, copper paid for building, and room upkeep and all spending in years 10+. */
  houseFirstStarted: number | null;
  houseFirstFinished: number | null;
  houseCompleted: number | null;
  houseCostCopper: number;
  /** Copper paid for building and for room upkeep in each year (index 0 is year 1), so the surplus before any house money can be read. */
  houseMoneyByYear: number[];
  /** The week (counted from the founding) the first plan step was started. */
  houseFirstWeek: number | null;
  roomsLateCopper: number;
  spendingLateCopper: number;
  seconds: number;
}

export function playCareer(setup: CareerSetup, job: CareerJob): Career {
  const { maxYears, size, refuseGrants } = setup;
  const { seed, delegate } = job;
  const planToUse = POLICIES[job.policy];
  if (!planToUse) throw new Error(`Unknown policy ${job.policy}.`);
  const content = {
    ...baseResolution,
    guild:
      setup.houseMode === 'on'
        ? houseGuildRules
        : setup.staffMode === 'compare'
          ? staffGuildRules
          : careerGuildRules,
  };
  const started = performance.now();
  const skillDays: Record<Area, number> = { training: 0, recovery: 0 };
  let days = 0;
  const rosterByYear: number[] = [];
  // runYear runs the guild and resolution invariants over the whole career and throws on a problem.
  const { events } = runYear(seed, planToUse, {
    content,
    size,
    lastDay: maxYears * yearDays,
    delegate,
    refuseGrants,
    ...(job.party ? { party: job.party } : {}),
    ...(setup.houseMode === 'on' ? { housePlan: fullHousePlan } : {}),
    onDay: (state) => {
      if (state.calendar % yearDays === 0)
        rosterByYear[state.calendar / yearDays - 1] = state.guild?.members.length ?? 0;
      const staff = state.guild?.staff;
      if (!staff) return;
      days += 1;
      for (const area of AREAS) skillDays[area] += staff.staff[area]?.quality ?? staff.skills[area];
    },
  });
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
    trainingByYear: [],
    rosterByYear,
    grants: 0,
    firstGrantYear: null,
    firstOfferYear: null,
    earlyGrantCopper: 0,
    crisisYear: null,
    crisisEnded: null,
    injuryDays: [],
    skillDays,
    days,
    houseFirstStarted: null,
    houseFirstFinished: null,
    houseCompleted: null,
    houseCostCopper: 0,
    houseMoneyByYear: [],
    houseFirstWeek: null,
    roomsLateCopper: 0,
    spendingLateCopper: 0,
    seconds: 0,
  };
  let housesFinished = 0;
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
    if (e.type === 'attribute.changed' && e.reason === 'training') {
      const y = yearOfEvent(e) - 1;
      c.trainingByYear[y] = (c.trainingByYear[y] ?? 0) + 1;
    }
    if (e.type === 'member.laid-up') c.injuryDays.push(e.days);
    if (e.type === 'patron.offered') c.firstOfferYear ??= yearOfEvent(e);
    if (e.type === 'money.changed' && e.reason === 'emergency' && yearOfEvent(e) <= 2)
      c.earlyGrantCopper += e.amountCopper;
    if (e.type === 'house.started') {
      c.houseFirstStarted ??= yearOfEvent(e);
      c.houseFirstWeek ??= Math.floor((e.day - 1) / rules.daysPerWeek) + 1;
    }
    if (e.type === 'house.finished') {
      c.houseFirstFinished ??= yearOfEvent(e);
      housesFinished += 1;
      if (housesFinished === fullHousePlan.length) c.houseCompleted = yearOfEvent(e);
    }
    if (e.type === 'money.changed' && (e.reason === 'building' || e.reason === 'rooms')) {
      if (e.reason === 'building') c.houseCostCopper -= e.amountCopper;
      const y = yearOfEvent(e) - 1;
      c.houseMoneyByYear[y] = (c.houseMoneyByYear[y] ?? 0) - e.amountCopper;
    }
    if (e.type === 'money.changed' && e.amountCopper < 0 && yearOfEvent(e) >= 10) {
      c.spendingLateCopper -= e.amountCopper;
      if (e.reason === 'rooms') c.roomsLateCopper -= e.amountCopper;
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

export function pct(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return (
    sorted[Math.min(sorted.length - 1, Math.floor((p * (sorted.length - 1)) / 100 + 0.5))] ?? NaN
  );
}
