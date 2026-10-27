// Shapes for crises v0 (SPEC.md). Content supplies CrisisRules; the engine only reads them.
import type { Danger } from '../resolution/types.ts';

export interface CrisisStep {
  readonly siteId: string;
  readonly monsterId: string;
  readonly danger: Danger;
  /** Scale on the danger's fee, basis points. */
  readonly feeBp: number;
}

export interface CrisisChain {
  readonly id: string;
  readonly steps: readonly CrisisStep[];
  readonly reward: { readonly renown: number; readonly confidence: number };
  readonly pressure: { readonly weeklyCopper: number; readonly confidencePerReview: number };
}

export interface CrisisRules {
  readonly fromYear: number;
  /** Chance at each Assembly from `fromYear` that a crisis wakes. */
  readonly startBp: number;
  readonly chains: readonly CrisisChain[];
}

export interface CrisisState {
  /** The standing crisis: its chain and the step to win next. */
  active: { readonly chainId: string; step: number; readonly startedYear: number } | null;
  /** Chains that have happened in this career (each happens once). */
  readonly done: string[];
}

/** On an offer that is a crisis step. */
export interface CrisisLink {
  readonly chainId: string;
  readonly step: number;
}
