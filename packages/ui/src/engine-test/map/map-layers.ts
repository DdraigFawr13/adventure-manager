// Live layers of the kingdom map that are drawn from small pre-rendered canvases: the parchment
// fog the party's path ink-reveals, the faction washes and the threat stain. Each is built once;
// per frame they are only blitted with the zoom transform (no big buffers allocated per frame).
import type { MapCells } from './map-cells.ts';

export const INK = 'rgb(42,32,23)';
const FOG_RES = 2;
const WOBBLE_POINTS = 48;

export function newCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Deterministic 0-1 hash of two integers, so no layer needs a random source. */
export function hash01(a: number, b: number): number {
  let h = (Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** An irregular closed outline around (x, y), in the units of the current transform. */
export function wobblePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  seed: number,
  rough = 0.16,
): void {
  ctx.beginPath();
  for (let k = 0; k < WOBBLE_POINTS; k += 1) {
    const a = (k / WOBBLE_POINTS) * Math.PI * 2;
    const wob =
      Math.sin(a * 3 + seed * 1.7) * 0.5 +
      Math.sin(a * 5 + seed * 2.9) * 0.3 +
      (hash01(k, seed) - 0.5) * 0.5;
    const rr = r * (1 + wob * rough);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export interface Fog {
  /** Draws the fog over the whole map; `size` is the map's side in the current transform's units. */
  draw: (ctx: CanvasRenderingContext2D, size: number, alpha: number) => void;
  /** Clears fog in a rough disc (cell units). */
  reveal: (x: number, y: number, r: number, seed: number) => void;
  /** Clears all fog. */
  clear: () => void;
  /** Lays fog back over a rough disc (cell units). */
  cover: (x: number, y: number, r: number, seed: number) => void;
  /** Makes the fog as it is now the state `regrow` returns to. */
  keepAsStart: () => void;
  /** Lets the fog grow back toward its start state by this share (0-1). */
  regrow: (share: number) => void;
}

function parchment(w: number, h: number): HTMLCanvasElement {
  const canvas = newCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const grain = 0.9 + 0.1 * hash01(y * w + x, 5);
      // Slow blotches, so the sheet reads as old vellum and not a flat fill.
      const stain = 0.94 + 0.06 * Math.sin(x * 0.09 + Math.sin(y * 0.07) * 2);
      const q = (y * w + x) * 4;
      img.data[q] = 226 * grain * stain;
      img.data[q + 1] = 212 * grain * stain;
      img.data[q + 2] = 178 * grain * stain;
      img.data[q + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Faint hatching of unsurveyed ground.
  ctx.strokeStyle = 'rgba(110,86,56,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let d = -h; d < w; d += 9) {
    ctx.moveTo(d, 0);
    ctx.lineTo(d + h, h);
  }
  ctx.stroke();
  return canvas;
}

export function createFog(width: number, height: number): Fog {
  const w = width * FOG_RES;
  const h = height * FOG_RES;
  const sheet = parchment(w, h);
  const fog = newCanvas(w, h);
  const fctx = fog.getContext('2d')!;
  fctx.drawImage(sheet, 0, 0);
  const start = newCanvas(w, h);
  return {
    draw(ctx, size, alpha) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(fog, 0, 0, size, size);
      ctx.globalAlpha = 1;
    },
    reveal(x, y, r, seed) {
      fctx.save();
      fctx.globalCompositeOperation = 'destination-out';
      fctx.scale(FOG_RES, FOG_RES);
      fctx.fillStyle = '#000';
      wobblePath(fctx, x, y, r, seed);
      fctx.fill();
      fctx.restore();
    },
    clear() {
      fctx.clearRect(0, 0, w, h);
    },
    cover(x, y, r, seed) {
      fctx.save();
      fctx.scale(FOG_RES, FOG_RES);
      wobblePath(fctx, x, y, r, seed, 0.22);
      fctx.clip();
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.drawImage(sheet, 0, 0);
      fctx.restore();
    },
    keepAsStart() {
      start.getContext('2d')!.drawImage(fog, 0, 0);
    },
    regrow(share) {
      fctx.globalAlpha = share;
      fctx.drawImage(start, 0, 0);
      fctx.globalAlpha = 1;
    },
  };
}

export interface FactionArea {
  x: number;
  y: number;
  r: number;
  colour: string;
}

/** Soft coloured washes with an inked band just inside the edge, kept to the land. */
export function createFactions(cells: MapCells, areas: readonly FactionArea[]): HTMLCanvasElement {
  const { width, height } = cells;
  const w = width * FOG_RES;
  const h = height * FOG_RES;
  const out = newCanvas(w, h);
  const ctx = out.getContext('2d')!;
  const landOnly = newCanvas(width, height);
  const lctx = landOnly.getContext('2d')!;
  const img = lctx.createImageData(width, height);
  for (let i = 0; i < width * height; i += 1) {
    const land = cells.water[i] !== 3 && cells.water[i] !== 2;
    img.data[i * 4 + 3] = land ? 255 : 0;
  }
  lctx.putImageData(img, 0, 0);
  areas.forEach((area, n) => {
    ctx.save();
    ctx.scale(FOG_RES, FOG_RES);
    ctx.fillStyle = area.colour;
    ctx.globalAlpha = 0.2;
    wobblePath(ctx, area.x, area.y, area.r, 11 + n * 5, 0.22);
    ctx.fill();
    ctx.clip();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = area.colour;
    ctx.lineWidth = 3.2;
    ctx.filter = 'blur(1.6px)';
    wobblePath(ctx, area.x, area.y, area.r, 11 + n * 5, 0.22);
    ctx.stroke();
    ctx.restore();
  });
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(landOnly, 0, 0, w, h);
  return out;
}

/** A dark ink blot of overlapping lobes with a few spattered drops; the view scales and turns it. */
export function createStain(): HTMLCanvasElement {
  const size = 256;
  const canvas = newCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  const blot = (x: number, y: number, r: number, alpha: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(27,18,12,${alpha})`);
    g.addColorStop(0.65, `rgba(27,18,12,${alpha * 0.55})`);
    g.addColorStop(1, 'rgba(27,18,12,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  blot(size / 2, size / 2, 70, 0.7);
  for (let k = 0; k < 16; k += 1) {
    const a = hash01(k, 31) * Math.PI * 2;
    const d = 22 + hash01(k, 32) * 42;
    blot(size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, 22 + hash01(k, 33) * 24, 0.5);
  }
  for (let k = 0; k < 9; k += 1) {
    const a = hash01(k, 41) * Math.PI * 2;
    const d = 80 + hash01(k, 42) * 36;
    blot(size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, 4 + hash01(k, 43) * 7, 0.65);
  }
  return canvas;
}
