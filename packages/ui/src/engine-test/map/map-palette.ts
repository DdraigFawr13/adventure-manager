// One sepia ink and soft washes for the whole sheet (STYLE §2: warm paper, one ink, muted tints).
export type Rgb = readonly [number, number, number];

export const PAPER: Rgb = [240, 231, 208];
export const SEA: Rgb = [201, 212, 208];
export const INK_RGB: Rgb = [58, 44, 30];
export const INK = `rgb(${INK_RGB.join(',')})`;
export const PAPER_CSS = `rgb(${PAPER.join(',')})`;
export const ink = (alpha: number): string => `rgba(${INK_RGB.join(',')},${alpha})`;
export const SEAL = '#8e2a22';

/** Soft ground wash per biome id; biomes not listed keep the paper. */
export const TINT: Readonly<Record<string, Rgb>> = {
  'temperate-forest': [194, 210, 164],
  taiga: [190, 206, 176],
  swamp: [178, 200, 178],
  grassland: [230, 229, 196],
  steppe: [232, 224, 190],
  tundra: [230, 228, 214],
  alpine: [216, 210, 198],
};

/** Wash for high ground, laid over the biome wash: hills and peaks go greyer. */
export const HILL_WASH: Rgb = [204, 192, 166];
