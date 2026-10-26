// Story-Generator's terrain, erosion, climate, water and biome stages for one seed (copied code,
// D-116), run on a square world; a window of it is cropped into the March by `bake.ts`.
// Tools may use Math freely; the output is plain arrays so a test can compare it.
import { BIOMES, BIOME_RULES } from './biome-content.ts';
import { classifyBiomes } from './biomes.ts';
import { generateClimate } from './climate.ts';
import { erodeTerrain } from './erosion.ts';
import { oceanMask } from './grid.ts';
import { RngStream } from './rng.ts';
import { generateTerrain } from './terrain.ts';
import type { WorldParams } from './types.ts';
import { computeWater } from './water.ts';

export const SOURCE_COMMIT = '8a5c4ef';

export interface World {
  size: number;
  elevation: Int16Array;
  /** 0 land, 1 river, 2 lake, 3 sea. */
  water: Uint8Array;
  biome: Uint8Array;
  /** Rainfall-weighted runoff gathered in each cell. */
  flow: Uint32Array;
  /** Downstream D8 direction of each land cell, -1 at the sea. */
  flowDir: Int8Array;
}

/** Only depressions this big become lakes, so the March has a few real lakes and not a sheet of ponds. */
const LAKE_CELLS = 400;
const stream = (seed: string, name: string) => RngStream.detached(seed, name);

export function generateWorld(
  seed: string,
  size: number,
  landFraction = 0.72,
  rainfallScale = 1.4,
): World {
  const params: WorldParams = {
    width: size,
    height: size,
    historyYears: 0,
    continents: 1,
    landFraction,
    temperatureShift: 0,
    rainfallScale,
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
  const water = computeWater(size, size, terrain.elevation, climate.rainfall, ocean, LAKE_CELLS);
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
  const world: World = {
    size,
    elevation: terrain.elevation,
    water: water.water,
    biome,
    flow: water.flow,
    flowDir: water.flowDir,
  };
  addFens(world);
  return world;
}

/** Fens lie on low ground within FEN_REACH cells of a river or lake. */
const FEN_HEIGHT = 130;
const FEN_REACH = 3;

/**
 * The climate table makes swamp only on narrow floodplains, too little for a fen worth a name, so
 * low ground beside rivers and lakes that is neither forest nor high becomes swamp too.
 */
function addFens(world: World): void {
  const { size: n, water, elevation, biome } = world;
  const swamp = BIOMES.findIndex((b) => b.id === 'swamp');
  const keep = new Set(
    ['alpine', 'tundra', 'swamp', 'temperate-forest', 'taiga'].map((id) =>
      BIOMES.findIndex((b) => b.id === id),
    ),
  );
  const fens: number[] = [];
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const i = y * n + x;
      if (water[i] !== 0 || elevation[i]! > FEN_HEIGHT || keep.has(biome[i]!)) continue;
      let wet = false;
      for (let dy = -FEN_REACH; dy <= FEN_REACH && !wet; dy += 1) {
        for (let dx = -FEN_REACH; dx <= FEN_REACH && !wet; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
          const w = water[ny * n + nx]!;
          wet = w === 1 || w === 2;
        }
      }
      if (wet) fens.push(i);
    }
  }
  for (const i of fens) biome[i] = swamp;
}

/** The D8 direction index after mirroring left to right (N, NE, E, SE, S, SW, W, NW). */
const MIRROR_X = [0, 7, 6, 5, 4, 3, 2, 1];
const MIRROR_Y = [4, 3, 2, 1, 0, 7, 6, 5];
const TRANSPOSE = [6, 5, 4, 3, 2, 1, 0, 7];

/** The world turned (x and y swapped), then mirrored left to right and/or top to bottom, so one world offers a coast on any side. */
export function mirrorWorld(world: World, flipX: boolean, flipY: boolean, turn = false): World {
  if (!flipX && !flipY && !turn) return world;
  const n = world.size;
  const out: World = {
    size: n,
    elevation: new Int16Array(n * n),
    water: new Uint8Array(n * n),
    biome: new Uint8Array(n * n),
    flow: new Uint32Array(n * n),
    flowDir: new Int8Array(n * n),
  };
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const to = y * n + x;
      const sx = flipX ? n - 1 - x : x;
      const sy = flipY ? n - 1 - y : y;
      const from = turn ? sx * n + sy : sy * n + sx;
      out.elevation[to] = world.elevation[from]!;
      out.water[to] = world.water[from]!;
      out.biome[to] = world.biome[from]!;
      out.flow[to] = world.flow[from]!;
      let dir = world.flowDir[from]!;
      if (dir >= 0) {
        if (turn) dir = TRANSPOSE[dir]!;
        if (flipX) dir = MIRROR_X[dir]!;
        if (flipY) dir = MIRROR_Y[dir]!;
      }
      out.flowDir[to] = dir;
    }
  }
  return out;
}

/** The cells of a window, with the flow-direction links kept only where both ends are inside. */
export interface Crop {
  width: number;
  height: number;
  elevation: Int16Array;
  water: Uint8Array;
  biome: Uint8Array;
  flow: Uint32Array;
  /** Downstream cell of each cell, or -1 (sea, or it leaves the window). */
  down: Int32Array;
}

export function cropWorld(world: World, x0: number, y0: number, w: number, h: number): Crop {
  const n = world.size;
  const crop: Crop = {
    width: w,
    height: h,
    elevation: new Int16Array(w * h),
    water: new Uint8Array(w * h),
    biome: new Uint8Array(w * h),
    flow: new Uint32Array(w * h),
    down: new Int32Array(w * h).fill(-1),
  };
  const DX = [0, 1, 1, 1, 0, -1, -1, -1];
  const DY = [-1, -1, 0, 1, 1, 1, 0, -1];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const from = (y0 + y) * n + x0 + x;
      const to = y * w + x;
      crop.elevation[to] = world.elevation[from]!;
      crop.water[to] = world.water[from]!;
      crop.biome[to] = world.biome[from]!;
      crop.flow[to] = world.flow[from]!;
      const dir = world.flowDir[from]!;
      if (dir < 0) continue;
      const nx = x + DX[dir]!;
      const ny = y + DY[dir]!;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h) crop.down[to] = ny * w + nx;
    }
  }
  return crop;
}
