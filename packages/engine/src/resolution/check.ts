// Percent-chance checks (D-119, SPEC.md "Checks"): a chance Value with named parts, one roll.
import { clamp, divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, type RngStream } from '../core/rng.ts';
import { makeValue, type Value, type ValuePart } from '../core/value.ts';
import type { CheckOutcome } from './types.ts';

/** The one draw a check needs; tests pass a fixed roll. */
export type Draw = Pick<RngStream, 'int'>;

/** Adds a clamp part when the parts push the total outside the limits, so the hover still adds up. */
export function chanceValue(
  baseBp: number,
  parts: readonly ValuePart[],
  minBp: number,
  maxBp: number,
  causeId: string,
): Value {
  const raw = makeValue(baseBp, causeId, parts);
  const clamped = clamp(raw.total, minBp, maxBp);
  if (clamped === raw.total) return raw;
  return makeValue(baseBp, causeId, [
    ...parts,
    { sourceId: 'rule.clamp', amount: clamped - raw.total },
  ]);
}

export interface Roll {
  /** 1–10,000. */
  readonly roll: number;
  readonly outcome: CheckOutcome;
}

/**
 * One draw. A success in the lowest `strongShareBp` of the chance is strong; a failure in the
 * highest `badShareBp` of the failure band is bad.
 */
export function rollCheck(
  stream: Draw,
  chanceBp: number,
  strongShareBp: number,
  badShareBp: number,
): Roll {
  const roll = stream.int(BP_CERTAIN) + 1;
  if (roll <= chanceBp) {
    const strong = roll <= divRoundDown(chanceBp * strongShareBp, BP_CERTAIN);
    return { roll, outcome: strong ? 'strong-success' : 'success' };
  }
  const badFrom = BP_CERTAIN - divRoundDown((BP_CERTAIN - chanceBp) * badShareBp, BP_CERTAIN);
  return { roll, outcome: roll > badFrom ? 'bad-failure' : 'failure' };
}

export function succeeded(outcome: CheckOutcome): boolean {
  return outcome === 'success' || outcome === 'strong-success';
}
