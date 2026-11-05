// One test per rule in docs/specs/gate1-one-delve.md, Design "Rooms", "Retreat" and "End" (J3), on
// the Hollow Barrow with the sample party.
import { describe, expect, it } from 'vitest';
import { gate1Content, gate1Delve, GATE1_SAMPLE_PACK } from '@adventure-manager/content';
import {
  delveView,
  fightView,
  retreatPreview,
  sampleDelveState,
  sampleStart,
  simulate,
  type DelveCommand,
  type DelveContent,
  type GameEvent,
  type GameState,
  type ResolutionContent,
} from '../src/index.ts';
import {
  AMIS,
  MAUD,
  ODRIC,
  WENNA,
  fighter,
  fixedChance,
  nextId,
  ofType,
  run,
} from './delve-fixture.ts';

const BARROW = 'site.hollow-barrow';
const rules = gate1Delve.rules;
const HIT = fixedChance(10_000);
const MISS = fixedChance(0);

/** Content with one rule changed (a copy; content is never written). */
function withRules(
  base: ResolutionContent,
  change: Partial<DelveContent['rules']>,
): ResolutionContent {
  return { ...base, delve: { ...base.delve!, rules: { ...base.delve!.rules, ...change } } };
}

type Result = { state: GameState; events: readonly GameEvent[] };
type Body = DelveCommand extends infer C
  ? C extends { id: string; day: number }
    ? Omit<C, 'id' | 'day'>
    : never
  : never;

function send(state: GameState, body: Body): Result {
  // cast-ok: the body plus id and day is the command of its type.
  return simulate(state, { ...body, id: nextId(), day: 1 } as DelveCommand);
}

function barrow(
  content: ResolutionContent = gate1Content,
  seed = 'rooms-test',
  approach: 'stealth' | 'assault' | 'diplomacy' = 'assault',
): Result {
  return simulate(
    sampleDelveState(content, seed),
    sampleStart(content, {
      id: 'cmd.start',
      siteId: BARROW,
      tactics: 12,
      pack: GATE1_SAMPLE_PACK.map((p) => ({ ...p })),
      approach,
    }),
  );
}

/** Plays the current fight to its end with plain attacks on the first target (use with HIT). */
function winFight(state: GameState): Result {
  let r: Result = { state, events: [] };
  const all: GameEvent[] = [];
  for (let i = 0; i < 200 && r.state.delve?.phase === 'fight'; i += 1) {
    const view = fightView(r.state)!;
    const plain = view.actions[0]!;
    r = send(r.state, {
      type: 'fight.act',
      actorId: view.actorId!,
      actionId: plain.actionId,
      targetId: plain.targets[0]!,
    });
    all.push(...r.events);
  }
  return { state: r.state, events: all };
}

describe('delve rooms: layout', () => {
  it('is entry, fight, fight, maybe one more, fight, boss, drawn without repeats', () => {
    const lengths = new Set<number>();
    let extraChoice = 0;
    for (let i = 0; i < 60; i += 1) {
      const rooms = run(barrow(gate1Content, `layout-${i}`).state).rooms;
      lengths.add(rooms.length);
      expect(rooms[0]).toEqual({ kind: 'choice', roomId: 'room.barrow-mouth' });
      expect(rooms.at(-1)).toEqual({ kind: 'fight', roomId: 'room.burial-hall', boss: true });
      expect(rooms[1]?.kind).toBe('fight');
      expect(rooms[2]?.kind).toBe('fight');
      const fights = rooms.filter((r) => r.kind === 'fight' && !r.boss).map((r) => r.roomId);
      expect(new Set(fights).size).toBe(fights.length);
      if (rooms.length === 6 && rooms[3]?.kind === 'choice') extraChoice += 1;
    }
    expect([...lengths].sort()).toEqual([5, 6]);
    expect(extraChoice).toBeGreaterThan(0);
  });

  it('opens in the entry room, a choice, with each standing member as a tester', () => {
    const { state } = barrow();
    expect(run(state).phase).toBe('choice');
    const choice = delveView(state)!.choice!;
    expect(choice.options.map((o) => o.attribute)).toEqual(['might', 'lore']);
    expect(choice.options[0]!.testers.map((t) => [t.id, t.chance.total])).toEqual([
      [ODRIC, 7000],
      [WENNA, 4000],
      [AMIS, 4500],
      [MAUD, 3000],
    ]);
  });

  it('tests the approach’s attribute on the entry’s first way (D-232)', () => {
    const view = delveView(barrow(gate1Content, 'x', 'stealth').state)!;
    expect(view.choice!.options[0]!.attribute).toBe('stealth');
  });
});

describe('delve rooms: choices', () => {
  it('success either way at the entry puts the first fight’s foes off guard', () => {
    const chosen = send(barrow(HIT).state, {
      type: 'delve.choose',
      optionIndex: 1,
      testerId: MAUD,
    });
    expect(ofType(chosen.events, 'choice.rolled')[0]?.success).toBe(true);
    expect(run(chosen.state).bonuses.offGuard).toBe(true);
    const fight = send(chosen.state, { type: 'delve.next' }).state;
    expect(Object.values(run(fight).fight!.intents).every((i) => i === 'off-guard')).toBe(true);
    expect(run(fight).bonuses.offGuard).toBe(false);
  });

  it('a failed hurt way costs the tester 4 health, never below 1', () => {
    const start = barrow(MISS).state;
    const chosen = send(start, { type: 'delve.choose', optionIndex: 0, testerId: ODRIC });
    expect(fighter(chosen.state, ODRIC).health).toBe(
      fighter(start, ODRIC).health - rules.room.hurt,
    );
    run(start).fighters.find((f) => f.id === ODRIC)!.health = 2;
    const low = send(start, { type: 'delve.choose', optionIndex: 0, testerId: ODRIC });
    expect(fighter(low.state, ODRIC).health).toBe(1);
  });

  it('a failed alert way alerts the next fight: its foes act before every adventurer in round 1', () => {
    const chosen = send(barrow(MISS).state, {
      type: 'delve.choose',
      optionIndex: 1,
      testerId: MAUD,
    });
    expect(run(chosen.state).bonuses.alerted).toBe(true);
    const entered = send(chosen.state, { type: 'delve.next' });
    const acted = ofType(entered.events, 'fight.acted');
    const foes = run(entered.state).fight!.foes.length;
    expect(acted.slice(0, foes).every((e) => e.subjectIds[0]!.startsWith('foe.'))).toBe(true);
    expect(run(entered.state).bonuses.alerted).toBe(false);
  });

  it('off guard and alerted together cancel: round 1 runs as normal', () => {
    const chosen = send(barrow(HIT).state, {
      type: 'delve.choose',
      optionIndex: 0,
      testerId: ODRIC,
    });
    run(chosen.state).bonuses.alerted = true;
    const entered = send(chosen.state, { type: 'delve.next' });
    const intents = Object.values(run(entered.state).fight!.intents);
    expect(intents.some((i) => i === 'off-guard')).toBe(false);
    expect(run(entered.state).fight!.order[run(entered.state).fight!.turn]).toBe(WENNA);
  });

  it('a following choice room passes an alert on', () => {
    const { state } = barrow(MISS);
    const d = run(state);
    // Make the next room a choice room, then fail its alert way too.
    (d.rooms as unknown as { kind: string; roomId: string }[])[1] = {
      kind: 'choice',
      roomId: 'room.fallen-passage',
    };
    const a = send(state, { type: 'delve.choose', optionIndex: 1, testerId: MAUD }).state;
    const b = send(a, { type: 'delve.next' }).state;
    expect(run(b).phase).toBe('choice');
    expect(run(b).bonuses.alerted).toBe(true);
  });
});

describe('delve rooms: Scout ahead and rows', () => {
  const afterEntry = (content: ResolutionContent) =>
    send(barrow(content).state, { type: 'delve.choose', optionIndex: 0, testerId: ODRIC }).state;

  it('a seen scout shows the next room and lets the rows be set, free, once per gap', () => {
    const state = afterEntry(HIT);
    const view = delveView(state)!;
    expect(view.scout?.scoutId).toBe(WENNA);
    expect(view.scout?.chance.total).toBe(10_000);
    const scouted = send(state, { type: 'delve.scout' });
    expect(ofType(scouted.events, 'scout.rolled')[0]?.success).toBe(true);
    const next = delveView(scouted.state)!.next!;
    expect(next.kind).toBe('fight');
    expect(next.foes.length).toBeGreaterThanOrEqual(3);
    expect(() => send(scouted.state, { type: 'delve.scout' })).toThrow(/spent/);
    const rows = send(scouted.state, { type: 'delve.rows', rows: { [AMIS]: 'front' } });
    expect(fighter(rows.state, AMIS).row).toBe('front');
    expect(ofType(rows.events, 'rows.set')).toHaveLength(1);
  });

  it('a heard scout alerts the next room and shows nothing; rows stay shut', () => {
    const scouted = send(afterEntry(MISS), { type: 'delve.scout' });
    expect(run(scouted.state).bonuses.alerted).toBe(true);
    expect(delveView(scouted.state)!.next).toBeNull();
    expect(() => send(scouted.state, { type: 'delve.rows', rows: { [AMIS]: 'front' } })).toThrow();
  });

  it('needs a standing rogue (the button is hidden otherwise)', () => {
    const state = afterEntry(HIT);
    run(state).fighters.find((f) => f.id === WENNA)!.status = 'down';
    expect(delveView(state)!.scout).toBeNull();
    expect(() => send(state, { type: 'delve.scout' })).toThrow(/rogue/);
  });

  it('uses the choice-room difficulty: Wenna’s Stealth 16 against 11 is 75%', () => {
    const state = send(barrow().state, {
      type: 'delve.choose',
      optionIndex: 0,
      testerId: ODRIC,
    }).state;
    expect(delveView(state)!.scout?.chance.total).toBe(7500);
  });
});

describe('delve rooms: the breather', () => {
  it('raises the Down to 3, leaves the Dying Down, and refills nothing', () => {
    let state = send(barrow(HIT).state, {
      type: 'delve.choose',
      optionIndex: 0,
      testerId: ODRIC,
    }).state;
    state = send(state, { type: 'delve.next' }).state;
    const d = run(state);
    d.fighters.find((f) => f.id === AMIS)!.status = 'down';
    d.fighters.find((f) => f.id === AMIS)!.health = 0;
    d.fighters.find((f) => f.id === MAUD)!.status = 'dying';
    d.fighters.find((f) => f.id === MAUD)!.health = 0;
    d.skillUses[ODRIC]!['action.guard'] = 1;
    d.pack.splice(0, 1);
    for (const foe of d.fight!.foes) foe.health = 1;
    const won = winFight(state);
    expect(run(won.state).phase).toBe('breather');
    expect(fighter(won.state, AMIS)).toMatchObject({ status: 'up', health: rules.breatherRaiseTo });
    expect(fighter(won.state, MAUD)).toMatchObject({ status: 'down', health: 0 });
    expect(run(won.state).skillUses[ODRIC]!['action.guard']).toBe(1);
    expect(run(won.state).pack).toHaveLength(3);
    expect(ofType(won.events, 'breather')[0]?.raisedIds).toEqual([AMIS]);
  });

  it('moving on with no one standing ends the delve routed', () => {
    const state = send(barrow(HIT).state, {
      type: 'delve.choose',
      optionIndex: 0,
      testerId: ODRIC,
    }).state;
    for (const f of run(state).fighters) f.status = 'down';
    const next = send(state, { type: 'delve.next' });
    expect(run(next.state).outcome).toBe('routed');
  });
});

describe('delve rooms: the boss, loot and the end', () => {
  function atBoss(content: ResolutionContent, prepare = (_: GameState) => {}): GameState {
    const state = barrow(content).state;
    const d = run(state);
    d.roomIndex = d.rooms.length - 2;
    d.phase = 'breather';
    prepare(state);
    return send(state, { type: 'delve.next' }).state;
  }

  it('the boss never flees; when it falls its minions flee and the delve ends won, no breather', () => {
    const state = atBoss(withRules(HIT, { loot: { dropBp: 0, bossDropBp: 10_000 } }));
    const d = run(state);
    expect(d.fight!.boss).toBe(true);
    const warden = d.fight!.foes.find((f) => f.kindId === 'foe.restless-warden')!;
    for (const f of d.fight!.foes) if (f !== warden) f.health = 1;
    // Both minions fall first: more than half the band Down, but a boss band does not flee.
    let r: Result = { state, events: [] };
    const minions = d.fight!.foes.filter((f) => f !== warden).map((f) => f.id);
    for (const id of minions) {
      const v = fightView(r.state)!;
      const target = v.actions.find((a) => a.targets.includes(id))!;
      r = send(r.state, {
        type: 'fight.act',
        actorId: v.actorId!,
        actionId: target.actionId,
        targetId: id,
      });
    }
    expect(
      minions.every((id) => run(r.state).fight!.foes.find((f) => f.id === id)!.status === 'down'),
    ).toBe(true);
    // Let the round end (the flee check runs there): swap rows until round 2 starts.
    const round = run(r.state).fight!.round;
    for (let i = 0; i < 10 && run(r.state).fight?.round === round; i += 1) {
      const v = fightView(r.state)!;
      r = send(r.state, { type: 'fight.act', actorId: v.actorId!, actionId: 'action.swap-row' });
    }
    expect(run(r.state).fight!.round).toBe(round + 1);
    expect(run(r.state).phase).toBe('fight');
    expect(run(r.state).fight!.foes.find((f) => f.id === warden.id)?.status).toBe('up');
    run(r.state).fight!.foes.find((f) => f.id === warden.id)!.health = 1;
    const won = winFight(r.state);
    const end = run(won.state);
    expect(end.outcome).toBe('won');
    expect(ofType(won.events, 'breather')).toHaveLength(0);
    expect(end.loot.parts.map((p) => p.partId)).toEqual(['part.warden-shroud']);
  });

  it('every Down foe drops its part at the drop chance; fled foes drop nothing', () => {
    let state = send(
      barrow(withRules(HIT, { loot: { dropBp: 10_000, bossDropBp: 10_000 } })).state,
      {
        type: 'delve.choose',
        optionIndex: 0,
        testerId: ODRIC,
      },
    ).state;
    state = send(state, { type: 'delve.next' }).state;
    const foes = run(state).fight!.foes;
    for (const f of foes) f.health = 1;
    const won = winFight(state);
    const fled = ofType(won.events, 'band.fled').flatMap((e) => e.subjectIds).length;
    expect(run(won.state).loot.parts).toHaveLength(foes.length - fled);
    expect(ofType(won.events, 'loot.dropped')).toHaveLength(foes.length - fled);
  });

  it('delve.ended gives each member’s wound step, injury and death, and keeps them on the run', () => {
    const content = withRules(HIT, {
      injuryBp: { badlyHurt: 10_000, down: 0, dying: 10_000 },
      deathRoll: { ...rules.deathRoll, baseBp: 0 },
    });
    const state = atBoss(content, (s) => {
      const m = (id: string) => run(s).fighters.find((f) => f.id === id)!;
      m(ODRIC).health = 5; // 5/28 is Badly hurt
      m(WENNA).status = 'dying';
      m(WENNA).health = 0;
      m(AMIS).status = 'dead';
      m(AMIS).health = 0;
    });
    for (const f of run(state).fight!.foes) f.health = 1;
    const won = winFight(state);
    const ended = ofType(won.events, 'delve.ended')[0]!;
    const of = (id: string) => ended.members.find((e) => e.adventurerId === id)!;
    expect(of(ODRIC)).toMatchObject({ woundStep: 2, injury: true, died: false });
    expect(of(WENNA)).toMatchObject({ woundStep: 4, died: false });
    expect(of(AMIS)).toMatchObject({ died: true, injury: false });
    expect(run(won.state).ends).toEqual(ended.members);
  });
});

describe('delve: retreat', () => {
  function inFight(content: ResolutionContent): GameState {
    const state = send(barrow(content).state, {
      type: 'delve.choose',
      optionIndex: 0,
      testerId: ODRIC,
    }).state;
    run(state).bonuses.offGuard = false;
    return send(state, { type: 'delve.next' }).state;
  }

  it('beats: 1, +1 carrying anyone Down or Dying, +1 if the check fails; Wenna leads at 75%', () => {
    const state = inFight(gate1Content);
    expect(retreatPreview(state)).toMatchObject({ leaderId: WENNA, beats: 1, failedBeats: 2 });
    expect(retreatPreview(state).chance.total).toBe(7500);
    const d = run(state);
    d.fighters.find((f) => f.id === AMIS)!.status = 'down';
    expect(retreatPreview(state)).toMatchObject({ beats: 2, failedBeats: 3 });
  });

  it('each beat every standing foe strikes once; anyone standing at the end means retreated', () => {
    const state = inFight(withRules(MISS, {}));
    const standing = run(state).fight!.foes.filter((f) => f.status === 'up').length;
    const out = send(state, { type: 'fight.retreat' });
    const rolled = ofType(out.events, 'retreat.rolled')[0]!;
    expect(rolled.success).toBe(false);
    expect(ofType(out.events, 'retreat.beat')).toHaveLength(rolled.beats);
    expect(ofType(out.events, 'fight.acted')).toHaveLength(standing * rolled.beats);
    expect(run(out.state).outcome).toBe('retreated');
    expect(ofType(out.events, 'round.ended')).toHaveLength(rolled.beats);
  });

  it('ends routed when no one stands at the end, and keeps the parts already found', () => {
    const state = inFight(HIT);
    const d = run(state);
    d.loot.parts.push({ partId: 'part.hound-fang', rarity: 0, foeKindId: 'foe.hound' });
    for (const f of d.fighters) if (f.id !== WENNA) f.status = 'down';
    d.fighters.find((f) => f.id === WENNA)!.health = 1;
    // Wenna must be the one acting; she is the fastest, so she is.
    const out = send(state, { type: 'fight.retreat' });
    expect(run(out.state).outcome).toBe('routed');
    expect(run(out.state).loot.parts).toHaveLength(1);
  });
});
