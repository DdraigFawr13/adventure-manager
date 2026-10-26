// From Story-Generator src/app/tales/outline.ts @ 8a5c4ef (D-116); unchanged.
// The shore as a vector line: marching squares over the smoothed land mask. The raster map steps
// at the pixel grid when zoomed in; this line is smooth at any zoom. Pure, no DOM.

/** A traced line in cell units: x and y alternate; `closed` lines end where they began. */
export interface Outline {
  points: number[];
  closed: boolean;
}

/**
 * Contours of `plane` (w by h, one value a cell centre, sampled bilinearly like the raster map)
 * at `level`, on a grid `sub` times finer than the cells. Coordinates are in cell units, with a
 * cell's centre at +0.5.
 */
export function contours(
  plane: Float32Array,
  w: number,
  h: number,
  level: number,
  sub: number,
): Outline[] {
  const steps = contourSteps(plane, w, h, level, sub);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

/** Grid points traced between pauses, so a big plane does not hold the page for long. */
const SLICE_POINTS = 1 << 18;

/** The same tracing in slices: each `next()` does a stretch of rows (see `atlasSteps`). */
export function* contourSteps(
  plane: Float32Array,
  w: number,
  h: number,
  level: number,
  sub: number,
): Generator<void, Outline[], void> {
  const gw = w * sub + 1;
  const gh = h * sub + 1;
  const at = (gx: number, gy: number): number => {
    const fx = gx / sub - 0.5;
    const fy = gy / sub - 0.5;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const x0 = Math.max(0, ix);
    const x1 = Math.min(w - 1, ix + 1);
    const y0 = Math.max(0, iy);
    const y1 = Math.min(h - 1, iy + 1);
    const top = plane[y0 * w + x0]! * (1 - tx) + plane[y0 * w + x1]! * tx;
    const bottom = plane[y1 * w + x0]! * (1 - tx) + plane[y1 * w + x1]! * tx;
    return top * (1 - ty) + bottom * ty;
  };
  const field = new Float32Array(gw * gh);
  const rows = Math.max(1, Math.floor(SLICE_POINTS / gw));
  for (let gy = 0; gy < gh; gy += 1) {
    if (gy % rows === rows - 1) yield;
    for (let gx = 0; gx < gw; gx += 1) field[gy * gw + gx] = at(gx, gy);
  }

  // An edge is named by its upper or left grid point: even ids run right, odd ids run down.
  const hEdge = (gx: number, gy: number) => (gy * gw + gx) * 2;
  const vEdge = (gx: number, gy: number) => (gy * gw + gx) * 2 + 1;
  const links = new Map<number, number[]>();
  const link = (a: number, b: number) => {
    if (!links.has(a)) links.set(a, []);
    if (!links.has(b)) links.set(b, []);
    links.get(a)!.push(b);
    links.get(b)!.push(a);
  };
  for (let gy = 0; gy < gh - 1; gy += 1) {
    if (gy % rows === rows - 1) yield;
    for (let gx = 0; gx < gw - 1; gx += 1) {
      const a = field[gy * gw + gx]! > level ? 1 : 0;
      const b = field[gy * gw + gx + 1]! > level ? 2 : 0;
      const c = field[(gy + 1) * gw + gx + 1]! > level ? 4 : 0;
      const d = field[(gy + 1) * gw + gx]! > level ? 8 : 0;
      const top = hEdge(gx, gy);
      const bottom = hEdge(gx, gy + 1);
      const left = vEdge(gx, gy);
      const right = vEdge(gx + 1, gy);
      switch (a | b | c | d) {
        case 1:
        case 14:
          link(left, top);
          break;
        case 2:
        case 13:
          link(top, right);
          break;
        case 3:
        case 12:
          link(left, right);
          break;
        case 4:
        case 11:
          link(right, bottom);
          break;
        case 5:
          link(left, top);
          link(right, bottom);
          break;
        case 6:
        case 9:
          link(top, bottom);
          break;
        case 7:
        case 8:
          link(left, bottom);
          break;
        case 10:
          link(top, right);
          link(left, bottom);
          break;
        default:
          break;
      }
    }
  }

  const where = (id: number): [number, number] => {
    const down = id & 1;
    const g = (id - down) / 2;
    const gx = g % gw;
    const gy = Math.floor(g / gw);
    const v0 = field[gy * gw + gx]!;
    const v1 = down ? field[(gy + 1) * gw + gx]! : field[gy * gw + gx + 1]!;
    const t = v1 === v0 ? 0.5 : Math.max(0, Math.min(1, (level - v0) / (v1 - v0)));
    return down ? [gx / sub, (gy + t) / sub] : [(gx + t) / sub, gy / sub];
  };

  const seen = new Set<number>();
  const out: Outline[] = [];
  const walk = (start: number) => {
    const ids: number[] = [start];
    seen.add(start);
    let prev = -1;
    let cur = start;
    let closed = false;
    for (;;) {
      const next = links.get(cur)!.find((n) => n !== prev && (!seen.has(n) || n === start));
      if (next === undefined) break;
      if (next === start && ids.length > 2) {
        closed = true;
        break;
      }
      if (seen.has(next)) break;
      seen.add(next);
      ids.push(next);
      prev = cur;
      cur = next;
    }
    const points: number[] = [];
    for (const id of ids) points.push(...where(id));
    if (closed) points.push(points[0]!, points[1]!);
    out.push({ points, closed });
  };
  // Open lines (that meet the edge of the grid) first, then the closed loops.
  for (const [id, n] of links) if (n.length === 1 && !seen.has(id)) walk(id);
  for (const id of links.keys()) if (!seen.has(id)) walk(id);
  return out;
}

/** An SVG path (`M x y L ...`) for the outlines, in cell units. */
export function pathOf(lines: readonly Outline[]): string {
  const parts: string[] = [];
  for (const line of lines) {
    const p = line.points;
    if (p.length < 4) continue;
    let d = `M${p[0]!.toFixed(2)} ${p[1]!.toFixed(2)}`;
    for (let i = 2; i < p.length; i += 2) d += `L${p[i]!.toFixed(2)} ${p[i + 1]!.toFixed(2)}`;
    parts.push(line.closed ? `${d}Z` : d);
  }
  return parts.join('');
}
