// Settlements as small drawn towns: a few gabled house blocks and a spire, bigger for the more
// important, with a wall, a keep or a quay where the place has one. Index 0 is the guild hall,
// then the seven others in the order of the content names place.0 to place.6.
import type { MapData } from './map-data.ts';
import { hash01 } from './map-layers.ts';
import { ink, INK, PAPER_CSS } from './map-palette.ts';

interface Spec {
  /** 1 hamlet, 2 town, 3 city. */
  tier: 1 | 2 | 3;
  spires: number;
  wall?: boolean;
  keep?: boolean;
  quay?: boolean;
  bridge?: boolean;
  hall?: boolean;
}

const SPECS: readonly Spec[] = [
  { tier: 3, spires: 1, hall: true }, // Wendle, the guild hall
  { tier: 1, spires: 0, bridge: true }, // Ashford
  { tier: 3, spires: 2, wall: true }, // Kingsholm
  { tier: 1, spires: 1 }, // Varrowmere
  { tier: 2, spires: 1 }, // Thornbury
  { tier: 2, spires: 1, quay: true }, // Saltmouth
  { tier: 1, spires: 0 }, // Sedgecombe
  { tier: 2, spires: 0, keep: true }, // Delvenhold
];
const HOUSES = [0, 4, 8, 12];
const ROOF = 'rgba(176,128,92,0.78)';

/** Half-width and half-height of a town's footprint in pixels, for keeping names and banners off it. */
export function townReach(index: number): { rx: number; ry: number } {
  const tier = SPECS[index]?.tier ?? 1;
  return { rx: 18 + tier * 8, ry: 13 + tier * 5 };
}

function house(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  tall: boolean,
): void {
  const wall = tall ? 8.5 : 6;
  const roof = 5;
  ctx.beginPath();
  ctx.rect(x - w / 2, y - wall, w, wall);
  ctx.fillStyle = PAPER_CSS;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 1.2, y - wall);
  ctx.lineTo(x, y - wall - roof);
  ctx.lineTo(x + w / 2 + 1.2, y - wall);
  ctx.closePath();
  ctx.fillStyle = ROOF;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(x - 1, y - 3.4, 2, 3.4);
  ctx.fillStyle = INK;
  ctx.fill();
}

function spire(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  const nave = 11 * scale;
  ctx.beginPath();
  ctx.rect(x - nave / 2, y - 7 * scale, nave, 7 * scale);
  ctx.fillStyle = PAPER_CSS;
  ctx.fill();
  ctx.stroke();
  const tx = x + nave / 2 - 1;
  ctx.beginPath();
  ctx.rect(tx - 2.6 * scale, y - 17 * scale, 5.2 * scale, 17 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx - 3.4 * scale, y - 17 * scale);
  ctx.lineTo(tx, y - 28 * scale);
  ctx.lineTo(tx + 3.4 * scale, y - 17 * scale);
  ctx.closePath();
  ctx.fillStyle = ROOF;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx, y - 28 * scale);
  ctx.lineTo(tx, y - 31.5 * scale);
  ctx.moveTo(tx - 1.5, y - 30 * scale);
  ctx.lineTo(tx + 1.5, y - 30 * scale);
  ctx.stroke();
}

function keep(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.rect(x - 8, y - 20, 16, 20);
  ctx.fillStyle = PAPER_CSS;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  for (let k = 0; k < 4; k += 1) ctx.rect(x - 8 + k * 4.5, y - 24, 3, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(x - 2, y - 7, 4, 7);
  ctx.fillStyle = INK;
  ctx.fill();
}

function wall(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y - 4, rx, ry, 0, 0, Math.PI * 2);
  ctx.lineWidth = 3.4;
  ctx.setLineDash([4, 1.6]);
  ctx.strokeStyle = ink(0.9);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  for (const a of [0.5, 2.2, 3.9, 5.5]) {
    const tx = x + Math.cos(a) * rx;
    const ty = y - 4 + Math.sin(a) * ry;
    ctx.beginPath();
    ctx.arc(tx, ty - 2, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = PAPER_CSS;
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** A short pier and a boat, toward the sea at angle `toward` (radians), for a harbour town. */
function quay(ctx: CanvasRenderingContext2D, x: number, y: number, toward: number): void {
  const dx = Math.cos(toward);
  const dy = Math.sin(toward);
  ctx.beginPath();
  ctx.moveTo(x + dx * 14, y + dy * 14);
  ctx.lineTo(x + dx * 34, y + dy * 34);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.lineWidth = 1;
  const bx = x + dx * 46 - dy * 6;
  const by = y + dy * 46 + dx * 6;
  ctx.beginPath();
  ctx.moveTo(bx - 7, by);
  ctx.quadraticCurveTo(bx, by + 5, bx + 7, by);
  ctx.closePath();
  ctx.fillStyle = PAPER_CSS;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, by - 11);
  ctx.moveTo(bx, by - 10);
  ctx.lineTo(bx + 5, by - 3);
  ctx.lineTo(bx, by - 3);
  ctx.stroke();
}

function bridge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 5);
  ctx.quadraticCurveTo(x, y - 1, x + 9, y + 5);
  ctx.moveTo(x - 9, y + 9);
  ctx.quadraticCurveTo(x, y + 3, x + 9, y + 9);
  ctx.stroke();
}

/** Draws one town centred at pixel (x, y); `seaToward` is the angle to the nearest sea, or null. */
function town(
  ctx: CanvasRenderingContext2D,
  index: number,
  x: number,
  y: number,
  seaToward: number | null,
): void {
  const spec = SPECS[index]!;
  const { rx, ry } = townReach(index);
  const g = ctx.createRadialGradient(x, y - 4, 0, x, y - 4, rx + 6);
  g.addColorStop(0, 'rgba(240,231,208,0.92)');
  g.addColorStop(0.72, 'rgba(240,231,208,0.8)');
  g.addColorStop(1, 'rgba(240,231,208,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, rx + 6, ry + 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink(0.92);
  ctx.lineWidth = 1;
  if (spec.wall) wall(ctx, x, y, rx - 3, ry - 3);
  if (spec.quay && seaToward !== null) quay(ctx, x, y, seaToward);
  if (spec.bridge) bridge(ctx, x - 14, y + 13);
  const count = HOUSES[spec.tier]! + (spec.keep ? -2 : 0);
  const spots: { x: number; y: number; w: number; t: boolean }[] = [];
  for (let k = 0; k < count; k += 1) {
    const a = (k / count) * Math.PI * 2 + index;
    const ring = k % 2 === 0 ? 0.72 : 0.38;
    spots.push({
      x: x + Math.cos(a) * rx * ring * 0.85 + (hash01(index, k) - 0.5) * 4,
      y: y + Math.sin(a) * ry * ring * 0.8 + (hash01(index, k + 40) - 0.5) * 3 + 3,
      w: 6.5 + hash01(index, k + 80) * 3.5,
      t: hash01(index, k + 120) > 0.65,
    });
  }
  const spireAt = [x - 3, x - rx * 0.45, x + rx * 0.4];
  spots.sort((a, b) => a.y - b.y);
  for (const s of spots) house(ctx, s.x, s.y, s.w, s.t);
  if (spec.keep) keep(ctx, x + 1, y + 6);
  if (spec.hall) {
    house(ctx, x + rx * 0.42, y + ry * 0.55, 14, true);
    ctx.beginPath();
    ctx.arc(x + rx * 0.42 + 11, y + ry * 0.55 - 8, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#b8923e';
    ctx.fill();
    ctx.stroke();
  }
  for (let s = 0; s < spec.spires; s += 1)
    spire(ctx, spireAt[s]!, y - ry * 0.1 + s * 6, spec.tier === 3 ? 1.1 : 0.9);
}

/** Half-width and half-height of a village's footprint in pixels. */
export const VILLAGE_REACH = { rx: 11, ry: 8 };

/** A village: two or three cottages on a pale clearing; every third has a small chapel spire. */
export function drawVillages(ctx: CanvasRenderingContext2D, data: MapData, S: number): void {
  const W = data.cells.width;
  data.villageCells.forEach((cell, n) => {
    const x = ((cell % W) + 0.5) * S;
    const y = (Math.floor(cell / W) + 0.5) * S;
    const { rx, ry } = VILLAGE_REACH;
    const g = ctx.createRadialGradient(x, y - 3, 0, x, y - 3, rx + 4);
    g.addColorStop(0, 'rgba(240,231,208,0.85)');
    g.addColorStop(1, 'rgba(240,231,208,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y - 3, rx + 4, ry + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink(0.9);
    ctx.lineWidth = 0.9;
    const count = 2 + Math.floor(hash01(100 + n, 1) * 2);
    for (let k = 0; k < count; k += 1) {
      const hx = x + (k - (count - 1) / 2) * 7 + (hash01(100 + n, k + 10) - 0.5) * 3;
      const hy = y + 2 + (k % 2) * 3;
      house(ctx, hx, hy, 5 + hash01(100 + n, k + 20) * 2, false);
    }
    if (n % 3 === 0) spire(ctx, x + count * 3.5, y - 1, 0.7);
  });
}

/** The angle from a cell to the nearest sea within 9 cells, or null. */
function towardSea(data: MapData, cell: number): number | null {
  const { width: W, height: H, water } = data.cells;
  const cx = cell % W;
  const cy = Math.floor(cell / W);
  let best = Infinity;
  let angle: number | null = null;
  for (let dy = -9; dy <= 9; dy += 1) {
    for (let dx = -9; dx <= 9; dx += 1) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= W || y >= H || water[y * W + x] !== 3) continue;
      const d = dx * dx + dy * dy;
      if (d < best) {
        best = d;
        angle = Math.atan2(dy, dx);
      }
    }
  }
  return angle;
}

export function drawTowns(
  ctx: CanvasRenderingContext2D,
  data: MapData,
  sites: readonly number[],
  S: number,
): void {
  const W = data.cells.width;
  sites.forEach((cell, index) => {
    const x = ((cell % W) + 0.5) * S;
    const y = (Math.floor(cell / W) + 0.5) * S;
    town(ctx, index, x, y, towardSea(data, cell));
  });
}

/** The Hollow Barrow: a grassy mound with a dark doorway and two standing stones. */
export function drawBarrow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink(0.92);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.bezierCurveTo(x - 10, y - 17, x + 10, y - 17, x + 14, y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(206,214,172,0.95)';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 3.4, y);
  ctx.lineTo(x - 3.4, y - 5);
  ctx.quadraticCurveTo(x, y - 9, x + 3.4, y - 5);
  ctx.lineTo(x + 3.4, y);
  ctx.closePath();
  ctx.fillStyle = INK;
  ctx.fill();
  for (const dx of [-21, 20]) {
    ctx.beginPath();
    ctx.moveTo(x + dx - 2.4, y + 1);
    ctx.lineTo(x + dx - 1.6, y - 10);
    ctx.lineTo(x + dx + 1.6, y - 11);
    ctx.lineTo(x + dx + 2.4, y + 1);
    ctx.closePath();
    ctx.fillStyle = PAPER_CSS;
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
