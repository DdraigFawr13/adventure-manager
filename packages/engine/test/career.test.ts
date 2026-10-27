import { describe, expect, it } from 'vitest';
import { PLAYER_ID, type CareerRules, type GameState } from '../src/index.ts';
import { ofType } from './fixture.ts';
import {
  advanceTo,
  testCareer as career,
  foundedGuild,
  play,
  playDays,
  type Run,
  WAGE,
} from './guild-fixture.ts';

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

  it('caps a missed target at maxMiss, and the bottom of a tier above the lowest goes down', () => {
    const run = settle(begun(), (s) => {
      const c = s.guild!.career!; // non-null: careers are on.
      c.tier = 1;
      c.target = 'top-two';
      c.renownThisYear = -1000;
      // Move one bottom-tier rival up so the middle tier keeps six.
      const swap = c.rivals.find((r) => r.tier === 1)!; // non-null: five rivals in the middle tier.
      swap.tier = 0;
    });
    // Last of six against "top two": four places short, 60 capped at 40.
    expect(ofType(run.events, 'patron.reviewed')[0]).toMatchObject({ place: 6, change: -40 });
    expect(ofType(run.events, 'tier.changed')[0]).toMatchObject({ from: 1, to: 0 });
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

  const grace = { years: 2, roster: 3, renown: 30, goalMet: 5, goalMissed: 5 };

  it('gives a new guild growth goals in its grace years instead of a ladder target (D-189)', () => {
    const run = begun({ grace });
    expect(ofType(run.events, 'patron.target')[0]?.target).toBe('growth');
    // Year 1: 3 members (met), 40 renown (met), no house so no room goal; last place doesn't count.
    const one = settle(run, (s) => (s.guild!.career!.renownThisYear = 40)); // non-null: careers are on.
    expect(ofType(one.events, 'patron.reviewed').at(-1)).toMatchObject({
      target: 'growth',
      met: true,
      goals: { roster: true, renown: true, room: null },
      change: 10,
      confidence: 70,
    });
    expect(ofType(one.events, 'patron.target').at(-1)?.target).toBe('growth');
    // Year 2: renown missed (-5), roster met (+5); after the last grace year the ladder target returns.
    const two = settle(one, (s) => (s.guild!.career!.renownThisYear = 10)); // non-null: careers are on.
    expect(ofType(two.events, 'patron.reviewed').at(-1)).toMatchObject({ met: false, change: 0 });
    expect(ofType(two.events, 'patron.target').at(-1)?.target).not.toBe('growth');
  });

  it('counts a room built in the year as a grace goal when the guild has a house, then resets it', () => {
    const house = {
      kinds: [],
      studyPlace: { area: 'hall' as const, floor: 0, cell: 1 },
      cellsPerFloor: 3,
      start: { lowestFloor: 0, highestFloor: 0, plotsPerSide: 0, cells: [] },
      storey: { baseCopper: 1, stepCopper: 1, weeks: 1 },
      cellar: { baseCopper: 1, stepCopper: 1, weeks: 1 },
      wall: { baseCopper: 1, stepCopper: 1, weeks: 1 },
      maxPlotsPerSide: 1,
      winterWeeksBp: 10_000,
      noSickbedBp: 10_000,
      homeTraining: { youngBp: 0, primeBp: 0, placedBp: 0, unplacedBp: 0 },
    };
    const run = foundedGuild(0, { career: { ...career, grace }, house });
    const missed = settle(run);
    expect(ofType(missed.events, 'patron.reviewed').at(-1)?.goals).toEqual({
      roster: false,
      renown: false,
      room: false,
    });
    const built = settle(run, (s) => (s.guild!.career!.roomsThisYear = 1)); // non-null: careers are on.
    expect(ofType(built.events, 'patron.reviewed').at(-1)?.goals?.room).toBe(true);
    expect(built.state.guild!.career!.roomsThisYear).toBe(0); // non-null: careers are on.
  });

  it('cannot dismiss in the grace years, but can at the third Assembly', () => {
    const hopeless = (s: GameState) => {
      s.guild!.career!.confidence = 1; // non-null: careers are on.
      s.guild!.career!.renownThisYear = -1000; // non-null: careers are on.
      s.guild!.chestCopper = -1; // non-null: founded.
    };
    const one = settle(begun({ grace }), hopeless);
    expect(ofType(one.events, 'career.ended')).toEqual([]);
    expect(one.state.guild!.career!.confidence).toBe(1); // non-null: careers are on.
    const two = settle(one, hopeless);
    expect(ofType(two.events, 'career.ended')[0]).toMatchObject({ reason: 'dismissed', years: 2 });
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

describe('the patron emergency grant (D-146)', () => {
  const emergency = { wageWeeks: 8, everyYears: 3, confidenceCost: 15 };
  /** Puts the guild in debt on the last day of a week, then steps into the next week start. */
  function inDebt(run: Run): Run {
    const state = structuredClone(run.state);
    state.calendar = 7 * Math.ceil(state.calendar / 7);
    state.guild!.chestCopper = -100_000; // non-null: founded.
    return play({ ...run, state }, { type: 'day.advance', day: state.calendar + 1 });
  }

  it('offers a guild in debt a grant of weeks of wages, costing confidence only', () => {
    let run = inDebt(begun({ emergency }));
    const offer = ofType(run.events, 'patron.offered')[0];
    expect(offer?.grantCopper).toBe(8 * 3 * WAGE);
    expect(ofType(run.events, 'stop.raised').some((e) => e.reason === 'patron-offer')).toBe(true);
    run = play(run, { type: 'patron.grant', day: run.state.calendar });
    expect(ofType(run.events, 'patron.granted')[0]?.confidence).toBe(45);
    const paid = ofType(run.events, 'money.changed').find((e) => e.reason === 'emergency');
    expect(paid?.amountCopper).toBe(8 * 3 * WAGE);
    // Next year's target is the usual one for a guild that stays down: still "avoid the bottom".
    const targets = ofType(run.events, 'patron.target').length;
    run = settle(run, (s) => (s.guild!.chestCopper = 0)); // non-null: founded.
    // A new target was set at this Assembly, and it is not made harder by the grant.
    expect(ofType(run.events, 'patron.target').length).toBe(targets + 1);
    expect(run.state.guild!.career!.target).toBe('avoid-bottom'); // non-null: careers are on.
  });

  it('lapses after the week, and offers again only after the interval', () => {
    let run = inDebt(begun({ emergency }));
    run = play(run, { type: 'patron.grant', day: run.state.calendar });
    expect(() => play(run, { type: 'patron.grant', day: run.state.calendar })).toThrow(/no grant/);
    run = inDebt(run);
    expect(ofType(run.events, 'patron.offered').length).toBe(1);
    // Once the guild is out of debt the offer can no longer be taken.
    const recovered = inDebt(begun({ emergency }));
    recovered.state.guild!.chestCopper = 10; // non-null: founded.
    expect(() => play(recovered, { type: 'patron.grant', day: recovered.state.calendar })).toThrow(
      /no longer in debt/,
    );
    // An untaken offer lapses at the next week start when the guild is no longer in debt.
    const offered = inDebt(begun({ emergency }));
    expect(offered.state.guild!.career!.emergencyOffer?.week).toBe(2); // non-null: careers are on.
    const state = structuredClone(offered.state);
    state.calendar = 14;
    state.guild!.chestCopper = 100_000; // non-null: founded.
    const lapsed = play({ ...offered, state }, { type: 'day.advance', day: 15 });
    expect(lapsed.state.guild!.career!.emergencyOffer).toBeNull(); // non-null: careers are on.
  });

  it('offers again once the interval since the last grant has passed', () => {
    const after = (lastGrantYear: number) => {
      const run = begun({ emergency });
      const state = structuredClone(run.state);
      state.guild!.career!.lastGrantYear = lastGrantYear; // non-null: careers are on.
      return ofType(inDebt({ ...run, state }).events, 'patron.offered').length;
    };
    // Year 1 now: three years after year -2, two after year -1.
    expect(after(-2)).toBe(1);
    expect(after(-1)).toBe(0);
  });

  it('offers nothing to a guild with nobody on the roster', () => {
    const empty = begun({ emergency });
    const state = structuredClone(empty.state);
    state.guild!.members.length = 0; // non-null: founded.
    const run = inDebt({ ...empty, state });
    expect(ofType(run.events, 'patron.offered').length).toBe(0);
  });
});
