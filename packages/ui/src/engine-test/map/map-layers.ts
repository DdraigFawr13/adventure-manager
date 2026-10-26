// Live layers of the kingdom map that are drawn from small pre-rendered canvases: the vellum fog the
// party's route ink-reveals, the faction border bands and the threat stain. Each is built once; per
// frame they are only blitted with the zoom transform (no big buffers allocated per frame).
import { INK, ink } from './map-palette.ts';

const FOG_RES = 2;
const WOBBLE_POINTS = 64;

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
      (hash01(k, seed) - 0.5) * 0.35;
    const rr = r * (1 + wob * rough);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export interface Fog {
  /** Draws the fog over the sheet; `w` and `h` are the sheet's size in the current transform's units. */
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) => void;
  /** Clears fog in a rough disc (cell units). */
  reveal: (x: number, y: number, r: number, seed: number) => void;
  /** Clears all fog. */
  clear: () => void;
  /** Lays vellum over a rough, soft-edged disc (cell units). */
  cover: (x: number, y: number, r: number, seed: number) => void;
  /** Makes the fog as it is now the state `regrow` returns to. */
  keepAsStart: () => void;
  /** Lets the fog grow back toward its start state by this share (0-1). */
  regrow: (share: number) => void;
}

/** Blank vellum: paper with a fine grain and nothing drawn on it. */
function vellum(w: number, h: number): HTMLCanvasElement {
  const canvas = newCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const grain = 0.95 + 0.05 * hash01(y * w + x, 5);
      const stain = 0.97 + 0.03 * Math.sin(x * 0.05 + Math.sin(y * 0.04) * 2);
      const q = (y * w + x) * 4;
      img.data[q] = 236 * grain * stain;
      img.data[q + 1] = 228 * grain * stain;
      img.data[q + 2] = 208 * grain * stain;
      img.data[q + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function createFog(width: number, height: number): Fog {
  const w = width * FOG_RES;
  const h = height * FOG_RES;
  const sheet = vellum(w, h);
  const fog = newCanvas(w, h);
  const fctx = fog.getContext('2d')!;
  fctx.drawImage(sheet, 0, 0);
  const start = newCanvas(w, h);
  return {
    draw(ctx, sw, sh, alpha) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(fog, 0, 0, sw, sh);
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
      // A soft-edged mask of the disc, then vellum through it, then a faint ink edge.
      const mask = newCanvas(w, h);
      const mctx = mask.getContext('2d')!;
      mctx.filter = 'blur(5px)';
      mctx.scale(FOG_RES, FOG_RES);
      mctx.fillStyle = '#000';
      wobblePath(mctx, x, y, r, seed, 0.2);
      mctx.fill();
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.filter = 'none';
      mctx.globalCompositeOperation = 'source-in';
      mctx.drawImage(sheet, 0, 0);
      fctx.drawImage(mask, 0, 0);
      fctx.save();
      fctx.scale(FOG_RES, FOG_RES);
      wobblePath(fctx, x, y, r * 0.985, seed, 0.2);
      fctx.strokeStyle = ink(0.28);
      fctx.lineWidth = 0.7;
      fctx.setLineDash([3, 2.4]);
      fctx.stroke();
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
  /** Seat in cells. */
  x: number;
  y: number;
  /** Reach in cells. */
  r: number;
  colour: string;
  charge: 'chevron' | 'waves';
}

export interface FactionMark {
  canvas: HTMLCanvasElement;
  /** Where the canvas sits on the sheet, in pixels. */
  x: number;
  y: number;
}

/** A heater shield in the faction's colour with its charge, centred at (x, y). */
function shield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
  charge: FactionArea['charge'],
) {
  const w = 22;
  const h = 27;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y + 2);
  ctx.quadraticCurveTo(x + w / 2, y + h / 2 - 2, x, y + h / 2);
  ctx.quadraticCurveTo(x - w / 2, y + h / 2 - 2, x - w / 2, y + 2);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(244,236,214,0.95)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  if (charge === 'chevron') {
    ctx.moveTo(x - 9, y + 3);
    ctx.lineTo(x, y - 5);
    ctx.lineTo(x + 9, y + 3);
  } else {
    for (const dy of [-5, 2, 9]) {
      ctx.moveTo(x - 11, y + dy);
      ctx.quadraticCurveTo(x - 5.5, y + dy - 3, x, y + dy);
      ctx.quadraticCurveTo(x + 5.5, y + dy + 3, x + 11, y + dy);
    }
    ctx.lineWidth = 2.2;
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * A faction's hold as a thin heraldic band just inside its border (a pale colour wash under a fine
 * double line), with its shield on the border; kept to the land and the ruled sheet. No blotch.
 */
export function createFactionMark(
  area: FactionArea,
  scale: number,
  land: Path2D,
  inner: { x: number; y: number; w: number; h: number },
  isLand: (x: number, y: number) => boolean,
  seed: number,
): FactionMark {
  const pad = (area.r + 4) * scale;
  const ox = Math.max(0, area.x * scale - pad);
  const oy = Math.max(0, area.y * scale - pad);
  const canvas = newCanvas(pad * 2, pad * 2);
  const ctx = canvas.getContext('2d')!;
  ctx.translate(-ox, -oy);
  const cx = area.x * scale;
  const cy = area.y * scale;
  const R = area.r * scale;
  ctx.save();
  wobblePath(ctx, cx, cy, R, seed, 0.2);
  ctx.clip();
  ctx.strokeStyle = area.colour;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 16;
  wobblePath(ctx, cx, cy, R, seed, 0.2);
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.globalAlpha = 0.24;
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = area.colour;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 1.3;
  wobblePath(ctx, cx, cy, R - 3.5, seed, 0.2);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1;
  ctx.setLineDash([1.5, 4]);
  wobblePath(ctx, cx, cy, R, seed, 0.2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fill(land, 'evenodd');
  ctx.beginPath();
  ctx.rect(inner.x, inner.y, inner.w, inner.h);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // The shield goes on the border at the first of eight bearings (from north, turning round) that is land.
  for (let k = 0; k < 8; k += 1) {
    const a = -Math.PI / 2 + (k * Math.PI) / 4;
    const sx = area.x + Math.cos(a) * (area.r - 2.6);
    const sy = area.y + Math.sin(a) * (area.r - 2.6);
    if (isLand(sx, sy) && sx * scale > inner.x + 24 && sy * scale > inner.y + 24) {
      shield(ctx, sx * scale, sy * scale, area.colour, area.charge);
      break;
    }
  }
  return { canvas, x: ox, y: oy };
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
