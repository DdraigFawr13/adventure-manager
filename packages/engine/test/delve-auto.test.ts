// Auto (docs/specs/gate1-one-delve.md, Design "Auto"; D-220): each `when`, the good-choice roll,
// save-for-boss, and `fight.step` taking one adventurer turn.
import { describe, expect, it } from 'vitest';
import { gate1Content, GATE1_SAMPLE_PACK } from '@adventure-manager/content';
import {
  autoChance,
  sampleDelveState,
  sampleStart,
  simulate,
  type GameEvent,
  type GameState,
  type ResolutionContent,
} from '../src/index.ts';
import {
  AMIS,
  MAUD,
  ODRIC,
  WENNA,
  fixedChance,
  giveTurn,
  nextId,
  ofType,
  run,
} from './delve-fixture.ts';

/** Every hit lands and every Auto decision is a good one (or, with `good` false, never). */
function autoContent(good: boolean): ResolutionContent {
  const base = fixedChance(10_000);
  const bp = good ? 10_000 : 0;
  return {
    ...base,
    delve: {
      ...base.delve!,
      rules: { ...base.delve!.rules, auto: { ...base.delve!.rules.auto, minBp: bp, maxBp: bp } },
    },
  };
}

/** In room 2's fight (or the boss room), Auto on with save-for-boss as given. */
function fight(options: { good?: boolean; save?: boolean; boss?: boolean } = {}): GameState {
  const content = autoContent(options.good ?? true);
  let state = simulate(
    sampleDelveState(content, 'auto-test'),
    sampleStart(content, {
      id: 'cmd.start',
      siteId: 'site.hollow-barrow',
      tactics: 12,
      pack: GATE1_SAMPLE_PACK.map((p) => ({ ...p })),
    }),
  ).state;
  const d = run(state);
  d.phase = 'breather';
  if (options.boss) d.roomIndex = d.rooms.length - 2;
  state = simulate(state, { type: 'delve.next', id: nextId(), day: 1 }).state;
  state = simulate(state, {
    type: 'fight.auto',
    id: nextId(),
    day: 1,
    on: true,
    saveSkillsForBoss: options.save ?? false,
  }).state;
  return state;
}

/** Gives the adventurer the turn, steps Auto once and returns what that adventurer did. */
function step(
  state: GameState,
  actorId: string,
): { actionId: string; targetId: string | null; events: readonly GameEvent[] } {
  giveTurn(state, actorId);
  const out = simulate(state, { type: 'fight.step', id: nextId(), day: 1 });
  const mine = ofType(out.events, 'fight.acted').filter((e) => e.subjectIds[0] === actorId);
  expect(mine.length).toBeGreaterThan(0);
  expect(mine.every((e) => e.auto)).toBe(true);
  return { actionId: mine[0]!.actionId, targetId: mine[0]!.targetId, events: out.events };
}

const member = (state: GameState, id: string) => run(state).fighters.find((f) => f.id === id)!;
const foes = (state: GameState) => run(state).fight!.foes;

describe('Auto: the good-choice chance', () => {
  it('is 6,000 + 300 × (leader’s Wits − 10) + 200 × (Tactics − 10): Wenna leads at 7,600', () => {
    const state = simulate(
      sampleDelveState(gate1Content, 'x'),
      sampleStart(gate1Content, {
        id: 'cmd.start',
        siteId: 'site.hollow-barrow',
        tactics: 12,
        pack: [],
      }),
    ).state;
    expect(autoChance(state).total).toBe(7600);
  });

  it('a missed roll takes the plain attack on the first reachable foe by order', () => {
    const state = fight({ good: false });
    member(state, AMIS).health = 1; // the warrior would Guard him on a good roll
    const did = step(state, ODRIC);
    expect(did.actionId).toBe('action.strike');
    const order = run(state).fight!.order;
    const first = order.find((id) => foes(state).some((f) => f.id === id && f.row === 'front'));
    expect(did.targetId).toBe(first);
  });

  it('fight.auto sets Auto and save-for-boss for the party', () => {
    const state = fight({ save: true });
    expect(run(state).auto).toEqual({ on: true, saveSkillsForBoss: true });
  });
});

describe('Auto: each rule', () => {
  it('warrior: an ally below a third → Guard the most hurt ally', () => {
    const state = fight();
    member(state, MAUD).health = 3;
    expect(step(state, ODRIC)).toMatchObject({ actionId: 'action.guard', targetId: MAUD });
  });

  it('warrior: two front foes → Cleave; else the plain attack', () => {
    const state = fight();
    expect(foes(state).filter((f) => f.row === 'front').length).toBeGreaterThanOrEqual(2);
    expect(step(state, ODRIC).actionId).toBe('action.cleave');
  });

  it('rogue: a foe hit this round → Strike from shadow on it', () => {
    const state = fight();
    const marked = foes(state).find((f) => f.row === 'front')!;
    marked.hitThisRound = true;
    expect(step(state, WENNA)).toMatchObject({
      actionId: 'action.shadow-strike',
      targetId: marked.id,
    });
  });

  it('rogue: in the boss room → Hamstring the boss, once a fight', () => {
    const state = fight({ boss: true });
    const boss = foes(state).find((f) => f.kindId === 'foe.restless-warden')!;
    boss.health = 40; // keep it standing through the test
    const first = step(state, WENNA);
    expect(first).toMatchObject({ actionId: 'action.hamstring', targetId: boss.id });
  });

  it('cleric: a Dying ally → Mend them, even saving skills for the boss', () => {
    const state = fight({ save: true });
    member(state, MAUD).status = 'dying';
    member(state, MAUD).health = 0;
    expect(step(state, AMIS)).toMatchObject({ actionId: 'action.mend', targetId: MAUD });
  });

  it('cleric: a Down ally → Mend them, even saving skills for the boss', () => {
    const state = fight({ save: true });
    member(state, ODRIC).status = 'down';
    member(state, ODRIC).health = 0;
    expect(step(state, AMIS)).toMatchObject({ actionId: 'action.mend', targetId: ODRIC });
  });

  it('cleric: an ally below a third → Mend, but not while saving skills outside the boss room', () => {
    const open = fight();
    member(open, WENNA).health = 2;
    expect(step(open, AMIS)).toMatchObject({ actionId: 'action.mend', targetId: WENNA });
    const saving = fight({ save: true });
    member(saving, WENNA).health = 2;
    expect(step(saving, AMIS).actionId).toBe('action.mace');
  });

  it('cleric: in the boss room → Ward, once a round', () => {
    const state = fight({ boss: true, save: true });
    expect(step(state, AMIS).actionId).toBe('action.ward');
  });

  it('wizard: in the boss room → Firebolt the boss', () => {
    const state = fight({ boss: true, save: true });
    const boss = foes(state).find((f) => f.kindId === 'foe.restless-warden')!;
    expect(step(state, MAUD)).toMatchObject({ actionId: 'action.firebolt', targetId: boss.id });
  });

  it('wizard: a foe hit this round → Firebolt it; otherwise Spark the most hurt foe', () => {
    const marked = fight();
    const foe = foes(marked)[1]!;
    foe.hitThisRound = true;
    expect(step(marked, MAUD)).toMatchObject({ actionId: 'action.firebolt', targetId: foe.id });
    const plain = fight();
    const hurt = foes(plain)[2]!;
    hurt.health = 1;
    expect(step(plain, MAUD)).toMatchObject({ actionId: 'action.spark', targetId: hurt.id });
  });

  it('a rule whose skill has no uses left is skipped', () => {
    const state = fight();
    run(state).skillUses[ODRIC]!['action.cleave'] = 0;
    expect(step(state, ODRIC).actionId).toBe('action.strike');
  });

  it('a Dying ally and no Mend: Auto gives them a draught before the plain attack', () => {
    const state = fight({ save: true });
    member(state, AMIS).status = 'dying';
    member(state, AMIS).health = 0;
    const did = step(state, ODRIC);
    expect(did).toMatchObject({ actionId: 'item.draught', targetId: AMIS });
  });
});
