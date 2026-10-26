// Bakes the kingdom-map base for the engine test (roadmap 1.8, D-110).
//
// SIZE (one home for the numbers; the map code reads them from the baked file):
//   The March is a land region about 300 x 200 km (3:2). 1 cell = 1 km, so the sheet is 300 x 200 cells.
//   On foot a party covers about DAY_CELLS km a day, so the far sites lie about 9-10 days from the guild
//   hall in the middle (quests run 2-4 weeks with travel, PLAN §2a). The atlas draws 8 px a cell (2400 x 1600).
//
// MAKING IT: Story-Generator's stages (world.ts) run on a larger square world; `window.ts` finds the
// 300 x 200 window that is mostly land with the sea along the east edge, a spine on another edge and
// low wet ground; every cell of the crop comes from the generator. `layout.ts` then picks the eight
// settlements, roads, one party route, area-name spots, a landmark and the compass.
import { BIOMES } from './biome-content.ts';
import { layoutMarch, type Layout } from './layout.ts';
import { findWindow } from './window.ts';
import { cropWorld, generateWorld, mirrorWorld, SOURCE_COMMIT } from './world.ts';

export { SOURCE_COMMIT };

/** The sheet in cells (1 cell = 1 km) and the day's march on foot in cells. */
export const MARCH = { width: 300, height: 200, cellKm: 1, dayCells: 22 };
/** The chosen March: seed, world side, mirroring and the window's corner (found with `--search`). */
export const MARCH_WORLD = {
  seed: 'march-7',
  worldSize: 420,
  flipX: true,
  flipY: true,
  turn: false,
  x0: 120,
  y0: 160,
};

export interface BakeOptions {
  seed: string;
  /** Side of the generated world the window is cut from. */
  worldSize: number;
  width: number;
  height: number;
  flipX?: boolean;
  flipY?: boolean;
  /** Swap x and y before mirroring. */
  turn?: boolean;
  /** Corner of the window; found by search when absent. */
  x0?: number;
  y0?: number;
}

export interface BakedMap extends Layout {
  width: number;
  height: number;
  seed: string;
  elevation: Int16Array;
  /** 0 land, 1 river, 2 lake, 3 sea. */
  water: Uint8Array;
  biome: Uint8Array;
  biomeIds: string[];
  cellKm: number;
  dayCells: number;
}

export function bakeMap(options: BakeOptions): BakedMap {
  const { seed, worldSize, width, height } = options;
  const world = mirrorWorld(
    generateWorld(seed, worldSize),
    options.flipX ?? false,
    options.flipY ?? false,
    options.turn ?? false,
  );
  const found =
    options.x0 !== undefined && options.y0 !== undefined
      ? { x0: options.x0, y0: options.y0 }
      : findWindow(world, width, height);
  const { x0, y0 } = found ?? {
    x0: (worldSize - width) >> 1,
    y0: (worldSize - height) >> 1,
  };
  const crop = cropWorld(world, x0, y0, width, height);
  const layout = layoutMarch(
    crop,
    BIOMES.map((b) => b.id),
  );
  return {
    width,
    height,
    seed,
    elevation: crop.elevation,
    water: crop.water,
    biome: crop.biome,
    biomeIds: BIOMES.map((b) => b.id),
    cellKm: MARCH.cellKm,
    dayCells: MARCH.dayCells,
    ...layout,
  };
}
