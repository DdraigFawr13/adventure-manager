// Bakes the kingdom-map base for the engine test (roadmap 1.8, D-110): Story-Generator's terrain,
// erosion, climate, water and biome stages for one seed, plus the layout picks (guild hall, other
// places, one party route). Tools may use Math freely; the output is plain arrays so a test can compare it.
import { BIOMES, BIOME_RULES } from './biome-content.ts';
import { classifyBiomes } from './biomes.ts';
import { generateClimate } from './climate.ts';
import { erodeTerrain } from './erosion.ts';
import { CellHeap, D8_DX, D8_DY, oceanMask } from './grid.ts';
import { RngStream } from './rng.ts';
import { generateTerrain } from './terrain.ts';
import type { WorldParams } from './types.ts';
import { computeWater, WATER_LAKE, WATER_LAND, WATER_RIVER, WATER_SEA } from './water.ts';

export const SOURCE_COMMIT = '8a5c4ef';

export interface BakeOptions {
  seed: string;
  size: number;
  continents?: number;
  landFraction?: number;
}

export interface BakedMap {
  width: number;
  height: number;
  seed: string;
  elevation: Int16Array;
  water: Uint8Array;
  biome: Uint8Array;
  flow: Uint32Array;
  biomeIds: string[];
  /** Cell of the guild hall. */
  guildCell: number;
  /** Cells of the other places, spread out. */
  placeCells: number[];
  /** Cells from the guild hall to the farthest place, inclusive. */
  route: number[];
}

const stream = (seed: string, name: string) => RngStream.detached(seed, name);

export function bakeMap(options: BakeOptions): BakedMap {
  const { seed, size } = options;
  const params: WorldParams = {
    width: size,
    height: size,
    historyYears: 0,
    continents: options.continents ?? 1,
    landFraction: options.landFraction ?? 0.45,
    temperatureShift: 0,
    rainfallScale: 1,
  };
  const terrain = generateTerrain(params, stream(seed, 'worldgen.terrain'));
  const ocean = oceanMask(size, size, terrain.elevation);
  erodeTerrain(size, size, terrain.elevation, ocean, stream(seed, 'worldgen.erosion'));
  const climate = generateClimate(
    params,
    terrain.elevation,
    ocean,
    stream(seed, 'worldgen.climate'),
  );
  const water = computeWater(size, size, terrain.elevation, climate.rainfall, ocean);
  const biome = classifyBiomes(
    size,
    size,
    terrain.elevation,
    climate.tempSummer,
    climate.tempWinter,
    climate.rainfall,
    water.water,
    water.floodplain,
    { biomes: BIOMES, biomeRules: BIOME_RULES },
  );
  const layout = pickLayout(size, terrain.elevation, water.water, biome);
  return {
    width: size,
    height: size,
    seed,
    elevation: terrain.elevation,
    water: water.water,
    biome,
    flow: water.flow,
    biomeIds: BIOMES.map((b) => b.id),
    ...layout,
  };
}

const isLand = (water: Uint8Array, i: number) => water[i] !== WATER_SEA && water[i] !== WATER_LAKE;

/** Cells of the largest land mass (8-connected, lakes excluded). */
function largestLandmass(size: number, water: Uint8Array): number[] {
  const seen = new Uint8Array(size * size);
  let best: number[] = [];
  for (let start = 0; start < size * size; start += 1) {
    if (seen[start] || !isLand(water, start)) continue;
    const members: number[] = [start];
    seen[start] = 1;
    for (let k = 0; k < members.length; k += 1) {
      const c = members[k]!;
      const x = c % size;
      const y = (c - x) / size;
      for (let d = 0; d < 8; d += 1) {
        const nx = x + D8_DX[d]!;
        const ny = y + D8_DY[d]!;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        const n = ny * size + nx;
        if (!seen[n] && isLand(water, n)) {
          seen[n] = 1;
          members.push(n);
        }
      }
    }
    if (members.length > best.length) best = members;
  }
  return best;
}

/** Chebyshev steps from each cell to the nearest sea cell (0 on sea). */
function seaSteps(size: number, water: Uint8Array): Int16Array {
  const dist = new Int16Array(size * size).fill(-1);
  const queue: number[] = [];
  for (let i = 0; i < size * size; i += 1) {
    if (water[i] === WATER_SEA) {
      dist[i] = 0;
      queue.push(i);
    }
  }
  for (let k = 0; k < queue.length; k += 1) {
    const c = queue[k]!;
    const x = c % size;
    const y = (c - x) / size;
    for (let d = 0; d < 8; d += 1) {
      const nx = x + D8_DX[d]!;
      const ny = y + D8_DY[d]!;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const n = ny * size + nx;
      if (dist[n] === -1) {
        dist[n] = dist[c]! + 1;
        queue.push(n);
      }
    }
  }
  return dist;
}

function pickLayout(
  size: number,
  elevation: Int16Array,
  water: Uint8Array,
  biome: Uint8Array,
): Pick<BakedMap, 'guildCell' | 'placeCells' | 'route'> {
  const land = largestLandmass(size, water);
  const inland = seaSteps(size, water);
  const swamp = BIOMES.findIndex((b) => b.id === 'swamp');
  const alpine = BIOMES.findIndex((b) => b.id === 'alpine');
  const flatEnough = (i: number) => {
    const x = i % size;
    const y = (i - x) / size;
    for (let d = 0; d < 8; d += 1) {
      const nx = x + D8_DX[d]!;
      const ny = y + D8_DY[d]!;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) return false;
      if (Math.abs(elevation[ny * size + nx]! - elevation[i]!) > 70) return false;
    }
    return true;
  };
  const candidates = land.filter(
    (i) =>
      water[i] === WATER_LAND &&
      elevation[i]! < 700 &&
      biome[i] !== swamp &&
      biome[i] !== alpine &&
      inland[i]! >= 4 &&
      flatEnough(i),
  );
  if (candidates.length < 6) throw new Error('Not enough inland land for the layout picks.');
  const dist2 = (a: number, b: number) => {
    const dx = (a % size) - (b % size);
    const dy = Math.floor(a / size) - Math.floor(b / size);
    return dx * dx + dy * dy;
  };
  // The hall sits at the candidate nearest the centre of the land mass.
  let sx = 0;
  let sy = 0;
  for (const i of land) {
    sx += i % size;
    sy += Math.floor(i / size);
  }
  const centre = Math.round(sy / land.length) * size + Math.round(sx / land.length);
  let guildCell = candidates[0]!;
  for (const c of candidates) if (dist2(c, centre) < dist2(guildCell, centre)) guildCell = c;
  // Farthest-point picks keep the places spread out; ties go to the lower index.
  const picked = [guildCell];
  const placeCells: number[] = [];
  while (placeCells.length < 5) {
    let best = -1;
    let bestGap = -1;
    for (const c of candidates) {
      let gap = Infinity;
      for (const p of picked) gap = Math.min(gap, dist2(c, p));
      if (gap > bestGap) {
        bestGap = gap;
        best = c;
      }
    }
    picked.push(best);
    placeCells.push(best);
  }
  let far = placeCells[0]!;
  for (const p of placeCells) if (dist2(p, guildCell) > dist2(far, guildCell)) far = p;
  return { guildCell, placeCells, route: landRoute(size, elevation, water, biome, guildCell, far) };
}

/** Cheapest land path (Dijkstra, 8 neighbours): biome travel cost plus slope; rivers are fords. */
function landRoute(
  size: number,
  elevation: Int16Array,
  water: Uint8Array,
  biome: Uint8Array,
  from: number,
  to: number,
): number[] {
  const count = size * size;
  const cost = new Float64Array(count).fill(Infinity);
  const parent = new Int32Array(count).fill(-1);
  const heap = new CellHeap(count * 8);
  cost[from] = 0;
  heap.push(from, 0);
  while (heap.size > 0) {
    const c = heap.pop();
    const spent = heap.lastValue;
    if (spent > cost[c]!) continue;
    if (c === to) break;
    const x = c % size;
    const y = (c - x) / size;
    for (let d = 0; d < 8; d += 1) {
      const nx = x + D8_DX[d]!;
      const ny = y + D8_DY[d]!;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const n = ny * size + nx;
      if (!isLand(water, n)) continue;
      const run = D8_DX[d] !== 0 && D8_DY[d] !== 0 ? Math.SQRT2 : 1;
      const travel = BIOMES[biome[n]!]?.travel ?? 4;
      const slope = Math.abs(elevation[n]! - elevation[c]!) / 12;
      const ford = water[n] === WATER_RIVER ? 8 : 0;
      const next = spent + run * (1 + travel * 0.5 + slope) + ford;
      if (next < cost[n]!) {
        cost[n] = next;
        parent[n] = c;
        heap.push(n, next);
      }
    }
  }
  if (parent[to] === -1) throw new Error('No land route between the guild hall and the far place.');
  const route: number[] = [];
  for (let c = to; c !== -1; c = parent[c]!) route.push(c);
  return route.reverse();
}
