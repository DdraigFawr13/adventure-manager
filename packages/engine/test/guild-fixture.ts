// Test content for the guild year: round numbers so each rule shows in its own arithmetic.
import type { CareerRules, Command, GameEvent, GameState, GuildRules, Plan } from '../src/index.ts';
import { simulate } from '../src/index.ts';
import { game, steadyPlan } from './fixture.ts';

export const guildRules: GuildRules = {
  weeksPerYear: 48,
  daysPerWeek: 7,
  assemblyWeeks: 4,
  winterFromWeek: 37,
  signingWindows: [{ from: 1, to: 2 }],
  offersPerWeek: { assembly: 2, campaign: 2, winter: 1 },
  offerLifeWeeks: 2,
  dangers: [
    {
      danger: 'hazardous',
      weight: 1,
      feeCopper: 1000,
      feeSpreadBp: 0,
      travelDays: 2,
      travelSpreadDays: 0,
      renownWin: 3,
    },
  ],
  payBp: { won: 10_000, partial: 5000, retreated: 0, routed: 0 },
  lootBp: 2000,
  death: { funeralCopper: 200, familyShareWeeks: 26, recklessRenownLoss: 5 },
  signOnWeeks: 8,
  runningCostCopper: 500,
  patronGrantCopper: 4000,
  startingChestCopper: 10_000,
  partySize: { min: 2, max: 3 },
  classes: [
    {
      classId: 'warrior',
      weight: 1,
      wageBaseCopper: 60,
      lead: ['might', 'toughness'],
      position: 'front',
    },
  ],
  wageStepCopper: 4,
  wagePivot: 10,
  wageFloorBelowBaseCopper: 10,
  restDaysPerWoundStep: 3,
  refitDays: 7,
  injuryWeeks: { min: 3, max: 3 },
  prospectsPerWindowWeek: 2,
  attributeRange: { min: 10, max: 10 },
  leadBonus: { min: 2, max: 2 },
  weaponBp: 0,
  armourBp: 0,
};

/** Careers with flat numbers: one danger, no growth, ageing or retirement unless a test sets them. */
export const testCareer: CareerRules = {
  guildsPerTier: 6,
  tiers: [0, 1, 2].map((t) => ({
    dangerWeights: { routine: 0, hazardous: 1, perilous: 0, deadly: 0 },
    feeBp: 10_000 + 1000 * t,
    grantCopper: 1000 * (t + 1),
    rivalMean: 50,
    rivalContracts: 10,
    rivalRenown: 15,
  })),
  drawAge: { min: 20, max: 20 },
  potential: { min: 4, max: 4 },
  primeAge: 32,
  growth: { youngAge: 24, youngBp: 0, primeBp: 0 },
  declineStepBp: 0,
  declineMaxBp: 0,
  retireStepBp: 0,
  retireMaxBp: 0,
  rivalWin: { baseBp: 5000, stepBp: 0, minBp: 5000, maxBp: 5000 },
  dangerDifficulty: { routine: 20, hazardous: 40, perilous: 60, deadly: 80 },
  rivalSpread: 0,
  rivalDrift: { pullDiv: 3, renownPerPoint: 25, noise: 0 },
  patron: { start: 60, met: 15, perPlaceShort: 15, maxMiss: 40, debt: 15, max: 100 },
  guildmaster: { age: { min: 40, max: 40 }, healthFromAge: 90, certainAge: 99 },
};

/** Every drawn adventurer has might and toughness 12, the rest 10: wage 60 + 4 * (11 - 10). */
export const WAGE = 64;

export interface Run {
  state: GameState;
  events: GameEvent[];
  commandIds: string[];
}

export function foundedGuild(size = 3, rules: Partial<GuildRules> = {}, seed = 'guild-seed'): Run {
  const base = game([]);
  const state: GameState = {
    ...base,
    seed,
    content: { ...base.content, guild: { ...guildRules, ...rules } },
  };
  return play({ state, events: [], commandIds: [] }, { type: 'guild.found', day: 1, size });
}

type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

/** Applies one command and appends its events; ids are numbered by the run. */
export function play(run: Run, command: Bare): Run {
  const id = `g${run.commandIds.length}`;
  // cast-ok: the id the caller left out is added back, so the union member is whole.
  const result = simulate(run.state, { ...command, id } as Command);
  return {
    state: result.state,
    events: [...run.events, ...result.events],
    commandIds: [...run.commandIds, id],
  };
}

export function advanceTo(run: Run, day: number): Run {
  let current = run;
  while (current.state.calendar < day)
    current = play(current, { type: 'day.advance', day: current.state.calendar + 1 });
  return current;
}

export function take(run: Run, partyIds: string[], offerId?: string, plan: Plan = steadyPlan): Run {
  const offer = offerId ?? run.state.guild?.board[0]?.id ?? 'none';
  return play(run, {
    type: 'contract.take',
    day: run.state.calendar,
    offerId: offer,
    partyIds,
    plan,
  });
}

/** A fixed player: after each day, send up to three free members out on the oldest offer. */
export function playDays(run: Run, untilDay: number): Run {
  let current = run;
  while (current.state.calendar < untilDay) {
    current = play(current, { type: 'day.advance', day: current.state.calendar + 1 });
    const guild = current.state.guild;
    const free = guild?.members.filter((m) => !m.away && m.outUntilDay <= current.state.calendar);
    if (guild?.board[0] && free && free.length >= 2)
      current = take(
        current,
        free.slice(0, 3).map((m) => m.id),
      );
  }
  return current;
}
