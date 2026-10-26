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
import { boxCounts, gap, stepsFrom, xOf, yOf } from './layout-grid.ts';
import { pickVillages } from './layout-villages.ts';
import { layRoads, pickClosedRoad, walkRoute } from './layout-roads.ts';

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

const woodId = (ids: readonly string[], name: string) => ids.indexOf(name);

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
