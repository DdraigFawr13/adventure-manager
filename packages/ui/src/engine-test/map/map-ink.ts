// Rivers and roads in fine ink. Rivers taper from a hair at the source to a firm line at the mouth
// (width follows the runoff the generator gathered); roads are dashed, one line where they share ground.
import type { MapData } from './map-data.ts';
import { addSmooth } from './map-field.ts';
import { ink } from './map-palette.ts';

const WIDTH_MIN = 0.7;
const WIDTH_MAX = 2.8;

/** Catmull-Rom samples through the cell centres: x, y, width in pixels. */
function sampleRiver(
  cells: readonly number[],
  flows: readonly number[],
  W: number,
  S: number,
  top: number,
): { x: number; y: number; w: number }[] {
  const raw = (k: number) => {
    const c = cells[Math.min(cells.length - 1, Math.max(0, k))]!;
    return { x: ((c % W) + 0.5) * S, y: (Math.floor(c / W) + 0.5) * S };
  };
  // A weighted average over the neighbours takes the grid's stair-steps out of the line (ends stay put).
  const pt = (k: number) => {
    if (k <= 0 || k >= cells.length - 1) return raw(k);
    let x = 0;
    let y = 0;
    let total = 0;
    for (let d = -3; d <= 3; d += 1) {
      const at = Math.min(cells.length - 1, Math.max(0, k + d));
      const w = 4 - Math.abs(d);
      x += raw(at).x * w;
      y += raw(at).y * w;
      total += w;
    }
    return { x: x / total, y: y / total };
  };
  const out: { x: number; y: number; w: number }[] = [];
  const width = (k: number) => {
    const f = flows[Math.min(flows.length - 1, Math.max(0, k))]! / top;
    return WIDTH_MIN + (WIDTH_MAX - WIDTH_MIN) * Math.sqrt(Math.min(1, f));
  };
  for (let k = 0; k < cells.length - 1; k += 1) {
    const p0 = pt(k - 1);
    const p1 = pt(k);
    const p2 = pt(k + 1);
    const p3 = pt(k + 2);
    for (let s = 0; s < 3; s += 1) {
      const t = s / 3;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({
        x: cr(p0.x, p1.x, p2.x, p3.x),
        y: cr(p0.y, p1.y, p2.y, p3.y),
        w: width(k) * (1 - t) + width(k + 1) * t,
      });
    }
  }
  const last = pt(cells.length - 1);
  out.push({ x: last.x, y: last.y, w: width(cells.length - 1) });
  return out;
}

/** Draws every river, clipped to the land so each ends cleanly at the shore or lake edge. */
export function drawRivers(
  ctx: CanvasRenderingContext2D,
  data: MapData,
  S: number,
  land: Path2D,
): void {
  const W = data.cells.width;
  let top = 1;
  for (const r of data.rivers) for (const f of r.flows) top = Math.max(top, f);
  ctx.save();
  ctx.clip(land, 'evenodd');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink(0.88);
  for (const river of data.rivers) {
    const pts = sampleRiver(river.cells, river.flows, W, S, top);
    for (let k = 0; k < pts.length - 1; k += 1) {
      ctx.lineWidth = (pts[k]!.w + pts[k + 1]!.w) / 2;
      ctx.beginPath();
      ctx.moveTo(pts[k]!.x, pts[k]!.y);
      ctx.lineTo(pts[k + 1]!.x, pts[k + 1]!.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** The cells a road path passes, thinned to every few cells so the curve stays smooth. */
function roadLine(cells: readonly number[], W: number, S: number): number[] {
  const xy: number[] = [];
  const last = cells.length - 1;
  cells.forEach((c, k) => {
    if (k % 3 !== 0 && k !== last) return;
    xy.push(((c % W) + 0.5) * S, (Math.floor(c / W) + 0.5) * S);
  });
  return xy;
}

/** Dashed fine lines, one per road; a stretch an earlier road already holds is not drawn twice. */
export function drawRoads(ctx: CanvasRenderingContext2D, data: MapData, S: number): void {
  const W = data.cells.width;
  const drawn = new Set<number>();
  const path = new Path2D();
  for (const road of data.roads) {
    let run: number[] = [];
    const flush = () => {
      if (run.length >= 2) addSmooth(path, roadLine(run, W, S), false);
      run = [];
    };
    for (let k = 0; k < road.cells.length; k += 1) {
      const c = road.cells[k]!;
      const prev = road.cells[k - 1];
      const key = prev === undefined ? -1 : Math.min(c, prev) * 100000 + Math.max(c, prev);
      if (key >= 0 && drawn.has(key)) {
        flush();
        continue;
      }
      if (key >= 0) drawn.add(key);
      if (run.length === 0 && prev !== undefined) run.push(prev);
      run.push(c);
    }
    flush();
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink(0.85);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 5]);
  ctx.stroke(path);
  ctx.restore();
}
