// The Order and skill-edge rules of docs/specs/gate1-one-delve.md, Design "Fight", checked over
// two rounds (J1; the branch review asked for each to be proven, not just its first step).
import { describe, expect, it } from 'vitest';
import { gate1Delve } from '@adventure-manager/content';
import { damageRange, hitChance } from '../src/index.ts';
import {
  AMIS,
  MAUD,
  ODRIC,
  WENNA,
  act,
  actor,
  fighter,
  fixedChance,
  giveTurn,
  ofType,
  run,
  started,
} from './delve-fixture.ts';
import type { GameEvent, GameState } from '../src/index.ts';

const HIT = fixedChance(10_000);
const MISS = fixedChance(0);

/** Swaps rows for every adventurer turn until the round number changes; returns all events. */
function finishRound(state: GameState): { state: GameState; events: GameEvent[] } {
  const round = run(state).fight!.round;
  const events: GameEvent[] = [];
  let s = state;
  while (s.delve?.phase === 'fight' && s.delve.fight!.round === round) {
    const r = act(s, 'action.swap-row');
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

const actorsOf = (events: readonly GameEvent[]): string[] =>
  ofType(events, 'fight.acted').map((e) => e.subjectIds[0]!);

describe('order over two rounds', () => {
  it('knockback lasts: the knocked foe acts one place later next round too', () => {
    let { state } = started('knock-2', HIT);
    giveTurn(state, ODRIC);
    state = act(state, 'action.strike', 'foe.1').state;
    const after = [...run(state).fight!.order];
    expect(after.indexOf('foe.1')).toBe(after.indexOf('foe.2') + 1);
    const next = finishRound(state);
    expect(run(next.state).fight!.order).toEqual(after);
  });

  it('a hasted ally who already acted acts after the wizard from the next round', () => {
    let { state } = started('haste-2', MISS);
    // Round 1 order: Wenna, hounds, Maud, archer, Odric, Amis. Wenna acts first, then Maud hastes her.
    state = act(state, 'action.swap-row').state;
    expect(actor(state)).toBe(MAUD);
    const { state: hasted, events } = act(state, 'action.haste', WENNA);
    // Wenna does not act again this round.
    expect(actorsOf(events).filter((id) => id === WENNA)).toEqual([]);
    const order = run(hasted).fight!.order;
    expect(order[order.indexOf(MAUD) + 1]).toBe(WENNA);
    // Round 2: Maud's turn comes, and the next to act after her is Wenna.
    let s2 = finishRound(hasted).state;
    expect(run(s2).fight!.round).toBe(2);
    const seen: string[] = [];
    while (s2.delve?.phase === 'fight' && run(s2).fight!.round === 2) {
      seen.push(actor(s2));
      s2 = act(s2, 'action.swap-row').state;
    }
    expect(seen[seen.indexOf(MAUD) + 1]).toBe(WENNA);
  });

  it('a raised ally whose place has passed acts again from the next round', () => {
    let { state } = started('raise-2', MISS);
    // Odric acts first; Wenna, next in the order, is Down and so is passed.
    giveTurn(state, ODRIC);
    Object.assign(fighter(state, WENNA), { status: 'down', health: 0 });
    state = act(state, 'action.swap-row').state;
    state = finishRoundUntil(state, AMIS);
    const { state: raised, events } = act(state, 'action.mend', WENNA);
    expect(fighter(raised, WENNA).status).toBe('up');
    // Round 1 ends without her acting; in round 2 she acts in her place, right after Odric.
    expect(actorsOf(events)).not.toContain(WENNA);
    expect(run(raised).fight!.round).toBe(2);
    expect(actor(raised)).toBe(ODRIC);
    const next = act(raised, 'action.swap-row').state;
    expect(actor(next)).toBe(WENNA);
  });
});

/** Swaps rows until it is the given adventurer's turn. */
function finishRoundUntil(state: GameState, id: string): GameState {
  let s = state;
  for (let i = 0; i < 20 && actor(s) !== id; i += 1) s = act(s, 'action.swap-row').state;
  return s;
}

describe('skill edges', () => {
  it('Cleave with one front-row foe strikes only that one', () => {
    const { state } = started('cleave-1', HIT);
    for (const id of ['foe.2', 'foe.3'])
      Object.assign(fighter(state, id), { status: 'down', health: 0 });
    giveTurn(state, ODRIC);
    const { events } = act(state, 'action.cleave', 'foe.1');
    const struck = ofType(events, 'fight.acted')
      .filter((e) => e.subjectIds[0] === ODRIC)
      .map((e) => e.targetId);
    expect(struck).toEqual(['foe.1']);
  });

  it('Guard spends its use with no hit coming', () => {
    let { state } = started('guard-use', MISS);
    giveTurn(state, ODRIC);
    state = act(state, 'action.guard', WENNA).state;
    expect(run(state).skillUses[ODRIC]!['action.guard']).toBe(gate1Delve.rules.skillUses - 1);
  });

  it('Guard ends when the warrior falls: later bites go to the guarded ally', () => {
    const { state } = started('guard-fall', HIT);
    giveTurn(state, ODRIC);
    fighter(state, ODRIC).health = 1;
    // Odric guards Wenna; the three hounds then bite at Wenna and the first bite lands on Odric.
    const guarded = act(state, 'action.guard', WENNA).state;
    // Wenna acts next (a knife at the archer); the hounds come after her.
    const { state: after, events } = act(guarded, 'action.throw-knife', 'foe.4');
    const bites = ofType(events, 'fight.acted').filter((e) =>
      ['foe.1', 'foe.2', 'foe.3'].includes(e.subjectIds[0]!),
    );
    expect(bites.map((e) => e.targetId)).toEqual([ODRIC, WENNA, WENNA]);
    expect(fighter(after, ODRIC).status).toBe('down');
    expect(fighter(after, WENNA).guardedBy).toBeUndefined();
  });

  it('Tactics adds 100 bp a point above 10 for the party, and nothing for foes', () => {
    const { state } = started();
    const party = hitChance(state, WENNA, 'action.throw-knife', 'foe.1');
    expect(party.parts).toContainEqual({ sourceId: 'guild.tactics', amount: 200 });
    const foe = hitChance(state, 'foe.1', 'action.foe-strike', WENNA);
    expect(foe.parts.map((p) => p.sourceId)).not.toContain('guild.tactics');
  });

  it('Spark helps only the party and Ward only hinders foes, so they never stack on one roll', () => {
    const { state } = started();
    run(state).fight!.warded = true;
    fighter(state, 'foe.1').sparked = true;
    const party = hitChance(state, WENNA, 'action.throw-knife', 'foe.1').parts.map(
      (p) => p.sourceId,
    );
    expect(party).toContain('mark.spark');
    expect(party).not.toContain('skill.ward');
    const foe = hitChance(state, 'foe.1', 'action.foe-strike', WENNA).parts.map((p) => p.sourceId);
    expect(foe).toContain('skill.ward');
    expect(foe).not.toContain('mark.spark');
  });

  it('Firebolt reaches any foe for 6–10 and spends a use', () => {
    let { state } = started('firebolt', HIT);
    giveTurn(state, MAUD);
    const range = damageRange(state, MAUD, 'action.firebolt', 'foe.4');
    expect([range.min.total, range.max.total]).toEqual([6, 10]);
    state = act(state, 'action.firebolt', 'foe.4').state;
    expect(run(state).skillUses[MAUD]!['action.firebolt']).toBe(gate1Delve.rules.skillUses - 1);
    const lost = 8 - fighter(state, 'foe.4').health;
    expect(lost === 8 || (lost >= 6 && lost <= 7)).toBe(true);
  });

  it('Ward and Strike from shadow each spend one use', () => {
    let { state } = started('uses-2', MISS);
    state = act(state, 'action.shadow-strike', 'foe.1').state;
    expect(run(state).skillUses[WENNA]!['action.shadow-strike']).toBe(2);
    giveTurn(state, AMIS);
    state = act(state, 'action.ward').state;
    expect(run(state).skillUses[AMIS]!['action.ward']).toBe(2);
  });
});
