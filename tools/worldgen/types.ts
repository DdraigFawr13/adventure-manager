// From Story-Generator src/engine/core/types.ts and src/engine/core/content-types.ts @ 8a5c4ef (D-116);
// only WorldParams, Plate, BiomeDef and BiomeRules, plus a two-field ContentBundle for the classifier.

export type Rgb = [number, number, number];

export interface WorldParams {
  width: number;
  height: number;
  historyYears: number;
  /** Continental plates; the default 3–5 gives a few continents plus islands. */
  continents: number;
  /** Share of cells above sea level (0–1). */
  landFraction: number;
  /** Degrees C added to every temperature (−15…15). */
  temperatureShift: number;
  /** Multiplies every rainfall total (0.25…2). */
  rainfallScale: number;
}

/** A tectonic plate from world-gen. Motion is in tenths of a cell per step. */
export interface Plate {
  id: number;
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  continental: boolean;
}

export interface BiomeDef {
  id: string;
  name: string;
  color: Rgb;
  /** Base fertility (0–100) before rainfall, season and floodplain adjustments. */
  fertility: number;
  /** Base wildness contribution (0–100): old forest and swamp high, grassland low. */
  wildness: number;
  /** Cost to cross one cell on foot (land biomes at least 1; unused for water biomes). */
  travel: number;
  /** True for forests (timber, game, old-forest aura, wildness). */
  forest?: boolean;
  /** Water biomes are assigned by water class, never by the climate table. */
  water?: 'sea' | 'coast' | 'lake';
}

export interface BiomeRules {
  /** Ascending upper bounds (°C) on mean annual temperature = (summer + winter) / 2; last band is open. */
  temperatureBands: number[];
  /** Ascending upper bounds (mm/yr) on rainfall; last band is open. */
  rainfallBands: number[];
  /** table[t][r] = biome id, for temperature band t and rainfall band r. Must be complete. */
  table: string[][];
  /** Land at or above this elevation (m) is alpine regardless of climate. */
  alpineElevation: number;
  /** Floodplain or lakeside land with rainfall >= this (mm) and mean temp >= swampMinTemp becomes swamp. */
  swampRainfall: number;
  swampMinTemp: number;
  /** Frost-free biomes only occur where the winter low is high enough; elsewhere the fallback biome is used. */
  frostFree: { biomes: string[]; minWinter: number; fallback: Record<string, string> };
  /** Sea cells within this many cells (8-neighbour) of land are coast, deeper ones ocean. */
  coastReach: number;
}

/** What the biome classifier reads. */
export interface ContentBundle {
  biomes: BiomeDef[];
  biomeRules: BiomeRules;
}
