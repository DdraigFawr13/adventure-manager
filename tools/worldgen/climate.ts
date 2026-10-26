// From Story-Generator src/engine/worldgen/climate.ts @ 8a5c4ef (D-116); imports point at sibling files with .ts extensions.
// Climate (Phase 1, M1.2): sea distance, seasonal temperature, rainfall from a
// prevailing-wind moisture sweep, and per-cell weather risks. The map spans
// latitude 70N (top row) to 10S (bottom row), so the north is harsh and the
// south lush by construction. Functions take plain arrays so tests can use
// tiny fixtures; generateClimate wires them together.

import type { RngStream } from './rng.ts';
import type { WorldParams } from './types.ts';
import { neighbour } from './grid.ts';
import { fractalNoise } from './noise.ts';

export const TOP_LATITUDE = 70;
export const BOTTOM_LATITUDE = -10;
/** Temperature drop per metre of elevation above sea level (6.5 C per km). */
const LAPSE_PER_METRE = 6.5 / 1000;
/** Amplitude in C of the temperature noise. */
const TEMP_NOISE = 2;
const MIN_TEMP = -60;
const MAX_TEMP = 50;

/** Moisture (mm/yr equivalent) an air column holds at most, and gains per ocean cell. */
const MOISTURE_CAP = 10000;
const OCEAN_PICKUP = 2500;
/** Share of the moisture that falls on each land cell, and the share of that rain evaporated back. */
const LAND_RAIN_SHARE = 0.1;
const LAND_RECYCLE = 0.9;
/** Rise (m, on smoothed relief) over one cell that wrings out all the air's moisture; capped at OROGRAPHIC_MAX. */
const OROGRAPHIC_RISE = 3000;
const OROGRAPHIC_MAX = 0.25;
/** Box-blur radius (cells) for the relief the wind feels, so single noisy cells don't make rain stripes. */
const RELIEF_RADIUS = 3;
/** Rain over open sea as a share of the air's moisture. */
const OCEAN_RAIN_SHARE = 0.25;
/**
 * Rain from weather the row sweep can't model (fronts, storms arriving from other
 * directions), in mm/yr before the belt factor, blended in at BACKGROUND_SHARE
 * so lee sides are dry but rarely barren outside the subtropical belt.
 */
const BACKGROUND_RAIN = 500;
const BACKGROUND_SHARE = 0.25;
/** Passes of a 3x3 blur over the final rainfall. */
const SMOOTH_PASSES = 1;
/** Share of each row's air swapped with the rows above and below after every sweep step. */
const ROW_MIX = 0.5;
/** Degrees of latitude over which the westerlies hand over to the trade winds. */
const WIND_BLEND = 6;
/** Degrees the wind and rain belts wander north and south along their length. */
const BELT_WIGGLE = 6;
const MAX_RAINFALL = 6000;

/** Rainfall multiplier by absolute latitude: wet tropics, dry subtropics, moderate temperate, dry pole. */
const RAIN_BELTS: readonly (readonly [number, number])[] = [
  [0, 1.7],
  [10, 1.5],
  [20, 0.8],
  [28, 0.5],
  [40, 0.85],
  [50, 1.0],
  [60, 0.85],
  [70, 0.4],
];

export function latitudeOfRow(y: number, height: number): number {
  return TOP_LATITUDE + ((BOTTOM_LATITUDE - TOP_LATITUDE) * y) / Math.max(1, height - 1);
}

/** Direction the prevailing wind blows along a row: +1 toward the east, −1 toward the west. */
export function windDirection(y: number, height: number): 1 | -1 {
  const lat = Math.abs(latitudeOfRow(y, height));
  return lat >= 30 && lat <= 60 ? 1 : -1;
}

function beltFactor(absLat: number): number {
  for (let b = 1; b < RAIN_BELTS.length; b += 1) {
    const [l1, f1] = RAIN_BELTS[b]!;
    if (absLat <= l1 || b === RAIN_BELTS.length - 1) {
      const [l0, f0] = RAIN_BELTS[b - 1]!;
      const t = Math.min(1, Math.max(0, (absLat - l0) / (l1 - l0)));
      return f0 + (f1 - f0) * t;
    }
  }
  return 1;
}

/** Multi-source BFS from ocean cells (8 neighbours): cells to the nearest sea, 0 at sea. */
export function computeSeaDistance(width: number, height: number, ocean: Uint8Array): Uint16Array {
  const size = width * height;
  const distance = new Uint16Array(size).fill(65535);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < size; i += 1) {
    if (ocean[i]) {
      distance[i] = 0;
      queue[tail++] = i;
    }
  }
  while (head < tail) {
    const i = queue[head++]!;
    if (distance[i]! >= 65535) continue;
    for (let d = 0; d < 8; d += 1) {
      const n = neighbour(width, height, i, d);
      if (n >= 0 && distance[n] === 65535) {
        distance[n] = distance[i]! + 1;
        queue[tail++] = n;
      }
    }
  }
  return distance;
}

export interface Temperatures {
  tempSummer: Int8Array;
  tempWinter: Int8Array;
}

/** Seasonal highs and lows from latitude, continentality, elevation lapse and noise. */
export function computeTemperature(
  width: number,
  height: number,
  elevation: ArrayLike<number>,
  seaDistance: Uint16Array,
  noiseSeed: number,
  temperatureShift: number,
): Temperatures {
  const tempSummer = new Int8Array(width * height);
  const tempWinter = new Int8Array(width * height);
  const noise = { scale: Math.max(8, width / 4), octaves: 3, persistence: 0.5 };
  for (let y = 0; y < height; y += 1) {
    const lat = latitudeOfRow(y, height);
    const mean = 28 - 0.0075 * lat * lat;
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      // Inland air swings wider between seasons than air near the sea.
      const inland = Math.min(1, seaDistance[i]! / (width / 8));
      const half = (2 + 0.18 * Math.abs(lat)) * (0.6 + 0.8 * inland);
      const lapse = Math.max(0, elevation[i]!) * LAPSE_PER_METRE;
      const base =
        mean - lapse + temperatureShift + fractalNoise(noiseSeed, x, y, noise) * TEMP_NOISE;
      tempSummer[i] = Math.min(MAX_TEMP, Math.max(MIN_TEMP, Math.round(base + half)));
      tempWinter[i] = Math.min(MAX_TEMP, Math.max(MIN_TEMP, Math.round(base - half)));
    }
  }
  return { tempSummer, tempWinter };
}

/**
 * Share of westerly (eastward) wind at a latitude: 1 inside 30–60 degrees, 0
 * outside, easing over WIND_BLEND degrees so the two sweeps meet without a seam.
 */
export function eastwardShare(latitude: number): number {
  const lat = Math.abs(latitude);
  const inside = Math.min(lat - 30, 60 - lat);
  const t = Math.min(1, Math.max(0, (inside + WIND_BLEND) / (2 * WIND_BLEND)));
  return t * t * (3 - 2 * t);
}

/**
 * Rainfall in mm/yr. Air is swept across the map along the prevailing wind:
 * it gains moisture over sea, loses a share as rain over land and a large
 * amount on rising ground, so lee sides are dry. All rows advance together and
 * trade moisture with their neighbours after every step, so no row runs dry or
 * wet on its own (which used to paint east-west bands).
 */
export function computeRainfall(
  width: number,
  height: number,
  elevation: ArrayLike<number>,
  ocean: Uint8Array,
  rainfallScale: number,
  noiseSeed = 0,
): Uint16Array {
  const size = width * height;
  const wiggle = { scale: Math.max(8, width / 3), octaves: 2, persistence: 0.5 };
  const relief = smoothRelief(width, height, elevation);
  const eastward = sweepRain(width, height, elevation, ocean, relief, 1);
  const westward = sweepRain(width, height, elevation, ocean, relief, -1);
  let rain = new Float64Array(size);
  for (let y = 0; y < height; y += 1) {
    const lat = latitudeOfRow(y, height);
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      // Wind and rain belts wander north and south so their edges don't rule
      // straight lines across the map (and through the biomes).
      const wandered = lat + fractalNoise(noiseSeed, x, y, wiggle) * BELT_WIGGLE;
      const share = eastwardShare(wandered);
      const belt = beltFactor(Math.abs(wandered));
      const fallen = eastward[i]! * share + westward[i]! * (1 - share);
      rain[i] = (fallen * (1 - BACKGROUND_SHARE) + BACKGROUND_RAIN * BACKGROUND_SHARE) * belt;
    }
  }
  // A light 3x3 blur hides single-cell speckle from the step-by-step sweep.
  for (let pass = 0; pass < SMOOTH_PASSES; pass += 1) rain = blur3(width, height, rain);
  const result = new Uint16Array(size);
  for (let i = 0; i < size; i += 1) {
    result[i] = Math.min(MAX_RAINFALL, Math.max(0, Math.round(rain[i]! * rainfallScale)));
  }
  return result;
}

/** Rain fallen per cell when every row's air blows toward `wind` (+1 east, -1 west). */
function sweepRain(
  width: number,
  height: number,
  elevation: ArrayLike<number>,
  ocean: Uint8Array,
  relief: Float64Array,
  wind: 1 | -1,
): Float64Array {
  const rain = new Float64Array(width * height);
  // Air arrives from beyond the map edge already half-laden.
  let moisture = new Float64Array(height).fill(MOISTURE_CAP / 2);
  let mixed = new Float64Array(height);
  const previous = new Float64Array(height);
  for (let step = 0; step < width; step += 1) {
    const x = wind > 0 ? step : width - 1 - step;
    for (let y = 0; y < height; y += 1) {
      const i = y * width + x;
      let air = moisture[y]!;
      let fallen: number;
      // Inland basins below sea level evaporate like the sea.
      if (ocean[i] || elevation[i]! <= 0) {
        air = Math.min(MOISTURE_CAP, air + OCEAN_PICKUP);
        fallen = air * OCEAN_RAIN_SHARE;
        previous[y] = 0;
      } else {
        const here = relief[i]!;
        const rise = Math.max(0, here - previous[y]!);
        const base = air * LAND_RAIN_SHARE;
        // Rising air rains out; that water is gone, so the lee side stays dry.
        const orographic = air * Math.min(OROGRAPHIC_MAX, rise / OROGRAPHIC_RISE);
        fallen = base + orographic;
        air = Math.max(0, air - fallen + base * LAND_RECYCLE);
        previous[y] = here;
      }
      moisture[y] = air;
      rain[i] = fallen;
    }
    // Neighbouring rows of air mix a little at every step.
    for (let y = 0; y < height; y += 1) {
      const up = moisture[Math.max(0, y - 1)]!;
      const down = moisture[Math.min(height - 1, y + 1)]!;
      mixed[y] = moisture[y]! * (1 - ROW_MIX) + ((up + down) / 2) * ROW_MIX;
    }
    [moisture, mixed] = [mixed, moisture];
  }
  return rain;
}

/** One pass of a 3x3 box blur, clamped at the map edge. */
function blur3(
  width: number,
  height: number,
  values: ArrayLike<number>,
): Float64Array<ArrayBuffer> {
  const out = new Float64Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        const yy = Math.min(height - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx += 1) {
          const xx = Math.min(width - 1, Math.max(0, x + dx));
          sum += values[yy * width + xx]!;
        }
      }
      out[y * width + x] = sum / 9;
    }
  }
  return out;
}

/** Land relief (m, sea at 0) box-blurred along both axes. */
function smoothRelief(width: number, height: number, elevation: ArrayLike<number>): Float64Array {
  const size = width * height;
  const rows = new Float64Array(size);
  const out = new Float64Array(size);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;
      for (
        let k = Math.max(0, x - RELIEF_RADIUS);
        k <= Math.min(width - 1, x + RELIEF_RADIUS);
        k += 1
      ) {
        sum += Math.max(0, elevation[y * width + k]!);
        count += 1;
      }
      rows[y * width + x] = sum / count;
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;
      for (
        let k = Math.max(0, y - RELIEF_RADIUS);
        k <= Math.min(height - 1, y + RELIEF_RADIUS);
        k += 1
      ) {
        sum += rows[k * width + x]!;
        count += 1;
      }
      out[y * width + x] = sum / count;
    }
  }
  return out;
}

export interface Risks {
  drought: Uint8Array;
  storm: Uint8Array;
  snow: Uint8Array;
}

/** Weather risks 0–100 from rainfall, heat, coast exposure and winter cold. */
export function computeRisks(
  width: number,
  height: number,
  ocean: Uint8Array,
  seaDistance: Uint16Array,
  tempSummer: Int8Array,
  tempWinter: Int8Array,
  rainfall: Uint16Array,
): Risks {
  const size = width * height;
  const drought = new Uint8Array(size);
  const storm = new Uint8Array(size);
  const snow = new Uint8Array(size);
  for (let y = 0; y < height; y += 1) {
    const wind = windDirection(y, height);
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const dry = Math.min(1, Math.max(0, 1 - rainfall[i]! / 1000));
      const hot = Math.min(1, Math.max(0, (tempSummer[i]! - 10) / 25));
      drought[i] = Math.round(dry * 70 + hot * 30);
      const warm = Math.min(1, Math.max(0, (tempSummer[i]! - 8) / 20));
      let stormy: number;
      if (seaDistance[i]! <= 3) {
        stormy = 25 + 45 * warm;
        // Windward coast: the sea lies upwind of the cell.
        const ux = x - wind;
        if (ocean[i] || (ux >= 0 && ux < width && ocean[y * width + ux])) stormy += 20;
      } else {
        stormy = (5 + 20 * warm) * Math.max(0, 1 - seaDistance[i]! / 15);
      }
      storm[i] = Math.min(100, Math.round(stormy));
      snow[i] = Math.round(Math.min(1, Math.max(0, -tempWinter[i]! / 15)) * 100);
    }
  }
  return { drought, storm, snow };
}

export interface ClimateResult extends Temperatures {
  seaDistance: Uint16Array;
  rainfall: Uint16Array;
  risk: Risks;
}

export function generateClimate(
  params: WorldParams,
  elevation: Int16Array,
  ocean: Uint8Array,
  rng: RngStream,
): ClimateResult {
  const { width, height, temperatureShift, rainfallScale } = params;
  const noiseSeed = rng.int(0x1_0000_0000);
  const seaDistance = computeSeaDistance(width, height, ocean);
  const temps = computeTemperature(
    width,
    height,
    elevation,
    seaDistance,
    noiseSeed,
    temperatureShift,
  );
  const rainfall = computeRainfall(width, height, elevation, ocean, rainfallScale, noiseSeed + 1);
  const risk = computeRisks(
    width,
    height,
    ocean,
    seaDistance,
    temps.tempSummer,
    temps.tempWinter,
    rainfall,
  );
  return { seaDistance, ...temps, rainfall, risk };
}
