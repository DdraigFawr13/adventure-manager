// Intervals for balance metrics (tools/balance/README.md). A metric is a number computed from a
// list of careers, so one method serves every metric, ratios and medians included: resample the
// careers (seeds) with replacement and recompute. A paired comparison resamples the same seeds on
// both sides, so luck that both sides share (the same seed's draws) cancels out.
import { pct } from '../career-play.ts';

export const RESAMPLES = 1000;

/** mulberry32: a small seeded generator, so the same run prints the same intervals. */
function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** RESAMPLES lists of indices into n seeds, the same for every metric in a run. */
export function resamples(n: number, count = RESAMPLES): number[][] {
  const next = generator(n * 7919 + count);
  return Array.from({ length: count }, () =>
    Array.from({ length: n }, () => Math.floor(next() * n)),
  );
}

export interface Estimate {
  readonly value: number;
  /** The 95% interval (2.5th to 97.5th percentile of the resampled values). */
  readonly low: number;
  readonly high: number;
}

const interval = (value: number, values: number[]): Estimate => {
  const finite = values.filter(Number.isFinite);
  return { value, low: pct(finite, 2.5), high: pct(finite, 97.5) };
};

export function estimate<T>(items: readonly T[], compute: (xs: T[]) => number, draws: number[][]) {
  const value = compute([...items]);
  return interval(
    value,
    draws.map((d) => compute(d.map((i) => items[i]!))), // non-null: indices are below items.length.
  );
}

/** B minus A over the same seeds (a[i] and b[i] are one seed played two ways). */
export function pairedDifference<T>(
  a: readonly T[],
  b: readonly T[],
  compute: (xs: T[]) => number,
  draws: number[][],
): Estimate {
  if (a.length !== b.length)
    throw new Error('A paired comparison needs the same seeds on both sides.');
  const value = compute([...b]) - compute([...a]);
  return interval(
    value,
    draws.map(
      (d) => compute(d.map((i) => b[i]!)) - compute(d.map((i) => a[i]!)), // non-null: as above.
    ),
  );
}
