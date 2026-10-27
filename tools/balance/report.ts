// Text tables for tools/balance/run.ts: one row per metric with its 95% interval and target, and
// for comparisons the paired change with its interval ("moved" only when the interval excludes 0).
import type { Career } from '../career-play.ts';
import type { Metric, MetricContext, Target } from './metrics.ts';
import { estimate, paired, type Estimate } from './stats.ts';

export interface Row {
  readonly id: string;
  readonly label: string;
  readonly now: Estimate;
  readonly target?: Target;
  readonly verdict: string;
  readonly referenceValue?: number;
  readonly change?: Estimate;
  readonly moved?: boolean;
}

/** ok: inside the band; near: the interval reaches the band; OFF: the whole interval misses it. */
export function verdict(e: Estimate, t: Target | undefined): string {
  if (!t || !Number.isFinite(e.value)) return '';
  const inBand = (v: number) =>
    (t.min === undefined || v >= t.min) && (t.max === undefined || v <= t.max);
  if (inBand(e.value)) return 'ok';
  const reaches =
    (t.min === undefined || e.high >= t.min) && (t.max === undefined || e.low <= t.max);
  return reaches ? 'near' : 'OFF';
}

export function rows(
  metrics: readonly Metric[],
  ctx: MetricContext,
  careers: readonly Career[],
  draws: number[][],
  reference?: readonly Career[],
): Row[] {
  return metrics.map((m) => {
    const compute = (cs: Career[]) => m.compute(cs, ctx);
    const both = reference ? paired(reference, careers, compute, draws) : null;
    const now = both?.now ?? estimate(careers, compute, draws);
    const base = { id: m.id, label: m.label, now, verdict: verdict(now, m.target) };
    const withTarget = m.target ? { ...base, target: m.target } : base;
    if (!reference || !both) return withTarget;
    return {
      ...withTarget,
      referenceValue: compute([...reference]),
      change: both.change,
      moved: both.change.low > 0 || both.change.high < 0,
    };
  });
}

const fmt = (v: number, digits: number) => (Number.isFinite(v) ? v.toFixed(digits) : '—');
const span = (e: Estimate, d: number) => `${fmt(e.low, d)}–${fmt(e.high, d)}`;
const signed = (v: number, d: number) => (v > 0 ? `+${fmt(v, d)}` : fmt(v, d));
const targetText = (t: Target | undefined) =>
  !t
    ? ''
    : `${t.min !== undefined && t.max !== undefined ? `${t.min}–${t.max}` : t.min !== undefined ? `≥ ${t.min}` : `≤ ${t.max}`} (${t.source})`;

export function printRows(rs: readonly Row[], metrics: readonly Metric[], refName?: string): void {
  const digits = new Map(metrics.map((m) => [m.id, m.digits]));
  const w = Math.max(...rs.map((r) => r.label.length));
  for (const r of rs) {
    const d = digits.get(r.id) ?? 1;
    const now = `${fmt(r.now.value, d).padStart(9)} [${span(r.now, d)}]`.padEnd(30);
    if (r.change && r.referenceValue !== undefined)
      console.log(
        `${r.label.padEnd(w)}  ${fmt(r.referenceValue, d).padStart(9)} → ${now} ${`${signed(r.change.value, d)} [${span(r.change, d)}]`.padEnd(26)} ${r.moved ? 'MOVED' : '     '}  ${r.verdict.padEnd(4)} ${targetText(r.target)}`,
      );
    else console.log(`${r.label.padEnd(w)}  ${now} ${r.verdict.padEnd(4)} ${targetText(r.target)}`);
  }
  if (refName)
    console.log(
      `\n${refName} → this run; change = this run minus ${refName}, paired by seed, 95% interval. MOVED: the interval excludes 0.`,
    );
}

/** A sweep: one column per value, each the value and its paired change from the reference. */
export function printSweep(
  metrics: readonly Metric[],
  ctx: MetricContext,
  reference: readonly Career[],
  variants: readonly { label: string; careers: readonly Career[] }[],
  draws: number[][],
): void {
  const w = Math.max(...metrics.map((m) => m.label.length));
  console.log(
    `${''.padEnd(w)}  ${'reference'.padStart(12)}  ${variants.map((v) => v.label.padStart(22)).join('')}`,
  );
  for (const m of metrics) {
    const compute = (cs: Career[]) => m.compute(cs, ctx);
    const cells = variants.map((v) => {
      const c = paired(reference, v.careers, compute, draws).change;
      const mark = c.low > 0 || c.high < 0 ? '*' : ' ';
      return `${fmt(compute([...v.careers]), m.digits)} (${signed(c.value, m.digits)})${mark}`.padStart(
        22,
      );
    });
    console.log(
      `${m.label.padEnd(w)}  ${fmt(compute([...reference]), m.digits).padStart(12)}  ${cells.join('')}  ${targetText(m.target)}`,
    );
  }
  console.log(
    '\n(change from the reference, paired by seed); * the 95% interval of the change excludes 0.',
  );
}
