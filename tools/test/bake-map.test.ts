import { describe, expect, it } from 'vitest';
import { bakeMap } from '../worldgen/bake.ts';

describe('kingdom-map baker (roadmap 1.8, GAME-01)', () => {
  it('bakes the same arrays and picks from the same seed, and different ones from another', () => {
    const a = bakeMap({ seed: 'fenn-march', size: 80 });
    const b = bakeMap({ seed: 'fenn-march', size: 80 });
    expect(Array.from(b.elevation)).toEqual(Array.from(a.elevation));
    expect(Array.from(b.water)).toEqual(Array.from(a.water));
    expect(Array.from(b.biome)).toEqual(Array.from(a.biome));
    expect(Array.from(b.flow)).toEqual(Array.from(a.flow));
    expect([b.guildCell, b.placeCells, b.route]).toEqual([a.guildCell, a.placeCells, a.route]);
    const other = bakeMap({ seed: 'tarn-reach', size: 80 });
    expect(Array.from(other.elevation)).not.toEqual(Array.from(a.elevation));
  });

  it('puts the guild hall and places on land and joins the hall to a place by a land route', () => {
    const map = bakeMap({ seed: 'fenn-march', size: 80 });
    const onLand = (cell: number) => map.water[cell] !== 3 && map.water[cell] !== 2;
    expect([map.guildCell, ...map.placeCells].every(onLand)).toBe(true);
    expect(map.route[0]).toBe(map.guildCell);
    expect(map.placeCells).toContain(map.route[map.route.length - 1]);
    expect(map.route.every(onLand)).toBe(true);
  });
});
