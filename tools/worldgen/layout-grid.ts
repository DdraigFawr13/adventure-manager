// Grid helpers for the March layout: distance maps, box counts and a cheapest-path search over a
// cost function. Cells are y * width + x.
import { CellHeap, D8_DX, D8_DY } from './grid.ts';

export interface Grid {
  width: number;
  height: number;
}

export const xOf = (g: Grid, i: number) => i % g.width;
export const yOf = (g: Grid, i: number) => Math.floor(i / g.width);

export function gap(g: Grid, a: number, b: number): number {
  const dx = xOf(g, a) - xOf(g, b);
  const dy = yOf(g, a) - yOf(g, b);
  return Math.sqrt(dx * dx + dy * dy);
}

/** Steps (8 neighbours) from each cell to the nearest cell where `source` is true; 9999 when none. */
export function stepsFrom(g: Grid, source: (i: number) => boolean): Int16Array {
  const n = g.width * g.height;
  const dist = new Int16Array(n).fill(9999);
  const queue: number[] = [];
  for (let i = 0; i < n; i += 1) {
    if (source(i)) {
      dist[i] = 0;
      queue.push(i);
    }
  }
  for (let k = 0; k < queue.length; k += 1) {
    const c = queue[k]!;
    const x = xOf(g, c);
    const y = yOf(g, c);
    for (let d = 0; d < 8; d += 1) {
      const nx = x + D8_DX[d]!;
      const ny = y + D8_DY[d]!;
      if (nx < 0 || ny < 0 || nx >= g.width || ny >= g.height) continue;
      const m = ny * g.width + nx;
      if (dist[m] === 9999) {
        dist[m] = dist[c]! + 1;
        queue.push(m);
      }
    }
  }
  return dist;
}

/** How many cells in the (2r+1) square around each cell satisfy `on`, by a summed-area table. */
export function boxCounts(g: Grid, on: (i: number) => boolean, r: number): Int32Array {
  const { width: w, height: h } = g;
  const sum = new Int32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      sum[(y + 1) * (w + 1) + x + 1] =
        (on(y * w + x) ? 1 : 0) +
        sum[y * (w + 1) + x + 1]! +
        sum[(y + 1) * (w + 1) + x]! -
        sum[y * (w + 1) + x]!;
    }
  }
  const out = new Int32Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.max(0, x - r);
      const y0 = Math.max(0, y - r);
      const x1 = Math.min(w, x + r + 1);
      const y1 = Math.min(h, y + r + 1);
      out[y * w + x] =
        sum[y1 * (w + 1) + x1]! -
        sum[y0 * (w + 1) + x1]! -
        sum[y1 * (w + 1) + x0]! +
        sum[y0 * (w + 1) + x0]!;
    }
  }
  return out;
}

export interface Search {
  cost: Float64Array;
  parent: Int32Array;
}

/** Cheapest paths from `from` to every cell; `step(to, from, run)` is the price of one move, or Infinity. */
export function cheapest(
  g: Grid,
  from: number,
  step: (to: number, via: number, run: number) => number,
): Search {
  const n = g.width * g.height;
  const cost = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const heap = new CellHeap(n * 8);
  cost[from] = 0;
  heap.push(from, 0);
  while (heap.size > 0) {
    const c = heap.pop();
    const spent = heap.lastValue;
    if (spent > cost[c]!) continue;
    const x = xOf(g, c);
    const y = yOf(g, c);
    for (let d = 0; d < 8; d += 1) {
      const nx = x + D8_DX[d]!;
      const ny = y + D8_DY[d]!;
      if (nx < 0 || ny < 0 || nx >= g.width || ny >= g.height) continue;
      const m = ny * g.width + nx;
      const run = D8_DX[d] !== 0 && D8_DY[d] !== 0 ? Math.SQRT2 : 1;
      const next = spent + step(m, c, run);
      if (next < cost[m]!) {
        cost[m] = next;
        parent[m] = c;
        heap.push(m, next);
      }
    }
  }
  return { cost, parent };
}

/** The path from the search's origin to `to`, inclusive. */
export function pathTo(search: Search, to: number): number[] {
  const out: number[] = [];
  for (let c = to; c !== -1; c = search.parent[c]!) out.push(c);
  return out.reverse();
}
