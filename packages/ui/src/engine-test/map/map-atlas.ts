// The static atlas of the March: everything inked once into one canvas (8 px a cell, so 2400 x 1600
// for the 300 x 200 km sheet). Each frame only blits it; the live layers and the sheet's furniture
// (frame, cartouche, compass, scale bar) are drawn over it. Built in slices so the page stays alive.
import type { MapData } from './map-data.ts';
import { sitesOf } from './map-data.ts';
import { drawGround } from './map-ground.ts';
import { newCanvas } from './map-layers.ts';
import { drawRivers, drawRoads } from './map-ink.ts';
import { collectMarks, drawSymbols } from './map-symbols.ts';
import { drawBarrow, drawTowns, townReach } from './map-town.ts';

/** Pixels a cell; the symbols are drawn for 8. */
export const ATLAS_SCALE = 8;

export interface Atlas {
  canvas: HTMLCanvasElement;
  /** Size in pixels. */
  width: number;
  height: number;
  scale: number;
  /** Land as a path in pixels (even-odd: lakes are holes), for clipping live layers to the land. */
  land: Path2D;
}

export function* atlasSteps(data: MapData, scale = ATLAS_SCALE): Generator<void, Atlas, void> {
  const { width: W, height: H } = data.cells;
  const canvas = newCanvas(W * scale, H * scale);
  const ctx = canvas.getContext('2d')!;
  const land = yield* drawGround(ctx, data, scale);
  yield;

  const sites = sitesOf(data);
  const roadCells = new Set(data.roads.flatMap((r) => r.cells));
  const marks = collectMarks(
    {
      cells: data.cells,
      biomeIds: data.biomeIds,
      clear: [
        ...sites.map((cell, k) => ({ cell, r: townReach(k).rx / scale + 1.2 })),
        { cell: data.landmarkCell, r: 3.6 },
      ],
      roadCells,
    },
    scale,
  );
  yield;
  yield* drawSymbols(ctx, marks);
  yield;
  drawRivers(ctx, data, scale, land);
  drawRoads(ctx, data, scale);
  yield;
  drawTowns(ctx, data, sites, scale);
  const bx = ((data.landmarkCell % W) + 0.5) * scale;
  const by = (Math.floor(data.landmarkCell / W) + 0.5) * scale;
  drawBarrow(ctx, bx, by);
  yield;
  return { canvas, width: W * scale, height: H * scale, scale, land };
}
