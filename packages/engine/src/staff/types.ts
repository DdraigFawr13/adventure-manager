// Shapes for staff v0 (SPEC.md). Content supplies StaffRules; the engine only reads them.
import type { Band } from '../career/types.ts';

export type Area = 'training' | 'recovery';
export const AREAS: readonly Area[] = ['training', 'recovery'];

export interface StaffRules {
  /** The guildmaster's starting skill per area, and the most it can grow to. */
  readonly guildmasterSkill: Band;
  readonly skillCap: number;
  /** Chance at each Assembly that an area the guildmaster ran all year gains a point; lower from `nearCapFrom` up. */
  readonly growBp: number;
  readonly growNearCapBp: number;
  readonly nearCapFrom: number;
  /** Candidates listed per area at each Assembly, their quality, and the weekly wage they ask. */
  readonly candidatesPerArea: number;
  readonly quality: Band;
  readonly wageBaseCopper: number;
  readonly wageStepCopper: number;
  /** Effect per skill point above or below 10, in basis points. */
  readonly trainingStepBp: number;
  readonly recoveryStepBp: number;
  /** The guildmaster running training raises a digest stop every this many campaigning weeks. */
  readonly trainingPlanEveryWeeks: number;
}

export interface StaffMember {
  readonly id: string;
  readonly quality: number;
  readonly wageCopper: number;
}

export interface StaffCandidate extends StaffMember {
  readonly area: Area;
}

export interface StaffState {
  readonly skills: Record<Area, number>;
  readonly staff: Partial<Record<Area, StaffMember>>;
  readonly candidates: StaffCandidate[];
  /** Whether the guildmaster has run the area since the last Assembly without a break. */
  readonly ranAllYear: Record<Area, boolean>;
  nextNo: number;
}
