import { describe, expect, it } from 'vitest';
import {
  composeQuest,
  shapeId,
  shapeOf,
  simulate,
  type ContractContent,
  type GameState,
  type Twist,
} from '../src/index.ts';
import { adventurer, game, ofType } from './fixture.ts';
import { advanceTo, guildRules, play as playGuild } from './guild-fixture.ts';

const contracts: ContractContent = {
  plainWeight: 1,
  sceneShift: { routine: -2, hazardous: 0, perilous: 1, deadly: 2 },
  recentShapes: 4,
  sites: [
    {
      id: 'site.barrow',
      tags: ['dark'],
      homes: ['tomb'],
      dangers: ['hazardous', 'perilous'],
      scenes: [
        {
          id: 'scene.road',
          kind: 'fixed',
          attribute: 'agility',
          difficulty: 8,
          testers: 'all',
          onFailure: 'wound',
        },
        { id: 'scene.gate', kind: 'approach', difficulty: 10, testers: 'best', onFailure: 'alarm' },
      ],
    },
  ],
  monsters: [
    {
      id: 'monster.dead',
      family: 'restless-dead',
      lives: ['tomb'],
      variants: { hazardous: [{ id: 'foe.wights', attack: 10, defence: 10, speed: 10, hits: 3 }] },
    },
    { id: 'monster.wolves', family: 'beasts', lives: ['wild'], variants: { hazardous: [] } },
  ],
  twists: [
    {
      id: 'twist.weather',
      weight: 1,
      feeBp: 500,
      hidden: false,
      kind: 'scene-shift',
      attribute: 'agility',
      amount: 2,
    },
    { id: 'twist.info', weight: 1, feeBp: 0, hidden: true, kind: 'foe-shift', amount: 3 },
    {
      id: 'twist.trap',
      weight: 1,
      feeBp: 500,
      hidden: false,
      kind: 'extra-scene',
      scene: {
        id: 'scene.trap',
        kind: 'fixed',
        attribute: 'wits',
        difficulty: 9,
        testers: 'best-two',
        onFailure: 'wound',
      },
    },
    { id: 'twist.curse', weight: 1, feeBp: 800, hidden: false, kind: 'bleed', amountBp: 1000 },
    { id: 'twist.hostage', weight: 1, feeBp: 1500, hidden: false, kind: 'hostage' },
    { id: 'twist.deadline', weight: 1, feeBp: 500, hidden: false, kind: 'deadline', exchanges: 5 },
  ],
};

const shape = (twistId: string | null, danger: 'hazardous' | 'perilous' = 'hazardous') => ({
  siteId: 'site.barrow',
  monsterId: 'monster.dead',
  twistId,
  danger,
});

describe('contracts (contract SPEC.md, D-139)', () => {
  it('names a shape in its template id and reads it back', () => {
    const id = shapeId(shape('twist.trap'));
    expect(id).toBe('shape:site.barrow+monster.dead+twist.trap+hazardous');
    expect(shapeOf(id)).toEqual(shape('twist.trap'));
    expect(shapeOf(shapeId(shape(null)))?.twistId).toBeNull();
    expect(shapeOf('quest.barrow-delve')).toBeNull();
    expect(() => shapeOf('shape:a+b')).toThrow(/Bad shape/);
    expect(() => shapeOf('shape:a+b+plain+hazardous+extra')).toThrow(/Bad shape/);
  });

  it('shifts site scenes by danger and fights the kind’s groups', () => {
    const q = composeQuest(contracts, { ...shape(null), danger: 'hazardous' });
    expect(q.scenes.map((s) => s.difficulty)).toEqual([8, 10]);
    expect(q.foes.map((f) => f.id)).toEqual(['foe.wights']);
    expect(q.tags).toEqual(['dark']);
    expect(() => composeQuest(contracts, shape(null, 'perilous'))).toThrow(/does not live/);
    expect(() => composeQuest(contracts, { ...shape(null), monsterId: 'monster.wolves' })).toThrow(
      /does not live/,
    );
  });

  it('applies scene, foe and extra-scene twists when composing', () => {
    expect(composeQuest(contracts, shape('twist.weather')).scenes.map((s) => s.difficulty)).toEqual(
      [10, 10],
    );
    const info = composeQuest(contracts, shape('twist.info')).foes[0];
    expect([info?.attack, info?.defence]).toEqual([13, 13]);
    expect(composeQuest(contracts, shape('twist.trap')).scenes.map((s) => s.id)).toEqual([
      'scene.road',
      'scene.trap',
      'scene.gate',
    ]);
  });

  function play(
    twistId: string,
    roster = [adventurer('a'), adventurer('b')],
    approach: 'assault' | 'stealth' = 'assault',
    certain = false,
  ) {
    // `certain` lets chances reach 0% and 100%, so a rule shows without depending on a draw.
    const base = game(roster, certain ? { rules: { minChanceBp: 0, maxChanceBp: 10_000 } } : {});
    let state: GameState = { ...base, content: { ...base.content, contracts } };
    const events = [];
    let result = simulate(state, {
      type: 'quest.start',
      id: 'c0',
      day: 1,
      questId: 'q',
      templateId: shapeId(shape(twistId)),
      partyIds: roster.map((a) => a.id),
      plan: { approach, risk: 'steady', retreat: 'never' },
      watched: false,
    });
    for (let n = 1; ; n += 1) {
      events.push(...result.events);
      state = result.state;
      if (!state.quest) break;
      result = simulate(state, { type: 'quest.step', id: `c${n}`, day: 1 });
    }
    return events;
  }

  it('cursed ground adds its named part to every bleed chance', () => {
    const weak = [
      adventurer('a', { agility: 1, might: 1, toughness: 1 }),
      adventurer('b', { agility: 1, might: 1, toughness: 1 }),
    ];
    const bleeds = ofType(play('twist.curse', weak), 'check.rolled').filter(
      (e) => e.purpose === 'bleed',
    );
    expect(bleeds.length).toBeGreaterThan(0);
    for (const b of bleeds)
      expect(b.chance.parts).toContainEqual({ sourceId: 'twist.curse', amount: 1000 });
  });

  it('a deadline of two ends a long fight at exchange four instead of six', () => {
    const short = {
      ...contracts,
      twists: contracts.twists.map((t) => (t.kind === 'deadline' ? { ...t, exchanges: 2 } : t)),
    };
    // Nobody can hurt anybody: the fight runs until the deadline.
    const stone = [
      adventurer('a', { agility: 30, might: 1 }),
      adventurer('b', { agility: 30, might: 1 }),
    ];
    let state: GameState = { ...game(stone, { rules: { minChanceBp: 0, maxChanceBp: 10_000 } }) };
    state = {
      ...state,
      content: { ...state.content, contracts: short, quests: state.content.quests },
    };
    const events = [];
    let result = simulate(state, {
      type: 'quest.start',
      id: 'c0',
      day: 1,
      questId: 'q',
      templateId: shapeId(shape('twist.deadline')),
      partyIds: ['a', 'b'],
      plan: { approach: 'assault', risk: 'steady', retreat: 'never' },
      watched: false,
    });
    for (let n = 1; ; n += 1) {
      events.push(...result.events);
      state = result.state;
      if (!state.quest) break;
      result = simulate(state, { type: 'quest.step', id: `c${n}`, day: 1 });
    }
    expect(Math.max(...ofType(events, 'exchange.started').map((e) => e.exchange))).toBe(4);
    expect(ofType(events, 'quest.ended')[0]?.outcome).toBe('partial');
  });

  it('a deadline ends the fight sooner, and the foes slip away', () => {
    const tough = [
      adventurer('a', { agility: 20, toughness: 20, might: 1 }),
      adventurer('b', { agility: 20, toughness: 20, might: 1 }),
    ];
    const events = play('twist.deadline', tough);
    expect(Math.max(...ofType(events, 'exchange.started').map((e) => e.exchange))).toBe(1);
    expect(ofType(events, 'quest.ended')[0]?.outcome).toBe('partial');
  });

  it('a hostage turns a win into half done once the alarm is up, and not otherwise', () => {
    const loud = [
      adventurer('a', { might: 30, agility: 30, stealth: -100 }),
      adventurer('b', { might: 30, agility: 30, stealth: -100 }),
    ];
    const heard = play('twist.hostage', loud, 'stealth', true);
    expect(ofType(heard, 'alarm.raised').length).toBe(1);
    expect(ofType(heard, 'foe.wounded').some((e) => e.to >= e.hits)).toBe(true);
    expect(ofType(heard, 'quest.ended')[0]?.outcome).toBe('partial');
    const quiet = loud.map((a) => ({ ...a, attributes: { ...a.attributes, stealth: 100 } }));
    const unheard = play('twist.hostage', quiet, 'stealth', true);
    expect(ofType(unheard, 'alarm.raised').length).toBe(0);
    expect(ofType(unheard, 'quest.ended')[0]?.outcome).toBe('won');
  });

  it('every twist kind is covered here', () => {
    const kinds: Twist['kind'][] = [
      'scene-shift',
      'foe-shift',
      'extra-scene',
      'bleed',
      'hostage',
      'deadline',
    ];
    expect(contracts.twists.map((t) => t.kind).sort()).toEqual([...kinds].sort());
  });

  it('the board composes offers, hides hidden twists, prices shown ones and avoids recent shapes', () => {
    const base = game([]);
    const state: GameState = {
      ...base,
      seed: 'board-shapes',
      content: {
        ...base.content,
        contracts,
        guild: { ...guildRules, offersPerWeek: { assembly: 2, campaign: 2, winter: 2 } },
      },
    };
    let run = playGuild(
      { state, events: [], commandIds: [] },
      { type: 'guild.found', day: 1, size: 3 },
    );
    // The real shapes as the board drew them, week by week (events only carry the shown ones).
    const drawnIds: string[] = [];
    const seen = new Set<string>();
    const note = () => {
      for (const o of run.state.guild!.board)
        // non-null: founded above.
        if (!seen.has(o.id)) {
          seen.add(o.id);
          drawnIds.push(o.templateId);
          const real = shapeOf(o.templateId);
          expect(shapeOf(o.shownTemplateId)).toEqual({
            ...real,
            twistId: real?.twistId === 'twist.info' ? null : real?.twistId,
          });
        }
    };
    note();
    for (let week = 2; week <= 11; week += 1) {
      run = advanceTo(run, (week - 1) * 7 + 1);
      note();
    }
    const posted = ofType(run.events, 'offer.posted');
    expect(posted.length).toBe(22);
    expect(drawnIds.length).toBe(22);
    expect(drawnIds.some((id) => id.includes('twist.info'))).toBe(true);
    // The hidden twist never reaches a posted event, so no log or view can show it.
    expect(JSON.stringify(posted)).not.toContain('twist.info');
    for (const p of posted) {
      const drawn = shapeOf(p.templateId);
      expect(drawn?.siteId).toBe('site.barrow');
      const twist = contracts.twists.find((t) => t.id === drawn?.twistId);
      // Fee 1000 with no spread in the fixture, plus the shown twist's change.
      expect(p.feeCopper).toBe(1000 + (twist ? twist.feeBp / 10 : 0));
    }
    // Seven shapes exist; with a memory of four, no shape repeats within four draws of itself.
    drawnIds.forEach((id, at) => {
      expect(drawnIds.slice(Math.max(0, at - 4), at)).not.toContain(id);
    });
  });

  it('draws from every shape again once all are remembered', () => {
    const base = game([]);
    const big = { ...contracts, recentShapes: 50 };
    const state: GameState = {
      ...base,
      seed: 'board-full-memory',
      content: {
        ...base.content,
        contracts: big,
        guild: { ...guildRules, offersPerWeek: { assembly: 3, campaign: 3, winter: 3 } },
      },
    };
    let run = playGuild(
      { state, events: [], commandIds: [] },
      { type: 'guild.found', day: 1, size: 3 },
    );
    run = advanceTo(run, 7 * 5 + 1);
    // 18 offers from 7 shapes: after all 7 are remembered the board still posts.
    expect(ofType(run.events, 'offer.posted').length).toBe(18);
    expect(new Set(run.state.guild!.recentShapes).size).toBe(7); // non-null: founded above.
  });
});
