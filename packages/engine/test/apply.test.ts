import { describe, expect, it } from 'vitest';
import {
  apply,
  simulate,
  type Command,
  type GameEvent,
  type GameState,
  type StaffRules,
} from '../src/index.ts';
import { adventurer, game, steadyPlan } from './fixture.ts';
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
type Step = (state: GameState, command: Command) => readonly GameEvent[];

/** Runs commands through one rule path; `copy` says whether that path returns a new state. */
function runner(
  start: GameState,
  step: (s: GameState, c: Command) => { state: GameState; events: readonly GameEvent[] },
) {
  let state = start;
  let n = 0;
  const events: GameEvent[] = [];
  return {
    get state() {
      return state;
    },
    events,
    run(command: Bare) {
      // cast-ok: the id is added back, so the union member is whole.
      const result = step(state, { ...command, id: `c${(n += 1)}` } as Command);
      state = result.state;
      events.push(...result.events);
    },
  };
}

/**
 * Every guild command: two months of a founded guild with careers and staff (signing a recruit,
 * hiring and releasing staff, parties out, a debt and the patron's grant), then a jump to the
 * year's end and into the next Assembly.
 */
function guildPlay(step: Parameters<typeof runner>[1]) {
  const r = runner(
    foundedGuild(3, {
      career: { ...testCareer, emergency: { wageWeeks: 8, everyYears: 3, confidenceCost: 5 } },
      staff: STAFF,
    }).state,
    step,
  );
  const candidate = r.state.guild!.staff!.candidates[0]!; // non-null: listed at the founding.
  r.run({ type: 'staff.hire', day: 1, candidateId: candidate.id });
  r.run({ type: 'recruit.sign', day: 1, prospectId: r.state.guild!.prospects[0]!.adventurer.id }); // non-null: a signing window.
  for (let day = 2; day <= 60; day += 1) {
    // A debt at day 30 (a jump between commands), so the patron offers the grant at the next week start.
    if (day === 30) r.state.guild!.chestCopper = -100_000; // non-null: founded.
    r.run({ type: 'day.advance', day });
    const guild = r.state.guild!; // non-null: founded.
    if (day === 40) r.run({ type: 'staff.release', day, area: candidate.area });
    if (guild.career?.emergencyOffer && guild.chestCopper < 0) r.run({ type: 'patron.grant', day });
    const free = guild.members.filter((m) => !m.away && m.outUntilDay <= day).map((m) => m.id);
    if (guild.board[0] && free.length >= 2)
      r.run({
        type: 'contract.take',
        day,
        offerId: guild.board[0].id,
        partyIds: free.slice(0, 3),
        plan: steadyPlan,
      });
  }
  // The rest of the year passes in one jump between commands; the Assembly settles it.
  r.state.calendar = YEAR;
  r.state.guild!.board.length = 0; // non-null: founded.
  for (let day = YEAR + 1; day <= YEAR + 3; day += 1) r.run({ type: 'day.advance', day });
  return r;
}

/** The watched quest's commands: start, steps, and pushing on at the first seed that raises a moment. */
function questPlay(step: Parameters<typeof runner>[1]) {
  for (let seed = 0; seed < 50; seed += 1) {
    const roster = ['a', 'b', 'c'].map((id) => adventurer(id));
    const r = runner(game(roster, { seed: `apply-${seed}` }), step);
    r.run({
      type: 'quest.start',
      day: 1,
      questId: 'q',
      templateId: 'quest.test-barrow',
      partyIds: ['a', 'b', 'c'],
      plan: { ...steadyPlan, retreat: 'badly-hurt' },
      watched: true,
    });
    while (r.state.quest)
      r.run(
        r.state.quest.momentPending
          ? { type: 'quest.choose', day: 1, choice: 'push-on' }
          : { type: 'quest.step', day: 1 },
      );
    if (r.events.some((e) => e.type === 'moment.resolved')) return r;
  }
  throw new Error('No seed raised a moment.');
}

const copying: Parameters<typeof runner>[1] = (state, command) => simulate(state, command);
const inPlace =
  (check: Step = apply): Parameters<typeof runner>[1] =>
  (state, command) => ({
    state,
    events: check(state, command),
  });

/** Objects reachable from a value (content left out: it is shared read-only by design). */
function objects(value: unknown, into = new Set<object>()): Set<object> {
  if (value === null || typeof value !== 'object' || into.has(value)) return into;
  into.add(value);
  for (const [key, child] of Object.entries(value)) if (key !== 'content') objects(child, into);
  return into;
}

describe('apply: the in-place rule path (D-148)', () => {
  for (const [name, playOf] of [
    ['guild', guildPlay],
    ['watched quest', questPlay],
  ] as const) {
    it(`gives the same events and state as simulate (${name} commands)`, () => {
      const copied = playOf(copying);
      const owned = playOf(inPlace());
      expect(owned.events).toEqual(copied.events);
      expect(owned.state).toEqual(copied.state);
    });

    it(`never returns an event that shares an object with the state (${name} commands)`, () => {
      // After every command, nothing in any event so far may be reachable from the state as it
      // is then, so no later command can change an event already returned.
      const returned: GameEvent[] = [];
      const shared: string[] = [];
      playOf(
        inPlace((state, command) => {
          const fresh = apply(state, command);
          returned.push(...fresh);
          const inState = objects(state);
          for (const e of returned)
            if ([...objects(e)].some((o) => inState.has(o))) shared.push(`${e.type} ${e.id}`);
          return fresh;
        }),
      );
      expect([...new Set(shared)]).toEqual([]);
    });
  }

  it('the plays reach every command and the systems they touch', () => {
    const types = new Set<string>(
      [...guildPlay(inPlace()).events, ...questPlay(inPlace()).events].map((e) => e.type),
    );
    for (const type of [
      'recruit.signed',
      'staff.hired',
      'staff.released',
      'party.returned',
      'patron.granted',
      'year.settled',
      'quest.started',
      'moment.resolved',
    ])
      expect(types.has(type), type).toBe(true);
  });
});
