// The sheet's ground: grained paper, soft biome washes, the sea, fine ripple lines along every
// shore and the coast as one crisp vector ink line (smooth at any zoom; nothing here is stepped).
import { addSmooth, blurField, distanceTo, padPlane } from './map-field.ts';
import { hash01, newCanvas } from './map-layers.ts';
import type { MapCells } from './map-cells.ts';
import { contourSteps, type Outline } from './outline.ts';
import { HILL_WASH, ink, PAPER, PAPER_CSS, SEA, TINT } from './map-palette.ts';

const PAD = 8;
/** Distances from the shore (cells) where a ripple line runs, and how dark each is. */
const RIPPLES = [
  [1.5, 0.5],
  [2.9, 0.4],
  [4.6, 0.31],
  [6.8, 0.23],
  [9.4, 0.16],
] as const;

/** Paper with a fine grain and slow stains, so the sheet reads as old stock and not a flat fill. */
function paper(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = PAPER_CSS;
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 70; k += 1) {
    const x = hash01(k, 11) * w;
    const y = hash01(k, 12) * h;
    const r = 90 + hash01(k, 13) * 330;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = hash01(k, 14) > 0.4;
    g.addColorStop(0, warm ? 'rgba(150,112,62,0.07)' : 'rgba(255,250,235,0.08)');
    g.addColorStop(1, 'rgba(150,112,62,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tile = newCanvas(160, 160);
  const t = tile.getContext('2d')!;
  const img = t.createImageData(160, 160);
  for (let i = 0; i < 160 * 160; i += 1) {
    const v = hash01(i, 21);
    img.data[i * 4] = 96;
    img.data[i * 4 + 1] = 72;
    img.data[i * 4 + 2] = 44;
    img.data[i * 4 + 3] = v > 0.82 ? 26 + (v - 0.82) * 160 : 0;
  }
  t.putImageData(img, 0, 0);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat')!;
  ctx.fillRect(0, 0, w, h);
}

/** One wash colour per cell (biome, then high ground), drawn small and blurred up so edges are soft. */
function washes(
  ctx: CanvasRenderingContext2D,
  data: { cells: MapCells; biomeIds: readonly string[] },
  S: number,
) {
  const { cells, biomeIds } = data;
  const { width: W, height: H } = cells;
  const small = newCanvas(W, H);
  const sctx = small.getContext('2d')!;
  const img = sctx.createImageData(W, H);
  for (let i = 0; i < W * H; i += 1) {
    const base = TINT[biomeIds[cells.biome[i]!] ?? ''] ?? PAPER;
    const high = Math.min(1, Math.max(0, (cells.elevation[i]! - 450) / 700)) * 0.75;
    for (let c = 0; c < 3; c += 1)
      img.data[i * 4 + c] = base[c]! * (1 - high) + HILL_WASH[c]! * high;
    img.data[i * 4 + 3] = cells.water[i] === 3 ? 0 : 175;
  }
  sctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.filter = `blur(${S * 1.3}px)`;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, W * S, H * S);
  ctx.restore();
}

const toPx = (o: Outline, S: number): number[] => o.points.map((v) => (v - PAD) * S);

/** Draws the ground and returns the land as a path in pixels (fill it even-odd: lakes are holes). */
export function* drawGround(
  ctx: CanvasRenderingContext2D,
  data: { cells: MapCells; biomeIds: readonly string[] },
  S: number,
): Generator<void, Path2D, void> {
  const { cells } = data;
  const { width: W, height: H } = cells;
  const px = W * S;
  const py = H * S;
  paper(ctx, px, py);
  yield;
  washes(ctx, data, S);
  yield;

  // The shore: blurred land mask, traced where it crosses one half.
  const land = Float32Array.from(cells.water, (v) => (v === 2 || v === 3 ? 0 : 1));
  const padded = padPlane(land, W, H, PAD, 5, 0);
  const smooth = blurField(padded.plane, padded.w, padded.h, 1.3);
  const outlines = yield* contourSteps(smooth, padded.w, padded.h, 0.5, 4);
  const landPath = new Path2D();
  for (const o of outlines) addSmooth(landPath, toPx(o, S), o.closed);

  const sea = new Path2D();
  sea.rect(-S, -S, px + S * 2, py + S * 2);
  sea.addPath(landPath);
  ctx.fillStyle = `rgb(${SEA.join(',')})`;
  ctx.fill(sea, 'evenodd');
  yield;

  // Fine ripple lines: contours of the distance from land, drawn only over water.
  const dist = distanceTo(
    Uint8Array.from(land, (v) => (v > 0 ? 1 : 0)),
    W,
    H,
  );
  const dpad = padPlane(dist, W, H, PAD, PAD, 0);
  const field = blurField(dpad.plane, dpad.w, dpad.h, 0.8);
  ctx.save();
  ctx.clip(sea, 'evenodd');
  // A soft darker band hugging the shore.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(92,110,104,0.13)';
  ctx.lineWidth = S * 3.2;
  ctx.stroke(landPath);
  ctx.lineWidth = S * 1.5;
  ctx.stroke(landPath);
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.05;
  for (let n = 0; n < RIPPLES.length; n += 1) {
    const [level, alpha] = RIPPLES[n]!;
    const lines = yield* contourSteps(field, dpad.w, dpad.h, level, 2);
    const path = new Path2D();
    for (const o of lines) addSmooth(path, toPx(o, S), o.closed);
    ctx.strokeStyle = ink(alpha);
    ctx.setLineDash([20 + n * 3, 6, 5 + n, 7]);
    ctx.lineDashOffset = n * 11;
    ctx.stroke(path);
  }
  ctx.setLineDash([]);
  ctx.restore();
  yield;

  // The coast and lake shores: a faint wide line under a crisp one.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink(0.16);
  ctx.lineWidth = 4.4;
  ctx.stroke(landPath);
  ctx.strokeStyle = ink(0.95);
  ctx.lineWidth = 1.9;
  ctx.stroke(landPath);
  return landPath;
}
