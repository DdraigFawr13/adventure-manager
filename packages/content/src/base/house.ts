// House v0 starting numbers (packages/engine/src/house/SPEC.md). Every number is an ASSUMPTION for
// the D-172 tuning runs (tools/career-sim.ts with the house on); none is a settled decision. Money
// is in copper.
//
// - 11 room kinds (D-149, D-180): 7 in the hall, 4 in the compound; the strongroom below ground.
//   Widths: gate and strongroom 1 cell, the rest up to 3 (D-169).
// - Cost per cell: level 1 at the kind's base, raising to level 2 twice that, to level 3 four times
//   that, so a level-3 cell costs 7 times its base. HOUSE_COST_PERCENT scales every base; it is the
//   one factor tuned so the reference full house (fullHousePlan) costs about 8-12 years of a mid
//   guild's surplus (D-172). Measured on the current start (D-187, D-189, a 30,000 chest; career-sim
//   house=on, 100 careers, 26 years, 2026-10-27): the middle tier's median surplus before house
//   money (building and room upkeep added back) is about 74,700 copper a year; at 175% the plan
//   costs 656,000, 8.8 years of it (plan finishers only, 79% of careers, median year 13). The first
//   plan step (a barracks cell) starts in week 1; room upkeep is 18% of spending from year 10
//   (p10 13%, p90 25%).
// - Work: 4 weeks for a cell, 6 and 8 to raise a room to levels 2 and 3; a storey 6, a cellar 8, a
//   wall 4. Work started in winter takes 75% of that (D-067, D-169).
// - Upkeep per cell per week by level 8 / 17 / 34, set for about 20% of spending from year 10
//   (owner, D-185; a lever to adjust).
// - Infirmary sickbeds per cell by level 2 / 3 / 4; without a free sickbed a lasting injury lasts
//   twice as long (D-186). Training-yard places 4 / 6 / 8 a plot. Training at home (D-187): each week
//   a member at home and fit grows a point with chance 3% (young) / 1.5% (prime), times 1.5 with a
//   yard place or 0.75 without. Measured (100 careers): at the first guess of 1% / 0.5%, 1 point a
//   year a career from training at home against 7 from quests; at 3% / 1.5%, 2 against 7. The rates
//   are the session's choice; D-187's "total growth near today's" is not yet compared to house off.
// - A new guild starts small (D-187): a 1-cell barracks (8 beds) for a founded roster of 7 (one party
//   and backups), a 1-plot training yard (4 places), and no infirmary (the rudimentary-infirmary
//   start is measured against it). The simulator then signs up to the beds.
// - Barracks beds per cell by level 8 / 10 / 12 (D-170, D-174).
// - Incidents (v2, D-173, D-191-D-193; baseIncidentRules, ASSUMPTIONS): fire 30 bp a week on a forge,
//   tavern, works or barracks cell, theft 110 bp, sickness 110 bp on a barracks cell at least 3/4 full (D-206); times
//   150% / 100% / 50% by room level 1 / 2 / 3, 200% in debt, 200% for a full target (200% for theft
//   with no strongroom). A fire fee is 400 copper, theft 300, sickness 250; thieves take 12% / 6% / 3%
//   of the chest by strongroom level (20% with none), the thief-takers get it back 50% of the time;
//   sickness fells 3 members for 14 days (7 with a healer, half that on a sickbed); lodgers pay 60
//   copper a week each at the inn; a repair costs 50% of the levels it restores (D-193). Measured
//   (career-sim house=on incidents=on, 100 careers x 26 years, every letter on its default,
//   2026-10-27): 1.24 incidents a year (fire 0.66, theft 0.52, sickness 0.07: the barracks is
//   rarely full after year 1), target 1-2; dismissals 12% against 14% without incidents; theft 3.3%
//   and repairs 3.8% of spending from year 10; lodgers in 0.6% of weeks; full house in year 13
//   (12 without), 9.6 years of surplus. First pass at 8 / 30 / 120 bp: 0.33 a year. With sickness
//   on a crowded barracks (D-206) and D-205's purse, same run: 1.47 a year (fire 0.67, theft 0.54,
//   sickness 0.26; 400 bp gave sickness 1.06); dismissals 12%; full house in year 13.
//   Not in baseHouseRules, so house=on without incidents is unchanged; houseIncidentGuildRules adds them.
// - Storeys: the first added 8,000, each later 8,000 more; cellars 10,000 then 10,000 more; a wall
//   push 5,000 then 5,000 more, up to 6 plots a side (D-172, D-183).
import type {
  CareerRules,
  GuildRules,
  HouseRules,
  IncidentRules,
  Place,
  RoomKind,
} from '@adventure-manager/engine';
import { baseCareerRules, careerGuildRules } from './career.ts';
import { baseFoundingRules } from './founding.ts';

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
    upkeepCopper: [8, 17, 34],
    ...extra,
  };
}

const hall = (floor: number, cell: number): Place => ({ area: 'hall', floor, cell });
const plot = (side: 'west' | 'east', n: number): Place => ({ area: 'compound', side, plot: n });

export const baseHouseRules: HouseRules = {
  kinds: [
    kind('room.barracks', 'hall', 3, 3000, { beds: [8, 10, 12] }),
    kind('room.infirmary', 'hall', 3, 4000, { sickbeds: [2, 3, 4] }),
    kind('room.library', 'hall', 3, 4000),
    kind('room.armoury', 'hall', 3, 3500),
    kind('room.tavern', 'hall', 3, 3000),
    kind('room.strongroom', 'hall', 1, 5000, { belowGround: true }),
    kind('room.heroes', 'hall', 3, 3000),
    kind('room.training-yard', 'compound', 3, 3500, { trainingPlaces: [4, 6, 8] }),
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
      { place: plot('west', 0), kindId: 'room.gate', level: 1 },
      { place: plot('west', 1), kindId: 'room.training-yard', level: 1 },
    ],
  },
  storey: { baseCopper: 8000, stepCopper: 8000, weeks: 6 },
  cellar: { baseCopper: 10000, stepCopper: 10000, weeks: 8 },
  wall: { baseCopper: 5000, stepCopper: 5000, weeks: 4 },
  maxPlotsPerSide: 6,
  winterWeeksBp: 7500,
  noSickbedBp: 20000,
  homeTraining: { youngBp: 300, primeBp: 150, placedBp: 15000, unplacedBp: 7500 },
};

/** House incidents (house/SPEC.md, Incidents): starting numbers, all ASSUMPTIONS (see the header). */
export const baseIncidentRules: IncidentRules = {
  kinds: [
    {
      id: 'incident.fire',
      effect: 'fire',
      roomKindIds: ['room.forge', 'room.tavern', 'room.works', 'room.barracks'],
      weeklyBp: 30,
      paidCopper: 400,
    },
    {
      id: 'incident.theft',
      effect: 'theft',
      roomKindIds: ['room.strongroom'],
      weeklyBp: 110,
      paidCopper: 300,
      shareBp: [1200, 600, 300],
      noRoomShareBp: 2000,
      recoverBp: 5000,
    },
    {
      id: 'incident.sickness',
      effect: 'sickness',
      roomKindIds: ['room.barracks'],
      crowdedBp: 7500,
      weeklyBp: 110,
      paidCopper: 250,
      count: 3,
      freeDays: 14,
      paidDays: 7,
      sickbedBp: 5000,
    },
  ],
  levelBp: [15_000, 10_000, 5000],
  noRoomBp: 20_000,
  debtBp: 20_000,
  fullBp: 20_000,
  innFeeCopper: 60,
  repairBp: 5000,
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
  hall(1, 0), // barracks
  hall(0, 2), // infirmary
  plot('west', 1), // training yard
  hall(0, 0), // tavern
  hall(2, 0), // armoury
  hall(2, 1), // Hall of Heroes
  hall(3, 0), // library
  hall(-1, 0), // strongroom
  plot('west', 0), // gate
  plot('east', 0), // forge
  plot('east', 1), // works
];

/**
 * The reference full house the simulator builds toward, in order (D-172): every kind at level 3.
 * Barracks first, so the founded party can grow into a second (D-187), then the infirmary (a new
 * guild has none, so injuries last twice as long, D-186) and the yard's second plot. Hall: ground floor tavern, study, infirmary; floor 1 barracks (3 cells);
 * floor 2 armoury, the Hall of Heroes and a spare cell; floor 3 library (2) and a spare cell; cellar
 * strongroom and 2 spare cells. Compound: gate and training yard (2) west, forge and works east,
 * 1 spare plot. That is 2 storeys and 1 cellar added, no wall pushed. Tools only; the game has no
 * "full" house.
 */
export const fullHousePlan: readonly HousePlanStep[] = [
  build(hall(1, 1), 'room.barracks'),
  build(hall(0, 2), 'room.infirmary'),
  build(plot('west', 2), 'room.training-yard'),
  build(hall(1, 2), 'room.barracks'),
  { type: 'extend', direction: 'up' },
  build(hall(2, 0), 'room.armoury'),
  build(hall(2, 1), 'room.heroes'),
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

/**
 * The patron's grace years for a new, small guild (D-189), assumptions for the simulator: for the
 * first 2 seasons, goals of 9 members by year's end (a second party forming), 30 renown in the year
 * and a room built; 5 confidence for each goal met, 5 lost for each missed; no dismissal until the
 * third Assembly.
 */
export const baseGraceRules: NonNullable<CareerRules['grace']> = {
  years: 2,
  roster: 9,
  renown: 30,
  goalMet: 5,
  goalMissed: 5,
};

/** The career rules with the house on: what `tools/career-sim.ts` plays with house=on. */
export const houseGuildRules: GuildRules = {
  ...careerGuildRules,
  career: { ...baseCareerRules, grace: baseGraceRules },
  house: baseHouseRules,
  // The founding draft (D-188) pays its purse; the inherited `startingChestCopper` is not used.
  founding: baseFoundingRules,
};

/** The house-on career rules with incidents and inn lodgers (career-sim incidents=on). */
export const houseIncidentGuildRules: GuildRules = {
  ...houseGuildRules,
  house: { ...baseHouseRules, incidents: baseIncidentRules },
};
