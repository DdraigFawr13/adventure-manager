import { describe, expect, it } from 'vitest';
import { apply, simulate, type Command, type GameEvent, type GameState } from '../src/index.ts';
import { steadyPlan } from './fixture.ts';
import { foundedGuild, testCareer } from './guild-fixture.ts';

const YEAR = 48 * 7;
type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

/**
 * Two months of play on a founded guild with careers, sending parties out, then a jump to the year's
 * end and into the next Assembly: the same commands through either rule path.
 */
function play(
  step: (state: GameState, command: Command) => { state: GameState; events: readonly GameEvent[] },
) {
  let state = foundedGuild(3, { career: testCareer }).state;
  const events: GameEvent[] = [];
  let n = 0;
  const run = (command: Bare) => {
    // cast-ok: the id is added back, so the union member is whole.
    const result = step(state, { ...command, id: `c${(n += 1)}` } as Command);
    state = result.state;
    events.push(...result.events);
  };
  for (let day = 2; day <= 60; day += 1) {
    run({ type: 'day.advance', day });
    const guild = state.guild!; // non-null: founded.
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

  it('returns events that share no object with the state, so later commands cannot change them', () => {
    const { state: owned, events } = viaApply();
    const inState = new Set<object>();
    const walk = (value: unknown, into: Set<object>) => {
      if (value === null || typeof value !== 'object' || into.has(value)) return;
      into.add(value);
      for (const child of Object.values(value)) walk(child, into);
    };
    walk({ ...owned, content: null }, inState);
    const inEvents = new Set<object>();
    walk(events, inEvents);
    expect([...inEvents].filter((o) => inState.has(o))).toEqual([]);
  });
});
