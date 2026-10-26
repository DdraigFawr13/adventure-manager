// From Story-Generator src/app/tales/atlas.ts @ 8a5c4ef (D-116); WorldCells import replaced by the local MapCells type, imports use .ts.
// The Tales map, drawn on canvases from the world's cells (a port of the approved calm6 script).
// The terrain layers (sea, paper, tints, symbols, rivers, roads, coast, compass) are drawn once per
// world; the political layer (fills, wild land, borders, towns) is redrawn when the borders move.
// Everything is deterministic: symbols come from a cell-index hash, never Math.random.

import type { MapCells as WorldCells } from './map-cells.ts';
import { type Rgb3 } from './colours.ts';
import { contourSteps, pathOf } from './outline.ts';

export type MapMode = 'land' | 'realms' | 'peoples' | 'faiths' | 'plain';

export interface Town {
  cell: number;
  pop: number;
  capital: boolean;
}

export interface DrawInput {
  mode: MapMode;
  /** Equal keys mean equal owner grids, towns and colours (the border year). */
  key: number;
  /** Civ id per cell, 0 for nobody; not changed here. */
  owner: Uint16Array;
  /** The fill colour of a civ in this mode, or null for none. */
  fillOf: (civ: number) => Rgb3 | null;
  borderOf: (civ: number) => Rgb3;
  towns: readonly Town[];
  /** Cells of holy cities, drawn in Faiths mode. */
  holy: readonly number[];
  /** Anything else the fills depend on (vassals wearing their overlord's colour), for the layer cache. */
  variant?: string;
}

export interface DrawResult {
  ms: number;
  /** Where each standing realm's name sits, in cell units, and how many land cells it holds. */
  centres: Map<number, { x: number; y: number; n: number }>;
}

const PAPER: Rgb3 = [242, 235, 218];
const SEA: Rgb3 = [199, 213, 215];
export const INK: Rgb3 = [84, 74, 62];
/** Soft ground tint per biome id (the map key reads it too). */
export const TINT: Record<string, Rgb3> = {
  'temperate-forest': [204, 218, 176],
  taiga: [196, 212, 190],
  jungle: [186, 208, 160],
  swamp: [196, 210, 192],
  desert: [240, 222, 182],
  steppe: [230, 224, 190],
  savanna: [228, 220, 176],
  tundra: [240, 241, 238],
  alpine: [224, 218, 208],
  grassland: [230, 230, 198],
};
/** Border opacity by mode; Land and Peoples keep theirs light and thin (Realms is the political view). */
const MODE_STRENGTH: Record<MapMode, number> = {
  land: 0.35,
  realms: 0.55,
  peoples: 0.35,
  faiths: 0.5,
  plain: 0,
};
const THIN_MODES: readonly MapMode[] = ['land', 'peoples'];
/** Political layers kept, so scrubbing back and forth redraws nothing. */
const LAYER_CACHE = 6;
const FILL_MODES: readonly MapMode[] = ['realms', 'peoples', 'faiths'];
/** How strongly a realm, people or faith fill lies over the land, so biomes and marks show through. */
const FILL_STRENGTH = 0.42;

const hash = (i: number, salt: number): number => {
  let h = (Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
};

const rad = (deg: number) => (deg * Math.PI) / 180;

function canvasOf(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
const ctxOf = (c: HTMLCanvasElement, read = false): CanvasRenderingContext2D =>
  c.getContext('2d', read ? { willReadFrequently: true } : undefined)!;

const FILTER_OK = (() => {
  try {
    const c = canvasOf(1, 1).getContext('2d');
    return !!c && 'filter' in c;
  } catch {
    return false;
  }
})();

/** A normalised Gaussian kernel, reaching three sigma. */
function kernelOf(sigma: number): Float32Array {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(r * 2 + 1);
  let sum = 0;
  for (let i = -r; i <= r; i += 1) {
    k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
    sum += k[i + r]!;
  }
  for (let i = 0; i < k.length; i += 1) k[i] = k[i]! / sum;
  return k;
}

/** Gaussian blur of a w x h plane, with nothing beyond the edge. */
function blurPlane(
  src: Float32Array,
  w: number,
  h: number,
  sigma: number,
  /** Treat the edge as more of the same instead of as nothing. */
  keepEdge = false,
): Float32Array {
  const k = kernelOf(sigma);
  const r = (k.length - 1) / 2;
  const mid = new Float32Array(src.length);
  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      let weight = 0;
      const from = Math.max(0, x - r);
      const to = Math.min(w - 1, x + r);
      for (let i = from; i <= to; i += 1) {
        sum += src[row + i]! * k[i - x + r]!;
        weight += k[i - x + r]!;
      }
      mid[row + x] = keepEdge ? sum / weight : sum;
    }
  }
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y += 1) {
    const from = Math.max(0, y - r);
    const to = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      let weight = 0;
      for (let i = from; i <= to; i += 1) {
        sum += mid[i * w + x]! * k[i - y + r]!;
        weight += k[i - y + r]!;
      }
      out[y * w + x] = keepEdge ? sum / weight : sum;
    }
  }
  return out;
}

/** Pixels worked between pauses in a sliced build (a few milliseconds of work). */
const SLICE_PX = 1 << 18;
/** Milliseconds of light work run together before a pause. */
const SLICE_MS = 8;
/** Rows of a plane this many pixels wide worked between pauses. */
const sliceRows = (width: number) => Math.max(1, Math.floor(SLICE_PX / width));

/** `upscale` in slices of rows. */
function* upscaleSteps(
  plane: Float32Array,
  w: number,
  h: number,
  S: number,
  put: (p: number, v: number) => void,
): Generator<void, void, void> {
  const rows = sliceRows(w * S);
  for (let y = 0; y < h * S; y += rows) {
    if (y > 0) yield;
    upscale(plane, w, h, S, put, y, Math.min(h * S, y + rows));
  }
}

/**
 * Calls `put(pixelIndex, value)` for every pixel of the plane upscaled `S` times, bilinear, in
 * the pixel rows `from` to `to`.
 */
function upscale(
  plane: Float32Array,
  w: number,
  h: number,
  S: number,
  put: (p: number, v: number) => void,
  from = 0,
  to = h * S,
): void {
  const P = w * S;
  const x0 = new Int32Array(P);
  const x1 = new Int32Array(P);
  const tx = new Float32Array(P);
  for (let x = 0; x < P; x += 1) {
    const f = (x + 0.5) / S - 0.5;
    const i = Math.floor(f);
    x0[x] = Math.max(0, i);
    x1[x] = Math.min(w - 1, i + 1);
    tx[x] = f - i;
  }
  for (let y = from; y < to; y += 1) {
    const f = (y + 0.5) / S - 0.5;
    const j = Math.floor(f);
    const ty = f - j;
    const r0 = Math.max(0, j) * w;
    const r1 = Math.min(h - 1, j + 1) * w;
    for (let x = 0; x < P; x += 1) {
      const a = x0[x]!;
      const b = x1[x]!;
      const t = tx[x]!;
      const top = plane[r0 + a]! * (1 - t) + plane[r0 + b]! * t;
      const bottom = plane[r1 + a]! * (1 - t) + plane[r1 + b]! * t;
      put(y * P + x, top * (1 - ty) + bottom * ty);
    }
  }
}

/**
 * A cell mask (0 or 255 a cell) smoothed and upscaled to `S` pixels a cell: blurred at cell
 * size (sigma in cells), then interpolated and cut at `thr` (0-255). Returns 1 where it holds.
 */
function* smoothMaskSteps(
  cellsAlpha: Uint8Array,
  w: number,
  h: number,
  S: number,
  sigmaCells: number,
  thr: number,
): Generator<void, Uint8Array, void> {
  const plane = blurPlane(
    Float32Array.from(cellsAlpha, (v) => v / 255),
    w,
    h,
    sigmaCells,
  );
  const out = new Uint8Array(w * S * h * S);
  const cut = thr / 255;
  yield* upscaleSteps(plane, w, h, S, (p, v) => {
    out[p] = v > cut ? 1 : 0;
  });
  return out;
}

/** The smoothed mask's values before the cut (0-1 a pixel), for edges drawn with coverage. */
function* smoothFieldSteps(
  cellsAlpha: Uint8Array,
  w: number,
  h: number,
  S: number,
  sigmaCells: number,
): Generator<void, Float32Array, void> {
  const plane = blurPlane(
    Float32Array.from(cellsAlpha, (v) => v / 255),
    w,
    h,
    sigmaCells,
  );
  const out = new Float32Array(w * S * h * S);
  yield* upscaleSteps(plane, w, h, S, (p, v) => {
    out[p] = v;
  });
  return out;
}

/**
 * How much of pixel `q` of a smoothed field (`pw` wide, `ph` high) lies inside its cut, 0-1: the
 * signed distance to the cut line from the local slope, so a shape's edge is drawn smooth (not
 * stepped) when the map is zoomed in.
 */
function coverage(field: Float32Array, q: number, pw: number, ph: number, cut: number): number {
  return Math.max(0, Math.min(1, 0.5 + signedAt(field, q, pw, ph, cut)));
}

/** Pixels from pixel `q`'s centre to the field's cut line (positive inside), from the slope. */
function signedAt(field: Float32Array, q: number, pw: number, ph: number, cut: number): number {
  const x = q % pw;
  const y = (q - x) / pw;
  const l = x > 0 ? field[q - 1]! : field[q]!;
  const r = x < pw - 1 ? field[q + 1]! : field[q]!;
  const u = y > 0 ? field[q - pw]! : field[q]!;
  const d = y < ph - 1 ? field[q + pw]! : field[q]!;
  const slope = Math.hypot(r - l, d - u) / 2;
  return (field[q]! - cut) / Math.max(slope, 1e-4);
}

/** The shore as an SVG path in cell units: the smoothed land mask's edge, smooth at any zoom. */
export function coastPath(cells: WorldCells): string {
  return runSteps(coastSteps(cells));
}

/** The same path in slices (see `atlasSteps`). */
export function* coastSteps(cells: WorldCells): Generator<void, string, void> {
  const W = cells.width;
  const H = cells.height;
  const land = Float32Array.from(cells.water, (v) => (v === 2 || v === 3 ? 0 : 1));
  // The same blur and cut as the raster map (smoothMask at sigma 1.75, threshold 127).
  return pathOf(yield* contourSteps(blurPlane(land, W, H, 1.75), W, H, 127 / 255, 4));
}

/** Runs a sliced build to the end at once. */
export function runSteps<T>(steps: Generator<void, T, void>): T {
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

const FAR = 30000;
/** Chamfer (3-4) distance to the nearest set pixel of `source`, in thirds of a pixel; sliced. */
function* distanceSteps(
  source: Uint8Array,
  w: number,
  h: number,
): Generator<void, Uint16Array, void> {
  const rows = sliceRows(w);
  const d = new Uint16Array(w * h);
  for (let i = 0; i < d.length; i += 1) d[i] = source[i] ? 0 : FAR;
  for (let y = 0; y < h; y += 1) {
    if (y % rows === rows - 1) yield;
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      let v = d[i]!;
      if (v === 0) continue;
      if (x > 0) v = Math.min(v, d[i - 1]! + 3);
      if (y > 0) {
        v = Math.min(v, d[i - w]! + 3);
        if (x > 0) v = Math.min(v, d[i - w - 1]! + 4);
        if (x < w - 1) v = Math.min(v, d[i - w + 1]! + 4);
      }
      d[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y -= 1) {
    if (y % rows === 0) yield;
    for (let x = w - 1; x >= 0; x -= 1) {
      const i = y * w + x;
      let v = d[i]!;
      if (v === 0) continue;
      if (x < w - 1) v = Math.min(v, d[i + 1]! + 3);
      if (y < h - 1) {
        v = Math.min(v, d[i + w]! + 3);
        if (x < w - 1) v = Math.min(v, d[i + w + 1]! + 4);
        if (x > 0) v = Math.min(v, d[i + w - 1]! + 4);
      }
      d[i] = v;
    }
  }
  return d;
}

/** One realm's smoothed shape, cut to its bounding box. Colour-free, so every mode shares it. */
interface Shape {
  x0: number;
  y0: number;
  w: number;
  h: number;
  /** Land it holds (alpha 0 or 255). */
  fill: Uint8Array;
  /** Soft band just inside its edge (alpha 0-255). */
  band: Uint8Array;
  /** The same band, thinner, for the light modes. */
  thin: Uint8Array;
  /** Pixels (box index) where either band is set, so tinting visits only those. */
  edge: Uint32Array;
}

export interface Atlas {
  /** The canvas shown: one pixel plane of `size` squared. */
  canvas: HTMLCanvasElement;
  size: number;
  /** Pixels a cell. */
  scale: number;
  width: number;
  height: number;
  /** The land's bounding box in cells, with a margin. */
  box: { x0: number; y0: number; x1: number; y1: number };
  /** Per cell: 1 where drawn land holds a mark clear of the shore (no beast floats at sea). */
  inland: Uint8Array;
  /** Milliseconds the terrain layers took (the time spent working, not waiting between slices). */
  terrainMs: number;
  /** The longest single slice of that work, in milliseconds. */
  maxSliceMs: number;
  draw: (input: DrawInput) => DrawResult;
  /** The same drawing in slices, for the sharper map: the canvas changes only at the last one. */
  drawSteps: (input: DrawInput) => Generator<void, DrawResult, void>;
}

/** Pixels a cell the Tales map uses for a world this many cells wide. */
export const defaultScale = (width: number): number => Math.max(4, Math.round(1024 / width));

export interface AtlasOptions {
  /** Draw the raster shore line (default); false leaves it to a vector line drawn over the map. */
  coast?: boolean;
}

/**
 * Builds the terrain layers for a world and returns the canvas and its political drawing.
 * `scale` (pixels a cell) is for a close-up that needs a sharper plane than the Tales map.
 */
export function createAtlas(
  cells: WorldCells,
  biomeIds: readonly string[],
  scale?: number,
  options: AtlasOptions = {},
): Atlas {
  const steps = atlasSteps(cells, biomeIds, scale, options);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

/**
 * The same build in slices: each `next()` does one stretch of work (a few tens to a couple of
 * hundred milliseconds) and the caller waits for a free moment before the next, so a close-up
 * atlas can be made without freezing the page.
 */
export function* atlasSteps(
  cells: WorldCells,
  biomeIds: readonly string[],
  scale?: number,
  options: AtlasOptions = {},
): Generator<void, Atlas, void> {
  let busy = 0;
  let longest = 0;
  let mark = performance.now();
  /** Ends a slice: adds its time to the work done. */
  const lap = () => {
    const spent = performance.now() - mark;
    busy += spent;
    longest = Math.max(longest, spent);
  };
  /** Runs a helper's slices as slices of this build. */
  function* inSlices<T>(steps: Generator<void, T, void>): Generator<void, T, void> {
    for (;;) {
      const r = steps.next();
      if (r.done) return r.value;
      lap();
      yield;
      mark = performance.now();
    }
  }
  const W = cells.width;
  const H = cells.height;
  const N = W * H;
  const S = scale ?? defaultScale(W);
  const P = W * S;
  /** Symbol sizes are written for 8 pixels a cell. */
  const k = S / 8;
  const water = cells.water;
  const isLand = new Uint8Array(N);
  for (let i = 0; i < N; i += 1) isLand[i] = water[i] === 2 || water[i] === 3 ? 0 : 1;
  const biomeAt = (i: number) => biomeIds[cells.biome[i]!] ?? '';

  // Land and lake masks, smoothed.
  const landCells = Uint8Array.from(isLand, (v) => (v ? 255 : 0));
  const landPx = yield* inSlices(smoothMaskSteps(landCells, W, H, S, 1.75, 127));
  lap();
  yield;
  mark = performance.now();
  const lakeCells = Uint8Array.from(water, (v) => (v === 2 ? 255 : 0));
  const lakePx = yield* inSlices(smoothMaskSteps(lakeCells, W, H, S, 0.9, 30));
  lap();
  yield;
  mark = performance.now();
  const sea = new Uint8Array(P * P);
  for (let i = 0; i < sea.length; i += 1) sea[i] = landPx[i] ? 0 : 1;
  const seaDist = yield* inSlices(distanceSteps(sea, P, P));
  lap();
  yield;
  mark = performance.now();
  const landDist = yield* inSlices(distanceSteps(landPx, P, P));
  /** Pixels from the nearest water (land) or land (sea). */
  const coastPx = (p: number) => (landPx[p] ? seaDist[p]! : landDist[p]!) / 3;

  lap();
  yield;
  mark = performance.now();

  // ---- paper and tinted bases -------------------------------------------------------------
  // Ground tint per biome, blurred at cell size and interpolated up.
  const tintPx = new Uint8Array(P * P * 3);
  for (let ch = 0; ch < 3; ch += 1) {
    lap();
    yield;
    mark = performance.now();
    const plane = new Float32Array(N);
    for (let i = 0; i < N; i += 1) plane[i] = (TINT[biomeAt(i)] ?? PAPER)[ch]!;
    yield* inSlices(
      upscaleSteps(blurPlane(plane, W, H, 1.5, true), W, H, S, (p, v) => {
        tintPx[p * 3 + ch] = v;
      }),
    );
  }
  const ripples = [
    [10 * k, 90],
    [22 * k, 55],
    [36 * k, 30],
  ] as const;
  const makeBase = function* (tinted: boolean): Generator<void, HTMLCanvasElement, void> {
    const canvas = canvasOf(P, P);
    const ctx = ctxOf(canvas, true);
    const img = ctx.createImageData(P, P);
    const d = img.data;
    for (let y = 0; y < P; y += 1) {
      if (y % 128 === 127) {
        lap();
        yield;
        mark = performance.now();
      }
      for (let x = 0; x < P; x += 1) {
        const p = y * P + x;
        const q = p * 4;
        const grain = 0.93 + 0.07 * hash((y >> 1) * P + (x >> 1), 91);
        let r: number;
        let g: number;
        let b: number;
        if (landPx[p]) {
          if (tinted) {
            r = tintPx[p * 3]!;
            g = tintPx[p * 3 + 1]!;
            b = tintPx[p * 3 + 2]!;
          } else {
            [r, g, b] = PAPER;
          }
        } else {
          [r, g, b] = SEA;
          const dist = landDist[p]! / 3;
          for (const [ring, alpha] of ripples) {
            const off = Math.abs(dist - ring);
            if (off < 0.8) {
              const a = (alpha / 255) * (1 - off / 0.8);
              r += (120 - r) * a;
              g += (150 - g) * a;
              b += (160 - b) * a;
            }
          }
        }
        // The sea keeps its flat colour so it meets the stage; only the paper has grain.
        const f = landPx[p] ? grain : 1;
        d[q] = r * f;
        d[q + 1] = g * f;
        d[q + 2] = b * f;
        d[q + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    drawCompass(ctx);
    return canvas;
  };

  // The compass sits in the open sea, west of the land where there is room.
  function drawCompass(ctx: CanvasRenderingContext2D): void {
    let best = -1;
    let bx = 0;
    let by = 0;
    const step = 8;
    for (let y = step; y < P; y += step) {
      for (let x = step; x < P * 0.5; x += step) {
        const p = y * P + x;
        if (landPx[p]) continue;
        const room = Math.min(landDist[p]!, x * 3, y * 3, (P - y) * 3) - (y > P * 0.8 ? 99 : 0);
        if (room > best) {
          best = room;
          bx = x;
          by = y;
        }
      }
    }
    const r = P * 0.045;
    if (best / 3 < r * 1.6) return;
    ctx.save();
    ctx.translate(bx, by);
    ctx.strokeStyle = 'rgba(110,92,66,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    const needle = (len: number, wide: number, angle: number) => {
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(95,85,72,0.85)';
      ctx.beginPath();
      ctx.moveTo(0, -len);
      ctx.lineTo(-wide, 0);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(170,158,138,0.8)';
      ctx.beginPath();
      ctx.moveTo(0, -len);
      ctx.lineTo(wide, 0);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();
    };
    needle(r * 0.5, r * 0.1, Math.PI / 4);
    needle(r * 0.5, r * 0.1, -Math.PI / 4);
    needle(r * 0.5, r * 0.1, (Math.PI * 3) / 4);
    needle(r * 0.5, r * 0.1, (-Math.PI * 3) / 4);
    needle(r * 0.95, r * 0.14, 0);
    needle(r * 0.62, r * 0.12, Math.PI);
    needle(r * 0.62, r * 0.12, Math.PI / 2);
    needle(r * 0.62, r * 0.12, -Math.PI / 2);
    ctx.fillStyle = 'rgba(95,85,72,0.8)';
    ctx.font = `italic ${Math.round(P * 0.011)}px Alegreya, Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -r - P * 0.006);
    ctx.restore();
  }
  const paperBase = yield* makeBase(false);
  const landBase = yield* makeBase(true);
  lap();
  yield;
  mark = performance.now();

  // ---- symbols -----------------------------------------------------------------------------
  const symbols = canvasOf(P, P);
  {
    const ctx = ctxOf(symbols);
    ctx.scale(k, k);
    const elev: number[] = [];
    for (let i = 0; i < N; i += 1) if (isLand[i]) elev.push(cells.elevation[i]!);
    elev.sort((a, b) => a - b);
    const quantile = (q: number) =>
      elev[Math.min(elev.length - 1, Math.floor(elev.length * q))] ?? 0;
    const p70 = quantile(0.72);
    const p86 = quantile(0.87);
    const p95 = quantile(0.96);
    const same = (i: number, b: string) => {
      const x = i % W;
      const y = Math.floor(i / W);
      let c = 0;
      for (const dx of [-2, 0, 2]) {
        for (const dy of [-2, 0, 2]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && biomeAt(ny * W + nx) === b) c += 1;
        }
      }
      return c;
    };
    interface Item {
      y: number;
      x: number;
      kind: string;
      e: number;
    }
    const items: Item[] = [];
    const add = (y: number, kind: string, x: number, e: number) => items.push({ y, x, kind, e });
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const i = y * W + x;
        if (!isLand[i]) continue;
        const jx = (x + 0.5 + (hash(i, 1) * 1.2 - 0.6)) * 8;
        const jy = (y + 0.5 + (hash(i, 2) * 1.2 - 0.6)) * 8;
        const e = cells.elevation[i]!;
        const b = biomeAt(i);
        const r = hash(i, 4);
        if (
          e >= p86 &&
          ((x % 6 === 0 && y % 6 === 0) || ((x + 3) % 6 === 0 && (y + 3) % 6 === 0))
        ) {
          add(jy, 'mtn', jx + (hash(i, 3) * 12 - 6), e);
          continue;
        }
        if (e >= p86) {
          if (r < 0.25) add(jy, 'crag', jx, e);
          continue;
        }
        if (e >= p70 && r < 0.32) {
          add(jy, 'hill', jx, e);
          continue;
        }
        const core = same(i, b);
        if (b === 'temperate-forest') {
          if (r < 0.45 + core * 0.04) add(jy, 'tree', jx, core);
        } else if (b === 'taiga') {
          if (r < 0.5 + core * 0.04) add(jy, 'pine', jx, 0);
        } else if (b === 'jungle') {
          if (r < 0.75) add(jy, 'jtree', jx, 0);
          if (hash(i, 5) < 0.25) add(jy + 3, 'palm', jx + 5, 0);
        } else if (b === 'swamp') {
          if (r < 0.55) add(jy, 'marsh', jx, 0);
        } else if (b === 'desert') {
          if (r < 0.3) add(jy, 'dune', jx, 0);
          else if (r < 0.42) add(jy, 'stone', jx, 0);
        } else if (b === 'savanna') {
          if (r < 0.16) add(jy, 'acacia', jx, 0);
          else if (r < 0.36) add(jy, 'tuft', jx, 0);
        } else if (b === 'grassland') {
          if (r < 0.24) add(jy, 'tuft', jx, 0);
        } else if (b === 'steppe') {
          if (r < 0.3) add(jy, 'dash', jx, 0);
        } else if (b === 'tundra') {
          if (r < 0.28) add(jy, 'snow', jx, 0);
        } else if (b === 'alpine') {
          if (r < 0.3) add(jy, 'crag', jx, 0);
        }
      }
    }
    items.sort((a, b) => a.y - b.y || a.x - b.x);
    const line = (c: string, w: number, ...pts: number[]) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(pts[0]!, pts[1]!);
      for (let n = 2; n < pts.length; n += 2) ctx.lineTo(pts[n]!, pts[n + 1]!);
      ctx.stroke();
    };
    const poly = (fill: string, stroke: string | null, pts: [number, number][], w = 1) => {
      ctx.beginPath();
      pts.forEach(([px, py], n) => (n ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = w;
        ctx.stroke();
      }
    };
    const arc = (
      c: string,
      w: number,
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      a0: number,
      a1: number,
    ) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, rad(a0), rad(a1));
      ctx.stroke();
    };
    const disc = (
      fill: string,
      stroke: string | null,
      cx: number,
      cy: number,
      rx: number,
      ry: number,
    ) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const { y: jy, x: jx, kind, e } of items) {
      switch (kind) {
        case 'mtn': {
          const h = e >= p95 ? 17 : 13;
          const w = h * 0.9;
          poly('rgba(244,238,226,0.9)', null, [
            [jx, jy - h],
            [jx + w, jy],
            [jx - w, jy],
          ]);
          poly('rgba(150,132,110,0.47)', null, [
            [jx, jy - h],
            [jx - w, jy],
            [jx - w * 0.15, jy],
          ]);
          line('rgba(96,82,66,0.78)', 2, jx - w, jy, jx, jy - h, jx + w, jy);
          if (e >= p95) {
            poly('rgba(255,255,255,0.9)', null, [
              [jx, jy - h],
              [jx - w * 0.32, jy - h * 0.62],
              [jx + w * 0.32, jy - h * 0.62],
            ]);
          }
          break;
        }
        case 'crag':
          line('rgba(110,96,80,0.59)', 1.2, jx - 5, jy, jx - 1, jy - 5, jx + 2, jy - 2, jx + 5, jy);
          break;
        case 'hill':
          arc('rgba(110,94,76,0.59)', 2, jx, jy, 9, 6, 200, 340);
          arc('rgba(110,94,76,0.27)', 2, jx - 3, jy + 1, 6, 5, 200, 270);
          break;
        case 'tree': {
          const r = e >= 6 ? 6 : 5;
          line('rgba(96,90,66,0.67)', 2, jx, jy, jx, jy + 5);
          disc('rgba(150,172,120,0.82)', 'rgba(90,108,74,0.82)', jx, jy - r + 1, r, r);
          ctx.beginPath();
          ctx.ellipse(jx, jy - r + 1, r, r, 0, rad(90), rad(270));
          ctx.closePath();
          ctx.fillStyle = 'rgba(120,146,98,0.67)';
          ctx.fill();
          break;
        }
        case 'pine':
          poly('rgba(124,150,116,0.82)', 'rgba(84,106,80,0.78)', [
            [jx, jy - 12],
            [jx - 5, jy + 2],
            [jx + 5, jy + 2],
          ]);
          poly('rgba(98,126,94,0.55)', null, [
            [jx, jy - 12],
            [jx - 5, jy + 2],
            [jx, jy + 2],
          ]);
          break;
        case 'jtree':
          disc('rgba(116,154,94,0.82)', 'rgba(74,106,64,0.78)', jx, jy - 2.5, 7, 5.5);
          disc('rgba(140,176,112,0.67)', null, jx + 0.5, jy - 3.5, 3.5, 2.5);
          break;
        case 'palm':
          line('rgba(96,90,66,0.67)', 1, jx, jy, jx + 1, jy - 9);
          for (const [dx, dy] of [
            [-5, -7],
            [5, -7],
            [-4, -11],
            [5, -11],
          ] as const) {
            line('rgba(84,120,74,0.75)', 2, jx + 1, jy - 9, jx + 1 + dx, jy - 9 + dy * 0.4);
          }
          break;
        case 'marsh':
          for (const dx of [-4, 0, 4])
            line('rgba(104,128,104,0.67)', 1, jx + dx, jy, jx + dx * 1.3, jy - 6);
          line('rgba(120,150,160,0.67)', 1, jx - 7, jy + 2, jx + 7, jy + 2);
          line('rgba(120,150,160,0.47)', 1, jx - 4, jy + 5, jx + 5, jy + 5);
          break;
        case 'dune':
          arc('rgba(176,150,104,0.7)', 2, jx, jy + 2, 10, 6, 200, 330);
          arc('rgba(176,150,104,0.35)', 1, jx + 5, jy + 5, 9, 5, 200, 300);
          break;
        case 'stone':
          disc('rgba(160,136,100,0.67)', null, jx, jy, 1.5, 1.5);
          break;
        case 'acacia':
          line('rgba(110,96,70,0.7)', 1, jx, jy, jx, jy - 6);
          disc('rgba(150,160,104,0.78)', 'rgba(110,120,78,0.7)', jx, jy - 7, 7, 2);
          break;
        case 'tuft':
          line('rgba(130,144,96,0.63)', 1, jx - 3, jy, jx - 1, jy - 5);
          line('rgba(130,144,96,0.63)', 1, jx + 3, jy, jx + 1, jy - 5);
          line('rgba(130,144,96,0.55)', 1, jx, jy, jx, jy - 6);
          break;
        case 'dash':
          line('rgba(160,150,110,0.63)', 1, jx - 5, jy, jx + 5, jy);
          line('rgba(160,150,110,0.43)', 1, jx - 2, jy + 3, jx + 6, jy + 3);
          break;
        case 'snow':
          line('rgba(150,160,170,0.63)', 1, jx - 3, jy, jx + 3, jy);
          line('rgba(150,160,170,0.63)', 1, jx, jy - 3, jx, jy + 3);
          break;
      }
    }
  }

  lap();
  yield;
  mark = performance.now();

  // ---- rivers and roads (one path each, so overlaps do not darken) -----------------------------
  const strokeLinks = (
    ctx: CanvasRenderingContext2D,
    include: (i: number) => boolean,
    width: (i: number) => number,
    widths: readonly number[],
  ) => {
    for (let cls = 0; cls < widths.length; cls += 1) {
      ctx.beginPath();
      for (let i = 0; i < N; i += 1) {
        if (!include(i) || width(i) !== cls) continue;
        const x = i % W;
        const y = Math.floor(i / W);
        for (const [dx, dy] of [
          [1, 0],
          [0, 1],
          [1, 1],
          [-1, 1],
        ] as const) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (!include(j)) continue;
          if (dx && dy && (include(y * W + nx) || include(ny * W + x))) continue;
          ctx.moveTo((x + 0.5) * S, (y + 0.5) * S);
          ctx.lineTo((nx + 0.5) * S, (ny + 0.5) * S);
        }
      }
      ctx.lineWidth = widths[cls]! * k;
      ctx.stroke();
    }
  };
  const rivers = canvasOf(P, P);
  {
    const ctx = ctxOf(rivers);
    const flows: number[] = [];
    for (let i = 0; i < N; i += 1) if (water[i] === 1) flows.push(cells.flow[i]!);
    flows.sort((a, b) => a - b);
    const thr = flows[Math.floor(flows.length * 0.35)] ?? 0;
    const big = flows[Math.floor(flows.length * 0.8)] ?? 0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(112,152,178,0.8)';
    if (FILTER_OK) ctx.filter = `blur(${(0.8 * k).toFixed(2)}px)`;
    strokeLinks(
      ctx,
      (i) => water[i] === 1 && cells.flow[i]! >= thr,
      (i) => (cells.flow[i]! < big ? 0 : 1),
      [3, 5],
    );
  }
  lap();
  yield;
  mark = performance.now();
  const roads = canvasOf(P, P);
  {
    const ctx = ctxOf(roads);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(140,104,74,0.38)';
    strokeLinks(
      ctx,
      (i) => cells.roads[i]! > 0 && isLand[i] === 1,
      () => 0,
      [2],
    );
  }

  lap();
  yield;
  mark = performance.now();

  // ---- coast ----------------------------------------------------------------------------------
  const coast = canvasOf(P, P);
  if (options.coast !== false) {
    const ctx = ctxOf(coast);
    const img = ctx.createImageData(P, P);
    for (let p = 0; p < P * P; p += 1) {
      if (landPx[p] && seaDist[p]! <= 3) {
        img.data[p * 4] = INK[0];
        img.data[p * 4 + 1] = INK[1];
        img.data[p * 4 + 2] = INK[2];
        img.data[p * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  lap();
  yield;
  mark = performance.now();
  // The land's bounding box in cells, with a margin.
  let bx0 = W;
  let by0 = H;
  let bx1 = 0;
  let by1 = 0;
  for (let i = 0; i < N; i += 1) {
    if (!isLand[i]) continue;
    const x = i % W;
    const y = Math.floor(i / W);
    bx0 = Math.min(bx0, x);
    bx1 = Math.max(bx1, x);
    by0 = Math.min(by0, y);
    by1 = Math.max(by1, y);
  }
  const margin = Math.round(W * 0.035);
  const box = {
    x0: Math.max(0, bx0 - margin),
    y0: Math.max(0, by0 - margin),
    x1: Math.min(W, bx1 + 1 + margin),
    y1: Math.min(H, by1 + 1 + margin),
  };

  // Cells whose centre is drawn land, a couple of pixels in from the shore.
  const inland = new Uint8Array(N);
  for (let i = 0; i < N; i += 1) {
    const p = (Math.floor(i / W) * S + (S >> 1)) * P + (i % W) * S + (S >> 1);
    if (isLand[i] && landPx[p] && coastPx(p) >= 0.5 * S) inland[i] = 1;
  }

  lap();
  yield;
  mark = performance.now();
  // Lakes: each lake belongs to the realm round most of its shore, so no ring is drawn round it.
  const lakeOf = new Int32Array(N).fill(-1);
  const lakes: number[][] = [];
  for (let i = 0; i < N; i += 1) {
    if (water[i] !== 2 || lakeOf[i]! >= 0) continue;
    const id = lakes.length;
    const members: number[] = [];
    const stack = [i];
    lakeOf[i] = id;
    while (stack.length) {
      const c = stack.pop()!;
      members.push(c);
      const x = c % W;
      const y = Math.floor(c / W);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (water[j] === 2 && lakeOf[j]! < 0) {
            lakeOf[j] = id;
            stack.push(j);
          }
        }
      }
    }
    lakes.push(members);
  }

  lap();
  yield;
  mark = performance.now();

  // ---- the political layer ---------------------------------------------------------------------
  const display = canvasOf(P, P);
  const dctx = ctxOf(display);
  const shapes = new Map<string, Shape>();
  const tinted = new Map<string, HTMLCanvasElement>();
  let wildCache: { key: string; canvas: HTMLCanvasElement } | null = null;
  const bandWidth = 0.75 * S;
  const thinWidth = 0.45 * S;
  // Pixel offsets (dx, dy, cost in thirds of a pixel) a band can reach in from an edge pixel.
  const reachOffsets: number[] = [];
  {
    const limit = bandWidth + 0.5;
    const R = Math.ceil(limit);
    for (let dy = -R; dy <= R; dy += 1) {
      for (let dx = -R; dx <= R; dx += 1) {
        const cost = Math.round(3 * Math.hypot(dx, dy)) + 3;
        if (cost < limit * 3) reachOffsets.push(dx, dy, cost);
      }
    }
  }
  const nearCoast = 0.4 * S;

  /** One realm's shape, built in slices; its edge is drawn with coverage, so it stays smooth. */
  function* shapeSteps(
    civ: number,
    own: Uint16Array,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): Generator<void, Shape, void> {
    const pad = 3;
    const cx0 = Math.max(0, x0 - pad);
    const cy0 = Math.max(0, y0 - pad);
    const cx1 = Math.min(W, x1 + 1 + pad);
    const cy1 = Math.min(H, y1 + 1 + pad);
    const cw = cx1 - cx0;
    const ch = cy1 - cy0;
    const alpha = new Uint8Array(cw * ch);
    for (let y = 0; y < ch; y += 1) {
      for (let x = 0; x < cw; x += 1) {
        if (own[(cy0 + y) * W + cx0 + x] === civ) alpha[y * cw + x] = 255;
      }
    }
    const field = yield* smoothFieldSteps(alpha, cw, ch, S, 1.25);
    const cut = 127 / 255;
    const pw = cw * S;
    const ph = ch * S;
    const rx = cx0 * S;
    const ry = cy0 * S;
    const rows = sliceRows(pw);
    const mask = new Uint8Array(pw * ph);
    const fill = new Uint8Array(pw * ph);
    /** Coverage (1-255) of the pixels either side of the edge; 0 elsewhere. */
    const cover = new Uint8Array(pw * ph);
    /** Pixels just outside the edge that it partly covers. */
    const fringe: number[] = [];
    const inside = (q: number) => field[q]! > cut;
    for (let y = 0; y < ph; y += 1) {
      if (y % rows === rows - 1) yield;
      for (let x = 0; x < pw; x += 1) {
        const q = y * pw + x;
        const held = inside(q);
        const edge =
          (x > 0 && inside(q - 1) !== held) ||
          (x < pw - 1 && inside(q + 1) !== held) ||
          (y > 0 && inside(q - pw) !== held) ||
          (y < ph - 1 && inside(q + pw) !== held);
        if (!held && !edge) continue;
        const c = edge ? coverage(field, q, pw, ph, cut) : 1;
        if (c <= 0) continue;
        const p = (ry + y) * P + rx + x;
        const wet = !landPx[p] && lakePx[p];
        if (!landPx[p] && !wet) continue;
        if (edge) cover[q] = Math.max(1, Math.round(c * 255));
        if (landPx[p]) fill[q] = Math.round(c * 255);
        if (held) mask[q] = 1;
        else fringe.push(q);
      }
    }
    yield;
    // Distance (thirds of a pixel) from the mask's edge, only where a band can reach: seed from the
    // edge pixels and spread a few pixels in, which is far cheaper than a whole-box distance pass.
    const near = new Uint8Array(pw * ph);
    const touched: number[] = [];
    for (let y = 1; y < ph - 1; y += 1) {
      if (y % rows === rows - 1) yield;
      for (let x = 1; x < pw - 1; x += 1) {
        const q = y * pw + x;
        if (!mask[q] || (mask[q - 1] && mask[q + 1] && mask[q - pw] && mask[q + pw])) continue;
        for (let o = 0; o < reachOffsets.length; o += 3) {
          const nx = x + reachOffsets[o]!;
          const ny = y + reachOffsets[o + 1]!;
          if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
          const r = ny * pw + nx;
          if (!mask[r]) continue;
          const cost = reachOffsets[o + 2]!;
          const old = near[r]!;
          if (old === 0) {
            touched.push(r);
            near[r] = cost;
          } else if (cost < old) near[r] = cost;
        }
      }
    }
    yield;
    const band = new Uint8Array(pw * ph);
    const thin = new Uint8Array(pw * ph);
    const coastFade = (q: number) => {
      const y = Math.floor(q / pw);
      const c = coastPx((ry + y) * P + rx + (q - y * pw));
      return Math.max(0, Math.min(1, c - nearCoast + 1));
    };
    for (const q of touched) {
      const d = near[q]! / 3;
      const k2 = coastFade(q) * (cover[q] ? cover[q]! / 255 : 1);
      const wide = Math.max(0, Math.min(1, bandWidth + 0.5 - d)) * k2;
      const slim = Math.max(0, Math.min(1, thinWidth + 0.5 - d)) * k2;
      if (wide > 0) band[q] = Math.round(wide * 255);
      if (slim > 0) thin[q] = Math.round(slim * 255);
    }
    // The outer half of the edge: the part of the line that falls on the pixels just outside.
    for (const q of fringe) {
      const a = Math.round(coastFade(q) * cover[q]!);
      if (a <= 0) continue;
      band[q] = a;
      thin[q] = a;
      touched.push(q);
    }
    return { x0: rx, y0: ry, w: pw, h: ph, fill, band, thin, edge: Uint32Array.from(touched) };
  }

  const tintOf = (
    key: string,
    plane: Uint8Array,
    shape: Shape,
    colour: Rgb3,
    only?: Uint32Array,
  ) => {
    const id = `${key}|${colour.join(',')}`;
    let canvas = tinted.get(id);
    if (canvas) return canvas;
    canvas = canvasOf(shape.w, shape.h);
    const ctx = ctxOf(canvas);
    const img = ctx.createImageData(shape.w, shape.h);
    const paint = (q: number) => {
      const a = plane[q]!;
      if (!a) return;
      img.data[q * 4] = colour[0];
      img.data[q * 4 + 1] = colour[1];
      img.data[q * 4 + 2] = colour[2];
      img.data[q * 4 + 3] = a;
    };
    if (only) for (let i = 0; i < only.length; i += 1) paint(only[i]!);
    else for (let q = 0; q < plane.length; q += 1) paint(q);
    ctx.putImageData(img, 0, 0);
    if (tinted.size > 160) tinted.clear();
    tinted.set(id, canvas);
    return canvas;
  };

  /** The wild land's hatching, built in slices; its dashed edge is drawn with coverage. */
  function* wildSteps(key: string, own: Uint16Array): Generator<void, HTMLCanvasElement, void> {
    if (wildCache?.key === key) return wildCache.canvas;
    const alpha = new Uint8Array(N);
    for (let i = 0; i < N; i += 1) if (isLand[i] && !own[i]) alpha[i] = 255;
    const field = yield* smoothFieldSteps(alpha, W, H, S, 1.25);
    const cut = 127 / 255;
    const canvas = canvasOf(P, P);
    const ctx = ctxOf(canvas);
    const img = ctx.createImageData(P, P);
    const hatch = Math.round(14 * k);
    const rows = sliceRows(P);
    const put = (q: number, rgb: Rgb3, a: number) => {
      if (a <= img.data[q + 3]!) return;
      img.data[q] = rgb[0];
      img.data[q + 1] = rgb[1];
      img.data[q + 2] = rgb[2];
      img.data[q + 3] = a;
    };
    for (let y = 1; y < P - 1; y += 1) {
      if (y % rows === rows - 1) yield;
      for (let x = 1; x < P - 1; x += 1) {
        const p = y * P + x;
        const v = field[p]!;
        if (!landPx[p] || v < cut - 0.25) continue;
        const held = v > cut;
        const edge =
          field[p - 1]! > cut !== held ||
          field[p + 1]! > cut !== held ||
          field[p - P]! > cut !== held ||
          field[p + P]! > cut !== held;
        if (!held && !edge) continue;
        const sd = edge ? signedAt(field, p, P, P, cut) : 1;
        const c = Math.max(0, Math.min(1, 0.5 + sd));
        const q = p * 4;
        if (edge) {
          // A dashed line about a pixel wide along the edge, a little inside it.
          const line = Math.max(0, Math.min(1, 1.1 - Math.abs(sd - 0.4)));
          if (line > 0 && (x + y) % 6 < 3 && coastPx(p) > nearCoast) {
            put(q, [110, 86, 62], Math.round(160 * line));
          }
          if (!held) continue;
        }
        // Thin diagonal hatching, with its neighbours lightly inked so it reads as a line.
        const off = (((x - y) % hatch) + hatch) % hatch;
        const across = Math.min(off, hatch - off);
        if (across <= 1) put(q, [120, 96, 70], Math.round((across === 0 ? 92 : 14) * c));
      }
    }
    ctx.putImageData(img, 0, 0);
    wildCache = { key, canvas };
    return canvas;
  }

  lap();
  const terrainMs = busy;
  const maxSliceMs = longest;

  /** Finished political layers, oldest first, by mode and border year. */
  const layers = new Map<string, { canvas: HTMLCanvasElement; centres: DrawResult['centres'] }>();

  function draw(input: DrawInput): DrawResult {
    return runSteps(drawSteps(input));
  }

  /**
   * The same drawing in slices: the realms' shapes, tints and the wild land are made first, a
   * slice at a time, then the map is put together at once, so a half-drawn map is never shown.
   */
  function* drawSteps(input: DrawInput): Generator<void, DrawResult, void> {
    let work = 0;
    let mark = performance.now();
    /** Ends a slice: adds its time to the work done. */
    function* pause(): Generator<void, void, void> {
      work += performance.now() - mark;
      yield;
      mark = performance.now();
    }
    const done = () => work + performance.now() - mark;
    /** Runs a helper's slices as slices of this drawing. */
    function* paced<T>(steps: Generator<void, T, void>): Generator<void, T, void> {
      for (;;) {
        const r = steps.next();
        if (r.done) return r.value;
        yield* pause();
      }
    }
    const { mode, owner } = input;
    const layerKey = `${mode}|${input.key}|${input.variant ?? ''}`;
    const kept = layers.get(layerKey);
    if (kept) {
      layers.delete(layerKey);
      layers.set(layerKey, kept);
      dctx.globalAlpha = 1;
      dctx.drawImage(kept.canvas, 0, 0);
      return { ms: done(), centres: kept.centres };
    }
    const fills = FILL_MODES.includes(mode);
    // Put together on a spare canvas (kept for the next visit), then shown in one copy.
    let page: HTMLCanvasElement;
    if (layers.size >= LAYER_CACHE) {
      const oldest = layers.keys().next().value!;
      page = layers.get(oldest)!.canvas;
      layers.delete(oldest);
    } else page = canvasOf(P, P);
    const cctx = ctxOf(page);
    const centres = new Map<number, { x: number; y: number; n: number }>();
    if (mode === 'plain') {
      cctx.globalAlpha = 1;
      cctx.drawImage(paperBase, 0, 0);
    } else {
      // Ownership with each lake given to the realm round most of its shore.
      const own = Uint16Array.from(owner, (v, i) => (isLand[i] || water[i] === 2 ? v : 0));
      for (const members of lakes) {
        for (const m of members) own[m] = 0;
        const tally = new Map<number, number>();
        for (const m of members) {
          const x = m % W;
          const y = Math.floor(m / W);
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
              const j = ny * W + nx;
              if (water[j] === 2) continue;
              const o = own[j]!;
              if (o) tally.set(o, (tally.get(o) ?? 0) + 1);
            }
          }
        }
        let top = 0;
        let topN = 0;
        for (const [civ, n] of tally) {
          if (n > topN || (n === topN && civ < top)) {
            top = civ;
            topN = n;
          }
        }
        if (top) for (const m of members) own[m] = top;
      }
      // One pass: each realm's box, hash of its cells, and centre of its land.
      const info = new Map<
        number,
        {
          x0: number;
          y0: number;
          x1: number;
          y1: number;
          h: number;
          sx: number;
          sy: number;
          n: number;
        }
      >();
      let wildHash = 0;
      let wildCount = 0;
      for (let i = 0; i < N; i += 1) {
        const c = own[i]!;
        if (!c) {
          if (isLand[i]) {
            wildHash = (Math.imul(wildHash, 31) + i + 1) | 0;
            wildCount += 1;
          }
          continue;
        }
        const x = i % W;
        const y = (i - x) / W;
        let a = info.get(c);
        if (!a) info.set(c, (a = { x0: x, y0: y, x1: x, y1: y, h: 0, sx: 0, sy: 0, n: 0 }));
        if (x < a.x0) a.x0 = x;
        if (x > a.x1) a.x1 = x;
        if (y < a.y0) a.y0 = y;
        if (y > a.y1) a.y1 = y;
        a.h = (Math.imul(a.h, 31) + i + 1) | 0;
        if (isLand[i]) {
          a.sx += x;
          a.sy += y;
          a.n += 1;
        }
      }
      const live: [string, number, Shape][] = [];
      for (const [civ, a] of [...info].sort((p, q) => p[0] - q[0])) {
        if (a.n === 0) continue;
        const key = `${civ}:${a.h}:${a.x0},${a.y0},${a.x1},${a.y1}`;
        let shape = shapes.get(key);
        if (!shape) {
          yield* pause();
          shape = yield* paced(shapeSteps(civ, own, a.x0, a.y0, a.x1, a.y1));
          if (shapes.size > 80) shapes.clear();
          shapes.set(key, shape);
        } else {
          shapes.delete(key);
          shapes.set(key, shape);
        }
        live.push([key, civ, shape]);
        centres.set(civ, { x: a.sx / a.n + 0.5, y: a.sy / a.n + 0.5, n: a.n });
      }
      const slim = THIN_MODES.includes(mode);
      // Tint ahead (the pieces are kept), a few realms a slice.
      for (const [key, civ, shape] of live) {
        const colour = fills ? input.fillOf(civ) : null;
        if (colour) tintOf(`${key}|f`, shape.fill, shape, colour);
        tintOf(
          `${key}|${slim ? 't' : 'b'}`,
          slim ? shape.thin : shape.band,
          shape,
          input.borderOf(civ),
          shape.edge,
        );
        if (performance.now() - mark > SLICE_MS) yield* pause();
      }
      const wild = wildCount > 0 ? yield* paced(wildSteps(`${wildHash}:${wildCount}`, own)) : null;
      yield* pause();
      cctx.globalAlpha = 1;
      cctx.drawImage(landBase, 0, 0);
      if (fills) {
        cctx.globalAlpha = FILL_STRENGTH;
        for (const [key, civ, shape] of live) {
          const colour = input.fillOf(civ);
          if (colour)
            cctx.drawImage(tintOf(`${key}|f`, shape.fill, shape, colour), shape.x0, shape.y0);
        }
      }
      cctx.globalAlpha = fills ? 0.8 : 1;
      cctx.drawImage(symbols, 0, 0);
      cctx.globalAlpha = 1;
      cctx.drawImage(rivers, 0, 0);
      if (wild) cctx.drawImage(wild, 0, 0);
      cctx.globalAlpha = MODE_STRENGTH[mode];
      for (const [key, civ, shape] of live) {
        cctx.drawImage(
          tintOf(
            `${key}|${slim ? 't' : 'b'}`,
            slim ? shape.thin : shape.band,
            shape,
            input.borderOf(civ),
            shape.edge,
          ),
          shape.x0,
          shape.y0,
        );
      }
      cctx.globalAlpha = 1;
      cctx.drawImage(roads, 0, 0);
      // Towns, small first so the big ones sit on top.
      const towns = [...input.towns].sort((a, b) => a.pop - b.pop);
      cctx.lineWidth = 2 * k;
      for (const town of towns) {
        const cx = ((town.cell % W) + 0.5) * S;
        const cy = (Math.floor(town.cell / W) + 0.5) * S;
        const r = (town.pop >= 800 ? 7 : town.pop >= 300 ? 5 : 3.2) * k;
        cctx.beginPath();
        cctx.arc(cx, cy, r, 0, Math.PI * 2);
        cctx.fillStyle = 'rgb(250,246,236)';
        cctx.fill();
        cctx.strokeStyle = 'rgb(70,62,52)';
        cctx.stroke();
        if (town.capital) {
          cctx.beginPath();
          cctx.arc(cx, cy, r + 4 * k, 0, Math.PI * 2);
          cctx.strokeStyle = 'rgba(70,62,52,0.9)';
          cctx.stroke();
        }
      }
      if (mode === 'faiths') {
        for (const cell of input.holy) {
          const cx = ((cell % W) + 0.5) * S;
          const cy = (Math.floor(cell / W) + 0.5) * S;
          const r = 8 * k;
          cctx.beginPath();
          cctx.moveTo(cx, cy - r * 1.5);
          cctx.lineTo(cx + r * 0.5, cy - r * 0.5);
          cctx.lineTo(cx + r * 1.5, cy);
          cctx.lineTo(cx + r * 0.5, cy + r * 0.5);
          cctx.lineTo(cx, cy + r * 1.5);
          cctx.lineTo(cx - r * 0.5, cy + r * 0.5);
          cctx.lineTo(cx - r * 1.5, cy);
          cctx.lineTo(cx - r * 0.5, cy - r * 0.5);
          cctx.closePath();
          cctx.fillStyle = 'rgb(236,200,96)';
          cctx.fill();
          cctx.strokeStyle = 'rgb(96,70,30)';
          cctx.lineWidth = 1.4 * k;
          cctx.stroke();
        }
      }
    }
    if (options.coast !== false) cctx.drawImage(coast, 0, 0);
    // The caller's key stands for the towns and colours too.
    layers.set(layerKey, { canvas: page, centres });
    yield* pause();
    dctx.globalAlpha = 1;
    dctx.drawImage(page, 0, 0);
    return { ms: done(), centres };
  }

  return {
    canvas: display,
    size: P,
    scale: S,
    width: W,
    height: H,
    box,
    inland,
    terrainMs,
    maxSliceMs,
    draw,
    drawSteps,
  };
}
