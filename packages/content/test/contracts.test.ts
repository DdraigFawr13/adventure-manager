import { describe, expect, it } from 'vitest';
import { composeQuest, fits, type Danger } from '@adventure-manager/engine';
import { baseContracts, names } from '../src/index.ts';

const DANGERS: readonly Danger[] = ['routine', 'hazardous', 'perilous', 'deadly'];

describe('base contracts (D-139)', () => {
  it('has work at every danger and composes every fitting shape', () => {
    for (const danger of DANGERS) {
      let shapes = 0;
      for (const site of baseContracts.sites)
        for (const monster of baseContracts.monsters) {
          if (!fits(site, monster, danger)) continue;
          for (const twist of [null, ...baseContracts.twists]) {
            const q = composeQuest(baseContracts, {
              siteId: site.id,
              monsterId: monster.id,
              twistId: twist?.id ?? null,
              danger,
            });
            expect(q.foes.length).toBeGreaterThan(0);
            shapes += 1;
          }
        }
      expect(shapes, danger).toBeGreaterThanOrEqual(50);
    }
  });

  it('names every site, scene, foe group and twist in the text', () => {
    const ids = [
      ...baseContracts.sites.flatMap((s) => [s.id, ...s.scenes.map((x) => x.id)]),
      ...baseContracts.monsters.flatMap((m) => [
        m.id,
        ...Object.values(m.variants).flatMap((groups) => (groups ?? []).map((g) => g.id)),
      ]),
      ...baseContracts.twists.flatMap((t) =>
        t.kind === 'extra-scene' ? [t.id, t.scene.id] : [t.id],
      ),
    ];
    expect(ids.filter((id) => !names[id])).toEqual([]);
  });

  it('keeps foe group ids unique within a contract', () => {
    for (const m of baseContracts.monsters)
      for (const groups of Object.values(m.variants)) {
        const list = (groups ?? []).map((g) => g.id);
        expect(new Set(list).size).toBe(list.length);
      }
  });
});
