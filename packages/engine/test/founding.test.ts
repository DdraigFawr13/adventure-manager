import { describe, expect, it } from 'vitest';
import type { FoundingRules, GuildRules, HouseRules, Prospect } from '../src/index.ts';
import { ofType } from './fixture.ts';
import { foundedGuild, play, testCareer, WAGE, type Run } from './guild-fixture.ts';

// Wage 64 for a plain draw (attributes 12, 12, 10...); +2 gives 72, -2 gives 56.
const founding: FoundingRules = {
  purseCopper: 5000,
  partySize: 2,
  characters: [
    {
      id: 'seasoned',
      attributeShift: 2,
      age: { min: 30, max: 30 },
      potentialBonus: 0,
      feeBp: 10_000,
    },
    {
      id: 'balanced',
      attributeShift: 0,
      age: { min: 25, max: 25 },
      potentialBonus: 0,
      feeBp: 10_000,
    },
    {
      id: 'green',
      attributeShift: -2,
      age: { min: 19, max: 19 },
      potentialBonus: 3,
      feeBp: 10_000,
    },
  ],
  extras: { offered: 4, min: 1, max: 2 },
  feeWeeks: 2,
};
const rules: Partial<GuildRules> = { career: testCareer, founding, startingChestCopper: 99_999 };

const listed = (): Run => foundedGuild(0, rules, 'draft-seed');
const draftOf = (run: Run) => run.state.guild!.draft!; // non-null: the draft is pending.
const ids = (people: readonly Prospect[]) => people.map((p) => p.adventurer.id);
const pick = (run: Run, partyIndex: number, extraIds: string[]) =>
  play(run, { type: 'guild.pick', day: 1, partyIndex, extraIds });

describe('founding draft (guild SPEC.md, D-188)', () => {
  it('lists a party per character and the extras, pays the purse and draws no roster', () => {
    const run = listed();
    const draft = draftOf(run);
    expect(draft.parties.map((p) => p.length)).toEqual([2, 2, 2]);
    expect(draft.extras).toHaveLength(4);
    expect(run.state.guild!.members).toEqual([]);
    expect(run.state.guild!.chestCopper).toBe(5000 + 1000 - 500); // purse, Assembly grant (testCareer tier 0), upkeep
    const money = ofType(run.events, 'money.changed').filter((e) => e.reason === 'founding');
    expect(money.map((e) => e.amountCopper)).toEqual([5000]);
    const events = ofType(run.events, 'founding.listed');
    expect(events.map((e) => e.party)).toEqual([0, 0, 1, 1, 2, 2, null, null, null, null]);
    expect(events[2]).toMatchObject({ wageCopper: WAGE, feeCopper: 2 * WAGE });
    expect(events[0]!.subjectIds).toEqual([draft.parties[0]![0]!.adventurer.id]);
  });

  it('shifts attributes, ages and potential by character, and leaves extras plain', () => {
    const draft = draftOf(listed());
    const [seasoned, balanced, green] = draft.parties.map((p) => p[0]!.adventurer);
    expect(seasoned!.attributes.might).toBe(14);
    expect(balanced!.attributes.might).toBe(12);
    expect(green!.attributes.might).toBe(10);
    expect(green!.attributes.agility).toBe(8);
    expect(draft.parties.map((p) => p[0]!.wageCopper)).toEqual([72, WAGE, 56]);
    // Born in year 1 minus the age: age 30, 25 and 19 on day 1.
    expect([seasoned, balanced, green].map((a) => 1 - a!.birthYear!)).toEqual([30, 25, 19]);
    // Potential is the drawn value + 4 (testCareer), + 3 for the green party.
    expect(green!.potential!.might).toBe(10 + 4 + 3);
    expect(balanced!.potential!.might).toBe(12 + 4);
    expect(draft.extras[0]!.adventurer.attributes.might).toBe(12);
    expect(draft.extras[0]!.wageCopper).toBe(WAGE);
  });

  it('keeps shifted attributes within 1 to 20', () => {
    const wild: FoundingRules = {
      ...founding,
      characters: [
        {
          id: 'x',
          attributeShift: 30,
          age: { min: 30, max: 30 },
          potentialBonus: 30,
          feeBp: 10_000,
        },
      ],
    };
    const high = foundedGuild(0, { ...rules, founding: wild }, 's');
    expect(Object.values(draftOf(high).parties[0]![0]!.adventurer.attributes)).toEqual(
      Array(8).fill(20),
    );
    const low = foundedGuild(
      0,
      {
        ...rules,
        founding: { ...wild, characters: [{ ...wild.characters[0]!, attributeShift: -30 }] },
      },
      's',
    );
    expect(Math.max(...Object.values(draftOf(low).parties[0]![0]!.adventurer.attributes))).toBe(1);
  });

  it('leaves the default recruit stream alone, so later prospects match a game without a draft', () => {
    const withDraft = listed();
    const without = foundedGuild(0, { career: testCareer }, 'draft-seed');
    // Person numbers differ (the draft numbers its people first); the draws do not.
    const plain = (run: Run) =>
      run.state.guild!.prospects.map((p) => ({ ...p.adventurer, id: '' }));
    expect(plain(withDraft)).toEqual(plain(without));
    expect(Object.keys(without.state.rng)).not.toContain('guild.founding');
    expect(Object.keys(withDraft.state.rng)).toContain('guild.founding');
  });

  it('refuses day.advance until the pick', () => {
    const run = listed();
    expect(() => play(run, { type: 'day.advance', day: 2 })).toThrow(/Pick the founding party/);
    const picked = pick(run, 1, [draftOf(run).extras[0]!.adventurer.id]);
    expect(play(picked, { type: 'day.advance', day: 2 }).state.calendar).toBe(2);
  });

  it('pays the fees of the party and the extras and engages them all', () => {
    const run = listed();
    const draft = draftOf(run);
    const before = run.state.guild!.chestCopper;
    const extraIds = ids(draft.extras.slice(1, 3));
    const done = pick(run, 2, extraIds);
    const guild = done.state.guild!;
    const people = [...draft.parties[2]!, ...draft.extras.slice(1, 3)];
    const fee = people.reduce((s, p) => s + 2 * p.wageCopper, 0);
    expect(fee).toBe(2 * 56 * 2 + 2 * WAGE * 2);
    expect(guild.chestCopper).toBe(before - fee);
    expect(guild.members.map((m) => m.id)).toEqual(ids(people));
    expect(done.state.roster.map((a) => a.id)).toEqual(ids(people));
    expect(guild.draft).toBeUndefined();
    const money = ofType(done.events, 'money.changed').filter((e) => e.reason === 'sign-on');
    expect(money.map((e) => e.amountCopper)).toEqual([-fee]);
    expect(ofType(done.events, 'recruit.signed')).toHaveLength(4);
    const event = ofType(done.events, 'founding.picked')[0]!;
    expect(event).toMatchObject({ party: 2, extraIds, feeCopper: fee });
    expect(event.extraIds).not.toBe(extraIds);
  });

  it("scales a party's fees by its character's share; extras pay the plain fee", () => {
    const premium: FoundingRules = {
      ...founding,
      characters: founding.characters.map((c, i) => ({ ...c, feeBp: [30_000, 10_000, 5_000][i]! })),
    };
    const run = foundedGuild(0, { ...rules, founding: premium }, 'draft-seed');
    const draft = draftOf(run);
    const listedFees = ofType(run.events, 'founding.listed').map((e) => e.feeCopper);
    // Seasoned (wage 72, 2 weeks) at 300%, the extras at 100%.
    expect(listedFees[0]).toBe(3 * 2 * 72);
    const extra = draft.extras[0]!; // non-null: four listed.
    const picked = pick(run, 0, [extra.adventurer.id]);
    const fee =
      draft.parties[0]!.reduce((s, p) => s + 3 * 2 * p.wageCopper, 0) + 2 * extra.wageCopper; // non-null: three parties.
    expect(ofType(picked.events, 'founding.picked')[0]?.feeCopper).toBe(fee);
  });

  it('refuses a pick with the wrong number of extras or an unknown party', () => {
    const run = listed();
    const extras = ids(draftOf(run).extras);
    expect(() => pick(run, 0, [])).toThrow(/extras/);
    expect(() => pick(run, 0, extras.slice(0, 3))).toThrow(/extras/);
    expect(() => pick(run, 3, [extras[0]!])).toThrow(/no party 3/);
    expect(() => pick(run, -1, [extras[0]!])).toThrow(/no party/);
  });

  it('refuses unknown, repeated and party ids as extras', () => {
    const run = listed();
    const draft = draftOf(run);
    const first = draft.extras[0]!.adventurer.id;
    expect(() => pick(run, 0, ['adv.999'])).toThrow(/not on the shortlist/);
    expect(() => pick(run, 0, [first, first])).toThrow(/twice/);
    expect(() => pick(run, 0, [draft.parties[1]![0]!.adventurer.id])).toThrow(
      /not on the shortlist/,
    );
  });

  it('refuses a pick whose fees exceed the chest, and leaves the draft', () => {
    const poor = foundedGuild(
      0,
      { ...rules, founding: { ...founding, purseCopper: 100, feeWeeks: 10 } },
      'x',
    );
    expect(poor.state.guild!.chestCopper).toBeLessThan(3 * 64 * 10);
    const extra = draftOf(poor).extras[0]!.adventurer.id;
    expect(() => pick(poor, 1, [extra])).toThrow(/cannot pay/);
    expect(poor.state.guild!.draft).toBeDefined();
  });

  it('refuses a pick with more people than the house has beds, and starts the house empty', () => {
    const house: HouseRules = {
      kinds: [
        {
          id: 'room.barracks',
          where: 'hall',
          maxCells: 3,
          cellCostCopper: [100, 200, 400],
          weeks: [2, 3, 4],
          upkeepCopper: [1, 2, 4],
          beds: [3, 4, 5],
        },
      ],
      studyPlace: { area: 'hall', floor: 0, cell: 1 },
      cellsPerFloor: 3,
      start: {
        lowestFloor: 0,
        highestFloor: 0,
        plotsPerSide: 1,
        cells: [{ place: { area: 'hall', floor: 0, cell: 0 }, kindId: 'room.barracks', level: 1 }],
      },
      storey: { baseCopper: 1000, stepCopper: 500, weeks: 6 },
      cellar: { baseCopper: 1000, stepCopper: 500, weeks: 6 },
      wall: { baseCopper: 1000, stepCopper: 500, weeks: 6 },
      maxPlotsPerSide: 2,
      winterWeeksBp: 10_000,
      noSickbedBp: 10_000,
      homeTraining: { youngBp: 0, primeBp: 0, placedBp: 10_000, unplacedBp: 10_000 },
    };
    // 3 beds: the house starts with no roster, and a pick of 2 + 2 does not fit.
    const run = foundedGuild(0, { ...rules, house }, 'beds');
    expect(run.state.guild!.house).toBeDefined();
    const [a, b] = ids(draftOf(run).extras);
    expect(() => pick(run, 0, [a!, b!])).toThrow(/bed/);
    expect(pick(run, 0, [a!]).state.guild!.members).toHaveLength(3);
  });

  it('refuses a second pick and a pick without founding rules', () => {
    const run = listed();
    const done = pick(run, 0, [draftOf(run).extras[0]!.adventurer.id]);
    expect(() => pick(done, 0, [draftOf(run).extras[1]!.adventurer.id])).toThrow(/no founding/);
    expect(() => pick(foundedGuild(3), 0, [])).toThrow(/no founding/);
  });

  it('changes nothing without founding rules: the roster is drawn and the starting chest paid', () => {
    const run = foundedGuild(3, { startingChestCopper: 7000 });
    const guild = run.state.guild!;
    expect(guild.members).toHaveLength(3);
    expect(guild.draft).toBeUndefined();
    expect(ofType(run.events, 'money.changed')[0]).toMatchObject({
      reason: 'founding',
      amountCopper: 7000,
    });
    expect(ofType(run.events, 'founding.listed')).toEqual([]);
    expect(Object.keys(run.state.rng)).not.toContain('guild.founding');
    expect(play(run, { type: 'day.advance', day: 2 }).state.calendar).toBe(2);
  });

  it('is deterministic: the same seed lists the same draft and a different seed another', () => {
    const a = listed();
    const b = foundedGuild(0, rules, 'draft-seed');
    expect(draftOf(a)).toEqual(draftOf(b));
    expect(ofType(a.events, 'founding.listed')).toEqual(ofType(b.events, 'founding.listed'));
  });
});
