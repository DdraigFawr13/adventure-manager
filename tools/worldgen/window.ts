// Picks the window of a generated world that reads as the March: mostly land, the sea along the
// east edge only, a high spine along another edge, wet low ground for fens and some woods.
import { BIOMES } from './biome-content.ts';
import type { World } from './world.ts';

export interface Window {
  x0: number;
  y0: number;
  score: number;
}

const idOf = (name: string) => BIOMES.findIndex((b) => b.id === name);
const SWAMP = idOf('swamp');
const WOODS = [idOf('temperate-forest'), idOf('taiga')];
const SPINE_FROM = 1300;
const STRIP = 8;
const BAND = 60;

export interface WindowStats {
  seaShare: number;
  /** Share of rows whose east end is sea, and the mean width of that sea in cells. */
  eastRows: number;
  eastWidth: number;
  lakes: number;
  /** Share of the window that is sea cut off from the east-edge sea (an inland sea). */
  strayed: number;
  otherSea: number;
  spine: number;
  highShare: number;
  swamp: number;
  woods: number;
  rivers: number;
}

export function windowStats(
  world: World,
  x0: number,
  y0: number,
  w: number,
  h: number,
): WindowStats {
  const n = world.size;
  let sea = 0;
  let swamp = 0;
  let woods = 0;
  let rivers = 0;
  let lakes = 0;
  let high = 0;
  const edgeSea = [0, 0, 0, 0]; // north, east, south, west
  const edgeHigh = [0, 0, 0, 0];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y0 + y) * n + x0 + x;
      const isSea = world.water[i] === 3;
      const isHigh = !isSea && world.elevation[i]! >= SPINE_FROM;
      if (isSea) sea += 1;
      if (world.biome[i] === SWAMP) swamp += 1;
      if (WOODS.includes(world.biome[i]!)) woods += 1;
      if (world.water[i] === 1) rivers += 1;
      if (world.water[i] === 2) lakes += 1;
      if (isHigh) high += 1;
      const near = [y < STRIP, x >= w - STRIP, y >= h - STRIP, x < STRIP];
      const band = [y < BAND, false, y >= h - BAND, x < BAND];
      for (let e = 0; e < 4; e += 1) {
        if (near[e] && isSea) edgeSea[e]! += 1;
        if (band[e] && isHigh) edgeHigh[e]! += 1;
      }
    }
  }
  const total = w * h;
  let rows = 0;
  let width = 0;
  for (let y = 0; y < h; y += 1) {
    let run = 0;
    while (run < w && world.water[(y0 + y) * n + x0 + w - 1 - run] === 3) run += 1;
    if (run > 0) rows += 1;
    width += run;
  }
  // Flood from the east edge through sea; any sea left over is an inland sea.
  const reached = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let y = 0; y < h; y += 1) {
    if (world.water[(y0 + y) * n + x0 + w - 1] === 3) {
      reached[y * w + w - 1] = 1;
      stack.push(y * w + w - 1);
    }
  }
  while (stack.length) {
    const c = stack.pop()!;
    const cx = c % w;
    const cy = (c - cx) / w;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || reached[ny * w + nx]) continue;
      if (world.water[(y0 + ny) * n + x0 + nx] !== 3) continue;
      reached[ny * w + nx] = 1;
      stack.push(ny * w + nx);
    }
  }
  let reachedCount = 0;
  for (const v of reached) reachedCount += v;
  const strip = (e: number) => (e % 2 === 0 ? w : h) * STRIP;
  const spine = [0, 2, 3].map((e) => edgeHigh[e]! / (BAND * (e % 2 === 0 ? w : h)));
  return {
    seaShare: sea / total,
    eastRows: rows / h,
    eastWidth: rows ? width / rows : 0,
    lakes: lakes / total,
    strayed: (sea - reachedCount) / total,
    // The worst of the other edges (a little sea in the south-east corner is fine).
    otherSea: Math.max(edgeSea[0]! / strip(0), edgeSea[3]! / strip(3), edgeSea[2]! / strip(2) / 8),
    spine: Math.max(...spine),
    highShare: high / total,
    swamp: swamp / total,
    woods: woods / total,
    rivers: rivers / total,
  };
}

/** How well the w by h window at (x0, y0) fits the brief; higher is better, 0 is unusable. */
export function scoreWindow(world: World, x0: number, y0: number, w: number, h: number): number {
  const s = windowStats(world, x0, y0, w, h);
  if (s.seaShare < 0.06 || s.seaShare > 0.2 || s.otherSea > 0.08) return 0;
  // A real strait: sea at the east end of nearly every row, 18 to 60 cells wide.
  if (s.eastRows < 0.85 || s.eastWidth < 15 || s.eastWidth > 65) return 0;
  if (s.spine < 0.08 || s.highShare > 0.22 || s.lakes > 0.06 || s.strayed > 0.004) return 0;
  if (s.swamp < 0.015 || s.woods < 0.04 || s.rivers < 0.01) return 0;
  return (
    1 -
    Math.abs(s.seaShare - 0.14) * 8 +
    Math.min(s.spine, 0.4) * 2 +
    Math.min(s.swamp, 0.08) * 8 +
    Math.min(s.woods, 0.3) * 3 +
    Math.min(s.rivers, 0.04) * 10 -
    Math.max(0, s.highShare - 0.18) * 4
  );
}

/** The best window on a 10-cell step, or null when none fits. */
export function findWindow(world: World, w: number, h: number): Window | null {
  let best: Window | null = null;
  for (let y0 = 0; y0 + h <= world.size; y0 += 20) {
    for (let x0 = 0; x0 + w <= world.size; x0 += 20) {
      const score = scoreWindow(world, x0, y0, w, h);
      if (score > 0 && (!best || score > best.score)) best = { x0, y0, score };
    }
  }
  return best;
}
