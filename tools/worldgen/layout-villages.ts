// Villages for the March (owner, 2026-10-26: "add more towns around the areas"). The eight
// settlements stay the places contracts come from (PLAN §7c); villages are the small life between
// them: hamlets by a road, a river or the shore, spread so every area has a few. Picked by
// farthest-point sampling over the candidate cells, so they spread evenly and the pick is the
// same for the same crop.
import type { Crop } from './world.ts';
import type { Road } from './layout.ts';
import { gap, xOf, yOf } from './layout-grid.ts';

/** How many villages the 300 × 200 sheet gets, and how close (cells) they may sit. */
export const VILLAGES = { count: 18, minGap: 15, nearRoad: 3, nearWater: 2 };

export function pickVillages(
  crop: Crop,
  biomeIds: readonly string[],
  sites: readonly number[],
  roads: readonly Road[],
  k: number,
): number[] {
  const { width: W, height: H, water, biome, elevation } = crop;
  const n = W * H;
  const banned = new Set(['ocean', 'coast', 'lake', 'alpine']);
  const onRoad = new Uint8Array(n);
  for (const r of roads) for (const c of r.cells) onRoad[c] = 1;
  const near = (i: number, reach: number, test: (j: number) => boolean): boolean => {
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const x = xOf(crop, i) + dx;
        const y = yOf(crop, i) + dy;
        if (x >= 0 && y >= 0 && x < W && y < H && test(y * W + x)) return true;
      }
    }
    return false;
  };
  // Sheet furniture: the cartouche in the lower left and the scale bar at the bottom middle.
  const underFurniture = (i: number) =>
    (xOf(crop, i) < 62 * k && yOf(crop, i) >= H - 28 * k) ||
    (yOf(crop, i) >= H - 24 * k && Math.abs(xOf(crop, i) - W * 0.45) < 64 * k);
  const candidates: number[] = [];
  for (let i = 0; i < n; i += 1) {
    if (water[i] !== 0 || banned.has(biomeIds[biome[i]!] ?? 'ocean')) continue;
    if (elevation[i]! > 900 || onRoad[i]) continue;
    const x = xOf(crop, i);
    const y = yOf(crop, i);
    if (x < 12 * k || x >= W - 12 * k || y < 10 * k || y >= H - 12 * k || underFurniture(i))
      continue;
    const byRoad = near(i, Math.max(1, Math.round(VILLAGES.nearRoad * k)), (j) => onRoad[j] === 1);
    const byWater = near(i, Math.max(1, Math.round(VILLAGES.nearWater * k)), (j) => water[j] !== 0);
    if (byRoad || byWater) candidates.push(i);
  }

  const villages: number[] = [];
  const nearest = candidates.map((c) => Math.min(...sites.map((s) => gap(crop, c, s))));
  const count = Math.round(VILLAGES.count * k * k);
  for (let v = 0; v < count; v += 1) {
    let best = -1;
    for (let j = 0; j < candidates.length; j += 1) {
      if (best < 0 || nearest[j]! > nearest[best]!) best = j;
    }
    if (best < 0 || nearest[best]! < VILLAGES.minGap * k) break;
    const cell = candidates[best]!;
    villages.push(cell);
    for (let j = 0; j < candidates.length; j += 1) {
      nearest[j] = Math.min(nearest[j]!, gap(crop, candidates[j]!, cell));
    }
  }
  return villages;
}
