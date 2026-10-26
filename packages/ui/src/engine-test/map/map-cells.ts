// The only fields the map drawing reads from the baked March.
// water: 0 land, 1 river, 2 lake, 3 sea.
export interface MapCells {
  width: number;
  height: number;
  water: Uint8Array;
  biome: Uint8Array;
  elevation: Int16Array;
}
