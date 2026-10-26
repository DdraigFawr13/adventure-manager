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
  ) {
    let state: GameState = { ...game(roster), content: { ...game(roster).content, contracts } };
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

  it('a deadline ends the fight sooner, and the foes slip away', () => {
    const tough = [
      adventurer('a', { agility: 20, toughness: 20, might: 1 }),
      adventurer('b', { agility: 20, toughness: 20, might: 1 }),
    ];
    const events = play('twist.deadline', tough);
    expect(Math.max(...ofType(events, 'exchange.started').map((e) => e.exchange))).toBe(1);
    expect(ofType(events, 'quest.ended')[0]?.outcome).toBe('partial');
  });

  it('a hostage turns a win into half done once the alarm is up', () => {
    const strong = [
      adventurer('a', { might: 20, agility: 20, stealth: 1 }),
      adventurer('b', { might: 20, agility: 20, stealth: 1 }),
    ];
    const events = play('twist.hostage', strong, 'stealth');
    expect(ofType(events, 'alarm.raised').length).toBeGreaterThan(0);
    expect(ofType(events, 'foe.wounded').some((e) => e.to >= e.hits)).toBe(true);
    expect(ofType(events, 'quest.ended')[0]?.outcome).toBe('partial');
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
    run = advanceTo(run, 7 * 10 + 1);
    const posted = ofType(run.events, 'offer.posted');
    expect(posted.length).toBe(22);
    for (const p of posted) {
      const drawn = shapeOf(p.templateId);
      expect(drawn?.siteId).toBe('site.barrow');
      const twist = contracts.twists.find((t) => t.id === drawn?.twistId);
      expect(p.shownTwistId).toBe(twist && !twist.hidden ? twist.id : null);
      // Fee 1000 with no spread in the fixture, plus the shown twist's change.
      expect(p.feeCopper).toBe(1000 + (twist && !twist.hidden ? twist.feeBp / 10 : 0));
    }
    // Seven shapes exist; with a memory of four, no shape repeats within four posts of itself.
    posted.forEach((p, at) => {
      const window = posted.slice(Math.max(0, at - 4), at).map((q) => q.templateId);
      expect(window).not.toContain(p.templateId);
    });
  });
});
