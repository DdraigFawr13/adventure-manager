import { describe, expect, it } from 'vitest';
import type { ContractContent, CrisisRules, GameState } from '../src/index.ts';
import { game, ofType } from './fixture.ts';
import { advanceTo, guildRules, play, take, testCareer, type Run } from './guild-fixture.ts';

// One easy site and one feeble monster kind, so a party of three wins every step.
const contracts: ContractContent = {
  plainWeight: 1,
  sceneShift: { routine: 0, hazardous: 0, perilous: 0, deadly: 0 },
  recentShapes: 4,
  sites: [
    {
      id: 'site.field',
      tags: [],
      homes: ['field'],
      dangers: ['hazardous'],
      scenes: [
        { id: 'scene.walk', kind: 'approach', difficulty: 1, testers: 'best', onFailure: 'alarm' },
      ],
    },
  ],
  monsters: [
    {
      id: 'monster.mice',
      family: 'vermin',
      lives: ['field'],
      variants: { hazardous: [{ id: 'foe.mouse', attack: 1, defence: 1, speed: 1, hits: 1 }] },
    },
  ],
  twists: [],
};
const crises: CrisisRules = {
  fromYear: 2,
  startBp: 10_000,
  chains: [
    {
      id: 'crisis.mice',
      steps: [
        { siteId: 'site.field', monsterId: 'monster.mice', danger: 'hazardous', feeBp: 20_000 },
        { siteId: 'site.field', monsterId: 'monster.mice', danger: 'hazardous', feeBp: 20_000 },
      ],
      reward: { renown: 15, confidence: 15 },
      pressure: { weeklyCopper: 300, confidencePerReview: 10 },
    },
  ],
};
const YEAR = 48 * 7;

function begun(): Run {
  const base = game([], { rules: { minChanceBp: 0, maxChanceBp: 10_000 } });
  const state: GameState = {
    ...base,
    seed: 'crisis-seed',
    content: {
      ...base.content,
      contracts,
      guild: {
        ...guildRules,
        offersPerWeek: { assembly: 0, campaign: 0, winter: 0 },
        career: testCareer,
        crises,
      },
    },
  };
  return play({ state, events: [], commandIds: [] }, { type: 'guild.found', day: 1, size: 3 });
}

/** Jumps to the last day of the year and steps into the next Assembly. */
function settle(run: Run): Run {
  const state = structuredClone(run.state);
  state.calendar = YEAR * Math.ceil(state.calendar / YEAR);
  return play({ ...run, state }, { type: 'day.advance', day: state.calendar + 1 });
}

const crisisOffer = (run: Run) => run.state.guild!.board.find((o) => o.crisis); // non-null: founded.

describe('crises (crisis SPEC.md, D-147)', () => {
  it('wakes at an Assembly from its year, posts its step and presses until answered', () => {
    const first = begun();
    expect(ofType(first.events, 'crisis.started').length).toBe(0);
    let run = settle(first);
    expect(ofType(run.events, 'crisis.started')[0]?.chainId).toBe('crisis.mice');
    expect(ofType(run.events, 'stop.raised').some((e) => e.reason === 'crisis')).toBe(true);
    expect(crisisOffer(run)).toMatchObject({
      crisis: { chainId: 'crisis.mice', step: 0 },
      feeCopper: 2000,
    });
    // Untaken, it expires with the board's other offers and is posted again; each week costs 300.
    run = advanceTo(run, YEAR + 1 + 3 * 7);
    expect(crisisOffer(run)?.crisis?.step).toBe(0);
    const pressure = ofType(run.events, 'money.changed').filter((e) => e.reason === 'crisis');
    expect(pressure.map((e) => e.amountCopper)).toEqual([-300, -300, -300, -300]);
    // The patron's next review counts the crisis still standing.
    run = settle(run);
    // The fixture's patron: last place against "avoid the bottom" is one short (-15), plus the crisis (-10).
    expect(ofType(run.events, 'patron.reviewed').at(-1)).toMatchObject({ crisis: true });
    const reviewed = ofType(run.events, 'patron.reviewed').at(-1)!; // non-null: just checked.
    const without = reviewed.met ? 15 : -Math.min(40, 15 * (reviewed.place - 5));
    expect(reviewed.change).toBe(without - (reviewed.inDebt ? 15 : 0) - 10);
  });

  it('a won step moves the chain on; winning the last ends it with its reward, once a career', () => {
    let run = settle(begun());
    const party = run.state.guild!.members.map((m) => m.id); // non-null: founded.
    for (const step of [0, 1]) {
      expect(crisisOffer(run)?.crisis?.step).toBe(step);
      run = take(run, party, crisisOffer(run)?.id);
      const home = run.state.guild!.parties[0]!.homeDay; // non-null: just sent.
      // Home, rested, and on to the next week start, where the next step is posted.
      run = advanceTo(run, 7 * Math.ceil((home + 14) / 7) + 1);
    }
    expect(ofType(run.events, 'crisis.advanced').map((e) => e.step)).toEqual([1, 2]);
    const ended = ofType(run.events, 'crisis.ended')[0];
    expect(ended).toMatchObject({ chainId: 'crisis.mice', outcome: 'resolved' });
    const reward = ofType(run.events, 'renown.changed').find((e) => e.causeId === ended?.id);
    expect(reward?.amount).toBe(15);
    // The patron's confidence rose by the reward since the review at the crisis's Assembly.
    const reviewed = ofType(run.events, 'patron.reviewed').at(-1)?.confidence ?? 0;
    expect(run.state.guild!.career!.confidence).toBe(Math.min(100, reviewed + 15)); // non-null: careers are on.
    expect(run.state.guild!.crisis).toEqual({ active: null, done: ['crisis.mice'] }); // non-null: founded.
    run = settle(run);
    expect(ofType(run.events, 'crisis.started').length).toBe(1);
  });
});
