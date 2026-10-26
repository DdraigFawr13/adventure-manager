// Decodes the baked map (tools/bake-map.ts) into typed arrays, and finds the few facts the live
// layers need (where an area's middle is, which cells are land). Pure; no rules live here (GAME-02).
import baked from '../../../assets/engine-test/map-base.json';
import type { MapCells } from './map-cells.ts';

export interface MapData {
  cells: MapCells;
  seed: string;
  biomeIds: readonly string[];
  guildCell: number;
  placeCells: readonly number[];
  route: readonly number[];
}

function bytesOf(base64: string): Uint8Array {
  const text = atob(base64);
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) out[i] = text.charCodeAt(i);
  return out;
}

export function decodeMap(): MapData {
  const { width, height } = baked;
  const roads = new Uint8Array(width * height);
  for (const cell of baked.route) roads[cell] = 1;
  return {
    cells: {
      width,
      height,
      water: bytesOf(baked.water),
      biome: bytesOf(baked.biome),
      elevation: new Int16Array(bytesOf(baked.elevation).buffer),
      flow: new Uint32Array(bytesOf(baked.flow).buffer),
      roads,
    },
    seed: baked.seed,
    biomeIds: baked.biomeIds,
    guildCell: baked.guildCell,
    placeCells: baked.placeCells,
    route: baked.route,
  };
}

/** The accepted cell with the most accepted cells around it (within `reach`), so a label sits in the heart of its ground. */
export function densestCell(
  cells: MapCells,
  accept: (cell: number) => boolean,
  reach: number,
): number {
  const { width, height } = cells;
  let best = -1;
  let bestCount = -1;
  for (let i = 0; i < width * height; i += 1) {
    if (!accept(i)) continue;
    const x = i % width;
    const y = (i - x) / width;
    let count = 0;
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && accept(ny * width + nx)) count += 1;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      best = i;
    }
  }
  return best;
}

/** A sea cell far from any land (sampled), for the name of the open water. */
export function openSeaCell(cells: MapCells): number {
  const { width, height, water } = cells;
  const land: number[] = [];
  const sea: number[] = [];
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = y * width + x;
      // Keep the name clear of the map's edge.
      const inside = x >= 14 && y >= 14 && x < width - 14 && y < height - 14;
      if (water[i] !== 3) land.push(i);
      else if (inside) sea.push(i);
    }
  }
  let best = -1;
  let bestGap = -1;
  for (const s of sea) {
    let gap = Infinity;
    for (const l of land) {
      const dx = (s % width) - (l % width);
      const dy = Math.floor(s / width) - Math.floor(l / width);
      gap = Math.min(gap, dx * dx + dy * dy);
    }
    if (gap > bestGap) {
      bestGap = gap;
      best = s;
    }
  }
  return best;
}
