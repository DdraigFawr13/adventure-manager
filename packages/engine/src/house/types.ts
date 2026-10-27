// Shapes for house v0 (SPEC.md). Content supplies HouseRules; the engine only reads them.

export type HouseArea = 'hall' | 'compound';
export type CompoundSide = 'west' | 'east';
export type ExtendDirection = 'up' | 'down' | CompoundSide;

/** A cell in the hall (floor 0 is the ground, negative floors are cellars) or a compound plot (0 is next to the hall). */
export type Place =
  | { readonly area: 'hall'; readonly floor: number; readonly cell: number }
  | { readonly area: 'compound'; readonly side: CompoundSide; readonly plot: number };

/** One room kind as data (GAME-04). Arrays by level hold level 1 first. */
export interface RoomKind {
  readonly id: string;
  readonly where: HouseArea;
  /** Cellars only (the strongroom, D-176). */
  readonly belowGround?: boolean;
  /** Longest run of side-by-side cells one room of this kind may have (1-3, D-169). */
  readonly maxCells: number;
  /** Copper per cell to build at level 1, then to raise each cell from level n to n + 1. */
  readonly cellCostCopper: readonly number[];
  /** Weeks of work to build a cell at level 1, then to raise a room to each next level. */
  readonly weeks: readonly number[];
  /** Copper per cell per week at each level (D-177). */
  readonly upkeepCopper: readonly number[];
  /** Beds per cell at each level; only the barracks has beds (D-170). */
  readonly beds?: readonly number[];
}

/** A rising price: the first costs `baseCopper`, each later one `stepCopper` more (D-172, D-183). */
export interface StepCost {
  readonly baseCopper: number;
  readonly stepCopper: number;
  readonly weeks: number;
}

export interface StartCell {
  readonly place: Place;
  readonly kindId: string;
  readonly level: number;
}

export interface HouseRules {
  readonly kinds: readonly RoomKind[];
  /** The fixed cell that holds the work desk; not a kind, never built or charged. */
  readonly studyPlace: Place;
  readonly cellsPerFloor: number;
  /** The new guild's floors (lowest and highest), plots per compound side, and built cells. */
  readonly start: {
    readonly lowestFloor: number;
    readonly highestFloor: number;
    readonly plotsPerSide: number;
    readonly cells: readonly StartCell[];
  };
  readonly storey: StepCost;
  readonly cellar: StepCost;
  readonly wall: StepCost;
  readonly maxPlotsPerSide: number;
  /** Work started in a winter week takes this share of its weeks, rounded up. */
  readonly winterWeeksBp: number;
}

export interface BuiltCell {
  readonly kindId: string;
  level: number;
}

export type HouseJob =
  | { readonly kind: 'build'; readonly place: Place; readonly kindId: string; readonly level: number }
  | { readonly kind: 'upgrade'; readonly places: readonly Place[]; readonly toLevel: number }
  | { readonly kind: 'extend'; readonly direction: ExtendDirection };

export interface HouseWork {
  readonly id: string;
  readonly job: HouseJob;
  /** Absolute week (counted across years) at whose start the work is done. */
  readonly doneWeek: number;
}

export interface HouseState {
  lowestFloor: number;
  highestFloor: number;
  /** Hall cells by floor; each floor has `cellsPerFloor` entries, null when empty. */
  readonly floors: Record<number, (BuiltCell | null)[]>;
  readonly compound: Record<CompoundSide, (BuiltCell | null)[]>;
  readonly work: HouseWork[];
  /** How many storeys, cellars and wall pushes were added since the founding (each costs more). */
  readonly added: Record<ExtendDirection, number>;
  nextWorkNo: number;
}
