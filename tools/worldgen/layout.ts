// The layout picks for the March: the guild hall in the middle, seven other settlements each on
// ground that fits it, roads between them (cheapest paths over the terrain), one party route, and
// the rivers, area-name spots, landmark and compass (layout-areas.ts).
import type { Crop } from './world.ts';
import {
  chartAreas,
  type AreaSpot,
  type Compass,
  type RiverLine,
  traceRivers,
} from './layout-areas.ts';
import { boxCounts, cheapest, gap, pathTo, stepsFrom, xOf, yOf } from './layout-grid.ts';
import { BIOMES } from './biome-content.ts';
import { pickVillages } from './layout-villages.ts';

export interface Road {
  /** Indices into the settlements list (0 is the guild hall). */
  a: number;
  b: number;
  cells: number[];
}

export interface Layout {
  guildCell: number;
  /** The seven other settlements, in the order of the content names place.0 to place.6. */
  placeCells: number[];
  roads: Road[];
  /** Hamlets between the settlements, in the order of the content names village.0 onwards. */
  villageCells: number[];
  /** Cells from the guild hall to the farthest settlement along the roads. */
  route: number[];
  rivers: RiverLine[];
  areas: AreaSpot[];
  landmarkCell: number;
  closedRoadCell: number;
  compass: Compass;
}

/** Where each settlement wants to sit, and how far from the hall (cells) it should be. */
type Role =
  'ashford' | 'kingsholm' | 'varrowmere' | 'thornbury' | 'saltmouth' | 'sedgecombe' | 'delvenhold';
export const PLACE_ROLES: readonly Role[] = [
  'ashford',
  'kingsholm',
  'varrowmere',
  'thornbury',
  'saltmouth',
  'sedgecombe',
  'delvenhold',
];
/** Picked in this order, the fussiest first. */
const PICK_ORDER: readonly Role[] = [
  'saltmouth',
  'delvenhold',
  'sedgecombe',
  'varrowmere',
  'kingsholm',
  'thornbury',
  'ashford',
];
const TARGET: Record<Role, number> = {
  ashford: 40,
  kingsholm: 85,
  varrowmere: 125,
  thornbury: 90,
  saltmouth: 105,
  sedgecombe: 62,
  delvenhold: 115,
};
/** For the 300-cell sheet: settlements keep this far from each other and from the edge (x, y), in cells. A smaller test sheet scales them down. */
const SPACING = 34;
const MARGIN_X = 20;
const MARGIN_Y = 16;
const EXTRA_ROADS = 2;
/** A loop road must be a short link (walking cost), not a long detour through the hills. */
const LOOP_MAX_COST = 330;

export function layoutMarch(crop: Crop, biomeIds: readonly string[]): Layout {
  const g = crop;
  const n = g.width * g.height;
  const { water, elevation, biome } = crop;
  const k = g.width / 300;
  const spacing = SPACING * k;
  const marginX = MARGIN_X * k;
  const marginY = MARGIN_Y * k;
  const id = (i: number) => biomeIds[biome[i]!] ?? '';
  const isLand = (i: number) => water[i] !== 3 && water[i] !== 2;
  const seaDist = stepsFrom(g, (i) => water[i] === 3);
  const riverDist = stepsFrom(g, (i) => water[i] === 1);
  const lakeDist = stepsFrom(g, (i) => water[i] === 2);
  const swampNear = boxCounts(g, (i) => id(i) === 'swamp', 5);
  const highNear = boxCounts(g, (i) => isLand(i) && elevation[i]! >= 1200, 4);
  const woodNear = boxCounts(g, (i) => biome[i] === woodId(biomeIds, 'temperate-forest'), 5);
  const flat = (i: number) => {
    const x = xOf(g, i);
    const y = yOf(g, i);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const m = (y + dy) * g.width + x + dx;
        if (m < 0 || m >= n || Math.abs(elevation[m]! - elevation[i]!) > 90) return false;
      }
    }
    return true;
  };
  const inside = (i: number) =>
    xOf(g, i) >= marginX &&
    xOf(g, i) < g.width - marginX &&
    yOf(g, i) >= marginY &&
    yOf(g, i) < g.height - marginY;
  // The sheet's title cartouche sits in the lower-left corner: no settlement there.
  const underCartouche = (i: number) => xOf(g, i) < 62 * k && yOf(g, i) >= g.height - 28 * k;
  const buildable = (i: number) =>
    isLand(i) &&
    !underCartouche(i) &&
    water[i] === 0 &&
    inside(i) &&
    flat(i) &&
    id(i) !== 'swamp' &&
    id(i) !== 'alpine';

  // The hall: flat dry ground near a river, as close to the middle of the sheet as it gets.
  const middle = Math.floor(g.height / 2) * g.width + Math.floor(g.width / 2);
  let guildCell = -1;
  let best = Infinity;
  for (let i = 0; i < n; i += 1) {
    if (!buildable(i) || elevation[i]! > 400 || seaDist[i]! < 30 * k) continue;
    const score = gap(g, i, middle) + (riverDist[i]! <= 4 ? 0 : 25);
    if (score < best) {
      best = score;
      guildCell = i;
    }
  }
  if (guildCell < 0) throw new Error('No flat dry ground for the guild hall.');

  /** How badly cell `i` suits `role` (lower is better), or Infinity when it cannot hold it. */
  const misfit = (role: Role, i: number): number => {
    const e = elevation[i]!;
    switch (role) {
      case 'saltmouth':
        return seaDist[i]! <= 2 && e < 150 ? (riverDist[i]! <= 5 ? 0 : 12) : Infinity;
      case 'delvenhold':
        return e >= 650 && e < 1500 && highNear[i]! >= 8 ? 0 : Infinity;
      case 'sedgecombe':
        return swampNear[i]! >= 14 && e < 220 && seaDist[i]! > 6 ? 0 : Infinity;
      case 'varrowmere':
        return e >= 250 && e < 800 && (id(i) === 'grassland' || id(i) === 'steppe')
          ? lakeDist[i]! <= 8
            ? 0
            : 6
          : Infinity;
      case 'kingsholm':
        return e < 350 && id(i) !== 'swamp' && seaDist[i]! > 12
          ? (riverDist[i]! <= 4 ? 0 : 8) + (woodNear[i]! >= 6 ? 0 : 4)
          : Infinity;
      case 'thornbury':
        return e >= 300 && e < 900 && highNear[i]! >= 1 ? 0 : Infinity;
      case 'ashford':
        return riverDist[i]! <= 2 && e < 300 ? 0 : 5;
    }
  };

  const picked = new Map<Role, number>();
  const placed = [guildCell];
  for (const role of PICK_ORDER) {
    let choice = -1;
    let bestCost = Infinity;
    for (const strict of [true, false]) {
      for (let i = 0; i < n; i += 1) {
        if (!buildable(i) && !(role === 'delvenhold' && isLand(i) && inside(i) && water[i] === 0))
          continue;
        if (placed.some((p) => gap(g, i, p) < spacing)) continue;
        const fit = misfit(role, i);
        if (strict && fit === Infinity) continue;
        const cost =
          (fit === Infinity ? 40 : fit) + Math.abs(gap(g, i, guildCell) - TARGET[role] * k) * 0.6;
        if (cost < bestCost) {
          bestCost = cost;
          choice = i;
        }
      }
      if (choice >= 0) break;
    }
    if (choice < 0) throw new Error(`No room for ${role}.`);
    picked.set(role, choice);
    placed.push(choice);
  }
  const placeCells = PLACE_ROLES.map((r) => picked.get(r)!);
  const sites = [guildCell, ...placeCells];

  const roads = layRoads(crop, sites);
  const route = walkRoute(roads, sites);
  const areas = chartAreas(crop, biomeIds, sites);
  const closed = pickClosedRoad(roads, route, crop, sites);
  const rivers = traceRivers(crop);
  const villageCells = pickVillages(crop, biomeIds, [...sites, closed.landmarkCell], roads, k);
  return { guildCell, placeCells, villageCells, roads, route, rivers, ...areas, ...closed };
}

const woodId = (ids: readonly string[], name: string) => ids.indexOf(name);

/** Cost of one step on foot: biome, slope, and a ford where a river is crossed. */
function walkCost(crop: Crop, onRoad: Uint8Array | null) {
  const { water, elevation, biome } = crop;
  return (to: number, via: number, run: number): number => {
    if (water[to] === 3 || water[to] === 2) return Infinity;
    const travel = BIOMES[biome[to]!]?.travel ?? 4;
    const slope = Math.abs(elevation[to]! - elevation[via]!) / 12;
    const ford = water[to] === 1 && water[via] !== 1 ? 8 : 0;
    const base = run * (1 + travel * 0.5 + slope) + ford;
    return onRoad && onRoad[to] ? base * 0.3 : base;
  };
}

/** A road tree (the cheapest links that join every settlement) plus a couple of loops. */
function layRoads(crop: Crop, sites: number[]): Road[] {
  const plain = walkCost(crop, null);
  const searches = sites.map((s) => cheapest(crop, s, plain));
  const pairs: { a: number; b: number; cost: number }[] = [];
  for (let a = 0; a < sites.length; a += 1) {
    for (let b = a + 1; b < sites.length; b += 1) {
      pairs.push({ a, b, cost: searches[a]!.cost[sites[b]!]! });
    }
  }
  pairs.sort((p, q) => p.cost - q.cost || p.a - q.a || p.b - q.b);
  const group = sites.map((_, k) => k);
  const find = (k: number): number => (group[k] === k ? k : (group[k] = find(group[k]!)));
  const chosen: { a: number; b: number; cost: number }[] = [];
  const spare: typeof chosen = [];
  for (const p of pairs) {
    if (find(p.a) !== find(p.b)) {
      group[find(p.a)] = find(p.b);
      chosen.push(p);
    } else spare.push(p);
  }
  // Loops: the cheapest links that save the most walking round the tree.
  const treeCost = (from: number) => {
    const best = sites.map(() => Infinity);
    best[from] = 0;
    for (let round = 0; round < sites.length; round += 1) {
      for (const e of chosen) {
        best[e.b] = Math.min(best[e.b]!, best[e.a]! + e.cost);
        best[e.a] = Math.min(best[e.a]!, best[e.b]! + e.cost);
      }
    }
    return best;
  };
  const loops = spare
    .map((p) => ({ p, ratio: treeCost(p.a)[p.b]! / p.cost }))
    .filter((c) => c.ratio > 1.25 && c.p.cost < LOOP_MAX_COST)
    .sort((x, y) => y.ratio - x.ratio || x.p.a - y.p.a)
    .slice(0, EXTRA_ROADS)
    .map((c) => c.p);
  const onRoad = new Uint8Array(crop.width * crop.height);
  const roads: Road[] = [];
  // Cheapest first, each road cheaper along the cells earlier roads already hold.
  for (const e of [...chosen, ...loops].sort((p, q) => p.cost - q.cost)) {
    const search = cheapest(crop, sites[e.a]!, walkCost(crop, onRoad));
    const cells = pathTo(search, sites[e.b]!);
    for (const c of cells) onRoad[c] = 1;
    roads.push({ a: e.a, b: e.b, cells });
  }
  return roads;
}

/** Cells from the hall to the settlement that is farthest by road, along the road network. */
function walkRoute(roads: Road[], sites: number[]): number[] {
  const best = sites.map(() => Infinity);
  const via: (Road | null)[] = sites.map(() => null);
  best[0] = 0;
  for (let round = 0; round < sites.length; round += 1) {
    for (const r of roads) {
      const len = r.cells.length;
      if (best[r.a]! + len < best[r.b]!) {
        best[r.b] = best[r.a]! + len;
        via[r.b] = r;
      }
      if (best[r.b]! + len < best[r.a]!) {
        best[r.a] = best[r.b]! + len;
        via[r.a] = r;
      }
    }
  }
  let far = 1;
  for (let k = 1; k < sites.length; k += 1) if (best[k]! > best[far]!) far = k;
  const legs: number[][] = [];
  for (let k = far; k !== 0;) {
    const r = via[k]!;
    const from = r.b === k ? r.a : r.b;
    legs.push(r.b === k ? r.cells : [...r.cells].reverse());
    k = from;
  }
  const route: number[] = [];
  for (const leg of legs.reverse()) route.push(...(route.length ? leg.slice(1) : leg));
  return route;
}

/** The road to close: one off the party's route if there is one, in the middle of its run. */
function pickClosedRoad(
  roads: Road[],
  route: number[],
  crop: Crop,
  sites: number[],
): { landmarkCell: number; closedRoadCell: number } {
  const walked = new Set(route);
  const free = roads.filter(
    (r) => r.cells.filter((c) => walked.has(c)).length < r.cells.length / 2,
  );
  const pool = (free.length ? free : roads).filter((r) => r.a !== 0 && r.b !== 0);
  const road = (pool.length ? pool : roads).reduce((p, q) =>
    q.cells.length > p.cells.length ? q : p,
  );
  const closedRoadCell = road.cells[road.cells.length >> 1]!;
  const g = crop;
  let landmarkCell = closedRoadCell;
  let best = Infinity;
  const onRoad = new Set(roads.flatMap((r) => r.cells));
  for (let i = 0; i < g.width * g.height; i += 1) {
    if (crop.water[i] !== 0 || onRoad.has(i)) continue;
    const away = gap(g, i, closedRoadCell);
    if (away < 6 || away > 14 || sites.some((s) => gap(g, i, s) < 14)) continue;
    const cost = Math.abs(away - 9) + (crop.elevation[i]! > 600 ? 6 : 0);
    if (cost < best) {
      best = cost;
      landmarkCell = i;
    }
  }
  return { landmarkCell, closedRoadCell };
}
