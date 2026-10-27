// Shapes for careers v0 (SPEC.md). Content supplies CareerRules; the engine only reads them.
import type { Danger } from '../resolution/types.ts';

/** One tier of the ladder, from the bottom (index 0) up. */
export interface TierRules {
  /** Danger weights for the player's board and for rivals' contracts in this tier. */
  readonly dangerWeights: Readonly<Record<Danger, number>>;
  /** Fee change for the player's board, in basis points (10,000 = as content's fee). */
  readonly feeBp: number;
  readonly grantCopper: number;
  /** Rivals: the strength they are pulled toward, contracts a year, and the renown a year expected of them. */
  readonly rivalMean: number;
  readonly rivalContracts: number;
  readonly rivalRenown: number;
}

export interface Band {
  readonly min: number;
  readonly max: number;
}

export interface CareerRules {
  readonly tiers: readonly TierRules[];
  readonly guildsPerTier: number;
  /** Drawn people's age and the spread of their hidden potential above each attribute. */
  readonly drawAge: Band;
  readonly potential: Band;
  readonly primeAge: number;
  /** Growth by doing: chance per quest survivor, young (at or under youngAge) and in their prime. */
  readonly growth: {
    readonly youngAge: number;
    readonly youngBp: number;
    readonly primeBp: number;
  };
  /** Per year past the prime: the chance to lose a point of each physical attribute, and to ask to retire. */
  readonly declineStepBp: number;
  readonly declineMaxBp: number;
  readonly retireStepBp: number;
  readonly retireMaxBp: number;
  /** Rivals: win chance against a danger's difficulty, and how strength drifts after a year. */
  readonly rivalWin: {
    readonly baseBp: number;
    readonly stepBp: number;
    readonly minBp: number;
    readonly maxBp: number;
  };
  readonly dangerDifficulty: Readonly<Record<Danger, number>>;
  readonly rivalSpread: number;
  readonly rivalDrift: {
    /** Strength moves 1/pullDiv of the way to the tier's mean each year. */
    readonly pullDiv: number;
    /** Renown above or below the tier's expectation per point of strength. */
    readonly renownPerPoint: number;
    readonly noise: number;
  };
  readonly patron: {
    readonly start: number;
    readonly met: number;
    readonly perPlaceShort: number;
    readonly maxMiss: number;
    readonly debt: number;
    readonly max: number;
  };
  /** The patron's emergency grant (D-146); absent: no grant. */
  readonly emergency?: {
    /** The grant is this many weeks of the guild's wages at the time of the offer. */
    readonly wageWeeks: number;
    /** At most one grant taken in this many years. */
    readonly everyYears: number;
    readonly confidenceCost: number;
  };
  readonly guildmaster: {
    readonly age: Band;
    readonly healthFromAge: number;
    readonly certainAge: number;
  };
}

export type TargetKind = 'top-two' | 'top-half' | 'avoid-bottom';
export type CareerEnd = 'dismissed' | 'retired';

export interface Rival {
  readonly id: string;
  tier: number;
  strength: number;
  /** Renown earned in the year just settled. */
  renown: number;
}

export interface CareerState {
  tier: number;
  /** Renown earned since the last Assembly (PLAN §3d ranks tiers by this). */
  renownThisYear: number;
  readonly rivals: Rival[];
  confidence: number;
  target: TargetKind;
  readonly guildmasterBirthYear: number;
  /** The patron's standing emergency offer (this week only) and the year of the last grant taken (D-146). */
  emergencyOffer: { readonly grantCopper: number; readonly week: number } | null;
  lastGrantYear: number | null;
  /** The year the career began (1) and, once over, how it ended. */
  ended: { readonly reason: CareerEnd; readonly year: number } | null;
}
