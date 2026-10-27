import { describe, expect, it } from 'vitest';
import {
  apply,
  simulate,
  type Command,
  type GameEvent,
  type GameState,
  type StaffRules,
} from '../src/index.ts';
import { steadyPlan } from './fixture.ts';
import { foundedGuild, testCareer } from './guild-fixture.ts';

const YEAR = 48 * 7;
const STAFF: StaffRules = {
  guildmasterSkill: { min: 10, max: 10 },
  skillCap: 12,
  growBp: 10_000,
  growNearCapBp: 10_000,
  nearCapFrom: 11,
  candidatesPerArea: 2,
  quality: { min: 12, max: 12 },
  wageBaseCopper: 30,
  wageStepCopper: 4,
  trainingStepBp: 1000,
  recoveryStepBp: 1000,
  trainingPlanEveryWeeks: 2,
};
type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

/**
 * Two months of play on a founded guild with careers, sending parties out, then a jump to the year's
 * end and into the next Assembly: the same commands through either rule path.
 */
function play(
  step: (state: GameState, command: Command) => { state: GameState; events: readonly GameEvent[] },
) {
  let state = foundedGuild(3, {
    career: { ...testCareer, emergency: { wageWeeks: 8, everyYears: 3, confidenceCost: 5 } },
    staff: STAFF,
  }).state;
  const events: GameEvent[] = [];
  let n = 0;
  const run = (command: Bare) => {
    // cast-ok: the id is added back, so the union member is whole.
    const result = step(state, { ...command, id: `c${(n += 1)}` } as Command);
    state = result.state;
    events.push(...result.events);
  };
  for (let day = 2; day <= 60; day += 1) {
    // A debt at day 30, so the patron offers the emergency grant at the next week start.
    if (day === 30) state.guild!.chestCopper = -100_000; // non-null: founded.
    run({ type: 'day.advance', day });
    const guild = state.guild!; // non-null: founded.
    if (guild.career?.emergencyOffer && guild.chestCopper < 0) run({ type: 'patron.grant', day });
    const free = guild.members.filter((m) => !m.away && m.outUntilDay <= day).map((m) => m.id);
    if (guild.board[0] && free.length >= 2)
      run({
        type: 'contract.take',
        day,
        offerId: guild.board[0].id,
        partyIds: free.slice(0, 3),
        plan: steadyPlan,
      });
  }
  // The rest of the year passes in one step; the Assembly settles it.
  state.calendar = YEAR;
  state.guild!.board.length = 0; // non-null: founded.
  for (let day = YEAR + 1; day <= YEAR + 3; day += 1) run({ type: 'day.advance', day });
  return { state, events };
}

const viaSimulate = () => play((state, command) => simulate(state, command));
const viaApply = () =>
  play((state, command) => {
    const events = apply(state, command);
    return { state, events };
  });

describe('apply: the in-place rule path (D-148)', () => {
  it('gives the same events and state as simulate', () => {
    const copied = viaSimulate();
    const owned = viaApply();
    expect(owned.events.some((e) => e.type === 'party.returned')).toBe(true);
    expect(owned.events.some((e) => e.type === 'year.settled')).toBe(true);
    expect(owned.events).toEqual(copied.events);
    expect(owned.state).toEqual(copied.state);
  });

  it("returns events that later commands can't change", () => {
    // Each command's events are copied the moment they are returned; after the whole play they
    // must still match, whatever the commands after them did to the state.
    const snapshots: GameEvent[] = [];
    const { events } = play((state, command) => {
      const fresh = apply(state, command);
      snapshots.push(...structuredClone(fresh));
      return { state, events: fresh };
    });
    for (const type of ['party.returned', 'patron.granted', 'training-plan', 'year.settled'])
      expect(
        events.some((e) => e.type === type || (e.type === 'stop.raised' && e.reason === type)),
        type,
      ).toBe(true);
    expect(events).toEqual(snapshots);
  });

  it('returns events that share no object with the final state (an alias not yet changed)', () => {
    const { state: owned, events } = viaApply();
    const walk = (value: unknown, into: Set<object>) => {
      if (value === null || typeof value !== 'object' || into.has(value)) return;
      into.add(value);
      for (const child of Object.values(value)) walk(child, into);
    };
    const inState = new Set<object>();
    walk({ ...owned, content: null }, inState);
    const inEvents = new Set<object>();
    walk(events, inEvents);
    expect([...inEvents].filter((o) => inState.has(o))).toEqual([]);
  });
});
