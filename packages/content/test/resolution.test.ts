import { describe, expect, it } from 'vitest';
import {
  ATTRIBUTES,
  checkInvariants,
  simulate,
  type Adventurer,
  type GameEvent,
  type GameState,
} from '@adventure-manager/engine';
import { baseResolution } from '../src/index.ts';

function member(id: string, classId: string, lean: number): Adventurer {
  const attributes = Object.fromEntries(ATTRIBUTES.map((a, i) => [a, 8 + ((i + lean) % 7)]));
  return {
    id,
    classId,
    position: classId === 'class.cleric' ? 'back' : 'front',
    // cast-ok: built from every name in ATTRIBUTES just above.
    attributes: attributes as Adventurer['attributes'],
    weaponBp: 300,
    armourBp: 300,
    dead: false,
  };
}

describe('base resolution content (SPEC.md)', () => {
  it('runs the barrow delve to an end with sound events', () => {
    let state: GameState = {
      seed: 'content-smoke',
      rng: {},
      nextEventNo: 1,
      content: baseResolution,
      roster: [
        member('adv.a', 'class.warrior', 0),
        member('adv.b', 'class.rogue', 3),
        member('adv.c', 'class.cleric', 5),
      ],
      quest: null,
    };
    const events: GameEvent[] = [];
    const ids = ['c0'];
    let result = simulate(state, {
      type: 'quest.start',
      id: 'c0',
      day: 1,
      questId: 'quest-run.1',
      templateId: 'quest.barrow-delve',
      partyIds: ['adv.a', 'adv.b', 'adv.c'],
      plan: { approach: 'stealth', risk: 'steady', retreat: 'down' },
      watched: false,
    });
    for (let n = 1; ; n += 1) {
      events.push(...result.events);
      state = result.state;
      if (!state.quest) break;
      ids.push(`c${n}`);
      result = simulate(state, { type: 'quest.step', id: `c${n}`, day: 1 });
    }
    expect(events.at(-1)?.type).toBe('quest.ended');
    expect(checkInvariants(state, events, ids)).toEqual([]);
    for (const a of state.roster) expect(baseResolution.rules.classes[a.classId]).toBeDefined();
  });
});

describe('watched-quest prototype data (D-127)', () => {
  it('fields the sample party on every quest, and every id has a display name', async () => {
    const { prototypeParty, names, logTemplates } = await import('../src/index.ts');
    const party = prototypeParty();
    for (const quest of baseResolution.quests) {
      let state: GameState = {
        seed: `proto-${quest.id}`,
        rng: {},
        nextEventNo: 1,
        content: baseResolution,
        roster: prototypeParty(),
        quest: null,
      };
      let result = simulate(state, {
        type: 'quest.start',
        id: 'c0',
        day: 1,
        questId: 'q',
        templateId: quest.id,
        partyIds: party.map((a) => a.id),
        plan: { approach: 'assault', risk: 'steady', retreat: 'leader' },
        watched: false,
      });
      for (let n = 1; result.state.quest; n += 1) {
        state = result.state;
        result = simulate(state, { type: 'quest.step', id: `c${n}`, day: 1 });
      }
      expect(result.events.at(-1)?.type).toBe('quest.ended');
      const ids = [quest.id, ...quest.scenes.map((s) => s.id), ...quest.foes.map((f) => f.id)];
      for (const id of ids) expect(names[id], id).toBeDefined();
    }
    for (const a of party) expect(names[a.id], a.id).toBeDefined();
    expect(Object.values(logTemplates).every((v) => v.length > 0)).toBe(true);
  });
});
