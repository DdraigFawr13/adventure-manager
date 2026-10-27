import { describe, expect, it } from 'vitest';
import {
  bedsOf,
  sickbedsOf,
  trainingPlacesOf,
  type GameState,
  type HouseRules,
  type Place,
  type RoomKind,
} from '../src/index.ts';
import { ofType } from './fixture.ts';
import { advanceTo, foundedGuild, play, playDays, testCareer, type Run } from './guild-fixture.ts';

const hall = (floor: number, cell: number): Place => ({ area: 'hall', floor, cell });
const plot = (side: 'west' | 'east', n: number): Place => ({
  area: 'compound',
  side,
  plot: n,
});

const barracks: RoomKind = {
  id: 'room.barracks',
  where: 'hall',
  maxCells: 3,
  cellCostCopper: [100, 200, 400],
  weeks: [2, 3, 4],
  upkeepCopper: [1, 2, 4],
  beds: [2, 3, 4],
};
const vault: RoomKind = {
  id: 'room.vault',
  where: 'hall',
  belowGround: true,
  maxCells: 1,
  cellCostCopper: [500, 1000, 2000],
  weeks: [4, 4, 4],
  upkeepCopper: [3, 6, 9],
};
const yard: RoomKind = {
  id: 'room.yard',
  where: 'compound',
  maxCells: 2,
  cellCostCopper: [300, 600, 1200],
  weeks: [4, 6, 8],
  upkeepCopper: [5, 10, 20],
};
const house: HouseRules = {
  kinds: [barracks, vault, yard],
  studyPlace: hall(0, 1),
  cellsPerFloor: 3,
  start: {
    lowestFloor: 0,
    highestFloor: 1,
    plotsPerSide: 2,
    cells: [
      { place: hall(1, 0), kindId: 'room.barracks', level: 1 },
      { place: hall(1, 1), kindId: 'room.barracks', level: 1 },
    ],
  },
  storey: { baseCopper: 1000, stepCopper: 500, weeks: 6 },
  cellar: { baseCopper: 2000, stepCopper: 700, weeks: 8 },
  wall: { baseCopper: 400, stepCopper: 100, weeks: 4 },
  maxPlotsPerSide: 3,
  winterWeeksBp: 7500,
  noSickbedBp: 20_000,
  noPlaceGrowthBp: 5000,
};
const WEEK = 7;
/** The first day of a week counted from the guild's first day. */
const startOf = (week: number) => (week - 1) * WEEK + 1;

function begun(size = 3, rules: Partial<HouseRules> = {}, chest = 100_000): Run {
  const run = foundedGuild(size, { house: { ...house, ...rules }, startingChestCopper: chest });
  return run;
}

const today = (run: Run) => run.state.calendar;
const build = (run: Run, place: Place, kindId: string) =>
  play(run, { type: 'house.build', day: today(run), place, kindId });
const upgrade = (run: Run, place: Place) =>
  play(run, { type: 'house.upgrade', day: today(run), place });
const extend = (run: Run, direction: 'up' | 'down' | 'west' | 'east') =>
  play(run, { type: 'house.extend', day: today(run), direction });
const chest = (run: Run) => run.state.guild!.chestCopper; // non-null: founded.
const houseOf = (run: Run) => run.state.guild!.house!; // non-null: house rules are on.
const levels = (run: Run, places: Place[]) =>
  places.map((p) =>
    p.area === 'hall'
      ? houseOf(run).floors[p.floor]?.[p.cell]?.level
      : houseOf(run).compound[p.side][p.plot]?.level,
  );
const paid = (run: Run, reason: string) =>
  ofType(run.events, 'money.changed')
    .filter((e) => e.reason === reason)
    .map((e) => e.amountCopper);

/** Builds and finishes a job: jumps to the first week start on or after its due week. */
function finishAll(run: Run): Run {
  const due = Math.max(...houseOf(run).work.map((w) => w.doneWeek));
  return advanceTo(run, startOf(due));
}

describe('house (house SPEC.md)', () => {
  it('starts from the content layout, with the study empty, and counts beds', () => {
    const run = begun();
    const h = houseOf(run);
    expect(h.floors[0]).toEqual([null, null, null]);
    expect(h.floors[1]?.map((c) => c?.kindId)).toEqual([
      'room.barracks',
      'room.barracks',
      undefined,
    ]);
    expect(h.compound.west.length).toBe(2);
    expect(h.compound.east.length).toBe(2);
    expect(bedsOf(h, house)).toBe(4);
    expect(h.work).toEqual([]);
  });

  it('refuses a founding roster larger than the starting beds', () => {
    expect(() => begun(5)).toThrow(/beds/);
    expect(() => begun(4)).not.toThrow();
  });

  it('builds a lone cell at level 1 for its cost, paid at the start; it exists when finished', () => {
    const start = begun();
    let run = build(start, plot('west', 0), 'room.yard');
    expect(chest(run)).toBe(chest(start) - 300);
    expect(paid(run, 'building')).toEqual([-300]);
    const started = ofType(run.events, 'house.started')[0]!;
    expect(started).toMatchObject({
      job: 'build',
      places: [plot('west', 0)],
      kindId: 'room.yard',
      level: 1,
      costCopper: 300,
      doneWeek: 5,
      causeId: run.events.find((e) => e.type === 'money.changed' && e.reason === 'building')!.id,
    });
    expect(houseOf(run).compound.west[0]).toBeNull();
    run = advanceTo(run, startOf(4));
    expect(houseOf(run).compound.west[0]).toBeNull();
    expect(ofType(run.events, 'house.finished')).toEqual([]);
    run = advanceTo(run, startOf(5));
    expect(houseOf(run).compound.west[0]).toEqual({ kindId: 'room.yard', level: 1 });
    expect(ofType(run.events, 'house.finished')[0]).toMatchObject({
      job: 'build',
      places: [plot('west', 0)],
      kindId: 'room.yard',
      level: 1,
      doneWeek: 5,
    });
    expect(houseOf(run).work).toEqual([]);
  });

  it('a cell joining a run takes its level and pays every level up to it', () => {
    let run = begun(3, {}, 1_000_000);
    run = upgrade(run, hall(1, 0)); // the two start cells to level 2: 2 x 100... level 1 -> 2 costs 200 each
    expect(paid(run, 'building')).toEqual([-400]);
    run = finishAll(run);
    expect(levels(run, [hall(1, 0), hall(1, 1)])).toEqual([2, 2]);
    run = build(run, hall(1, 2), 'room.barracks');
    expect(paid(run, 'building').at(-1)).toBe(-(100 + 200));
    expect(ofType(run.events, 'house.started').at(-1)).toMatchObject({ level: 2 });
    run = finishAll(run);
    expect(levels(run, [hall(1, 2)])).toEqual([2]);
    expect(bedsOf(houseOf(run), house)).toBe(9);
  });

  it('a cell between two runs joins both at the lowest level among them', () => {
    let run = begun(3, {
      start: {
        ...house.start,
        cells: [
          { place: hall(1, 0), kindId: 'room.barracks', level: 2 },
          { place: hall(1, 2), kindId: 'room.barracks', level: 1 },
        ],
      },
    });
    run = build(run, hall(1, 1), 'room.barracks');
    expect(ofType(run.events, 'house.started').at(-1)).toMatchObject({ level: 1, costCopper: 100 });
    run = finishAll(run);
    expect(levels(run, [hall(1, 0), hall(1, 1), hall(1, 2)])).toEqual([2, 1, 1]);
    // The room is now at level 1: raising it lifts only the two level-1 cells.
    run = upgrade(run, hall(1, 0));
    expect(ofType(run.events, 'house.started').at(-1)).toMatchObject({
      places: [hall(1, 1), hall(1, 2)],
      costCopper: 400,
    });
  });

  it('refuses a run longer than the kind allows', () => {
    let run = begun(3, {}, 1_000_000);
    run = build(run, hall(1, 2), 'room.barracks'); // the run is now 3 long (once built)
    expect(() => build(run, hall(1, 2), 'room.barracks')).toThrow(/under work/);
    const cramped = begun(3, { kinds: [{ ...barracks, maxCells: 2 }, vault, yard] });
    expect(() => build(cramped, hall(1, 2), 'room.barracks')).toThrow(/at most 2/);
  });

  it('refuses the wrong area, above-ground vaults, missing or filled places and unknown kinds', () => {
    const run = begun(3, {}, 1_000_000);
    expect(() => build(run, hall(0, 0), 'room.yard')).toThrow(/compound/);
    expect(() => build(run, plot('west', 0), 'room.barracks')).toThrow(/hall/);
    expect(() => build(run, hall(0, 0), 'room.vault')).toThrow(/below ground/);
    expect(() => build(run, hall(1, 0), 'room.barracks')).toThrow(/not empty/);
    expect(() => build(run, hall(5, 0), 'room.barracks')).toThrow(/no hall floor 5/);
    expect(() => build(run, plot('east', 2), 'room.yard')).toThrow(/no east plot 2/);
    expect(() => build(run, hall(0, 0), 'room.nope')).toThrow(/not a room kind/);
    expect(() =>
      play(run, { type: 'house.build', day: 9, place: hall(0, 0), kindId: 'room.barracks' }),
    ).toThrow(/not today/);
  });

  it('never builds on the study', () => {
    expect(() => build(begun(), hall(0, 1), 'room.barracks')).toThrow(/study/);
    expect(() => upgrade(begun(), hall(0, 1))).toThrow(/no room/);
  });

  it('builds a cellar room only below ground, once the cellar is dug', () => {
    let run = begun(3, {}, 1_000_000);
    expect(() => build(run, hall(-1, 0), 'room.vault')).toThrow(/no hall floor -1/);
    run = extend(run, 'down');
    run = finishAll(run);
    run = build(run, hall(-1, 0), 'room.vault');
    run = finishAll(run);
    expect(levels(run, [hall(-1, 0)])).toEqual([1]);
    expect(() => build(run, hall(-1, 1), 'room.barracks')).not.toThrow();
  });

  it('refuses work the chest cannot pay for and changes nothing', () => {
    const run = begun(3, {}, 600);
    const before = structuredClone(run.state);
    expect(() => build(run, plot('west', 0), 'room.yard')).not.toThrow(); // 300 <= 600
    const poor = { ...run, state: { ...structuredClone(run.state) } };
    poor.state.guild!.chestCopper = 299;
    expect(() => build(poor, plot('west', 0), 'room.yard')).toThrow(/chest/);
    expect(() => upgrade(poor, hall(1, 0))).toThrow(/chest/); // 2 x 200
    expect(() => extend(poor, 'west')).toThrow(/chest/); // 400
    expect(run.state).toEqual(before);
  });

  it('keeps a place under work from taking another command', () => {
    let run = begun(3, {}, 1_000_000);
    run = build(run, plot('west', 0), 'room.yard');
    expect(() => build(run, plot('west', 0), 'room.yard')).toThrow(/under work/);
    expect(() => upgrade(run, plot('west', 0))).toThrow(/under work/);
    // Another place is free, and so is the same kind next to it.
    run = build(run, plot('east', 0), 'room.yard');
    run = finishAll(run);
    run = upgrade(run, plot('west', 0));
    expect(() => upgrade(run, plot('west', 0))).toThrow(/under work/);
    // A room being raised can't be joined until it finishes.
    expect(() => build(run, plot('west', 1), 'room.yard')).toThrow(/under work/);
    run = finishAll(run);
    expect(() => build(run, plot('west', 1), 'room.yard')).not.toThrow();
  });

  it('refuses to join or raise a room while one of its cells is under work', () => {
    let run = begun(3, {}, 1_000_000);
    run = build(run, hall(1, 2), 'room.barracks'); // joins the starting run (1,0)-(1,1)
    expect(() => upgrade(run, hall(1, 0))).toThrow(/under work/);
    run = finishAll(run);
    run = upgrade(run, hall(1, 0));
    run = extend(run, 'up');
    run = finishAll(run);
    // A new cell can't join a room that is being raised: it would land at the old level.
    run = upgrade(run, hall(1, 0));
    expect(() => build(run, hall(2, 0), 'room.barracks')).not.toThrow(); // another floor, its own room
    expect(levels(run, [hall(1, 0), hall(1, 1), hall(1, 2)])).toEqual([2, 2, 2]);
    run = finishAll(run);
    expect(levels(run, [hall(1, 0), hall(1, 1), hall(1, 2)])).toEqual([3, 3, 3]);
  });

  it('has no places at negative or missing indices', () => {
    const run = begun();
    expect(() => build(run, hall(1, -1), 'room.barracks')).toThrow(/no hall/);
    expect(() => build(run, hall(0, 3), 'room.barracks')).toThrow(/no hall/);
    expect(() => build(run, plot('west', -1), 'room.yard')).toThrow(/no west/);
    expect(() => upgrade(run, hall(5, 0))).toThrow(/no hall/);
  });

  it('refuses a starting layout on the study or with uneven level tables', () => {
    expect(() =>
      begun(3, {
        start: {
          ...house.start,
          cells: [{ place: hall(0, 1), kindId: 'room.barracks', level: 1 }],
        },
      }),
    ).toThrow(/starting layout/);
    expect(() => begun(3, { kinds: [{ ...barracks, weeks: [2, 3] }, vault, yard] })).toThrow(
      /each of its levels/,
    );
  });

  it('finishes at the first week start on or after the due week', () => {
    let run = build(begun(), hall(0, 0), 'room.barracks'); // 2 weeks from week 1: due week 3
    run = advanceTo(run, startOf(3) - 1);
    expect(houseOf(run).work.length).toBe(1);
    run = advanceTo(run, startOf(3));
    expect(houseOf(run).work.length).toBe(0);
    expect(houseOf(run).floors[0]?.[0]).toEqual({ kindId: 'room.barracks', level: 1 });
    // The finished event comes after the week started, before that week's upkeep.
    const finished = run.events.findIndex((e) => e.type === 'house.finished');
    const week = run.events.findLastIndex((e) => e.type === 'week.started');
    expect(finished).toBeGreaterThan(week);
  });

  it('scales work started in winter to its share of the weeks, rounded up, in whole numbers', () => {
    let run = begun(3, {}, 1_000_000);
    run = advanceTo(run, startOf(37) - 1);
    run = advanceTo(run, startOf(37));
    run = build(run, plot('west', 0), 'room.yard'); // 4 weeks x 75% = 3
    expect(ofType(run.events, 'house.started').at(-1)?.doneWeek).toBe(40);
    run = extend(run, 'up'); // 6 weeks x 75% = 4.5, rounded up to 5
    expect(ofType(run.events, 'house.started').at(-1)?.doneWeek).toBe(42);
    run = advanceTo(run, startOf(40));
    expect(houseOf(run).compound.west[0]?.level).toBe(1);
    expect(houseOf(run).highestFloor).toBe(1);
    // Week 36 is the last week before winter: the full weeks apply.
    let late = begun(3, {}, 1_000_000);
    late = advanceTo(late, startOf(36));
    late = build(late, plot('west', 0), 'room.yard');
    expect(ofType(late.events, 'house.started').at(-1)?.doneWeek).toBe(40);
    // Before winter the full weeks apply.
    let early = begun(3, {}, 1_000_000);
    early = build(early, plot('west', 0), 'room.yard');
    expect(ofType(early.events, 'house.started')[0]?.doneWeek).toBe(5);
  });

  it('upgrades every cell at the room level, at that level cost per cell, and takes its weeks', () => {
    let run = begun(3, {}, 1_000_000);
    run = upgrade(run, hall(1, 1)); // any cell of the room; two cells at level 1 -> 2: 2 x 200
    expect(paid(run, 'building')).toEqual([-400]);
    expect(ofType(run.events, 'house.started')[0]).toMatchObject({
      job: 'upgrade',
      places: [hall(1, 0), hall(1, 1)],
      level: 2,
      doneWeek: 4, // weeks[1] = 3 from week 1
    });
    expect(levels(run, [hall(1, 0), hall(1, 1)])).toEqual([1, 1]);
    run = finishAll(run);
    expect(levels(run, [hall(1, 0), hall(1, 1)])).toEqual([2, 2]);
    run = upgrade(run, hall(1, 0)); // level 2 -> 3: 2 x 400
    expect(paid(run, 'building').at(-1)).toBe(-800);
    run = finishAll(run);
    expect(levels(run, [hall(1, 0), hall(1, 1)])).toEqual([3, 3]);
    expect(() => upgrade(run, hall(1, 0))).toThrow(/top level/);
  });

  it('upgrades only the cells at the lowest level in a partly raised room', () => {
    let run = begun(3, {}, 1_000_000);
    run = upgrade(run, hall(1, 0));
    run = finishAll(run);
    run = build(run, hall(1, 2), 'room.barracks'); // joins at level 2
    run = finishAll(run);
    run = upgrade(run, hall(1, 0)); // all three at 2 -> 3
    run = finishAll(run);
    // A cell dropped to level 1 by a separate setup: lower one cell by hand to make a partial room.
    const state: GameState = structuredClone(run.state);
    state.guild!.house!.floors[1]![2]!.level = 3;
    state.guild!.house!.floors[1]![0]!.level = 2;
    state.guild!.house!.floors[1]![1]!.level = 2;
    run = { ...run, state };
    run = upgrade(run, hall(1, 2)); // asked at the level-3 cell: the room is at level 2
    expect(ofType(run.events, 'house.started').at(-1)).toMatchObject({
      places: [hall(1, 0), hall(1, 1)],
      level: 3,
      costCopper: 800,
    });
  });

  it('prices each extension higher than the last and adds the floor or plot when done', () => {
    let run = begun(3, {}, 1_000_000);
    run = extend(run, 'up');
    expect(paid(run, 'building')).toEqual([-1000]);
    expect(() => extend(run, 'up')).toThrow(/already under work/);
    run = finishAll(run);
    expect(houseOf(run).highestFloor).toBe(2);
    expect(houseOf(run).floors[2]).toEqual([null, null, null]);
    run = extend(run, 'up');
    expect(paid(run, 'building').at(-1)).toBe(-1500);
    run = extend(run, 'down');
    expect(paid(run, 'building').at(-1)).toBe(-2000);
    run = finishAll(run);
    expect(houseOf(run).lowestFloor).toBe(-1);
    expect(houseOf(run).highestFloor).toBe(3);
    run = extend(run, 'down');
    expect(paid(run, 'building').at(-1)).toBe(-2700);
    run = extend(run, 'west');
    expect(paid(run, 'building').at(-1)).toBe(-400);
    run = finishAll(run);
    run = extend(run, 'east');
    expect(paid(run, 'building').at(-1)).toBe(-400); // each side counts its own pushes
    run = finishAll(run);
    expect(() => extend(run, 'west')).toThrow(/3 plots/);
    expect(houseOf(run).compound.west.length).toBe(3);
    expect(houseOf(run).compound.east.length).toBe(3);
    expect(ofType(run.events, 'house.finished').at(-1)).toMatchObject({
      job: 'extend',
      places: [],
    });
  });

  it('stops the compound at the maximum plots a side', () => {
    let run = begun(3, {}, 1_000_000);
    run = extend(run, 'east');
    run = finishAll(run);
    expect(houseOf(run).compound.east.length).toBe(3);
    expect(() => extend(run, 'east')).toThrow(/3 plots/);
    expect(() => extend(run, 'west')).not.toThrow();
  });

  it('charges upkeep for finished cells by level at each week start, not before they finish', () => {
    let run = begun(3, {}, 1_000_000);
    expect(paid(run, 'rooms')).toEqual([-2]); // week 1: two barracks cells at level 1
    run = advanceTo(run, startOf(2));
    run = build(run, plot('west', 0), 'room.yard'); // 4 weeks: due week 6
    run = advanceTo(run, startOf(5));
    expect(paid(run, 'rooms')).toEqual([-2, -2, -2, -2, -2]);
    run = advanceTo(run, startOf(6));
    expect(paid(run, 'rooms').at(-1)).toBe(-2 - 5); // the finished yard pays the same week
    run = upgrade(run, hall(1, 0));
    run = finishAll(run);
    run = advanceTo(run, today(run) + WEEK);
    expect(paid(run, 'rooms').at(-1)).toBe(-(2 + 2 + 5)); // barracks levels 2, 2, yard level 1
  });

  it('caps signing at the beds', () => {
    let run = foundedGuild(3, {
      house,
      startingChestCopper: 100_000,
      signingWindows: [{ from: 1, to: 6 }],
    });
    const sign = (r: Run) =>
      play(r, {
        type: 'recruit.sign',
        day: today(r),
        prospectId: r.state.guild!.prospects[0]!.adventurer.id,
      });
    run = sign(run);
    expect(run.state.guild!.members.length).toBe(4);
    expect(() => sign(run)).toThrow(/bed/);
    // A new barracks cell brings two more beds once finished.
    run = build(run, hall(1, 2), 'room.barracks');
    expect(() => sign(run)).toThrow(/bed/);
    run = finishAll(run);
    expect(bedsOf(houseOf(run), house)).toBe(6);
    expect(() => sign(run)).not.toThrow();
  });

  it('changes nothing without house rules', () => {
    const run = foundedGuild(3);
    expect(run.state.guild!.house).toBeUndefined();
    expect(() => build(run, hall(0, 0), 'room.barracks')).toThrow(/no house rules/);
    const later = advanceTo(run, startOf(3));
    expect(ofType(later.events, 'money.changed').map((e) => e.reason)).not.toContain('rooms');
    expect(later.state.guild!.house).toBeUndefined();
  });

  it('is deterministic: the same commands give the same state and events', () => {
    const go = () => {
      let run = begun(3, {}, 1_000_000);
      run = build(run, plot('west', 0), 'room.yard');
      run = extend(run, 'up');
      return finishAll(run);
    };
    const a = go();
    const b = go();
    expect(a.state).toEqual(b.state);
    expect(a.events).toEqual(b.events);
  });
  describe('room effects (v1)', () => {
    const infirmary: RoomKind = {
      id: 'room.infirmary',
      where: 'hall',
      maxCells: 3,
      cellCostCopper: [100, 200, 400],
      weeks: [2, 3, 4],
      upkeepCopper: [1, 2, 4],
      sickbeds: [1, 2, 3],
    };
    const trainingYard: RoomKind = {
      id: 'room.training-yard',
      where: 'compound',
      maxCells: 3,
      cellCostCopper: [100, 200, 400],
      weeks: [2, 3, 4],
      upkeepCopper: [1, 2, 4],
      trainingPlaces: [1, 2, 3],
    };
    const withRooms = (
      cells: { place: Place; kindId: string }[],
      career = testCareer,
      extra: Partial<HouseRules> = {},
    ): Run =>
      foundedGuild(3, {
        career,
        house: {
          ...house,
          ...extra,
          kinds: [...house.kinds, infirmary, trainingYard],
          start: {
            ...house.start,
            cells: [...house.start.cells, ...cells.map((c) => ({ ...c, level: 1 }))],
          },
        },
      });
    const infirmaryRun = () => withRooms([{ place: hall(1, 2), kindId: 'room.infirmary' }]);
    const laidUp = (run: Run) =>
      ofType(run.events, 'member.laid-up').map((e) => [e.days, e.sickbed]);
    const withBeds = (run: Run, beds: { memberId: string; untilDay: number }[]): Run => {
      const state = structuredClone(run.state);
      state.guild!.house!.sickbeds.push(...beds); // non-null: founded with a house.
      return { ...run, state };
    };

    it('counts sickbeds and places by level', () => {
      const run = withRooms([
        { place: hall(1, 2), kindId: 'room.infirmary' },
        { place: plot('west', 0), kindId: 'room.training-yard' },
      ]);
      expect(sickbedsOf(houseOf(run), run.state.content.guild!.house!)).toBe(1);
      expect(trainingPlacesOf(houseOf(run), run.state.content.guild!.house!)).toBe(1);
      expect(sickbedsOf(houseOf(foundedGuild(3, { house })), house)).toBe(0);
    });

    it('a free sickbed keeps the injury days and is held until the member is fit', () => {
      const run = playDays(infirmaryRun(), 60);
      const [first] = ofType(run.events, 'member.laid-up');
      expect(first).toBeDefined();
      expect([first!.days, first!.sickbed]).toEqual([21, true]); // non-null: checked above.
      // Stopped on the day it was reported, the bed runs to the day the member is fit.
      const then = playDays(infirmaryRun(), first!.day);
      const bed = houseOf(then).sickbeds.find((b) => b.memberId === first!.subjectIds[0]);
      const member = then.state.guild!.members.find((m) => m.id === first!.subjectIds[0]);
      expect(bed?.untilDay).toBe(member?.outUntilDay);
    });

    it('without a free sickbed the injury days are doubled', () => {
      const none = playDays(withRooms([]), 60);
      const [first] = laidUp(none);
      expect(first).toEqual([42, false]);
      const members = infirmaryRun().state.guild!.members.map((m) => m.id);
      // The one bed is held by another fit member.
      const held = playDays(
        withBeds(infirmaryRun(), [{ memberId: members[2]!, untilDay: 1000 }]),
        60,
      );
      expect(laidUp(held)[0]).toEqual([42, false]);
    });

    it('a bed frees when its holder is fit again or has left the guild', () => {
      const members = infirmaryRun().state.guild!.members.map((m) => m.id);
      for (const holder of [
        { memberId: members[2]!, untilDay: 1 },
        { memberId: 'gone', untilDay: 1000 },
      ]) {
        const run = playDays(withBeds(infirmaryRun(), [holder]), 60);
        expect(laidUp(run)[0]).toEqual([21, true]);
        if (holder.memberId === 'gone')
          expect(houseOf(run).sickbeds.some((b) => b.memberId === 'gone')).toBe(false);
      }
    });

    it('training places go to the youngest members; the rest grow at their share of the chance', () => {
      const growth = { youngAge: 24, youngBp: 10_000, primeBp: 10_000 };
      const career = { ...testCareer, growth };
      const grown = (run: Run) => {
        const ids = ofType(run.events, 'attribute.changed')
          .filter((e) => e.reason === 'growth')
          .map((e) => e.subjectIds[0]);
        return new Set(ids);
      };
      const yardCell = [{ place: plot('west', 0), kindId: 'room.training-yard' }];
      // The third member is the youngest by a year; one place.
      const younger = (run: Run): Run => {
        const state = structuredClone(run.state);
        const c = state.guild!.members[2]!.id;
        const who = state.roster.find((r) => r.id === c)!;
        state.roster[state.roster.indexOf(who)] = { ...who, birthYear: who.birthYear! + 1 };
        return { ...run, state };
      };
      const c = withRooms(yardCell, career).state.guild!.members[2]!.id;
      // With no share for those without a place, only the youngest grows.
      const strict = younger(withRooms(yardCell, career, { noPlaceGrowthBp: 0 }));
      expect([...grown(playDays(strict, 60))]).toEqual([c]);
      // At full share for everyone the others grow too.
      const all = younger(withRooms(yardCell, career, { noPlaceGrowthBp: 10_000 }));
      expect(grown(playDays(all, 60)).size).toBeGreaterThan(1);
    });

    it('changes nothing without house rules', () => {
      const run = foundedGuild(3, { career: testCareer });
      expect(
        ofType(playDays(run, 60).events, 'member.laid-up').every((e) => e.sickbed === undefined),
      ).toBe(true);
    });
  });
});
