// Test content for the guild year: round numbers so each rule shows in its own arithmetic.
import type { Command, GameEvent, GameState, GuildRules } from '../src/index.ts';
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

export function take(run: Run, partyIds: string[], offerId?: string): Run {
  const offer = offerId ?? run.state.guild?.board[0]?.id ?? 'none';
  return play(run, {
    type: 'contract.take',
    day: run.state.calendar,
    offerId: offer,
    partyIds,
    plan: steadyPlan,
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
