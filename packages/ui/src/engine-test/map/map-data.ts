// Decodes the baked March (tools/bake-map.ts) into typed arrays. Pure; no rules live here (GAME-02).
import baked from '../../../assets/engine-test/map-base.json';
import type { MapCells } from './map-cells.ts';

export interface MapData {
  cells: MapCells;
  seed: string;
  biomeIds: readonly string[];
  /** Kilometres a cell, and cells a day's walk on foot (the sheet's scale). */
  cellKm: number;
  dayCells: number;
  guildCell: number;
  /** The seven other settlements, in the order of the content names place.0 to place.6. */
  placeCells: readonly number[];
  roads: readonly { a: number; b: number; cells: readonly number[] }[];
  route: readonly number[];
  rivers: readonly { cells: readonly number[]; flows: readonly number[] }[];
  areas: readonly { id: string; cell: number; angle: number }[];
  landmarkCell: number;
  closedRoadCell: number;
  /** Compass rose: centre and radius in cells. */
  compass: { x: number; y: number; r: number };
}

function bytesOf(base64: string): Uint8Array {
  const text = atob(base64);
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) out[i] = text.charCodeAt(i);
  return out;
}

export function decodeMap(): MapData {
  const { width, height } = baked;
  return {
    cells: {
      width,
      height,
      water: bytesOf(baked.water),
      biome: bytesOf(baked.biome),
      elevation: new Int16Array(bytesOf(baked.elevation).buffer),
    },
    seed: baked.seed,
    biomeIds: baked.biomeIds,
    cellKm: baked.cellKm,
    dayCells: baked.dayCells,
    guildCell: baked.guildCell,
    placeCells: baked.placeCells,
    roads: baked.roads,
    route: baked.route,
    rivers: baked.rivers,
    areas: baked.areas,
    landmarkCell: baked.landmarkCell,
    closedRoadCell: baked.closedRoadCell,
    compass: baked.compass,
  };
}

/** Every settlement: the guild hall first, then the seven others. */
export const sitesOf = (data: MapData): number[] => [data.guildCell, ...data.placeCells];
