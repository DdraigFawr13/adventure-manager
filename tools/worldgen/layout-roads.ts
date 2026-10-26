// Roads for the March layout (split from layout.ts): the cost of a step on foot, the road tree
// with a couple of short loops, the party's route along it, and the road the threat closes.
import type { Crop } from './world.ts';
import type { Road } from './layout.ts';
import { BIOMES } from './biome-content.ts';
import { cheapest, gap, pathTo } from './layout-grid.ts';

const EXTRA_ROADS = 2;
/** A loop road must be a short link (walking cost), not a long detour through the hills. */
const LOOP_MAX_COST = 330;

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
export function layRoads(crop: Crop, sites: number[]): Road[] {
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
export function walkRoute(roads: Road[], sites: number[]): number[] {
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
export function pickClosedRoad(
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
