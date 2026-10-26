// Values explain themselves (PLAN §11h, D-114): a game number carries its parts and the
// cause of its last change, so hover breakdowns and the Trace read them instead of rebuilding.

/** One contribution to a value, e.g. a sword's +2 or a wound's -3. */
export interface ValuePart {
  readonly sourceId: string;
  readonly amount: number;
}

export interface Value {
  readonly base: number;
  readonly parts: readonly ValuePart[];
  readonly total: number;
  /** The command or event that last changed this value. */
  readonly causeId: string;
}

function assertWhole(amount: number, label: string): void {
  if (!Number.isSafeInteger(amount)) throw new Error(`${label} must be a whole number: ${amount}.`);
}

export function makeValue(base: number, causeId: string, parts: readonly ValuePart[] = []): Value {
  assertWhole(base, 'Base');
  let total = base;
  for (const part of parts) {
    assertWhole(part.amount, `Part ${part.sourceId}`);
    total += part.amount;
  }
  return { base, parts, total, causeId };
}

/** Adds a part, or replaces the part from the same source. */
export function withPart(value: Value, part: ValuePart, causeId: string): Value {
  const parts = value.parts.filter((p) => p.sourceId !== part.sourceId);
  return makeValue(value.base, causeId, [...parts, part]);
}

export function withoutPart(value: Value, sourceId: string, causeId: string): Value {
  return makeValue(
    value.base,
    causeId,
    value.parts.filter((p) => p.sourceId !== sourceId),
  );
}
