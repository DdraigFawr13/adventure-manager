// From Story-Generator src/engine/worldgen/water.ts @ 8a5c4ef (D-116); imports point at sibling files with .ts extensions.
// Water (Phase 1, M1.2): priority flood from the sea fills depressions and
// gives every land cell a downstream neighbour, so drainage always reaches the
// sea. Big fills become lakes, small ones are levelled; flow accumulates
// rainfall-weighted runoff; heavy-flow cells are rivers; low flat ground beside
// rivers is floodplain.

import { CellHeap, D8_DX, D8_DY, neighbour } from './grid.ts';

export const WATER_LAND = 0;
export const WATER_RIVER = 1;
export const WATER_LAKE = 2;
export const WATER_SEA = 3;

/** Filled depressions of at least this many cells become lakes; smaller pits are levelled. */
export const LAKE_MIN_CELLS = 24;
/** Accumulated runoff at which a land cell becomes a river (about 5-15 per cell, so roughly 10-30 cells upstream). */
export const RIVER_FLOW = 150;
/** Floodplain: ground below this height (m) whose drop to the next cell is at most FLOODPLAIN_DROP (m). */
const FLOODPLAIN_MAX_ELEVATION = 400;
const FLOODPLAIN_DROP = 15;

export interface WaterResult {
  flowDir: Int8Array;
  flow: Uint32Array;
  water: Uint8Array;
  floodplain: Uint8Array;
}

/** Direction index from cell `from` to adjacent cell `to`. */
function directionTo(width: number, from: number, to: number): number {
  const dx = (to % width) - (from % width);
  const dy = Math.floor(to / width) - Math.floor(from / width);
  for (let d = 0; d < 8; d += 1) if (D8_DX[d] === dx && D8_DY[d] === dy) return d;
  return -1;
}

/** Fills small pits in `elevation` in place; returns flow, rivers, lakes and floodplains. */
export function computeWater(
  width: number,
  height: number,
  elevation: Int16Array,
  rainfall: Uint16Array,
  ocean: Uint8Array,
  lakeMinCells = LAKE_MIN_CELLS,
): WaterResult {
  const size = width * height;
  const filled = new Int32Array(size);
  const parent = new Int32Array(size).fill(-1);
  const seen = new Uint8Array(size);
  const flowDir = new Int8Array(size).fill(-1);
  const water = new Uint8Array(size);
  // Flood order: sea first, then land in the order the flood reached it.
  const order = new Int32Array(size);
  let reached = 0;
  const heap = new CellHeap(size);
  for (let i = 0; i < size; i += 1) {
    if (!ocean[i]) continue;
    seen[i] = 1;
    filled[i] = elevation[i]!;
    water[i] = WATER_SEA;
    order[reached++] = i;
  }
  for (let i = 0; i < size; i += 1) {
    if (!ocean[i]) continue;
    for (let d = 0; d < 8; d += 1) {
      const n = neighbour(width, height, i, d);
      if (n >= 0 && !seen[n]) {
        // Seed from the sea: the first land cell reached drains to this ocean cell.
        seen[n] = 1;
        parent[n] = i;
        filled[n] = Math.max(elevation[n]!, filled[i]!);
        heap.push(n, filled[n]!);
      }
    }
  }
  while (heap.size > 0) {
    const c = heap.pop();
    order[reached++] = c;
    flowDir[c] = directionTo(width, c, parent[c]!);
    for (let d = 0; d < 8; d += 1) {
      const n = neighbour(width, height, c, d);
      if (n >= 0 && !seen[n]) {
        seen[n] = 1;
        parent[n] = c;
        filled[n] = Math.max(elevation[n]!, filled[c]!);
        heap.push(n, filled[n]!);
      }
    }
  }

  // Group connected filled cells: big groups are lakes, small ones are levelled.
  const group = new Uint8Array(size);
  const queue = new Int32Array(size);
  for (let start = 0; start < size; start += 1) {
    if (group[start] || ocean[start] || filled[start]! <= elevation[start]!) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    group[start] = 1;
    while (head < tail) {
      const c = queue[head++]!;
      for (let d = 0; d < 8; d += 1) {
        const n = neighbour(width, height, c, d);
        if (n >= 0 && !group[n] && !ocean[n] && filled[n]! > elevation[n]!) {
          group[n] = 1;
          queue[tail++] = n;
        }
      }
    }
    for (let k = 0; k < tail; k += 1) {
      const c = queue[k]!;
      if (tail >= lakeMinCells) water[c] = WATER_LAKE;
      else elevation[c] = filled[c]!;
    }
  }

  // Accumulate runoff downstream, last reached first.
  const flow = new Uint32Array(size);
  for (let i = 0; i < size; i += 1) {
    if (!ocean[i]) flow[i] = Math.max(1, Math.round(rainfall[i]! / 100));
  }
  for (let k = reached - 1; k >= 0; k -= 1) {
    const c = order[k]!;
    if (ocean[c] || flowDir[c]! < 0) continue;
    const down = neighbour(width, height, c, flowDir[c]!);
    flow[down] = flow[down]! + flow[c]!;
  }
  for (let i = 0; i < size; i += 1) {
    if (water[i] === WATER_LAND && flow[i]! >= RIVER_FLOW) water[i] = WATER_RIVER;
  }

  const floodplain = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) {
    if (water[i] !== WATER_LAND && water[i] !== WATER_RIVER) continue;
    if (elevation[i]! >= FLOODPLAIN_MAX_ELEVATION) continue;
    let nearRiver = water[i] === WATER_RIVER;
    for (let d = 0; d < 8 && !nearRiver; d += 1) {
      const n = neighbour(width, height, i, d);
      if (n >= 0 && water[n] === WATER_RIVER) nearRiver = true;
    }
    if (!nearRiver) continue;
    if (flowDir[i]! < 0) continue;
    const down = neighbour(width, height, i, flowDir[i]!);
    if (filled[i]! - Math.max(0, filled[down]!) <= FLOODPLAIN_DROP) floodplain[i] = 1;
  }
  return { flowDir, flow, water, floodplain };
}
