// From Story-Generator src/engine/worldgen/erosion.ts @ 8a5c4ef (D-116); imports point at sibling files with .ts extensions.
// Erosion (Phase 1, M1.2): a few integer stream-power passes. Each pass finds
// steepest-descent flow on land, accumulates drainage area, and lowers each
// cell in proportion to sqrt(area) * slope. Big rivers cut valleys; headwater
// peaks barely change. Land never drops below 1 m, so the coast is untouched.

import type { RngStream } from './rng.ts';
import { D8_DX, D8_DY, neighbour } from './grid.ts';

/** Passes of erosion (3–5). */
export const EROSION_PASSES = 4;
/** Metres lost per sqrt(cell of drainage) per metre of drop per cell, before per-pass jitter. */
const EROSION_K = 0.03;
/** No cell loses more than this in one pass, so ranges are carved, not flattened. */
const MAX_LOSS_PER_PASS = 60;
const SQRT2 = 1.4142135623730951;

/** Lowers `elevation` in place along drainage lines. `ocean` is 1 on sea cells. */
export function erodeTerrain(
  width: number,
  height: number,
  elevation: Int16Array,
  ocean: Uint8Array,
  rng: RngStream,
): void {
  const size = width * height;
  const down = new Int32Array(size);
  const drop = new Float64Array(size);
  const area = new Float64Array(size);
  const loss = new Int16Array(size);
  const order: number[] = [];
  for (let pass = 0; pass < EROSION_PASSES; pass += 1) {
    const k = (EROSION_K * rng.between(85, 115)) / 100;
    // Order land from high to low (ties by index) so upstream cells come first.
    const keys: number[] = [];
    for (let i = 0; i < size; i += 1) {
      if (!ocean[i] && elevation[i]! > 0) keys.push((5000 - elevation[i]!) * size + i);
    }
    keys.sort((a, b) => a - b);
    order.length = 0;
    for (const key of keys) order.push(key % size);

    // Steepest descent; the sea counts as ground at 0 m. -1 marks a pit or flat.
    for (const i of order) {
      let best = -1;
      let bestSlope = 0;
      let bestDrop = 0;
      for (let d = 0; d < 8; d += 1) {
        const n = neighbour(width, height, i, d);
        if (n < 0) continue;
        const dz = elevation[i]! - Math.max(0, elevation[n]!);
        const slope = dz / (D8_DX[d] !== 0 && D8_DY[d] !== 0 ? SQRT2 : 1);
        if (slope > bestSlope) {
          bestSlope = slope;
          best = n;
          bestDrop = dz;
        }
      }
      down[i] = best;
      drop[i] = bestDrop;
      area[i] = 1;
    }
    for (const i of order) {
      const n = down[i]!;
      if (n >= 0 && !ocean[n] && elevation[n]! > 0) area[n] = area[n]! + area[i]!;
    }
    loss.fill(0);
    for (const i of order) {
      if (down[i]! < 0) continue;
      const n = down[i]!;
      // Slope per cell of distance; never cut below the downstream cell (no new pits).
      const run = Math.abs(n - i) === width || Math.abs(n - i) === 1 ? 1 : SQRT2;
      const cut = Math.round(k * Math.sqrt(area[i]!) * (drop[i]! / run));
      loss[i] = Math.min(MAX_LOSS_PER_PASS, cut, drop[i]!, elevation[i]! - 1);
    }
    for (const i of order) elevation[i] = elevation[i]! - loss[i]!;
  }
}
