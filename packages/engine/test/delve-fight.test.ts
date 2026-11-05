// One test per rule in docs/specs/gate1-one-delve.md, Design "Fight" (J1), on the sample fight.
import { describe, expect, it } from 'vitest';
import { gate1Delve } from '@adventure-manager/content';
import { damageRange, fightView, hitChance, previewAction } from '../src/index.ts';
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

const HIT = fixedChance(10_000);
const MISS = fixedChance(0);
const rules = gate1Delve.rules;

describe('delve fight: order', () => {
  it('sorts by speed, ties by id, and starts on the fastest adventurer', () => {
    const { state, events } = started();
    // Wenna 15, hounds 14, Maud 11 and the archer 11 (adv. before foe.), Odric 10, Amis 8.
    expect(run(state).fight?.order).toEqual([
      WENNA,
      'foe.1',
      'foe.2',
      'foe.3',
      MAUD,
      'foe.4',
      ODRIC,
      AMIS,
    ]);
    expect(actor(state)).toBe(WENNA);
    expect(ofType(events, 'round.started')[0]?.round).toBe(1);
  });

  it('keeps the order across rounds and runs foe turns between adventurers', () => {
    let { state } = started('order-kept', MISS);
    const first = [...(run(state).fight?.order ?? [])];
    for (let i = 0; i < 4; i += 1) state = act(state, 'action.swap-row').state;
    expect(run(state).fight?.round).toBe(2);
    expect(run(state).fight?.order).toEqual(first);
    expect(actor(state)).toBe(WENNA);
  });

  it('knockback moves the target one place later, and the move lasts', () => {
    let { state } = started('knock', HIT);
    giveTurn(state, ODRIC);
    const before = run(state).fight!.order.indexOf('foe.1');
    state = act(state, 'action.strike', 'foe.1').state;
    const order = run(state).fight!.order;
    expect(order.indexOf('foe.1')).toBe(before + 1);
  });

  it('Hamstring moves the target to last', () => {
    let { state } = started('ham', HIT);
    state = act(state, 'action.hamstring', 'foe.2').state;
    const order = run(state).fight!.order;
    expect(order[order.length - 1]).toBe('foe.2');
  });

  it('Haste moves an ally to right after the wizard, who acts there', () => {
    let { state } = started('haste', MISS);
    giveTurn(state, MAUD);
    state = act(state, 'action.haste', AMIS).state;
    const order = run(state).fight!.order;
    expect(order[order.indexOf(MAUD) + 1]).toBe(AMIS);
    expect(actor(state)).toBe(AMIS);
  });

  it('skips Down fighters, who keep their place', () => {
    let { state } = started('skip', MISS);
    fighter(state, MAUD).status = 'down';
    fighter(state, MAUD).health = 0;
    const order = [...run(state).fight!.order];
    const acted: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const r = act(state, 'action.swap-row');
      state = r.state;
      acted.push(...ofType(r.events, 'fight.acted').map((e) => e.subjectIds[0]!));
    }
    expect(run(state).fight!.order).toEqual(order);
    expect(acted).not.toContain(MAUD);
    expect(acted).toContain(ODRIC);
  });
});

describe('delve fight: intents', () => {
  it('each foe shows what and whom at the round start, by its target rule', () => {
    const { state } = started();
    const intents = run(state).fight!.intents;
    // Hounds: front-most, the first front-row adventurer by order (Wenna). Archer: back-row-first,
    // the back row's lowest health (Maud 12 against Amis 19).
    for (const id of ['foe.1', 'foe.2', 'foe.3'])
      expect(intents[id]).toEqual({ actionId: 'action.foe-strike', targetId: WENNA });
    expect(intents['foe.4']).toEqual({ actionId: 'action.foe-strike', targetId: MAUD });
  });

  it('a foe whose target fell picks again by the same rule', () => {
    const { state } = started('repick', HIT);
    fighter(state, WENNA).status = 'down';
    fighter(state, WENNA).health = 0;
    giveTurn(state, ODRIC);
    const { events } = act(state, 'action.swap-row');
    const houndHits = ofType(events, 'fight.acted').filter((e) => e.subjectIds[0] === 'foe.1');
    // Odric moved to the back, so no one stands in front: the hound takes the first by order.
    expect(houndHits[0]?.targetId).toBe(ODRIC);
  });
});

describe('delve fight: reach', () => {
  it('melee reaches only the front row while a foe stands there; ranged reaches any', () => {
    const { state } = started();
    const view = fightView(state)!;
    const targets = (id: string): readonly string[] =>
      view.actions.find((a) => a.actionId === id)?.targets ?? [];
    expect(targets('action.hamstring')).toEqual(['foe.1', 'foe.2', 'foe.3']);
    expect(targets('action.throw-knife')).toEqual(['foe.1', 'foe.2', 'foe.3', 'foe.4']);
  });

  it('melee reaches the back row once the front row is down', () => {
    const { state } = started();
    for (const id of ['foe.1', 'foe.2', 'foe.3']) {
      fighter(state, id).status = 'down';
      fighter(state, id).health = 0;
    }
    const view = fightView(state)!;
    expect(view.actions.find((a) => a.actionId === 'action.hamstring')?.targets).toEqual(['foe.4']);
  });

  it('a melee foe hits the front row while anyone stands there', () => {
    const { state } = started('reach-foe', HIT);
    run(state).fight!.intents['foe.1'] = { actionId: 'action.foe-strike', targetId: AMIS };
    // Wenna steps back; Amis in the back can't be bitten while Odric stands in front.
    const { events } = act(state, 'action.swap-row');
    const bite = ofType(events, 'fight.acted').find((e) => e.subjectIds[0] === 'foe.1');
    expect(bite?.targetId).toBe(ODRIC);
  });
});

describe('delve fight: hit and damage', () => {
  it('hit is 5,000 + 500 × (attack − defence) + Tactics, in bp, with parts', () => {
    const { state } = started();
    const hit = hitChance(state, WENNA, 'action.throw-knife', 'foe.4');
    // Agility 15 against the archer's defence 8, Tactics 12.
    expect(hit.total).toBe(5000 + 500 * 7 + 200);
    expect(hit.parts.map((p) => p.sourceId)).toEqual(['check.difference', 'guild.tactics']);
  });

  it('clamps to 500–9,500 with a clamp part', () => {
    const { state } = started();
    run(state).fight!.foes[0]!.sparked = true;
    const hit = hitChance(state, ODRIC, 'action.strike', 'foe.1');
    // Might 15 − 9 = +3,000, Tactics +200, Spark +1,000: 9,200 stays under the cap.
    expect(hit.total).toBe(9200);
    const archer = hitChance(state, 'foe.4', 'action.foe-strike', MAUD);
    expect(archer.total).toBe(5000 + 500 * (12 - 10));
  });

  it('adventurer defence is 10 + ⌊(Agility − 10) / 2⌋ + armour weight', () => {
    const { state } = started();
    // Amis: Agility 8 → −1, medium armour +1: defence 10. Odric: Agility 10, heavy +2: 12.
    expect(hitChance(state, 'foe.1', 'action.foe-strike', AMIS).total).toBe(5000 + 500 * 2);
    expect(hitChance(state, 'foe.1', 'action.foe-strike', ODRIC).total).toBe(5000);
  });

  it('Ward takes 1,500 bp off foes this round', () => {
    const { state } = started();
    run(state).fight!.warded = true;
    expect(hitChance(state, 'foe.1', 'action.foe-strike', WENNA).total).toBe(
      5000 + 0 - rules.wardBp,
    );
  });

  it('damage is the range less armour, at least 1; Strike from shadow doubles on a foe hit this round', () => {
    const { state } = started();
    const knife = damageRange(state, WENNA, 'action.throw-knife', 'foe.4');
    expect([knife.min.total, knife.max.total]).toEqual([2, 4]);
    // The hounds bite Odric (heavy, armour 2): 2–4 − 2, at least 1.
    const bite = damageRange(state, 'foe.1', 'action.foe-strike', ODRIC);
    expect([bite.min.total, bite.max.total]).toEqual([1, 2]);
    fighter(state, 'foe.2').hitThisRound = true;
    const shadow = damageRange(state, WENNA, 'action.shadow-strike', 'foe.2');
    expect([shadow.min.total, shadow.max.total]).toEqual([6, 12]);
  });

  it('a strike rolls once to hit and damage lies in the previewed range', () => {
    const { state } = started('roll');
    const preview = previewAction(state, WENNA, 'action.throw-knife', 'foe.4');
    const { events } = act(state, 'action.throw-knife', 'foe.4');
    const acted = ofType(events, 'fight.acted')[0]!;
    expect(acted.hit?.total).toBe(preview.hit.total);
    expect(acted.roll! <= acted.hit!.total).toBe(acted.damage > 0);
    if (acted.damage) {
      expect(acted.damage).toBeGreaterThanOrEqual(preview.damage.min.total);
      expect(acted.damage).toBeLessThanOrEqual(preview.damage.max.total);
    }
  });

  it('heals, Guard, Ward, Haste and items never miss (no roll)', () => {
    const { state } = started('never', MISS);
    giveTurn(state, AMIS);
    fighter(state, WENNA).health = 5;
    const { state: next, events } = act(state, 'action.mend', WENNA);
    const acted = ofType(events, 'fight.acted')[0]!;
    expect(acted.roll).toBeNull();
    expect(hitChance(state, AMIS, 'action.mend', WENNA).total).toBe(10_000);
    expect(fighter(next, WENNA).health).toBeGreaterThanOrEqual(11);
  });
});

describe('delve fight: plain attacks and skills', () => {
  it('the cleric’s plain attack heals the most hurt standing ally 1', () => {
    let { state } = started('mace', MISS);
    giveTurn(state, AMIS);
    fighter(state, WENNA).health = 10;
    fighter(state, MAUD).health = 6;
    state = act(state, 'action.mace', 'foe.1').state;
    // Maud 6/12 is more hurt than Wenna 10/17; the heal comes even on a miss.
    expect(fighter(state, MAUD).health).toBeGreaterThanOrEqual(7);
  });

  it('Spark marks the foe for allies this round', () => {
    let { state } = started('spark', HIT);
    giveTurn(state, MAUD);
    state = act(state, 'action.spark', 'foe.4').state;
    expect(actor(state)).toBe(WENNA);
    expect(fighter(state, 'foe.4').sparked).toBe(true);
    const parts = hitChance(state, WENNA, 'action.throw-knife', 'foe.4').parts;
    expect(parts).toContainEqual({ sourceId: 'mark.spark', amount: rules.sparkBp });
  });

  it('Guard: hits aimed at the guarded ally strike the warrior instead', () => {
    let { state } = started('guard', HIT);
    giveTurn(state, ODRIC);
    state = act(state, 'action.guard', WENNA).state;
    expect(fighter(state, WENNA).guardedBy).toBe(ODRIC);
    const { events } = act(state, 'action.throw-knife', 'foe.4');
    const bites = ofType(events, 'fight.acted').filter((e) =>
      ['foe.1', 'foe.2', 'foe.3'].includes(e.subjectIds[0]!),
    );
    expect(bites).toHaveLength(3);
    for (const bite of bites) expect(bite.targetId).toBe(ODRIC);
  });

  it('Cleave strikes the target and the next front-row foe in order', () => {
    const { state } = started('cleave', HIT);
    giveTurn(state, ODRIC);
    const { events } = act(state, 'action.cleave', 'foe.2');
    const struck = ofType(events, 'fight.acted')
      .filter((e) => e.subjectIds[0] === ODRIC)
      .map((e) => e.targetId);
    expect(struck).toEqual(['foe.2', 'foe.3']);
  });

  it('Mend heals 6, or raises a Down or Dying ally to 4', () => {
    let { state } = started('mend', MISS);
    giveTurn(state, AMIS);
    Object.assign(fighter(state, WENNA), { status: 'dying', health: 0 });
    state = act(state, 'action.mend', WENNA).state;
    expect(fighter(state, WENNA).status).toBe('up');
    // Raised to 4 (the hounds' bites miss under this content).
    expect(fighter(state, WENNA).health).toBe(4);
  });

  it('skills have 3 uses a delve and are refused at 0', () => {
    let { state } = started('uses', MISS);
    expect(fightView(state)!.actions.find((a) => a.actionId === 'action.hamstring')?.usesLeft).toBe(
      3,
    );
    run(state).skillUses[WENNA]!['action.hamstring'] = 0;
    expect(() => act(state, 'action.hamstring', 'foe.1')).toThrow('no uses left');
    state = act(state, 'action.throw-knife', 'foe.1').state;
    expect(run(state).skillUses[WENNA]!['action.shadow-strike']).toBe(3);
  });

  it('a draught raises a Down ally to 6; a firebomb hits every standing foe in the row', () => {
    let { state } = started('pack', HIT);
    Object.assign(fighter(state, ODRIC), { status: 'down', health: 0 });
    state = act(state, 'action.pack', ODRIC, 0).state;
    expect(fighter(state, ODRIC).status).toBe('up');
    expect(run(state).pack).toHaveLength(3);
    giveTurn(state, WENNA);
    const { events } = act(state, 'action.pack', 'foe.1', 2);
    const hurtFoes = new Set(
      ofType(events, 'health.changed')
        .filter((e) => ['foe.1', 'foe.2', 'foe.3'].includes(e.subjectIds[0]!))
        .map((e) => e.subjectIds[0]),
    );
    expect(hurtFoes.size).toBe(3);
  });

  it('swapping rows takes the turn', () => {
    let { state } = started('swap', MISS);
    state = act(state, 'action.swap-row').state;
    expect(fighter(state, WENNA).row).toBe('back');
    expect(actor(state)).not.toBe(WENNA);
  });

  it('refuses a command out of turn or out of reach', () => {
    const { state } = started();
    expect(() => act(state, 'action.hamstring', 'foe.4')).toThrow('Out of reach');
    giveTurn(state, WENNA);
    run(state).fight!.turn = 1;
    expect(() => act(state, 'action.throw-knife', 'foe.1')).toThrow();
  });
});

describe('delve fight: round end and the fight’s end', () => {
  it('Down adventurers roll to bleed and the Dying roll for death at the round end', () => {
    // Chances: bleed base − 200 × (14 − 10) for Odric (1,095 − 800 = 295 since S2's tuning);
    // death 3,500 − 150 × ((8 − 10) + (12 − 10)) = 3,500 for Maud. Over the seeds each roll must
    // come up at least once (300 seeds: at 295 bp a bleed is rare).
    const dying: number[] = [];
    const died: number[] = [];
    for (let n = 0; n < 300; n += 1) {
      let { state } = started(`bleed-${n}`, MISS);
      Object.assign(fighter(state, ODRIC), { status: 'down', health: 0 });
      Object.assign(fighter(state, MAUD), { status: 'dying', health: 0 });
      for (let i = 0; i < 2; i += 1) {
        const r = act(state, 'action.swap-row');
        state = r.state;
        dying.push(...ofType(r.events, 'fighter.dying').map((e) => e.chanceBp));
        died.push(...ofType(r.events, 'fighter.died').map((e) => e.chanceBp));
      }
    }
    expect(dying.length).toBeGreaterThan(0);
    expect(died.length).toBeGreaterThan(0);
    expect(new Set(dying)).toEqual(new Set([rules.bleed.baseBp - 200 * (14 - 10)]));
    expect(new Set(died)).toEqual(new Set([3500]));
  });

  it('marks clear at the round end', () => {
    let { state } = started('marks', MISS);
    run(state).fight!.warded = true;
    fighter(state, 'foe.1').sparked = true;
    for (let i = 0; i < 4; i += 1) state = act(state, 'action.swap-row').state;
    expect(run(state).fight!.warded).toBe(false);
    expect(fighter(state, 'foe.1').sparked).toBe(false);
  });

  it('a band flees when more than half its foes are Down: 3 of 4', () => {
    let { state } = started('flee', MISS);
    for (const id of ['foe.1', 'foe.2'])
      Object.assign(fighter(state, id), { status: 'down', health: 0 });
    for (let i = 0; i < 4; i += 1) state = act(state, 'action.swap-row').state;
    expect(run(state).phase).toBe('fight');
    Object.assign(fighter(state, 'foe.3'), { status: 'down', health: 0 });
    const { state: end, events } = act(state, 'action.swap-row');
    let s = end;
    let all = [...events];
    while (s.delve?.phase === 'fight') {
      const r = act(s, 'action.swap-row');
      s = r.state;
      all = [...all, ...r.events];
    }
    expect(ofType(all, 'band.fled')[0]?.subjectIds).toEqual(['foe.4']);
    expect(fighter(s, 'foe.4').status).toBe('fled');
    expect(s.delve?.outcome).toBe('won');
  });

  it('routs when no adventurer stands, and ends the delve with wound steps', () => {
    const { state } = started('rout', HIT);
    for (const id of [ODRIC, AMIS, MAUD])
      Object.assign(fighter(state, id), { status: 'down', health: 0 });
    fighter(state, WENNA).health = 1;
    const { state: end, events } = act(state, 'action.swap-row');
    expect(end.delve?.outcome).toBe('routed');
    const ended = ofType(events, 'delve.ended')[0]!;
    expect(ended.members.find((m) => m.adventurerId === WENNA)?.woundStep).toBe(3);
    expect(ended.members.every((m) => !m.died)).toBe(true);
  });

  it('wound steps at the end: above ⅔ 0, Hurt 1, Badly hurt 2, Down 3, Dying 4', async () => {
    const { woundStepOf } = await import('../src/index.ts');
    const f = { ...fighter(started().state, WENNA) };
    expect(woundStepOf({ ...f, health: 17 })).toBe(0);
    expect(woundStepOf({ ...f, health: 11 })).toBe(1);
    expect(woundStepOf({ ...f, health: 5 })).toBe(2);
    expect(woundStepOf({ ...f, health: 0, status: 'down' })).toBe(3);
    expect(woundStepOf({ ...f, health: 0, status: 'dying' })).toBe(4);
  });
});
