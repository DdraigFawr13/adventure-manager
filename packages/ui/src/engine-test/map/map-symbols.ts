// Terrain symbols, small and regular like an engraver's: hachured hills, shaded peaks, stippled
// trees, reed tufts for fen and sparse tufts for open ground. One sepia ink; placement is a jittered
// grid read from the generator's cells, so it is the same every run.
import { distanceTo } from './map-field.ts';
import { hash01 } from './map-layers.ts';
import type { MapCells } from './map-cells.ts';
import { ink, INK } from './map-palette.ts';

type Kind = 'peak' | 'hill' | 'tree' | 'pine' | 'reed' | 'tuft';
interface Mark {
  x: number;
  y: number;
  kind: Kind;
  size: number;
  seed: number;
}

const KINDS: readonly Kind[] = ['peak', 'hill', 'tree', 'pine', 'reed', 'tuft'];

/** Grid spacing (cells), jitter (cells) and the share of spots used, by kind. */
const SPACING: Record<Kind, [number, number, number]> = {
  peak: [2.5, 0.8, 0.95],
  hill: [1.7, 0.55, 0.92],
  tree: [0.95, 0.42, 0.85],
  pine: [0.95, 0.42, 0.85],
  reed: [1.2, 0.5, 0.85],
  tuft: [1.9, 0.8, 0.62],
};

export interface SymbolInput {
  cells: MapCells;
  biomeIds: readonly string[];
  /** Cells to keep clear: towns (with radius) and the road cells. */
  clear: readonly { cell: number; r: number }[];
  roadCells: ReadonlySet<number>;
}

function kindAt(cells: MapCells, ids: readonly string[], i: number): Kind | null {
  if (cells.water[i] !== 0) return null;
  const e = cells.elevation[i]!;
  if (e >= 1250) return 'peak';
  if (e >= 430) return 'hill';
  const id = ids[cells.biome[i]!] ?? '';
  if (id === 'temperate-forest') return 'tree';
  if (id === 'taiga') return 'pine';
  if (id === 'swamp') return 'reed';
  return id === 'alpine' ? 'peak' : 'tuft';
}

export function collectMarks(input: SymbolInput, S: number): Mark[] {
  const { cells, biomeIds } = input;
  const { width: W, height: H } = cells;
  const wet = (match: (v: number) => boolean) =>
    Uint8Array.from(cells.water, (v) => (match(v) ? 1 : 0));
  const fromShore = distanceTo(
    wet((v) => v === 2 || v === 3),
    W,
    H,
  );
  const fromRiver = distanceTo(
    wet((v) => v === 1),
    W,
    H,
  );
  const clearAt = new Uint8Array(W * H);
  for (const { cell, r } of input.clear) {
    const cx = cell % W;
    const cy = Math.floor(cell / W);
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy += 1) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx += 1) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && y >= 0 && x < W && y < H && dx * dx + dy * dy <= r * r)
          clearAt[y * W + x] = 1;
      }
    }
  }
  const marks: Mark[] = [];
  KINDS.forEach((kind, ki) => {
    const [step, jitter, use] = SPACING[kind];
    for (let gy = 0; gy * step < H; gy += 1) {
      for (let gx = 0; gx * step < W; gx += 1) {
        const h1 = hash01(gx * 7 + ki, gy * 13 + ki * 5);
        const h2 = hash01(gy * 17 + ki * 3, gx * 11 + 5);
        const h3 = hash01(gx * 5 + gy * 3, ki * 19 + 7);
        if (h3 > use) continue;
        const x = (gx + 0.5) * step + (h1 - 0.5) * 2 * jitter;
        const y = (gy + 0.5) * step + (h2 - 0.5) * 2 * jitter;
        if (x < 3 || y < 3 || x > W - 3 || y > H - 3) continue;
        const i = Math.floor(y) * W + Math.floor(x);
        const found = kindAt(cells, biomeIds, i);
        const same = found === kind || (kind === 'peak' && found === 'peak');
        if (!same || clearAt[i] || input.roadCells.has(i)) continue;
        if (fromShore[i]! < 2.1 || fromRiver[i]! < 1.4) continue;
        marks.push({
          x: x * S,
          y: y * S,
          kind,
          size: 0.8 + h3 * 0.5 + h1 * 0.15,
          seed: gx * 977 + gy,
        });
      }
    }
  });
  // Back to front, so nearer symbols overlap farther ones.
  return marks.sort((a, b) => a.y - b.y || a.x - b.x);
}

const WASH = 'rgba(232,222,196,0.96)';

function peak(ctx: CanvasRenderingContext2D, m: Mark): void {
  const w = 28 * m.size;
  const h = 25 * m.size;
  const { x, y } = m;
  const lean = (hash01(m.seed, 3) - 0.5) * w * 0.25;
  const ax = x + lean;
  const ay = y - h;
  // The ridge falls from the summit to a point on the base; the right-hand face is in shade.
  const mx = x + w * 0.06;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * 0.2, y - h * 0.55);
  ctx.lineTo(x - w * 0.1, y - h * 0.62);
  ctx.lineTo(ax, ay);
  ctx.lineTo(ax + w * 0.1, y - h * 0.7);
  ctx.lineTo(x + w * 0.2, y - h * 0.5);
  ctx.lineTo(x + w * 0.27, y - h * 0.52);
  ctx.lineTo(x + w / 2, y);
  ctx.closePath();
  ctx.fillStyle = WASH;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(x + w / 2 + 2, y + 2);
  ctx.lineTo(mx, y + 2);
  ctx.closePath();
  ctx.fillStyle = ink(0.2);
  ctx.fill();
  // Hatching across the shaded face, parallel to the ridge.
  ctx.beginPath();
  const n = Math.round(8 * m.size);
  for (let k = 1; k <= n; k += 1) {
    const t = k / (n + 1);
    const px = ax + (x + w / 2 - ax) * t;
    const py = ay + (y - ay) * t;
    ctx.moveTo(px, py);
    ctx.lineTo(px + (mx - ax) * 0.62 * (1 - t * 0.5), py + (y - ay) * 0.5 * (1 - t * 0.5));
  }
  ctx.lineWidth = 0.75;
  ctx.strokeStyle = ink(0.75);
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * 0.2, y - h * 0.55);
  ctx.lineTo(x - w * 0.1, y - h * 0.62);
  ctx.lineTo(ax, ay);
  ctx.lineTo(ax + w * 0.1, y - h * 0.7);
  ctx.lineTo(x + w * 0.2, y - h * 0.5);
  ctx.lineTo(x + w * 0.27, y - h * 0.52);
  ctx.lineTo(x + w / 2, y);
  ctx.moveTo(ax, ay);
  ctx.lineTo(mx, y);
  ctx.strokeStyle = ink(0.92);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function hill(ctx: CanvasRenderingContext2D, m: Mark): void {
  const w = 16 * m.size;
  const h = 8.5 * m.size;
  const { x, y } = m;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.bezierCurveTo(x - w * 0.34, y - h * 1.25, x + w * 0.3, y - h * 1.25, x + w / 2, y);
  ctx.fillStyle = WASH;
  ctx.fill();
  ctx.strokeStyle = ink(0.88);
  ctx.lineWidth = 1;
  ctx.stroke();
  // Hachures on the sunless side, following the curve.
  ctx.beginPath();
  for (let k = 0; k < 5; k += 1) {
    const t = 0.18 + k * 0.15;
    const hx = x + w * (0.02 + t * 0.46);
    const top = y - h * (1.0 - t * t * 0.9) * (1 - t * 0.3);
    ctx.moveTo(hx, Math.min(y - 2, top + 2));
    ctx.lineTo(hx + 0.6, y - 0.8);
  }
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = ink(0.7);
  ctx.stroke();
}

function tree(ctx: CanvasRenderingContext2D, m: Mark): void {
  const r = 2.7 * m.size;
  const { x, y } = m;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - r * 0.7);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = ink(0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - r * 1.75, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(214,224,186,0.94)';
  ctx.fill();
  ctx.lineWidth = 0.9;
  ctx.stroke();
  // Stipple on the shaded side.
  ctx.fillStyle = INK;
  for (let k = 0; k < 4; k += 1) {
    const a = 0.2 + k * 0.85 + hash01(m.seed, k) * 0.4;
    const d = r * (0.25 + hash01(m.seed, k + 9) * 0.45);
    ctx.fillRect(x + Math.cos(a) * d + 0.3, y - r * 1.75 + Math.sin(a) * d * 0.9 + 0.2, 0.9, 0.9);
  }
}

function pine(ctx: CanvasRenderingContext2D, m: Mark): void {
  const h = 8.5 * m.size;
  const w = 3 * m.size;
  const { x, y } = m;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h * 0.25);
  ctx.moveTo(x - w, y - h * 0.25);
  ctx.lineTo(x, y - h * 0.7);
  ctx.lineTo(x + w, y - h * 0.25);
  ctx.moveTo(x - w * 0.7, y - h * 0.55);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + w * 0.7, y - h * 0.55);
  ctx.lineWidth = 0.95;
  ctx.strokeStyle = ink(0.88);
  ctx.stroke();
}

function reed(ctx: CanvasRenderingContext2D, m: Mark): void {
  const h = 5.2 * m.size;
  const { x, y } = m;
  ctx.beginPath();
  for (const dx of [-2.1, 0, 2.1]) {
    const lift = dx === 0 ? 1 : 0.7;
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x + dx * 1.15, y - h * lift);
    ctx.moveTo(x + dx * 1.15, y - h * lift);
    ctx.lineTo(x + dx * 1.15 + 1, y - h * lift + 1.4);
  }
  ctx.moveTo(x - 5.5, y + 1.5);
  ctx.lineTo(x - 2, y + 1.5);
  ctx.moveTo(x + 2, y + 1.5);
  ctx.lineTo(x + 5.5, y + 1.5);
  ctx.lineWidth = 0.85;
  ctx.strokeStyle = ink(0.8);
  ctx.stroke();
}

function tuft(ctx: CanvasRenderingContext2D, m: Mark): void {
  const h = 3 * m.size;
  const { x, y } = m;
  ctx.beginPath();
  ctx.moveTo(x - 2.4, y);
  ctx.lineTo(x - 3.2, y - h);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h * 1.25);
  ctx.moveTo(x + 2.4, y);
  ctx.lineTo(x + 3.2, y - h);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = ink(0.55);
  ctx.stroke();
}

const DRAW: Record<Kind, (ctx: CanvasRenderingContext2D, m: Mark) => void> = {
  peak,
  hill,
  tree,
  pine,
  reed,
  tuft,
};

export function* drawSymbols(
  ctx: CanvasRenderingContext2D,
  marks: readonly Mark[],
): Generator<void, void, void> {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let k = 0; k < marks.length; k += 1) {
    DRAW[marks[k]!.kind](ctx, marks[k]!);
    if (k % 2500 === 2499) yield;
  }
}
