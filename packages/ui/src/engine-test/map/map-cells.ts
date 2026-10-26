// The only fields the atlas reads from a world (Story-Generator's WorldCells, cut down).
// water: 0 land, 1 river, 2 lake, 3 sea. roads: above 0 where a road runs.
export interface MapCells {
  width: number;
  height: number;
  water: Uint8Array;
  biome: Uint8Array;
  elevation: Int16Array;
  flow: Uint32Array;
  roads: Uint8Array;
}
