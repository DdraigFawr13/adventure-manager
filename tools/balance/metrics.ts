// Balance metrics and their targets (tools/balance/README.md). Each metric is a number computed
// from a list of careers. Most compute what tools/career-sim.ts reports; three differ on purpose:
// deaths and stop days a year are means (career-sim prints medians), because a median of whole
// numbers doesn't move with small changes, and renown is the median of the player's lead over the
// median rival each year (career-sim prints the two medians apart). A target names the decision or
// PLAN line it comes from; the "±25%" bands borrow R2's pass line (PLAN §9a, medians within ±25%)
// and are applied here to the mean.
import { PLAYER_ID } from '@adventure-manager/engine';
import { pct, type Career } from '../career-play.ts';

export interface Target {
  readonly min?: number;
  readonly max?: number;
  readonly source: string;
}

export interface MetricContext {
  /** The copper a guild starts with (the draft's purse with the house on): §9d's bad-start line. */
  readonly startCopper: number;
  readonly house: boolean;
  readonly incidents: boolean;
}

export interface Metric {
  readonly id: string;
  readonly label: string;
  readonly digits: number;
  readonly compute: (careers: Career[], ctx: MetricContext) => number;
  readonly target?: Target;
  readonly when?: (ctx: MetricContext) => boolean;
}

const median = (v: number[]) => pct(v, 50);
const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN);
const share = <T>(xs: T[], keep: (x: T) => boolean) =>
  xs.length ? (100 * xs.filter(keep).length) / xs.length : NaN;
const TIERS = ['bottom', 'middle', 'top'] as const;

/** One value per settled year the career spent in the tier. */
const inTier = (cs: Career[], tier: number, pick: (c: Career, y: number) => number | undefined) =>
  cs.flatMap((c) =>
    c.tierByYear.flatMap((t, y) => {
      const v = t === tier ? pick(c, y) : undefined;
      return v === undefined ? [] : [v];
    }),
  );
const perCareerYear = (cs: Career[], pick: (c: Career) => number[]) =>
  cs.flatMap((c) => Array.from({ length: c.years }, (_, y) => pick(c)[y] ?? 0));

/** §9d's bad start (as career-sim.ts): in debt at a week start in years 1–2, or the chest less grant money below half the start after 2 years. */
export const isBadStart = (c: Career, ctx: MetricContext) =>
  (c.firstOfferYear !== null && c.firstOfferYear <= 2) ||
  (c.chestByYear[1] ?? c.chestByYear[0] ?? 0) - c.earlyGrantCopper < ctx.startCopper / 2;

/** R2's runaway: one rival tops the top tier in over 2/3 of the first 30 settled years. */
const hasRunaway = (c: Career) => {
  const span = c.topLeaders.slice(0, 30).filter(Boolean);
  if (span.length < 10) return false;
  const counts = new Map<string, number>();
  for (const id of span) if (id !== PLAYER_ID) counts.set(id, (counts.get(id) ?? 0) + 1);
  return Math.max(0, ...counts.values()) > (2 * span.length) / 3;
};

/** A middle-tier year's surplus before house money (D-172), as career-sim.ts reports it. */
const middleSurplus = (cs: Career[]) =>
  median(
    cs.flatMap((c) =>
      c.tierByYear.flatMap((tier, y) => {
        const now = c.chestByYear[y];
        const before = c.chestByYear[y - 1];
        return tier === 1 && y >= 1 && now !== undefined && before !== undefined
          ? [now - before + (c.houseMoneyByYear[y] ?? 0)]
          : [];
      }),
    ),
  );

const tierMetrics: Metric[] = TIERS.flatMap((name, t) => [
  {
    id: `deaths.${name}`,
    label: `deaths a year, ${name} tier (mean)`,
    digits: 2,
    compute: (cs) => mean(inTier(cs, t, (c, y) => c.deathsByYear[y] ?? 0)),
    target: { min: 1.5, max: 2.5, source: 'D-137 ~2, ±25%' },
  },
  {
    id: `stops.${name}`,
    label: `stop days a year, ${name} tier (mean)`,
    digits: 1,
    compute: (cs) => mean(inTier(cs, t, (c, y) => c.stopsByYear[y] ?? 0)),
    target: t === 2 ? { max: 130, source: '§9d top guild' } : { max: 100, source: 'R3' },
  },
  {
    id: `renown.${name}`,
    label: `renown a year, ${name} tier: player minus median rival (median)`,
    digits: 0,
    compute: (cs) =>
      median(
        inTier(cs, t, (c, y) => {
          const mine = c.myRenown[y];
          const theirs = c.rivalRenown[y];
          return mine === undefined || theirs === undefined ? undefined : mine - theirs;
        }),
      ),
  },
]);

const houseOn = (ctx: MetricContext) => ctx.house;

export const METRICS: readonly Metric[] = [
  {
    id: 'career.years',
    label: 'guildmaster career, years (median)',
    digits: 0,
    compute: (cs) => median(cs.map((c) => c.years)),
    target: { min: 20, max: 30, source: 'R9' },
  },
  {
    id: 'career.dismissed',
    label: 'careers ending in dismissal (%)',
    digits: 1,
    compute: (cs) => share(cs, (c) => c.end === 'dismissed'),
  },
  {
    id: 'career.retired',
    label: 'careers ending in retirement (%)',
    digits: 1,
    compute: (cs) => share(cs, (c) => c.end === 'retired'),
  },
  {
    id: 'promotion.share',
    label: 'promoted at least once (%)',
    digits: 1,
    compute: (cs) => share(cs, (c) => c.firstPromotion !== null),
  },
  {
    id: 'promotion.year',
    label: 'first promotion, year (median of the promoted)',
    digits: 0,
    compute: (cs) => median(cs.flatMap((c) => c.firstPromotion ?? [])),
    target: { min: 3, max: 5, source: 'R2 well-run founded guild' },
  },
  {
    id: 'tier.top',
    label: 'reached the top tier (%)',
    digits: 1,
    compute: (cs) => share(cs, (c) => c.tierByYear.includes(2)),
  },
  {
    id: 'rival.runaway',
    label: 'careers with a runaway rival (%)',
    digits: 1,
    compute: (cs) => share(cs, hasRunaway),
    target: { max: 0, source: 'R2' },
  },
  ...tierMetrics,
  {
    id: 'chest.year1',
    label: 'chest at the end of year 1, copper (median)',
    digits: 0,
    compute: (cs) => median(cs.map((c) => c.chestByYear[0] ?? 0)),
  },
  {
    id: 'start.bad',
    label: 'bad starts (%)',
    digits: 1,
    compute: (cs, ctx) => share(cs, (c) => isBadStart(c, ctx)),
  },
  {
    id: 'start.recovered',
    label: 'bad starts lasting 10+ years (% of bad starts)',
    digits: 1,
    compute: (cs, ctx) =>
      share(
        cs.filter((c) => isBadStart(c, ctx)),
        (c) => c.years >= 10,
      ),
    target: { min: 50, source: '§4g most recover' },
  },
  {
    id: 'grants.careers',
    label: 'careers taking an emergency grant (%)',
    digits: 1,
    compute: (cs) => share(cs, (c) => c.grants > 0),
  },
  {
    id: 'crisis.woke',
    label: 'crisis woke in years 5–15 (% of careers reaching year 10)',
    digits: 1,
    compute: (cs) =>
      share(
        cs.filter((c) => c.years >= 10),
        (c) => c.crisisYear !== null && c.crisisYear >= 5 && c.crisisYear <= 15,
      ),
  },
  {
    id: 'crisis.years',
    label: 'years from crisis waking to its end (median)',
    digits: 0,
    compute: (cs) =>
      median(
        cs.flatMap((c) =>
          c.crisisEnded !== null && c.crisisYear !== null ? c.crisisEnded - c.crisisYear : [],
        ),
      ),
  },
  {
    id: 'growth.quests',
    label: 'attribute points a year from quests (median per career-year)',
    digits: 0,
    compute: (cs) => median(perCareerYear(cs, (c) => c.growthByYear)),
  },
  {
    id: 'growth.home',
    label: 'attribute points a year from training at home (median per career-year)',
    digits: 0,
    compute: (cs) => median(perCareerYear(cs, (c) => c.trainingByYear)),
    when: houseOn,
  },
  {
    id: 'house.completed',
    label: 'full house plan completed (%)',
    digits: 1,
    compute: (cs) => share(cs, (c) => c.houseCompleted !== null),
    when: houseOn,
  },
  {
    id: 'house.year',
    label: 'full house plan completed, year (median of finishers)',
    digits: 0,
    compute: (cs) => median(cs.flatMap((c) => c.houseCompleted ?? [])),
    when: houseOn,
  },
  {
    id: 'house.costYears',
    label: 'full house cost in middle-tier surpluses, years (median)',
    digits: 1,
    compute: (cs) => {
      const surplus = middleSurplus(cs);
      return median(
        cs.flatMap((c) => (c.houseCompleted !== null ? c.houseCostCopper / surplus : [])),
      );
    },
    target: { min: 8, max: 12, source: 'D-172' },
    when: houseOn,
  },
  {
    id: 'house.upkeepShare',
    label: 'room upkeep, % of all spending in years 10+ (median)',
    digits: 1,
    compute: (cs) =>
      median(
        cs
          .filter((c) => c.spendingLateCopper > 0)
          .map((c) => (100 * c.roomsLateCopper) / c.spendingLateCopper),
      ),
    target: { min: 15, max: 25, source: 'D-185 near 20%, ±25%' },
    when: houseOn,
  },
  {
    id: 'incidents.perYear',
    label: 'house incidents a year (mean over career-years)',
    digits: 2,
    compute: (cs) => {
      const years = cs.reduce((n, c) => n + c.years, 0);
      const count = cs.reduce(
        (n, c) => n + Object.values(c.incidentsByKind).reduce((a, b) => a + b, 0),
        0,
      );
      return years ? count / years : NaN;
    },
    target: { min: 1, max: 2, source: 'D-173' },
    when: (ctx) => ctx.incidents,
  },
  {
    id: 'incidents.burntBarracks',
    label: 'fires that burned out a barracks cell (%)',
    digits: 1,
    compute: (cs) => {
      const fires = cs.reduce((n, c) => n + c.fires, 0);
      return fires ? (100 * cs.reduce((n, c) => n + c.firesBurntBarracks, 0)) / fires : NaN;
    },
    when: (ctx) => ctx.incidents,
  },
];

/** The metrics that apply to a run, house lines only with the house on. */
export const metricsFor = (ctx: MetricContext) => METRICS.filter((m) => m.when?.(ctx) ?? true);
