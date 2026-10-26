// From Story-Generator src/engine/worldgen/biomes.ts @ 8a5c4ef (D-116); imports point at sibling files with .ts extensions.
// Biomes (Phase 1, M1.3): sea cells become ocean or coast by distance to land;
// lakes keep their own biome; high ground is alpine; wet floodplains and lake
// shores are swamp; everything else comes from the temperature x rainfall
// table in content. Rivers are a water class, so river cells take the land
// biome around them. Plain arrays in and out so tests can use tiny fixtures.

import type { ContentBundle } from './types.ts';
import { WATER_LAKE, WATER_SEA } from './water.ts';
import { D8_DX, D8_DY } from './grid.ts';

export type BiomeContent = Pick<ContentBundle, 'biomes' | 'biomeRules'>;

/** Index of the first band whose upper bound is not below `value`; the last band is open. */
function band(bounds: readonly number[], value: number): number {
  let i = 0;
  while (i < bounds.length && value > bounds[i]!) i += 1;
  return i;
}

function indexOfId(content: BiomeContent, id: string): number {
  const index = content.biomes.findIndex((b) => b.id === id);
  if (index < 0) throw new Error(`Biome "${id}" is missing from the content.`);
  return index;
}

function indexOfWater(content: BiomeContent, water: 'sea' | 'coast' | 'lake'): number {
  const index = content.biomes.findIndex((b) => b.water === water);
  if (index < 0) throw new Error(`No "${water}" biome in the content.`);
  return index;
}

export function classifyBiomes(
  width: number,
  height: number,
  elevation: ArrayLike<number>,
  tempSummer: ArrayLike<number>,
  tempWinter: ArrayLike<number>,
  rainfall: ArrayLike<number>,
  water: ArrayLike<number>,
  floodplain: ArrayLike<number>,
  content: BiomeContent,
): Uint8Array {
  const { biomeRules: rules } = content;
  const size = width * height;
  const ocean = indexOfWater(content, 'sea');
  const coast = indexOfWater(content, 'coast');
  const lake = indexOfWater(content, 'lake');
  const alpine = indexOfId(content, 'alpine');
  const swamp = indexOfId(content, 'swamp');
  const frostFree = new Set(rules.frostFree.biomes.map((id) => indexOfId(content, id)));
  const fallback = new Map(
    Object.entries(rules.frostFree.fallback).map(([from, to]) => [
      indexOfId(content, from),
      indexOfId(content, to),
    ]),
  );
  const table = rules.table.map((row) => row.map((id) => indexOfId(content, id)));

  // Sea distance to land: BFS outwards from every non-sea cell through sea cells.
  const seaReach = new Int16Array(size).fill(-1);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < size; i += 1) {
    if (water[i] !== WATER_SEA) {
      seaReach[i] = 0;
      queue[tail++] = i;
    }
  }
  while (head < tail) {
    const i = queue[head++]!;
    if (seaReach[i]! >= rules.coastReach) continue;
    const x = i % width;
    const y = (i - x) / width;
    for (let d = 0; d < 8; d += 1) {
      const nx = x + D8_DX[d]!;
      const ny = y + D8_DY[d]!;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const n = ny * width + nx;
      if (seaReach[n] === -1) {
        seaReach[n] = seaReach[i]! + 1;
        queue[tail++] = n;
      }
    }
  }

  const biome = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) {
    if (water[i] === WATER_SEA) {
      biome[i] = seaReach[i]! >= 0 ? coast : ocean;
      continue;
    }
    if (water[i] === WATER_LAKE) {
      biome[i] = lake;
      continue;
    }
    if (elevation[i]! >= rules.alpineElevation) {
      biome[i] = alpine;
      continue;
    }
    const mean = (tempSummer[i]! + tempWinter[i]!) / 2;
    const wet = floodplain[i]! === 1 || beside(width, height, water, i, WATER_LAKE);
    if (wet && rainfall[i]! >= rules.swampRainfall && mean >= rules.swampMinTemp) {
      biome[i] = swamp;
      continue;
    }
    let chosen =
      table[band(rules.temperatureBands, mean)]![band(rules.rainfallBands, rainfall[i]!)]!;
    if (frostFree.has(chosen) && tempWinter[i]! < rules.frostFree.minWinter) {
      chosen = fallback.get(chosen) ?? chosen;
    }
    biome[i] = chosen;
  }
  return biome;
}

/** True if any 8-neighbour of cell `i` has water class `kind`. */
function beside(
  width: number,
  height: number,
  water: ArrayLike<number>,
  i: number,
  kind: number,
): boolean {
  const x = i % width;
  const y = (i - x) / width;
  for (let d = 0; d < 8; d += 1) {
    const nx = x + D8_DX[d]!;
    const ny = y + D8_DY[d]!;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (water[ny * width + nx] === kind) return true;
  }
  return false;
}
