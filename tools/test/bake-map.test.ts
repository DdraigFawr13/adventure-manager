import { describe, expect, it } from 'vitest';
import { bakeMap, MARCH, MARCH_WORLD } from '../worldgen/bake.ts';
import { VILLAGES } from '../worldgen/layout-villages.ts';
import committed from '../../packages/ui/assets/engine-test/map-base.json' with { type: 'json' };

// A small sheet (80 x 54 cut from a 160-cell world) keeps the test fast; the real March is the
// 300 x 200 window in MARCH_WORLD.
const small = { seed: 'march-7', worldSize: 160, width: 80, height: 54, x0: 40, y0: 50 };

describe('kingdom-map baker (roadmap 1.8, GAME-01)', () => {
  it('bakes the same arrays and picks from the same seed, and different ones from another', () => {
    const a = bakeMap(small);
    const b = bakeMap(small);
    expect(Array.from(b.elevation)).toEqual(Array.from(a.elevation));
    expect(Array.from(b.water)).toEqual(Array.from(a.water));
    expect(Array.from(b.biome)).toEqual(Array.from(a.biome));
    expect(b.villageCells).toEqual(a.villageCells);
    expect([b.guildCell, b.placeCells, b.roads, b.route, b.rivers, b.areas]).toEqual([
      a.guildCell,
      a.placeCells,
      a.roads,
      a.route,
      a.rivers,
      a.areas,
    ]);
    const other = bakeMap({ ...small, seed: 'tarn-reach' });
    expect(Array.from(other.elevation)).not.toEqual(Array.from(a.elevation));
  });

  it('puts eight settlements on land and joins the hall to the farthest by a road route', () => {
    const map = bakeMap(small);
    const onLand = (cell: number) => map.water[cell] !== 3 && map.water[cell] !== 2;
    const sites = [map.guildCell, ...map.placeCells];
    expect(sites).toHaveLength(8);
    expect(new Set(sites).size).toBe(8);
    expect(sites.every(onLand)).toBe(true);
    expect(map.route[0]).toBe(map.guildCell);
    expect(map.placeCells).toContain(map.route[map.route.length - 1]);
    expect(map.route.every(onLand)).toBe(true);
    const onRoad = new Set(map.roads.flatMap((r) => r.cells));
    expect(map.route.every((c) => onRoad.has(c))).toBe(true);
  });

  it('spreads villages on dry land, apart from the settlements and each other', () => {
    const map = bakeMap(small);
    const k = small.width / MARCH.width;
    const sites = [map.guildCell, ...map.placeCells];
    const gap = (a: number, b: number) =>
      Math.hypot(
        (a % small.width) - (b % small.width),
        Math.floor(a / small.width) - Math.floor(b / small.width),
      );
    expect(map.villageCells.length).toBeGreaterThan(0);
    for (const v of map.villageCells) {
      expect(map.water[v]).toBe(0);
      for (const other of [...sites, ...map.villageCells.filter((w) => w !== v)]) {
        expect(gap(v, other)).toBeGreaterThanOrEqual(VILLAGES.minGap * k);
      }
    }
  });

  it('the committed map base equals a fresh bake of the chosen March', () => {
    const map = bakeMap({ ...MARCH_WORLD, width: MARCH.width, height: MARCH.height });
    const b64 = (v: Int16Array | Uint8Array) =>
      Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('base64');
    expect(committed.elevation).toBe(b64(map.elevation));
    expect(committed.water).toBe(b64(map.water));
    expect(committed.biome).toBe(b64(map.biome));
    const picks = (m: typeof committed | typeof map) => [
      m.guildCell,
      m.placeCells,
      m.villageCells,
      m.route,
      m.landmarkCell,
      m.closedRoadCell,
    ];
    expect(picks(committed)).toEqual(picks(map));
  });

  it('keeps the March at a 3:2 sheet of about 300 x 200 km, 1 km a cell', () => {
    expect(MARCH.width / MARCH.height).toBe(1.5);
    expect(MARCH.width * MARCH.cellKm).toBe(300);
    expect(MARCH_WORLD.worldSize).toBeGreaterThanOrEqual(MARCH.width);
  });
});
