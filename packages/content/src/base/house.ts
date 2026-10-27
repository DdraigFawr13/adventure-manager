// House v0 starting numbers (packages/engine/src/house/SPEC.md). Every number is an ASSUMPTION for
// the D-172 tuning runs (tools/career-sim.ts with the house on); none is a settled decision. Money
// is in copper.
//
// - 11 room kinds (D-149, D-180): 7 in the hall, 4 in the compound; the strongroom below ground.
//   Widths: gate and strongroom 1 cell, the rest up to 3 (D-169).
// - Cost per cell: level 1 at the kind's base, raising to level 2 twice that, to level 3 four times
//   that, so a level-3 cell costs 7 times its base. HOUSE_COST_PERCENT scales every base; it is the
//   one factor tuned so the reference full house (fullHousePlan) costs about 8-12 years of a mid
//   guild's surplus (D-172). Measured (career-sim with house=on, 40 careers, 26 years, 2026-10-27):
//   the middle tier's median surplus before house money (building and room upkeep added back) is
//   about 70,700 copper a year, near the 75,000 of a house-off run; at 175% the plan costs 706,000,
//   10.0 years of it (plan finishers only, 73% of careers). The first plan step starts in week 42
//   (median; p10 week 7, p90 week 294, held back by the policy's 12-week reserve); room upkeep is
//   about 13% of spending from year 10.
// - Work: 4 weeks for a cell, 6 and 8 to raise a room to levels 2 and 3; a storey 6, a cellar 8, a
//   wall 4. Work started in winter takes 75% of that (D-067, D-169).
// - Upkeep per cell per week by level 5 / 10 / 20 (D-177).
// - Barracks beds per cell by level 8 / 10 / 12. A new guild has 2 barracks cells, 16 beds, for a
//   founded roster of 15 (D-170, D-174).
// - Storeys: the first added 8,000, each later 8,000 more; cellars 10,000 then 10,000 more; a wall
//   push 5,000 then 5,000 more, up to 6 plots a side (D-172, D-183).
import type { GuildRules, HouseRules, Place, RoomKind } from '@adventure-manager/engine';
import { careerGuildRules } from './career.ts';

export const HOUSE_COST_PERCENT = 175;

function kind(
  id: string,
  where: RoomKind['where'],
  maxCells: number,
  baseCopper: number,
  extra: Partial<RoomKind> = {},
): RoomKind {
  const base = Math.round((baseCopper * HOUSE_COST_PERCENT) / 100);
  return {
    id,
    where,
    maxCells,
    cellCostCopper: [base, 2 * base, 4 * base],
    weeks: [4, 6, 8],
    upkeepCopper: [5, 10, 20],
    ...extra,
  };
}

const hall = (floor: number, cell: number): Place => ({ area: 'hall', floor, cell });
const plot = (side: 'west' | 'east', n: number): Place => ({ area: 'compound', side, plot: n });

export const baseHouseRules: HouseRules = {
  kinds: [
    kind('room.barracks', 'hall', 3, 3000, { beds: [8, 10, 12] }),
    kind('room.infirmary', 'hall', 3, 4000),
    kind('room.library', 'hall', 3, 4000),
    kind('room.armoury', 'hall', 3, 3500),
    kind('room.tavern', 'hall', 3, 3000),
    kind('room.strongroom', 'hall', 1, 5000, { belowGround: true }),
    kind('room.heroes', 'hall', 3, 3000),
    kind('room.training-yard', 'compound', 3, 3500),
    kind('room.forge', 'compound', 3, 4500),
    kind('room.works', 'compound', 3, 3000),
    kind('room.gate', 'compound', 1, 2500),
  ],
  studyPlace: hall(0, 1),
  cellsPerFloor: 3,
  start: {
    lowestFloor: 0,
    highestFloor: 1,
    plotsPerSide: 3,
    cells: [
      { place: hall(0, 0), kindId: 'room.tavern', level: 1 },
      { place: hall(1, 0), kindId: 'room.barracks', level: 1 },
      { place: hall(1, 1), kindId: 'room.barracks', level: 1 },
      { place: plot('west', 0), kindId: 'room.gate', level: 1 },
    ],
  },
  storey: { baseCopper: 8000, stepCopper: 8000, weeks: 6 },
  cellar: { baseCopper: 10000, stepCopper: 10000, weeks: 8 },
  wall: { baseCopper: 5000, stepCopper: 5000, weeks: 4 },
  maxPlotsPerSide: 6,
  winterWeeksBp: 7500,
};

/** One step of the simulator's build plan; places refer to the starting layout and the floors the plan adds. */
export type HousePlanStep =
  | { readonly type: 'build'; readonly place: Place; readonly kindId: string }
  | { readonly type: 'upgrade'; readonly place: Place }
  | { readonly type: 'extend'; readonly direction: 'up' | 'down' | 'west' | 'east' };

const build = (place: Place, kindId: string): HousePlanStep => ({ type: 'build', place, kindId });
const upgrade = (place: Place): HousePlanStep => ({ type: 'upgrade', place });

/** One cell of every room in the reference full house; the plan raises each room twice. */
const ROOMS: readonly Place[] = [
  hall(0, 0), // tavern
  hall(0, 2), // armoury
  hall(1, 0), // barracks
  hall(2, 0), // infirmary
  hall(2, 2), // Hall of Heroes
  hall(3, 0), // library
  hall(-1, 0), // strongroom
  plot('west', 0), // gate
  plot('west', 1), // training yard
  plot('east', 0), // forge
  plot('east', 1), // works
];

/**
 * The reference full house the simulator builds toward, in order (D-172): every kind at level 3.
 * Hall: ground floor tavern, study, armoury; floor 1 barracks (3 cells); floor 2 infirmary (2) and
 * the Hall of Heroes; floor 3 library (2) and a spare cell; cellar strongroom and 2 spare cells.
 * Compound: gate and training yard (2) west, forge and works east, 1 spare plot. That is 2 storeys
 * and 1 cellar added, no wall pushed. Tools only; the game has no "full" house.
 */
export const fullHousePlan: readonly HousePlanStep[] = [
  build(hall(0, 2), 'room.armoury'),
  build(hall(1, 2), 'room.barracks'),
  build(plot('west', 1), 'room.training-yard'),
  build(plot('west', 2), 'room.training-yard'),
  { type: 'extend', direction: 'up' },
  build(hall(2, 0), 'room.infirmary'),
  build(hall(2, 1), 'room.infirmary'),
  build(hall(2, 2), 'room.heroes'),
  build(plot('east', 0), 'room.forge'),
  build(plot('east', 1), 'room.works'),
  { type: 'extend', direction: 'up' },
  build(hall(3, 0), 'room.library'),
  build(hall(3, 1), 'room.library'),
  { type: 'extend', direction: 'down' },
  build(hall(-1, 0), 'room.strongroom'),
  ...ROOMS.map(upgrade),
  ...ROOMS.map(upgrade),
];

/** The career rules with the house on: what `tools/career-sim.ts` plays with house=on. */
export const houseGuildRules: GuildRules = { ...careerGuildRules, house: baseHouseRules };
