import { describe, expect, it } from 'vitest';
import { PLAYER_ID, type CareerRules, type GameState } from '../src/index.ts';
import { ofType } from './fixture.ts';
import { advanceTo, foundedGuild, play, playDays, type Run } from './guild-fixture.ts';

const career: CareerRules = {
  guildsPerTier: 6,
  tiers: [0, 1, 2].map((t) => ({
    dangerWeights: { routine: 0, hazardous: 1, perilous: 0, deadly: 0 },
    feeBp: 10_000 + 1000 * t,
    grantCopper: 1000 * (t + 1),
    rivalMean: 50,
    rivalContracts: 10,
    rivalRenown: 15,
  })),
  drawAge: { min: 20, max: 20 },
  potential: { min: 4, max: 4 },
  primeAge: 32,
  growth: { youngAge: 24, youngBp: 0, primeBp: 0 },
  declineStepBp: 0,
  declineMaxBp: 0,
  retireStepBp: 0,
  retireMaxBp: 0,
  rivalWin: { baseBp: 5000, stepBp: 0, minBp: 5000, maxBp: 5000 },
  dangerDifficulty: { routine: 20, hazardous: 40, perilous: 60, deadly: 80 },
  rivalSpread: 0,
  rivalDrift: { pullDiv: 3, renownPerPoint: 25, noise: 0 },
  patron: { start: 60, met: 15, perPlaceShort: 15, maxMiss: 40, debt: 15, max: 100 },
  guildmaster: { age: { min: 40, max: 40 }, healthFromAge: 90, certainAge: 99 },
};
const YEAR = 48 * 7;

function begun(rules: Partial<CareerRules> = {}, size = 3): Run {
  return foundedGuild(size, { career: { ...career, ...rules } });
}

/** Jumps to the last day of the year (nothing happens between) and steps into the next Assembly. */
function settle(run: Run, adjust: (s: GameState) => void = () => {}): Run {
  const state = structuredClone(run.state);
  state.calendar = YEAR * Math.ceil(state.calendar / YEAR);
  state.guild!.board.length = 0; // non-null: founded.
  adjust(state);
  return play({ ...run, state }, { type: 'day.advance', day: state.calendar + 1 });
}

describe('careers (career SPEC.md)', () => {
  it('starts the founded guild in the bottom tier with 17 rivals and a first target', () => {
    const run = begun();
    const c = run.state.guild!.career!; // non-null: careers are on.
    expect(c.tier).toBe(0);
    expect(c.rivals.map((r) => r.tier).sort()).toEqual([
      0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2,
    ]);
    expect(ofType(run.events, 'patron.target')[0]?.target).toBe('avoid-bottom');
    // Drawn people get a birth year and a potential above each attribute.
    const someone = run.state.roster[0]!; // non-null: three were drawn.
    expect(someone.birthYear).toBe(1 - 20);
    expect(someone.potential?.might).toBe(someone.attributes.might + 4);
  });

  it('runs past the first year, counting weeks within the year', () => {
    const run = settle(begun());
    const week = ofType(run.events, 'week.started').at(-1);
    expect([week?.week, week?.year]).toEqual([1, 2]);
    // Without careers the year still ends at week 48.
    const plain = foundedGuild(3);
    const last = { ...plain, state: { ...structuredClone(plain.state), calendar: YEAR } };
    expect(() => play(last, { type: 'day.advance', day: YEAR + 1 })).toThrow(/year is over/);
  });

  it("settles the ladder by the year's renown: the top of a tier goes up, its target changes", () => {
    const run = settle(begun(), (s) => (s.guild!.career!.renownThisYear = 1000)); // non-null: careers are on.
    const settled = ofType(run.events, 'year.settled')[0];
    expect(settled?.standings[0]?.id).toBe(PLAYER_ID);
    expect(settled?.standings.length).toBe(6);
    expect(settled?.leaders.length).toBe(3);
    expect(ofType(run.events, 'tier.changed')[0]).toMatchObject({ from: 0, to: 1 });
    expect(run.state.guild!.career!.tier).toBe(1); // non-null: careers are on.
    // A newly promoted guild is asked to stay up; the renown count starts again.
    expect(ofType(run.events, 'patron.target').at(-1)?.target).toBe('avoid-bottom');
    expect(run.state.guild!.career!.renownThisYear).toBe(0); // non-null: careers are on.
    // The new tier's grant is paid.
    expect(
      ofType(run.events, 'money.changed').find((e) => e.reason === 'grant' && e.day > YEAR)
        ?.amountCopper,
    ).toBe(2000);
  });

  it('the patron reviews the target: met raises confidence, missing it and debt lower it', () => {
    const met = settle(begun(), (s) => (s.guild!.career!.renownThisYear = 1000)); // non-null: careers are on.
    expect(ofType(met.events, 'patron.reviewed')[0]).toMatchObject({
      met: true,
      change: 15,
      confidence: 75,
    });
    const missed = settle(begun(), (s) => {
      s.guild!.career!.renownThisYear = -1000; // non-null: careers are on.
      s.guild!.chestCopper = -1; // non-null: founded.
    });
    // Last of six against "avoid the bottom place" (5th at worst): one place short, and in debt.
    expect(ofType(missed.events, 'patron.reviewed')[0]).toMatchObject({
      place: 6,
      met: false,
      inDebt: true,
      change: -30,
      confidence: 30,
    });
  });

  it('dismisses the guildmaster when confidence runs out, and the guild stops', () => {
    const run = settle(begun(), (s) => {
      s.guild!.career!.confidence = 10; // non-null: careers are on.
      s.guild!.career!.renownThisYear = -1000; // non-null: careers are on.
    });
    expect(ofType(run.events, 'career.ended')[0]).toMatchObject({ reason: 'dismissed', years: 1 });
    expect(ofType(run.events, 'stop.raised').some((e) => e.reason === 'career-ended')).toBe(true);
    expect(() => play(run, { type: 'day.advance', day: run.state.calendar + 1 })).toThrow(
      /career is over/,
    );
  });

  it('retires the guildmaster on health once past the age', () => {
    const run = settle(
      begun({ guildmaster: { age: { min: 70, max: 70 }, healthFromAge: 60, certainAge: 70 } }),
    );
    expect(ofType(run.events, 'career.ended')[0]).toMatchObject({ reason: 'retired' });
  });

  it('ages people past their prime: physical points fall, and those who ask retire off the wages', () => {
    const run = settle(
      begun({
        declineStepBp: 10_000,
        declineMaxBp: 10_000,
        retireStepBp: 10_000,
        retireMaxBp: 10_000,
      }),
      (s) => {
        for (const a of s.roster) Object.assign(a, { birthYear: -40 });
      },
    );
    const changed = ofType(run.events, 'attribute.changed');
    expect(changed.length).toBe(9);
    for (const e of changed) expect([e.reason, e.to - e.from]).toEqual(['age', -1]);
    expect(ofType(run.events, 'adventurer.retired').length).toBe(3);
    expect(run.state.guild!.members.length).toBe(0); // non-null: founded.
    expect(run.state.roster.every((a) => a.retiredYear === 2)).toBe(true);
  });

  it('grows survivors by doing, up to their potential, and a lasting injury costs a physical point', () => {
    const run = playDays(begun({ growth: { youngAge: 24, youngBp: 10_000, primeBp: 10_000 } }), 60);
    const growth = ofType(run.events, 'attribute.changed').filter((e) => e.reason === 'growth');
    expect(growth.length).toBeGreaterThan(0);
    for (const e of growth) expect(e.to - e.from).toBe(1);
    for (const a of run.state.roster)
      for (const [k, v] of Object.entries(a.attributes))
        expect(v).toBeLessThanOrEqual(a.potential?.[k as keyof typeof a.attributes] ?? 20);
    const injuries = ofType(run.events, 'injury.gained').length;
    const losses = ofType(run.events, 'attribute.changed').filter((e) => e.reason === 'injury');
    // Attributes start at 10-12, far above the floor of 1, so every injury costs exactly one point.
    expect(injuries).toBeGreaterThan(0);
    expect(losses.length).toBe(injuries);
    for (const e of losses) expect(['might', 'agility', 'toughness']).toContain(e.attribute);
  });

  it("prices the board by the guild's tier", () => {
    const run = settle(begun(), (s) => (s.guild!.career!.renownThisYear = 1000)); // non-null: careers are on.
    const after = advanceTo(run, run.state.calendar + 7);
    const fresh = ofType(after.events, 'offer.posted').filter((e) => e.day > YEAR);
    expect(fresh.length).toBeGreaterThan(0);
    // The fixture's fee is 1000 with no spread; the middle tier pays 110%.
    for (const e of fresh) expect(e.feeCopper).toBe(1100);
  });
});
