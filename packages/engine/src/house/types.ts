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
  /** Sickbeds per cell at each level; the infirmary (D-186). */
  readonly sickbeds?: readonly number[];
  /** Training places per cell at each level; the training yard (D-186). */
  readonly trainingPlaces?: readonly number[];
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

interface IncidentBase {
  readonly id: string;
  /** Kinds a fire or sickness may strike; for theft, the kinds that set the chest's level (the strongroom). */
  readonly roomKindIds: readonly string[];
  /** The weekly chance (basis points) before the multipliers. */
  readonly weeklyBp: number;
  /** The fee for the paid answer. */
  readonly paidCopper: number;
}

/** One incident kind as data (GAME-04): the engine knows three effects (SPEC.md, Incidents). */
export type IncidentKind = IncidentBase &
  (
    | { readonly effect: 'fire' }
    | {
        readonly effect: 'theft';
        /** Share of the chest taken, by strongroom level. */
        readonly shareBp: readonly number[];
        readonly noRoomShareBp: number;
        /** Chance the paid answer gets the coin back. */
        readonly recoverBp: number;
      }
    | {
        readonly effect: 'sickness';
        /** Members as a share of beds (basis points) at which sickness may strike: crowded, not only full (D-206). */
        readonly crowdedBp: number;
        readonly count: number;
        readonly freeDays: number;
        readonly paidDays: number;
        /** Days for a sick member with a free sickbed, as a share. */
        readonly sickbedBp: number;
      }
  );

export interface IncidentRules {
  readonly kinds: readonly IncidentKind[];
  /** Chance multiplier by room level (level 1 first), in basis points. */
  readonly levelBp: readonly number[];
  /** Stands in for `levelBp` when theft finds no strongroom. */
  readonly noRoomBp: number;
  /** Multiplier while the chest is below zero, and for a full target. */
  readonly debtBp: number;
  readonly fullBp: number;
  /** Copper a week for each member who lodges at the inn (members beyond the beds). */
  readonly innFeeCopper: number;
  /** A repair's share of the cell costs of the levels it restores (D-193). */
  readonly repairBp: number;
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
  /** Lasting-injury days for a member with no free sickbed, as a share (20,000 is twice, D-186). */
  readonly noSickbedBp: number;
  /** Training at home (D-187): weekly growth chance by age band, and the share for members with and without a yard place. */
  readonly homeTraining: {
    readonly youngBp: number;
    readonly primeBp: number;
    readonly placedBp: number;
    readonly unplacedBp: number;
  };
  /** House incidents and inn lodgers (v2); absent: none. */
  readonly incidents?: IncidentRules;
}

export interface BuiltCell {
  readonly kindId: string;
  level: number;
}

export type HouseJob =
  | {
      readonly kind: 'build';
      readonly place: Place;
      readonly kindId: string;
      readonly level: number;
    }
  | {
      readonly kind: 'upgrade';
      readonly kindId: string;
      readonly places: readonly Place[];
      readonly toLevel: number;
    }
  | { readonly kind: 'extend'; readonly direction: ExtendDirection }
  | {
      readonly kind: 'repair';
      readonly place: Place;
      readonly kindId: string;
      readonly level: number;
    };

export interface HouseWork {
  readonly id: string;
  readonly job: HouseJob;
  /** Absolute week (counted across years) at whose start the work is done. */
  readonly doneWeek: number;
}

/** The standing incident letter, until it is answered or the next week start. */
export interface IncidentLetter {
  readonly kindId: string;
  /** The struck cell; null for theft. */
  readonly place: Place | null;
  /** The absolute week it struck. */
  readonly week: number;
  /** The paid answer's fee. */
  readonly feeCopper: number;
  /** Theft: what the thieves took at the strike. */
  readonly stolenCopper?: number;
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
  /** Who holds a sickbed, and the day they are fit again (D-186). */
  readonly sickbeds: { readonly memberId: string; readonly untilDay: number }[];
  nextWorkNo: number;
  letter: IncidentLetter | null;
  /** What fires took (D-193): each scarred place, its kind and its level before the first fire. */
  readonly scars: { readonly place: Place; readonly kindId: string; readonly level: number }[];
}
