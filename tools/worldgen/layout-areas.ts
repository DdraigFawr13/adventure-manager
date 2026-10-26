// The March's rivers (traced from the generator's downstream links), the spots where each area's name
// sits (picked from the terrain that fits it) and the compass rose's place.
import { boxCounts, gap, stepsFrom, xOf, yOf, type Grid } from './layout-grid.ts';
import type { Crop } from './world.ts';

export interface RiverLine {
  /** Cells from the source down to the mouth (the last may be the sea or lake cell it runs into). */
  cells: number[];
  /** Accumulated runoff at each cell, for the line's width. */
  flows: number[];
}

export interface AreaSpot {
  id: 'spine' | 'moor' | 'wood' | 'fens' | 'sea';
  cell: number;
  /** Direction of the name's baseline, in degrees (0 is level, negative reads uphill). */
  angle: number;
}

export interface Compass {
  /** Centre and radius in cells. */
  x: number;
  y: number;
  r: number;
}

/** Rivers carrying less runoff than this are left off the map (the generator's own limit is 150). */
const MIN_FLOW = 700;
const AREA_CLEAR = 9;

export function traceRivers(crop: Crop): RiverLine[] {
  const { water, flow, down } = crop;
  const n = crop.width * crop.height;
  const shown = (i: number) => water[i] === 1 && flow[i]! >= MIN_FLOW;
  const hasUpstream = new Uint8Array(n);
  for (let i = 0; i < n; i += 1)
    if (shown(i) && down[i]! >= 0 && shown(down[i]!)) hasUpstream[down[i]!] = 1;
  const sources: { cell: number; cells: number[] }[] = [];
  for (let i = 0; i < n; i += 1) {
    if (!shown(i) || hasUpstream[i]) continue;
    const cells = [i];
    for (let c = i; down[c]! >= 0;) {
      c = down[c]!;
      cells.push(c);
      if (!shown(c)) break;
    }
    sources.push({ cell: i, cells });
  }
  // Long rivers first, so a tributary stops where it meets one already drawn.
  sources.sort((a, b) => b.cells.length - a.cells.length || a.cell - b.cell);
  const taken = new Set<number>();
  const out: RiverLine[] = [];
  for (const s of sources) {
    const cells: number[] = [];
    for (const c of s.cells) {
      cells.push(c);
      if (taken.has(c)) break;
      if (shown(c)) taken.add(c);
    }
    if (cells.length >= 6) out.push({ cells, flows: cells.map((c) => flow[c]!) });
  }
  return out;
}

/** The densest block of accepted cells (so a name sits in the heart of its ground), or -1. */
function heart(g: Grid, accept: (i: number) => boolean, reach: number, pull = 0): number {
  const counts = boxCounts(g, accept, reach);
  let best = -1;
  let bestScore = 0;
  for (let i = 0; i < counts.length; i += 1) {
    // `pull` leans toward the middle of the sheet, so a long range is named where it can be read.
    const score = counts[i]! - pull * Math.abs(xOf(g, i) - g.width / 2);
    if (accept(i) && score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/** The long axis of the accepted cells near `cell`, in degrees clamped to something a name can follow. */
function axis(g: Grid, accept: (i: number) => boolean, cell: number, reach: number): number {
  let n = 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < g.width * g.height; i += 1) {
    if (!accept(i) || gap(g, i, cell) > reach) continue;
    const x = xOf(g, i);
    const y = yOf(g, i);
    n += 1;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  if (n < 30) return 0;
  const vx = sxx / n - (sx / n) ** 2;
  const vy = syy / n - (sy / n) ** 2;
  const cov = sxy / n - (sx / n) * (sy / n);
  let deg = (0.5 * Math.atan2(2 * cov, vx - vy) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg <= -90) deg += 180;
  return Math.max(-72, Math.min(40, deg));
}

export function chartAreas(
  crop: Crop,
  biomeIds: readonly string[],
  sites: number[],
): { areas: AreaSpot[]; compass: Compass } {
  const g = crop;
  const { water, elevation, biome } = crop;
  const name = (i: number) => biomeIds[biome[i]!] ?? '';
  const isLand = (i: number) => water[i] !== 3 && water[i] !== 2;
  const clear = (i: number) => sites.every((s) => gap(g, i, s) > AREA_CLEAR);
  const wanted: {
    id: AreaSpot['id'];
    accept: (i: number) => boolean;
    reach: number;
    follow: boolean;
    pull?: number;
  }[] = [
    {
      id: 'spine',
      accept: (i) => isLand(i) && elevation[i]! >= 1100 && clear(i),
      reach: 9,
      follow: true,
      pull: 0.5,
    },
    {
      id: 'fens',
      accept: (i) => name(i) === 'swamp' && water[i] === 0 && clear(i),
      reach: 8,
      follow: false,
    },
    {
      id: 'wood',
      accept: (i) => (name(i) === 'temperate-forest' || name(i) === 'taiga') && clear(i),
      reach: 9,
      follow: false,
    },
    {
      id: 'moor',
      accept: (i) =>
        water[i] === 0 &&
        elevation[i]! >= 220 &&
        elevation[i]! < 900 &&
        ['grassland', 'steppe', 'tundra'].includes(name(i)) &&
        clear(i),
      reach: 10,
      follow: false,
    },
    { id: 'sea', accept: (i) => water[i] === 3, reach: 11, follow: true },
  ];
  const areas: AreaSpot[] = [];
  for (const w of wanted) {
    const cell = heart(g, w.accept, w.reach, w.pull);
    if (cell < 0) continue;
    areas.push({ id: w.id, cell, angle: w.follow ? axis(g, w.accept, cell, 32) : 0 });
  }
  return { areas, compass: placeCompass(crop) };
}

/** The compass goes on the sea where there is room (lower half), else in the north-east corner. */
function placeCompass(crop: Crop): Compass {
  const g = crop;
  const fromLand = stepsFrom(g, (i) => crop.water[i] !== 3);
  let best = -1;
  let bestRoom = 0;
  for (let i = 0; i < fromLand.length; i += 1) {
    if (yOf(g, i) < g.height * 0.55 || xOf(g, i) > g.width - 20 || fromLand[i]! < 1) continue;
    const room = Math.min(fromLand[i]!, xOf(g, i), g.height - 20 - yOf(g, i));
    if (room > bestRoom) {
      bestRoom = room;
      best = i;
    }
  }
  if (best >= 0 && bestRoom >= 9) {
    return { x: xOf(g, best) + 0.5, y: yOf(g, best) + 0.5, r: Math.min(bestRoom - 1, 14) };
  }
  return { x: g.width - 26, y: 28, r: 11 };
}
