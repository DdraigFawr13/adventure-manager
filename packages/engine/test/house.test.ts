import { describe, expect, it } from 'vitest';
import {
  bedsOf,
  incidentChanceBp,
  sickbedsOf,
  trainingPlacesOf,
  type GameState,
  type HouseRules,
  type IncidentKind,
  type IncidentRules,
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
  homeTraining: { youngBp: 0, primeBp: 0, placedBp: 15_000, unplacedBp: 7500 },
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

  it("counts rooms finished this year for the patron's grace goals (D-189)", () => {
    let run = foundedGuild(3, { house, career: testCareer, startingChestCopper: 1_000_000 });
    run = build(run, hall(0, 0), 'room.barracks');
    run = extend(run, 'up'); // an extension is not a room
    expect(run.state.guild!.career!.roomsThisYear).toBe(0); // non-null: careers are on.
    run = finishAll(run);
    expect(run.state.guild!.career!.roomsThisYear).toBe(1); // non-null: careers are on.
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

    it('frees a sickbed by today, not by the home day of the party being settled', () => {
      // Parties are settled on arrival, days before they are home: a holder fit tomorrow still holds.
      const [first] = ofType(playDays(infirmaryRun(), 60).events, 'member.laid-up');
      const injured = first!.subjectIds[0]; // non-null: one is laid up within 60 days.
      const other = infirmaryRun().state.guild!.members.find((m) => m.id !== injured)!.id; // non-null: three members.
      const held = playDays(
        withBeds(infirmaryRun(), [{ memberId: other, untilDay: first!.day + 1 }]),
        60,
      );
      expect(laidUp(held)[0]).toEqual([42, false]);
      // Fit by today, the bed is free.
      const freed = playDays(
        withBeds(infirmaryRun(), [{ memberId: other, untilDay: first!.day }]),
        60,
      );
      expect(laidUp(freed)[0]).toEqual([21, true]);
    });

    it('keeps at least one day for an injury scaled down to nothing', () => {
      const tiny = playDays(withRooms([], testCareer, { noSickbedBp: 1 }), 60);
      expect(laidUp(tiny)[0]).toEqual([1, false]);
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

    describe('training at home', () => {
      const training = (youngBp: number, placedBp: number, unplacedBp: number) => ({
        homeTraining: { youngBp, primeBp: youngBp, placedBp, unplacedBp },
      });
      const yardCell = [{ place: plot('west', 0), kindId: 'room.training-yard' }];
      // From day 2: week 1 starts inside the founding, before a test can change the people.
      const trained = (run: Run) =>
        ofType(run.events, 'attribute.changed')
          .filter((e) => e.reason === 'training' && e.day > 1)
          .map((e) => e.subjectIds[0]);
      /** Member `n` is made one year younger than the others (all are 20). */
      const younger = (run: Run, n: number): Run => {
        const state = structuredClone(run.state);
        const who = state.roster.find((r) => r.id === state.guild!.members[n]!.id)!;
        state.roster[state.roster.indexOf(who)] = { ...who, birthYear: who.birthYear! + 1 };
        return { ...run, state };
      };
      const ids = (run: Run) => run.state.guild!.members.map((m) => m.id);

      it('only members with a place grow when the rest have no share, the youngest first', () => {
        const start = withRooms(yardCell, testCareer, training(10_000, 10_000, 0));
        const youngest = ids(start)[2];
        const done = advanceTo(younger(start, 2), 3 * WEEK + 1);
        expect(trained(done).length).toBeGreaterThan(0);
        expect(new Set(trained(done))).toEqual(new Set([youngest]));
        for (const e of ofType(done.events, 'attribute.changed'))
          expect([e.reason, e.to - e.from]).toEqual(['training', 1]);
      });

      it('ties by age go to the lower id', () => {
        const start = withRooms(yardCell, testCareer, training(10_000, 10_000, 0));
        const lowest = [...ids(start)].sort()[0];
        expect(new Set(trained(advanceTo(start, 3 * WEEK + 1)))).toEqual(new Set([lowest]));
      });

      it('members without a place grow at their share', () => {
        const all = withRooms(yardCell, testCareer, training(10_000, 10_000, 10_000));
        expect(new Set(trained(advanceTo(all, 3 * WEEK + 1)))).toEqual(new Set(ids(all)));
        const none = withRooms([], testCareer, training(10_000, 10_000, 0));
        expect(trained(advanceTo(none, 3 * WEEK + 1))).toEqual([]);
        const slow = withRooms([], testCareer, training(10_000, 10_000, 5000));
        const n = trained(advanceTo(slow, 40 * WEEK)).length;
        const full = trained(
          advanceTo(withRooms([], testCareer, training(10_000, 10_000, 10_000)), 40 * WEEK),
        ).length;
        expect(n).toBeGreaterThan(0);
        expect(n).toBeLessThan(full);
      });

      it('only members at home and fit train, and none past the prime', () => {
        const start = withRooms(yardCell, testCareer, training(10_000, 10_000, 10_000));
        const state = structuredClone(start.state);
        const [hurt, away, old] = state.guild!.members;
        hurt!.outUntilDay = 1000;
        away!.away = true;
        const who = state.roster.find((r) => r.id === old!.id)!;
        state.roster[state.roster.indexOf(who)] = { ...who, birthYear: who.birthYear! - 30 };
        const done = advanceTo({ ...start, state }, 3 * WEEK + 1);
        expect(trained(done)).toEqual([]);
      });

      it('stops at the potential', () => {
        const start = withRooms(yardCell, testCareer, training(10_000, 10_000, 10_000));
        const state = structuredClone(start.state);
        const who = state.roster[0]!;
        state.roster[0] = { ...who, potential: { ...who.potential!, might: who.attributes.might } };
        const done = advanceTo({ ...start, state }, 60 * WEEK);
        const mine = ofType(done.events, 'attribute.changed').filter(
          (e) => e.subjectIds[0] === who.id && e.attribute === 'might',
        );
        expect(mine).toEqual([]);
      });

      it('does nothing without house rules', () => {
        const run = foundedGuild(3, { career: testCareer });
        expect(trained(advanceTo(run, 10 * WEEK))).toEqual([]);
      });

      it('leaves growth after quests as it was', () => {
        const growth = { youngAge: 24, youngBp: 10_000, primeBp: 10_000 };
        const career = { ...testCareer, growth };
        const grown = (run: Run) =>
          ofType(run.events, 'attribute.changed')
            .filter((e) => e.reason === 'growth')
            .map((e) => [e.subjectIds[0], e.attribute, e.from, e.to]);
        const plain = playDays(foundedGuild(3, { career }), 60);
        const housed = playDays(
          withRooms(yardCell, career, { ...training(0, 0, 0), noSickbedBp: 10_000 }),
          60,
        );
        expect(grown(plain).length).toBeGreaterThan(0);
        expect(grown(housed)).toEqual(grown(plain));
      });
    });

    it('changes nothing without house rules', () => {
      const run = foundedGuild(3, { career: testCareer });
      expect(
        ofType(playDays(run, 60).events, 'member.laid-up').every((e) => e.sickbed === undefined),
      ).toBe(true);
    });
  });

  describe('incidents (v2)', () => {
    const fire: IncidentKind = {
      id: 'incident.fire',
      effect: 'fire',
      roomKindIds: ['room.barracks'],
      weeklyBp: 10_000,
      paidCopper: 40,
    };
    const theft: IncidentKind = {
      id: 'incident.theft',
      effect: 'theft',
      roomKindIds: ['room.vault'],
      weeklyBp: 10_000,
      paidCopper: 30,
      shareBp: [1000, 500, 250],
      noRoomShareBp: 2000,
      recoverBp: 10_000,
    };
    const sickness: IncidentKind = {
      id: 'incident.sickness',
      effect: 'sickness',
      roomKindIds: ['room.barracks'],
      weeklyBp: 10_000,
      paidCopper: 25,
      count: 2,
      freeDays: 14,
      paidDays: 7,
      sickbedBp: 5000,
    };
    const rules = (kinds: IncidentKind[], extra: Partial<IncidentRules> = {}): IncidentRules => ({
      kinds,
      levelBp: [10_000, 10_000, 10_000],
      noRoomBp: 10_000,
      debtBp: 10_000,
      fullBp: 10_000,
      innFeeCopper: 5,
      repairBp: 5000,
      ...extra,
    });
    /** Weekly chances of 10,000 bp, so the first week start (the founding day) strikes. */
    const struck = (
      size: number,
      kinds: IncidentKind[],
      house2: Partial<HouseRules> = {},
      chest = 100_000,
    ) =>
      foundedGuild(size, {
        house: { ...house, ...house2, incidents: rules(kinds) },
        startingChestCopper: chest,
        signingWindows: [{ from: 1, to: 6 }],
      });
    const answer = (run: Run, a: 'paid' | 'free') =>
      play(run, { type: 'incident.answer', day: today(run), answer: a });
    const letterOf = (run: Run) => houseOf(run).letter;
    const barracksAt = (level: number): Partial<HouseRules> => ({
      start: {
        ...house.start,
        cells: [
          { place: hall(1, 0), kindId: 'room.barracks', level },
          { place: hall(1, 1), kindId: 'room.barracks', level },
        ],
      },
    });

    it('rolls and draws nothing without incidents, and charges no inn fee', () => {
      const run = playDays(begun(3), 30);
      expect(ofType(run.events, 'incident.struck')).toEqual([]);
      expect(run.state.rng['house.incidents']).toBeUndefined();
      expect(paid(run, 'inn')).toEqual([]);
      expect(houseOf(run).letter).toBeNull();
    });

    it('strikes at most once a week, never while a letter stands, then settles by default', () => {
      let run = struck(3, [fire, theft]);
      expect(ofType(run.events, 'incident.struck').map((e) => e.kindId)).toEqual(['incident.fire']);
      expect(ofType(run.events, 'stop.raised').filter((e) => e.reason === 'incident')).toHaveLength(
        1,
      );
      expect(letterOf(run)?.kindId).toBe('incident.fire');
      run = advanceTo(run, startOf(2) - 1);
      expect(ofType(run.events, 'incident.struck')).toHaveLength(1);
      run = advanceTo(run, startOf(2));
      const [settled] = ofType(run.events, 'incident.settled');
      expect([settled?.answer, settled?.byDefault]).toEqual(['free', true]);
      expect(ofType(run.events, 'incident.struck')).toHaveLength(2);
    });

    it('scales the chance by level, debt and a full target, rounding down at each step', () => {
      const r = rules([], {
        levelBp: [15_000, 10_000, 5000],
        noRoomBp: 20_000,
        debtBp: 20_000,
        fullBp: 20_000,
      });
      expect(incidentChanceBp(r, 8, 1, false, false)).toBe(12);
      expect(incidentChanceBp(r, 8, 3, false, false)).toBe(4);
      expect(incidentChanceBp(r, 8, 1, true, false)).toBe(24);
      expect(incidentChanceBp(r, 8, 1, false, true)).toBe(24);
      expect(incidentChanceBp(r, 8, 1, true, true)).toBe(48);
      expect(incidentChanceBp(r, 8, null, false, false)).toBe(16);
      expect(incidentChanceBp(r, 7, 1, true, false)).toBe(20); // 10.5 -> 10, then 20
    });

    it('fire let burn drops a level, and burns out a level-1 cell', () => {
      const high = answer(struck(3, [fire], barracksAt(2)), 'free');
      expect(levels(high, [hall(1, 0), hall(1, 1)])).toEqual([1, 2]);
      expect(ofType(high.events, 'incident.settled')[0]?.result).toBe('lowered');
      const low = answer(struck(3, [fire]), 'free');
      expect(houseOf(low).floors[1]?.[0]).toBeNull();
      expect(ofType(low.events, 'incident.settled')[0]?.result).toBe('burnt-out');
      expect(letterOf(low)).toBeNull();
    });

    it('fire paid pays the fee and keeps the cell', () => {
      const run = answer(struck(3, [fire]), 'paid');
      expect(paid(run, 'incident')).toEqual([-40]);
      expect(levels(run, [hall(1, 0)])).toEqual([1]);
      expect(ofType(run.events, 'incident.settled')[0]?.result).toBe('saved');
    });

    it('a burnt barracks cell gives lodgers who pay the inn fee into debt, and blocks signing', () => {
      let run = answer(struck(4, [fire], {}, -10_000), 'free');
      expect(bedsOf(houseOf(run), run.state.content.guild!.house!)).toBe(2);
      const sign = (r: Run) =>
        play(r, {
          type: 'recruit.sign',
          day: today(r),
          prospectId: r.state.guild!.prospects[0]!.adventurer.id,
        });
      expect(() => sign(run)).toThrow(/bed/);
      run = advanceTo(run, startOf(2));
      expect(paid(run, 'inn')).toEqual([-10]); // 4 members, 2 beds, 5 copper each
      expect(chest(run)).toBeLessThan(0);
      const reasons = ofType(run.events, 'money.changed').map((e) => e.reason);
      expect(reasons.lastIndexOf('inn')).toBeGreaterThan(reasons.lastIndexOf('rooms'));
    });

    it('theft takes its share at the strike, and the paid answer rolls to bring it back', () => {
      const run = struck(3, [theft]);
      const [taken] = ofType(run.events, 'money.changed').filter((e) => e.reason === 'theft');
      const stolen = -taken!.amountCopper; // non-null: a strike takes coin.
      expect(stolen).toBe(Math.floor(((taken!.chestCopper + stolen) * 2000) / 10_000));
      expect(letterOf(run)?.stolenCopper).toBe(stolen);
      const free = answer(run, 'free');
      expect(paid(free, 'theft')).toEqual([-stolen]);
      const back = answer(run, 'paid');
      expect(paid(back, 'incident')).toEqual([-30]);
      expect(paid(back, 'theft')).toEqual([-stolen, stolen]);
      expect(ofType(back.events, 'incident.settled')[0]?.result).toBe('recovered');
      const lost = answer(
        foundedGuild(3, {
          house: { ...house, incidents: rules([{ ...theft, recoverBp: 0 }]) },
          startingChestCopper: 100_000,
        }),
        'paid',
      );
      expect(paid(lost, 'theft')).toEqual([-stolen]);
    });

    it('theft uses the best strongroom level and needs coin in the chest', () => {
      const vaultAt = (level: number): Partial<HouseRules> => ({
        start: {
          ...house.start,
          lowestFloor: -1,
          cells: [...house.start.cells, { place: hall(-1, 0), kindId: 'room.vault', level }],
        },
      });
      const run = struck(3, [theft], vaultAt(2));
      const [taken] = ofType(run.events, 'money.changed').filter((e) => e.reason === 'theft');
      const stolen = -taken!.amountCopper; // non-null: a strike takes coin.
      expect(stolen).toBe(Math.floor(((taken!.chestCopper + stolen) * 500) / 10_000));
      expect(ofType(struck(3, [theft], {}, -10_000).events, 'incident.struck')).toEqual([]);
    });

    it('sickness fells only home and fit members, and a sickbed halves the days', () => {
      const infirmary: RoomKind = {
        id: 'room.infirmary',
        where: 'hall',
        maxCells: 3,
        cellCostCopper: [100, 200, 400],
        weeks: [2, 3, 4],
        upkeepCopper: [1, 2, 4],
        sickbeds: [1, 2, 3],
      };
      const ill = (run: Run) => ofType(run.events, 'member.fell-ill');
      // Only a full barracks falls ill: 3 members on 4 beds do not.
      expect(ofType(struck(3, [sickness]).events, 'incident.struck')).toEqual([]);
      const free = answer(struck(4, [sickness]), 'free');
      expect(ill(free).map((e) => [e.days, e.sickbed])).toEqual([
        [14, false],
        [14, false],
      ]);
      expect(new Set(ill(free).map((e) => e.subjectIds[0])).size).toBe(2);
      const members = free.state.guild!.members;
      expect(members.filter((m) => m.outUntilDay === 15)).toHaveLength(2);
      const paidRun = answer(struck(4, [sickness]), 'paid');
      expect(ill(paidRun).map((e) => e.days)).toEqual([7, 7]);
      // One sickbed: the first sick member takes it (half the days), the second does not.
      const bed = answer(
        struck(4, [sickness], {
          kinds: [...house.kinds, infirmary],
          start: {
            ...house.start,
            cells: [
              ...house.start.cells,
              { place: hall(1, 2), kindId: 'room.infirmary', level: 1 },
            ],
          },
        }),
        'free',
      );
      expect(ill(bed).map((e) => [e.days, e.sickbed])).toEqual([
        [7, true],
        [14, false],
      ]);
      expect(houseOf(bed).sickbeds).toHaveLength(1);
      // Someone already out is not drawn: count 3 of 4 members, one away.
      let busy = struck(4, [{ ...sickness, count: 3 }]);
      busy = { ...busy, state: structuredClone(busy.state) };
      busy.state.guild!.members[0]!.outUntilDay = 100;
      const sick = ill(answer(busy, 'free'));
      expect(sick).toHaveLength(3);
      expect(sick.map((e) => e.subjectIds[0])).not.toContain(busy.state.guild!.members[0]!.id);
    });

    it('repairs fire damage at half the cost, into debt, and heals the scar when done (D-193)', () => {
      const burnt = answer(struck(4, [fire], {}, -10_000), 'free');
      expect(houseOf(burnt).scars).toEqual([
        { place: hall(1, 0), kindId: 'room.barracks', level: 1 },
      ]);
      const cost = burnt.state.content.guild!.house!.kinds.find((k) => k.id === 'room.barracks')!
        .cellCostCopper[0]!;
      expect(() =>
        play(burnt, { type: 'house.repair', day: today(burnt), place: hall(1, 1) }),
      ).toThrow(/no fire damage/);
      let run = play(burnt, { type: 'house.repair', day: today(burnt), place: hall(1, 0) });
      expect(paid(run, 'repair')).toEqual([-Math.floor(cost / 2)]);
      expect(chest(run)).toBeLessThan(0);
      expect(() => play(run, { type: 'house.repair', day: today(run), place: hall(1, 0) })).toThrow(
        /under work/,
      );
      // Weekly fires keep striking the other barracks cell; the repaired one is checked the week it is done.
      const done = ofType(run.events, 'house.started').at(-1)!.doneWeek;
      run = advanceTo(run, startOf(done));
      expect(levels(run, [hall(1, 0)])).toEqual([1]);
      expect(houseOf(run).scars.some((x) => x.place.area === 'hall' && x.place.cell === 0)).toBe(
        false,
      );
    });

    it("holds a standing fire letter's cell, so no work starts on it before the answer", () => {
      const run = struck(3, [fire], barracksAt(2));
      expect(() =>
        play(run, { type: 'house.upgrade', day: today(run), place: hall(1, 0) }),
      ).toThrow(/under work/);
    });

    it('refuses a repair that would make its run longer than the kind allows', () => {
      const burnt = answer(struck(4, [fire], {}, -10_000), 'free');
      // The fixture's barracks runs 2 cells; with 1 allowed, the burnt cell can't rejoin its neighbour.
      const base = burnt.state.content;
      const narrow = {
        ...structuredClone(burnt.state),
        content: {
          ...base,
          guild: {
            ...base.guild!,
            house: {
              ...base.guild!.house!,
              kinds: base.guild!.house!.kinds.map((k) =>
                k.id === 'room.barracks' ? { ...k, maxCells: 1 } : k,
              ),
            },
          },
        },
      };
      expect(() =>
        play(
          { ...burnt, state: narrow },
          { type: 'house.repair', day: today(burnt), place: hall(1, 0) },
        ),
      ).toThrow(/at most 1/);
    });

    it('sends no break-in letter when the share would round to nothing', () => {
      const run = struck(3, [{ ...theft, shareBp: [0, 0, 0], noRoomShareBp: 0 }]);
      expect(letterOf(run)).toBeNull();
      expect(ofType(run.events, 'incident.struck')).toEqual([]);
    });

    it('a second fire keeps the first scar, and building on a burnt place clears it', () => {
      let run = answer(struck(3, [fire], barracksAt(2)), 'free');
      run = answer(advanceTo(run, startOf(2)), 'free');
      expect(houseOf(run).scars).toEqual([
        { place: hall(1, 0), kindId: 'room.barracks', level: 2 },
      ]);
      const burnt = answer(struck(3, [{ ...fire, weeklyBp: 10_000 }]), 'free');
      const built = play(burnt, {
        type: 'house.build',
        day: today(burnt),
        place: hall(1, 0),
        kindId: 'room.barracks',
      });
      expect(houseOf(built).scars).toEqual([]);
    });

    it('lets the fire watch go into debt, but refuses other paid answers the chest cannot pay, and an answer with no letter or on the wrong day', () => {
      const watch = answer(struck(3, [fire], {}, -10_000), 'paid'); // in debt after the grant and wages
      expect(paid(watch, 'incident')).toEqual([-40]);
      const poor = struck(4, [sickness], {}, -10_000);
      expect(() => answer(poor, 'paid')).toThrow(/chest/);
      expect(letterOf(poor)).not.toBeNull();
      expect(() => answer(poor, 'free')).not.toThrow();
      const calm = struck(3, [{ ...fire, weeklyBp: 0 }]);
      expect(() => answer(calm, 'free')).toThrow(/No incident letter/);
      expect(() =>
        play(struck(3, [fire]), { type: 'incident.answer', day: 2, answer: 'free' }),
      ).toThrow(/not today/);
      expect(() => answer(begun(3), 'free')).toThrow(/no incidents/);
    });
  });
});
