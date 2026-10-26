// From Story-Generator src/content/biomes.ts @ 8a5c4ef (D-116); import now points at ./types.ts.
// Biomes and the climate table that assigns them (Phase 1, M1.3). The index in
// BIOMES is the value stored in `cells.biome`; ocean and coast must stay at 0
// and 1 because the world checker treats those as the only sea biomes.

import type { BiomeDef, BiomeRules } from './types.ts';

export const BIOMES: BiomeDef[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    color: [20, 50, 110],
    fertility: 0,
    wildness: 0,
    travel: 0,
    water: 'sea',
  },
  {
    id: 'coast',
    name: 'Coast',
    color: [70, 130, 190],
    fertility: 0,
    wildness: 0,
    travel: 0,
    water: 'coast',
  },
  {
    id: 'lake',
    name: 'Lake',
    color: [90, 160, 230],
    fertility: 0,
    wildness: 0,
    travel: 0,
    water: 'lake',
  },
  { id: 'tundra', name: 'Tundra', color: [185, 200, 195], fertility: 10, wildness: 55, travel: 4 },
  {
    id: 'taiga',
    name: 'Taiga',
    color: [60, 110, 90],
    fertility: 30,
    wildness: 65,
    travel: 4,
    forest: true,
  },
  {
    id: 'temperate-forest',
    name: 'Temperate forest',
    color: [50, 130, 60],
    fertility: 52,
    wildness: 60,
    travel: 4,
    forest: true,
  },
  {
    id: 'grassland',
    name: 'Grassland',
    color: [140, 195, 90],
    fertility: 58,
    wildness: 25,
    travel: 2,
  },
  { id: 'steppe', name: 'Steppe', color: [200, 195, 110], fertility: 35, wildness: 35, travel: 2 },
  { id: 'desert', name: 'Desert', color: [225, 200, 130], fertility: 5, wildness: 45, travel: 5 },
  { id: 'savanna', name: 'Savanna', color: [200, 170, 70], fertility: 36, wildness: 40, travel: 3 },
  {
    id: 'jungle',
    name: 'Jungle',
    color: [20, 105, 55],
    fertility: 42,
    wildness: 80,
    travel: 7,
    forest: true,
  },
  { id: 'swamp', name: 'Swamp', color: [90, 110, 70], fertility: 35, wildness: 80, travel: 8 },
  { id: 'alpine', name: 'Alpine', color: [215, 215, 220], fertility: 5, wildness: 70, travel: 10 },
];

export const BIOME_RULES: BiomeRules = {
  // Mean annual temperature: polar, cold, cool, warm, hot.
  temperatureBands: [-2, 6, 15, 23],
  // Rainfall: arid, dry, moderate, wet, very wet.
  rainfallBands: [250, 450, 800, 1300],
  table: [
    ['tundra', 'tundra', 'tundra', 'tundra', 'tundra'],
    ['tundra', 'tundra', 'taiga', 'taiga', 'taiga'],
    ['steppe', 'steppe', 'grassland', 'temperate-forest', 'temperate-forest'],
    ['desert', 'steppe', 'grassland', 'temperate-forest', 'jungle'],
    ['desert', 'desert', 'savanna', 'jungle', 'jungle'],
  ],
  alpineElevation: 2800,
  frostFree: {
    biomes: ['jungle', 'savanna'],
    minWinter: 10,
    fallback: { jungle: 'temperate-forest', savanna: 'grassland' },
  },
  swampRainfall: 900,
  swampMinTemp: 8,
  coastReach: 2,
};
