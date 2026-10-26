import { describe, expect, it } from 'vitest';
import {
  checkGuildInvariants,
  checkInvariants,
  isFree,
  stopDays,
  type GameState,
  type QuestOutcome,
} from '../src/index.ts';
import { rules as resolutionRules } from './fixture.ts';
import { ofType, steadyPlan } from './fixture.ts';
import { advanceTo, foundedGuild, play, take, WAGE, type Run } from './guild-fixture.ts';

const moneyOf = (run: Run, reason: string) =>
  ofType(run.events, 'money.changed')
    .filter((e) => e.reason === reason)
    .map((e) => e.amountCopper);

/** Puts a party in the state that is already on its way home tomorrow, with a known outcome. */
function withReturningParty(run: Run, outcome: QuestOutcome): Run {
  const state: GameState = structuredClone(run.state);
  const guild = state.guild!; // non-null: foundedGuild founded it.
  const ids = guild.members.slice(0, 2).map((m) => m.id);
  for (const m of guild.members) if (ids.includes(m.id)) m.away = true;
  guild.parties.push({
    id: 'party.test',
    memberIds: ids,
    plan: steadyPlan,
    offer: {
      id: 'offer.test',
      templateId: 'quest.test-barrow',
      danger: 'hazardous',
      feeCopper: 1000,
      travelDays: 2,
      expiresWeek: 9,
    },
    arriveDay: 1,
    homeDay: state.calendar + 1,
    outcome,
  });
  return { ...run, state };
}

describe('money (guild SPEC.md, Money)', () => {
  it('pays the patron grant once, and wages and running costs on each week start', () => {
    const day1 = foundedGuild(3);
    expect(moneyOf(day1, 'founding')).toEqual([10_000]);
    expect(moneyOf(day1, 'grant')).toEqual([4000]);
    expect(moneyOf(day1, 'wages')).toEqual([-3 * WAGE]);
    expect(moneyOf(day1, 'upkeep')).toEqual([-500]);
    expect(day1.state.guild?.chestCopper).toBe(10_000 + 4000 - 3 * WAGE - 500);
    const week2 = advanceTo(day1, 8);
    expect(moneyOf(week2, 'grant')).toHaveLength(1);
    expect(moneyOf(week2, 'wages')).toEqual([-3 * WAGE, -3 * WAGE]);
    expect(moneyOf(week2, 'upkeep')).toEqual([-500, -500]);
    expect(advanceTo(day1, 7).events.filter((e) => e.type === 'week.started')).toHaveLength(1);
  });

  it.each([
    ['won', 1200, 3],
    ['partial', 500, 0],
    ['retreated', 0, 0],
    ['routed', 0, -3],
  ] as const)('pays the fee by outcome: %s', (outcome, paid, renown) => {
    const day1 = foundedGuild(3);
    const before = day1.state.guild!.chestCopper; // non-null: founded.
    const home = advanceTo(withReturningParty(day1, outcome), 2);
    expect(home.state.guild!.chestCopper - before).toBe(paid); // non-null: founded.
    expect(home.state.guild!.renown).toBe(renown); // non-null: founded.
    expect(ofType(home.events, 'party.returned')[0]?.outcome).toBe(outcome);
    expect(home.state.guild!.parties).toHaveLength(0); // non-null: founded.
  });
});

describe('the board (guild SPEC.md, The board)', () => {
  it('drops offers after their two weeks and posts new ones each week', () => {
    const day1 = foundedGuild(3);
    const first = day1.state.guild!.board.map((o) => o.id); // non-null: founded.
    expect(first).toHaveLength(2);
    const day14 = advanceTo(day1, 14);
    expect(ofType(day14.events, 'offer.expired')).toHaveLength(0);
    const day15 = advanceTo(day14, 15);
    expect(ofType(day15.events, 'offer.expired').map((e) => e.subjectIds[0])).toEqual(first);
    const board = day15.state.guild!.board.map((o) => o.id); // non-null: founded.
    expect(board.some((id) => first.includes(id))).toBe(false);
    expect(board).toHaveLength(4); // weeks 2 and 3 posted two each; week 1's two expired.
  });

  it('refuses a party that is the wrong size, or has someone listed twice', () => {
    const run = foundedGuild(5);
    expect(() => take(run, ['adv.1'])).toThrow(/2–3 members/);
    expect(() => take(run, ['adv.1', 'adv.2', 'adv.3', 'adv.4'])).toThrow(/2–3 members/);
    expect(() => take(run, ['adv.1', 'adv.1'])).toThrow(/twice/);
  });
});

describe('people (guild SPEC.md, People)', () => {
  it('will not send an injured or away member until they are fit', () => {
    const run = foundedGuild(4);
    const hurt: Run = structuredClone(run);
    hurt.state.guild!.members[0]!.outUntilDay = 10; // non-null: four members exist.
    expect(() => take(hurt, ['adv.1', 'adv.2'])).toThrow(/recovering/);
    expect(isFree(hurt.state.guild!.members[0]!, 10)).toBe(true); // non-null: as above.
    const out = take(run, ['adv.1', 'adv.2']);
    expect(() => take(out, ['adv.2', 'adv.3'])).toThrow(/away/);
    expect(take(out, ['adv.3', 'adv.4']).state.guild!.parties).toHaveLength(2); // non-null: founded.
  });

  it('adds a wage when a prospect is signed, and the shortlist is only open in a window', () => {
    const day1 = foundedGuild(3);
    const prospect = day1.state.guild!.prospects[0]!; // non-null: window week, two listed.
    expect(day1.state.guild!.prospects).toHaveLength(2); // non-null: founded.
    const signed = play(day1, {
      type: 'recruit.sign',
      day: 1,
      prospectId: prospect.adventurer.id,
    });
    expect(ofType(signed.events, 'recruit.signed').at(-1)?.wageCopper).toBe(WAGE);
    expect(signed.state.guild!.members).toHaveLength(4); // non-null: founded.
    expect(signed.state.roster.some((a) => a.id === prospect.adventurer.id)).toBe(true);
    expect(() =>
      play(signed, { type: 'recruit.sign', day: 1, prospectId: prospect.adventurer.id }),
    ).toThrow(/shortlist/);
    expect(moneyOf(advanceTo(signed, 8), 'wages').at(-1)).toBe(-4 * WAGE);
    expect(advanceTo(signed, 15).state.guild!.prospects).toHaveLength(0); // non-null: founded.
  });

  it('takes the dead off the roster and the wage bill', () => {
    const base = foundedGuild(3);
    // Foes that cannot miss and a death roll that cannot fail: someone dies on the quest.
    const cloned: GameState = structuredClone(base.state);
    const state: GameState = {
      ...cloned,
      content: {
        ...cloned.content,
        rules: { ...resolutionRules, deathRoll: { baseBp: 10_000, stepBp: 0, pivot: 10 } },
        quests: cloned.content.quests.map((q) => ({
          ...q,
          foes: [{ id: 'foe.doom', attack: 40, defence: 40, speed: 40, hits: 90 }],
        })),
      },
    };
    const out = take({ ...base, state }, ['adv.1', 'adv.2', 'adv.3']);
    const home = advanceTo(out, 8);
    const died = ofType(home.events, 'adventurer.died').map((e) => e.subjectIds[0]);
    expect(died.length).toBeGreaterThan(0);
    const guild = home.state.guild!; // non-null: founded.
    for (const id of died) {
      expect(guild.members.some((m) => m.id === id)).toBe(false);
      expect(home.state.roster.find((a) => a.id === id)?.dead).toBe(true);
    }
    expect(moneyOf(home, 'wages').at(-1)).toBe(-(3 - died.length) * WAGE);
    expect(stopDays(home.events, (s) => s.reason === 'death')).toEqual([3]);
    expect(checkGuildInvariants(home.state, home.events, home.commandIds)).toEqual([]);
  });
});

describe('a contract from board to chest (guild SPEC.md, The board, People)', () => {
  it('departs, resolves on arrival, returns home and heals, with the invariants intact', () => {
    let run = take(foundedGuild(3), ['adv.1', 'adv.2', 'adv.3']);
    expect(ofType(run.events, 'party.departed')[0]).toMatchObject({ arriveDay: 3, homeDay: 5 });
    run = advanceTo(run, 4);
    expect(ofType(run.events, 'quest.ended')).toHaveLength(1);
    expect(ofType(run.events, 'quest.started')[0]?.day).toBe(3);
    expect(ofType(run.events, 'party.returned')).toHaveLength(0);
    run = advanceTo(run, 5);
    expect(ofType(run.events, 'party.returned')[0]?.day).toBe(5);
    expect(stopDays(run.events, (s) => s.reason === 'party-home')).toEqual([5]);
    const out = run.state.guild!.members.filter((m) => m.outUntilDay > 0); // non-null: founded.
    run = advanceTo(run, 60);
    expect(run.state.guild!.members.every((m) => isFree(m, 60))).toBe(true); // non-null: founded.
    const recovered = ofType(run.events, 'member.recovered').map((e) => e.subjectIds[0]);
    expect(recovered.sort()).toEqual(out.map((m) => m.id).sort());
    expect(checkInvariants(run.state, run.events, run.commandIds)).toEqual([]);
    expect(checkGuildInvariants(run.state, run.events, run.commandIds)).toEqual([]);
  });
});

describe('stops (guild SPEC.md, Stops)', () => {
  it('bundles every stop raised on one day into one stop day', () => {
    const day1 = foundedGuild(3);
    const raised = ofType(day1.events, 'stop.raised');
    expect(raised.map((s) => s.reason)).toEqual(['assembly', 'signing-window', 'new-contracts']);
    expect(raised.map((s) => s.stopClass)).toEqual(['must', 'must', 'digest']);
    expect(stopDays(day1.events)).toEqual([1]);
    const week2 = advanceTo(day1, 8);
    expect(stopDays(week2.events)).toEqual([1, 8]);
    expect(stopDays(week2.events, (s) => s.stopClass === 'digest')).toEqual([1, 8]);
    expect(stopDays(advanceTo(day1, 7).events)).toEqual([1]);
  });

  it('raises a week report on each campaigning week start only', () => {
    const run = advanceTo(foundedGuild(3), 36 * 7 + 1);
    const days = stopDays(run.events, (s) => s.reason === 'week-report');
    expect(days).toHaveLength(32);
    expect(days[0]).toBe(4 * 7 + 1);
    expect(days.at(-1)).toBe(35 * 7 + 1);
  });
});
