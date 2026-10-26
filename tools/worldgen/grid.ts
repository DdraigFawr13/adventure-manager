// From Story-Generator src/engine/worldgen/grid.ts @ 8a5c4ef (D-116); imports point at sibling files with .ts extensions.
// Shared grid helpers for world generation: D8 neighbours, ocean detection and
// a deterministic binary min-heap for priority flood. Index = y * width + x.

/** D8 neighbour offsets in a fixed order: N, NE, E, SE, S, SW, W, NW. */
export const D8_DX: readonly number[] = [0, 1, 1, 1, 0, -1, -1, -1];
export const D8_DY: readonly number[] = [-1, -1, 0, 1, 1, 1, 0, -1];

/** Neighbour of cell `i` in direction `dir`, or −1 off the map. */
export function neighbour(width: number, height: number, i: number, dir: number): number {
  const x = i % width;
  const y = (i - x) / width;
  const nx = x + D8_DX[dir]!;
  const ny = y + D8_DY[dir]!;
  if (nx < 0 || ny < 0 || nx >= width || ny >= height) return -1;
  return ny * width + nx;
}

/**
 * Sea = every cell at or below sea level, including enclosed inland seas, so
 * the terrain's land fraction is exactly the land the water stage sees. Lakes
 * form only in depressions above sea level. Returns 1 for sea.
 */
export function oceanMask(width: number, height: number, elevation: ArrayLike<number>): Uint8Array {
  const size = width * height;
  const ocean = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) if (elevation[i]! <= 0) ocean[i] = 1;
  return ocean;
}

/** Binary min-heap of cell indices keyed by (value, index), so ties resolve deterministically. */
export class CellHeap {
  private readonly values: Float64Array;
  private readonly cells: Int32Array;
  private count = 0;

  constructor(capacity: number) {
    this.values = new Float64Array(capacity);
    this.cells = new Int32Array(capacity);
  }

  get size(): number {
    return this.count;
  }

  /** Empties the heap so one allocation serves many searches. */
  clear(): void {
    this.count = 0;
  }

  private less(a: number, b: number): boolean {
    const va = this.values[a]!;
    const vb = this.values[b]!;
    return va < vb || (va === vb && this.cells[a]! < this.cells[b]!);
  }

  private swap(a: number, b: number): void {
    const v = this.values[a]!;
    const c = this.cells[a]!;
    this.values[a] = this.values[b]!;
    this.cells[a] = this.cells[b]!;
    this.values[b] = v;
    this.cells[b] = c;
  }

  push(cell: number, value: number): void {
    let k = this.count++;
    this.values[k] = value;
    this.cells[k] = cell;
    while (k > 0) {
      const parent = (k - 1) >> 1;
      if (!this.less(k, parent)) break;
      this.swap(k, parent);
      k = parent;
    }
  }

  /** Removes and returns the smallest cell index (read `lastValue` for its key). */
  pop(): number {
    const top = this.cells[0]!;
    this.lastValue = this.values[0]!;
    this.count -= 1;
    if (this.count > 0) {
      this.values[0] = this.values[this.count]!;
      this.cells[0] = this.cells[this.count]!;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < this.count && this.less(l, m)) m = l;
        if (r < this.count && this.less(r, m)) m = r;
        if (m === k) break;
        this.swap(k, m);
        k = m;
      }
    }
    return top;
  }

  lastValue = 0;
}
