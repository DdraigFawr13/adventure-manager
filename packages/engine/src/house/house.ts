// House v0 (SPEC.md): the guild house's space, what building costs and takes, upkeep, and beds.
import type { EventSink } from '../core/events.ts';
import { divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import { ageOf, setAttribute } from '../career/people.ts';
import { trainingBp } from '../staff/areas.ts';
import { guildTurn, isFree, pay, weekInYear, weekOf, type GuildTurn } from '../guild/turn.ts';
import { ATTRIBUTES, type Command, type GameEvent, type GameState } from '../resolution/types.ts';
import type { IncidentAnswer, IncidentResult, StopReason } from '../guild/types.ts';
import type {
  BuiltCell,
  CompoundSide,
  ExtendDirection,
  HouseJob,
  HouseRules,
  HouseState,
  IncidentKind,
  IncidentRules,
  Place,
  RoomKind,
} from './types.ts';

const BP = 10_000;
const SIDES: readonly CompoundSide[] = ['west', 'east'];

type Slot = BuiltCell | null | undefined;

function emptyCells(count: number): (BuiltCell | null)[] {
  return Array.from({ length: count }, () => null);
}

function copyPlace(place: Place): Place {
  return place.area === 'hall'
    ? { area: 'hall', floor: place.floor, cell: place.cell }
    : { area: 'compound', side: place.side, plot: place.plot };
}

function samePlace(a: Place, b: Place): boolean {
  if (a.area === 'hall') return b.area === 'hall' && a.floor === b.floor && a.cell === b.cell;
  return b.area === 'compound' && a.side === b.side && a.plot === b.plot;
}

function describe(place: Place): string {
  return place.area === 'hall'
    ? `hall floor ${place.floor} cell ${place.cell}`
    : `${place.side} plot ${place.plot}`;
}

/** The row a place sits in and its index in it; undefined when the floor or side has no such row. */
function rowOf(house: HouseState, place: Place): { row: (BuiltCell | null)[]; at: number } | null {
  if (place.area === 'hall') {
    const row = house.floors[place.floor];
    return row ? { row, at: place.cell } : null;
  }
  return { row: house.compound[place.side], at: place.plot };
}

function slot(house: HouseState, place: Place): Slot {
  const found = rowOf(house, place);
  return found ? found.row[found.at] : undefined;
}

function withIndex(place: Place, at: number): Place {
  return place.area === 'hall' ? { ...place, cell: at } : { ...place, plot: at };
}

function kindOf(rules: HouseRules, kindId: string): RoomKind {
  const kind = rules.kinds.find((k) => k.id === kindId);
  if (!kind) throw new Error(`${kindId} is not a room kind.`);
  return kind;
}

/** The finished cells of the run of `kindId` that includes (or would include) `place`, as places. */
function runAround(house: HouseState, place: Place, kindId: string, pending: Place[]): Place[] {
  const found = rowOf(house, place);
  if (!found) return [];
  const same = (at: number) => {
    const p = withIndex(place, at);
    return found.row[at]?.kindId === kindId || pending.some((q) => samePlace(p, q));
  };
  let from = found.at;
  while (same(from - 1)) from -= 1;
  let to = found.at;
  while (same(to + 1)) to += 1;
  const run: Place[] = [];
  for (let at = from; at <= to; at += 1) run.push(withIndex(place, at));
  return run;
}

function cellsOf(house: HouseState): BuiltCell[] {
  return [
    ...Object.values(house.floors).flat(),
    ...house.compound.west,
    ...house.compound.east,
  ].filter((c): c is BuiltCell => c !== null);
}

/** Beds the barracks give: each barracks cell's beds at its level (D-170). */
export function bedsOf(house: HouseState, rules: HouseRules): number {
  let beds = 0;
  for (const cell of cellsOf(house))
    beds += rules.kinds.find((k) => k.id === cell.kindId)?.beds?.[cell.level - 1] ?? 0;
  return beds;
}

/** Sickbeds the infirmary gives: each infirmary cell's sickbeds at its level (D-186). */
export function sickbedsOf(house: HouseState, rules: HouseRules): number {
  let n = 0;
  for (const cell of cellsOf(house))
    n += rules.kinds.find((k) => k.id === cell.kindId)?.sickbeds?.[cell.level - 1] ?? 0;
  return n;
}

/** Training places the yard gives: each training-yard cell's places at its level (D-186). */
export function trainingPlacesOf(house: HouseState, rules: HouseRules): number {
  let n = 0;
  for (const cell of cellsOf(house))
    n += rules.kinds.find((k) => k.id === cell.kindId)?.trainingPlaces?.[cell.level - 1] ?? 0;
  return n;
}

/**
 * Lasting-injury days for a member whose party comes home on `homeDay`, and the sickbed they take,
 * held from the day the quest is settled (today) until they are fit. Holders fit by today or gone
 * are dropped first; parties settle on arrival, so today, not a party's home day, is the clock.
 * The caller passes the days before the sickbed rule and the member's rest before the injury days;
 * `days` is then scaled when no sickbed is free. Returns null without house rules.
 */
export function layUp(
  turn: GuildTurn,
  memberId: string,
  homeDay: number,
  restDays: number,
  days: number,
): { days: number; sickbed: boolean } | null {
  const rules = turn.rules.house;
  const house = turn.guild.house;
  if (!rules || !house) return null;
  const today = turn.state.calendar;
  const held = house.sickbeds.filter(
    (b) => b.untilDay > today && turn.guild.members.some((m) => m.id === b.memberId),
  );
  house.sickbeds.splice(0, house.sickbeds.length, ...held);
  if (held.length < sickbedsOf(house, rules)) {
    house.sickbeds.push({ memberId, untilDay: homeDay + restDays + days });
    return { days, sickbed: true };
  }
  return {
    days: Math.max(1, divRoundDown(days * rules.noSickbedBp, BP_CERTAIN)),
    sickbed: false,
  };
}

/** Copper a week the finished cells cost to keep, by kind and level (the study costs nothing). */
export function upkeepOf(house: HouseState, rules: HouseRules): number {
  let upkeep = 0;
  for (const cell of cellsOf(house))
    upkeep += rules.kinds.find((k) => k.id === cell.kindId)?.upkeepCopper[cell.level - 1] ?? 0;
  return upkeep;
}

/** At the founding: the starting layout from content. Throws when the founded roster has no beds. */
export function startHouse(turn: GuildTurn, size: number): void {
  const rules = turn.rules.house;
  if (!rules) return;
  const { start } = rules;
  const house: HouseState = {
    lowestFloor: start.lowestFloor,
    highestFloor: start.highestFloor,
    floors: {},
    compound: { west: emptyCells(start.plotsPerSide), east: emptyCells(start.plotsPerSide) },
    work: [],
    sickbeds: [],
    added: { up: 0, down: 0, west: 0, east: 0 },
    nextWorkNo: 0,
    letter: null,
    scars: [],
  };
  for (const kind of rules.kinds) {
    const levels = kind.cellCostCopper.length;
    if (kind.weeks.length !== levels || kind.upkeepCopper.length !== levels)
      throw new Error(`${kind.id} needs costs, weeks and upkeep for each of its levels.`);
  }
  for (let floor = start.lowestFloor; floor <= start.highestFloor; floor += 1)
    house.floors[floor] = emptyCells(rules.cellsPerFloor);
  for (const c of start.cells) {
    const kind = kindOf(rules, c.kindId);
    const found = rowOf(house, c.place);
    if (
      !found ||
      samePlace(c.place, rules.studyPlace) ||
      found.row[found.at] !== null ||
      c.level < 1 ||
      c.level > kind.cellCostCopper.length
    )
      throw new Error(`The starting layout cannot hold ${c.kindId} at ${describe(c.place)}.`);
    found.row[found.at] = { kindId: c.kindId, level: c.level };
  }
  const beds = bedsOf(house, rules);
  if (size > beds) throw new Error(`The founded roster of ${size} has only ${beds} beds.`);
  turn.guild.house = house;
}

/** Every place a running job holds, so no other command can touch it. */
function placesHeld(house: HouseState): Place[] {
  return house.work.flatMap((w) =>
    w.job.kind === 'build' || w.job.kind === 'repair'
      ? [w.job.place]
      : w.job.kind === 'upgrade'
        ? [...w.job.places]
        : [],
  );
}

function jobParts(job: HouseJob): {
  job: HouseJob['kind'];
  places: Place[];
  kindId?: string;
  level?: number;
  direction?: ExtendDirection;
} {
  if (job.kind === 'build')
    return {
      job: 'build',
      places: [copyPlace(job.place)],
      kindId: job.kindId,
      level: job.level,
    };
  if (job.kind === 'repair')
    return {
      job: 'repair',
      places: [copyPlace(job.place)],
      kindId: job.kindId,
      level: job.level,
    };
  if (job.kind === 'upgrade')
    return {
      job: 'upgrade',
      places: job.places.map(copyPlace),
      kindId: job.kindId,
      level: job.toLevel,
    };
  return { job: 'extend', places: [], direction: job.direction };
}

function winterWeeks(turn: GuildTurn, weeks: number, house: HouseRules): number {
  const { rules, state } = turn;
  if (weekInYear(state.calendar, rules) < rules.winterFromWeek) return weeks;
  return divRoundDown(weeks * house.winterWeeksBp + BP - 1, BP);
}

function begin(
  turn: GuildTurn,
  house: HouseState,
  rules: HouseRules,
  command: { id: string },
  job: HouseJob,
  costCopper: number,
  weeks: number,
  intoDebt = false,
): void {
  if (!intoDebt && costCopper > turn.guild.chestCopper)
    throw new Error(`The chest holds ${turn.guild.chestCopper} copper; this costs ${costCopper}.`);
  const doneWeek = weekOf(turn.state.calendar, turn.rules) + winterWeeks(turn, weeks, rules);
  house.nextWorkNo += 1;
  const id = `house.work.${house.nextWorkNo}`;
  house.work.push({ id, job, doneWeek });
  const paid = pay(turn, -costCopper, 'building', command.id, [id]);
  turn.sink.emit({
    type: 'house.started',
    causeId: paid,
    subjectIds: [id],
    ...jobParts(job),
    costCopper,
    doneWeek,
  });
}

/** A house command's shared checks: the house exists and the day is today. */
function houseTurn(
  state: GameState,
  command: { day: number },
  sink: EventSink<GameEvent>,
): { turn: GuildTurn; house: HouseState; rules: HouseRules } {
  const turn = guildTurn(state, sink);
  const house = turn.guild.house;
  const rules = turn.rules.house;
  if (!house || !rules) throw new Error('This guild has no house rules.');
  if (command.day !== state.calendar) throw new Error(`Day ${command.day} is not today.`);
  return { turn, house, rules };
}

export function buildRoom(
  state: GameState,
  command: Extract<Command, { type: 'house.build' }>,
  sink: EventSink<GameEvent>,
): void {
  const { turn, house, rules } = houseTurn(state, command, sink);
  const { place } = command;
  const kind = kindOf(rules, command.kindId);
  const where = describe(place);
  if (samePlace(place, rules.studyPlace)) throw new Error('The study cannot be built over.');
  if (placesHeld(house).some((p) => samePlace(p, place)))
    throw new Error(`The ${where} is under work.`);
  const cell = slot(house, place);
  if (cell === undefined) throw new Error(`There is no ${where}.`);
  if (cell !== null) throw new Error(`The ${where} is not empty.`);
  if (place.area !== kind.where) throw new Error(`${kind.id} goes in the ${kind.where}.`);
  if (kind.belowGround && !(place.area === 'hall' && place.floor < 0))
    throw new Error(`${kind.id} goes below ground.`);
  const pending = house.work.flatMap((w) =>
    w.job.kind === 'build' && w.job.kindId === kind.id ? [w.job.place] : [],
  );
  const run = runAround(house, place, kind.id, pending);
  // A room with a cell under work can't be joined: the new cell would take a level about to change.
  const held = placesHeld(house);
  if (run.some((p) => !samePlace(p, place) && held.some((q) => samePlace(p, q))))
    throw new Error(`The ${kind.id} beside the ${where} is under work.`);
  if (run.length > kind.maxCells)
    throw new Error(`${kind.id} runs to at most ${kind.maxCells} cells.`);
  // Joining a run takes its lowest level; the new cell pays every level up to it.
  const joined = run.flatMap((p) => {
    const c = slot(house, p);
    return c ? [c.level] : [];
  });
  const level = joined.length > 0 ? Math.min(...joined) : 1;
  let cost = 0;
  for (let n = 0; n < level; n += 1) cost += kind.cellCostCopper[n] ?? 0;
  // Building on a burnt-out place, at full price, replaces any repair it was owed (D-193).
  const scar = house.scars.findIndex((x) => samePlace(x.place, place));
  if (scar >= 0) house.scars.splice(scar, 1);
  begin(
    turn,
    house,
    rules,
    command,
    { kind: 'build', place: copyPlace(place), kindId: kind.id, level },
    cost,
    kind.weeks[0] ?? 0,
  );
}

export function upgradeRoom(
  state: GameState,
  command: Extract<Command, { type: 'house.upgrade' }>,
  sink: EventSink<GameEvent>,
): void {
  const { turn, house, rules } = houseTurn(state, command, sink);
  const { place } = command;
  const where = describe(place);
  const held = placesHeld(house);
  if (held.some((p) => samePlace(p, place))) throw new Error(`The ${where} is under work.`);
  const cell = slot(house, place);
  if (cell === undefined) throw new Error(`There is no ${where}.`);
  if (cell === null) throw new Error(`The ${where} holds no room.`);
  const kind = kindOf(rules, cell.kindId);
  const pending = house.work.flatMap((w) =>
    w.job.kind === 'build' && w.job.kindId === kind.id ? [w.job.place] : [],
  );
  // A room with a cell under work (a new cell joining it, or an upgrade) can't be raised.
  const whole = runAround(house, place, kind.id, pending);
  if (whole.some((p) => held.some((q) => samePlace(p, q))))
    throw new Error(`The ${kind.id} has a cell under work.`);
  const run = whole.filter((p) => slot(house, p) !== null);
  const level = Math.min(...run.map((p) => slot(house, p)?.level ?? Infinity));
  if (level >= kind.cellCostCopper.length) throw new Error(`The ${kind.id} is at its top level.`);
  const targets = run.filter((p) => slot(house, p)?.level === level);
  begin(
    turn,
    house,
    rules,
    command,
    { kind: 'upgrade', kindId: kind.id, places: targets.map(copyPlace), toLevel: level + 1 },
    (kind.cellCostCopper[level] ?? 0) * targets.length,
    kind.weeks[level] ?? 0,
  );
}

/** `house.repair` (D-193): restores a place a fire took to its old level, at a share of the cost, into debt if need be. */
export function repairRoom(
  state: GameState,
  command: Extract<Command, { type: 'house.repair' }>,
  sink: EventSink<GameEvent>,
): void {
  const { turn, house, rules } = houseTurn(state, command, sink);
  const incidents = rules.incidents;
  if (!incidents) throw new Error('This house has no incidents.');
  const { place } = command;
  const where = describe(place);
  const scar = house.scars.find((x) => samePlace(x.place, place));
  if (!scar) throw new Error(`The ${where} has no fire damage.`);
  if (placesHeld(house).some((p) => samePlace(p, place)))
    throw new Error(`The ${where} is under work.`);
  const cell = slot(house, place);
  if (cell && cell.kindId !== scar.kindId) throw new Error(`The ${where} holds another room.`);
  const kind = kindOf(rules, scar.kindId);
  const from = cell?.level ?? 0;
  let cost = 0;
  for (let n = from; n < scar.level; n += 1) cost += kind.cellCostCopper[n] ?? 0;
  begin(
    turn,
    house,
    rules,
    command,
    { kind: 'repair', place: copyPlace(place), kindId: scar.kindId, level: scar.level },
    divRoundDown(cost * incidents.repairBp, BP),
    kind.weeks[scar.level - 1] ?? 0,
    true,
  );
}

export function extendHouse(
  state: GameState,
  command: Extract<Command, { type: 'house.extend' }>,
  sink: EventSink<GameEvent>,
): void {
  const { turn, house, rules } = houseTurn(state, command, sink);
  const { direction } = command;
  if (house.work.some((w) => w.job.kind === 'extend' && w.job.direction === direction))
    throw new Error(`The ${direction} extension is already under work.`);
  const step = direction === 'up' ? rules.storey : direction === 'down' ? rules.cellar : rules.wall;
  if (
    (direction === 'west' || direction === 'east') &&
    house.compound[direction].length >= rules.maxPlotsPerSide
  )
    throw new Error(`The ${direction} side already has ${rules.maxPlotsPerSide} plots.`);
  begin(
    turn,
    house,
    rules,
    command,
    { kind: 'extend', direction },
    step.baseCopper + step.stepCopper * house.added[direction],
    step.weeks,
  );
}

/**
 * Each week start: settle an unanswered letter by default, finish the work that is due, charge
 * upkeep for every finished cell, then the inn fee for lodgers, training, and the incident rolls.
 */
export function houseWeek(turn: GuildTurn, causeId: string, stops: Set<StopReason>): void {
  const house = turn.guild.house;
  const rules = turn.rules.house;
  if (!house || !rules) return;
  const week = weekOf(turn.state.calendar, turn.rules);
  const incidents = rules.incidents;
  if (incidents && house.letter) settle(turn, house, rules, incidents, 'free', true, causeId);
  for (const work of [...house.work]) {
    if (work.doneWeek > week) continue;
    house.work.splice(house.work.indexOf(work), 1);
    finish(house, rules, work.job);
    if (work.job.kind === 'build' && turn.guild.career) turn.guild.career.roomsThisYear += 1;
    turn.sink.emit({
      type: 'house.finished',
      causeId,
      subjectIds: [work.id],
      ...jobParts(work.job),
      doneWeek: work.doneWeek,
    });
  }
  // A scar heals once its place is back at its old level, or holds another kind (D-193).
  const healed = house.scars.filter((x) => {
    const cell = slot(house, x.place);
    return cell && (cell.kindId !== x.kindId || cell.level >= x.level);
  });
  for (const x of healed) house.scars.splice(house.scars.indexOf(x), 1);
  const upkeep = upkeepOf(house, rules);
  if (upkeep > 0) pay(turn, -upkeep, 'rooms', causeId);
  if (incidents) {
    const lodgers = turn.guild.members.length - bedsOf(house, rules);
    if (lodgers > 0) pay(turn, -lodgers * incidents.innFeeCopper, 'inn', causeId);
  }
  trainAtHome(turn, house, rules, causeId);
  if (incidents) rollIncidents(turn, house, rules, incidents, causeId, stops);
}

/** Every built cell's place, in place order: hall floors low to high, cells left to right, then west, then east plots. */
function cellPlaces(house: HouseState): Place[] {
  const places: Place[] = [];
  for (let floor = house.lowestFloor; floor <= house.highestFloor; floor += 1)
    (house.floors[floor] ?? []).forEach((c, cell) => {
      if (c) places.push({ area: 'hall', floor, cell });
    });
  for (const side of SIDES)
    house.compound[side].forEach((c, plot) => {
      if (c) places.push({ area: 'compound', side, plot });
    });
  return places;
}

/** The room's level at a cell: the lowest level among the cells of its run. */
function roomLevelAt(house: HouseState, place: Place, kindId: string): number {
  const levels = runAround(house, place, kindId, []).flatMap((p) => slot(house, p)?.level ?? []);
  return Math.min(...levels);
}

/** The chance (basis points) a target strikes this week: each multiplier in basis points, rounded down at each step. */
export function incidentChanceBp(
  rules: IncidentRules,
  weeklyBp: number,
  level: number | null,
  inDebt: boolean,
  full: boolean,
): number {
  const byLevel = level === null ? rules.noRoomBp : (rules.levelBp[level - 1] ?? BP);
  let bp = divRoundDown(weeklyBp * byLevel, BP);
  if (inDebt) bp = divRoundDown(bp * rules.debtBp, BP);
  if (full) bp = divRoundDown(bp * rules.fullBp, BP);
  return bp;
}

/** Whether a room kind's cell is full: beds all taken, every sickbed held, or every yard place filled. */
function isFull(turn: GuildTurn, house: HouseState, rules: HouseRules, kind: RoomKind): boolean {
  const today = turn.state.calendar;
  if (kind.beds) return turn.guild.members.length >= bedsOf(house, rules);
  if (kind.sickbeds) {
    const held = house.sickbeds.filter(
      (b) => b.untilDay > today && turn.guild.members.some((m) => m.id === b.memberId),
    );
    return held.length >= sickbedsOf(house, rules);
  }
  if (kind.trainingPlaces)
    return (
      turn.guild.members.filter((m) => isFree(m, today)).length >= trainingPlacesOf(house, rules)
    );
  return false;
}

/** The incident rolls (SPEC.md, Chance): kinds in content order, targets in place order; the first strike ends them. */
function rollIncidents(
  turn: GuildTurn,
  house: HouseState,
  rules: HouseRules,
  incidents: IncidentRules,
  causeId: string,
  stops: Set<StopReason>,
): void {
  if (house.letter) return;
  const rng = streamFor(turn.state, 'house.incidents');
  const inDebt = turn.guild.chestCopper < 0;
  const held = placesHeld(house);
  const strike = (kind: IncidentKind, place: Place | null, stolenCopper?: number) => {
    house.letter = {
      kindId: kind.id,
      place: place ? copyPlace(place) : null,
      week: weekOf(turn.state.calendar, turn.rules),
      feeCopper: kind.paidCopper,
      ...(stolenCopper === undefined ? {} : { stolenCopper }),
    };
    const struck = turn.sink.emit({
      type: 'incident.struck',
      causeId,
      subjectIds: [],
      kindId: kind.id,
      effect: kind.effect,
      place: place ? copyPlace(place) : null,
      feeCopper: kind.paidCopper,
    });
    if (stolenCopper) pay(turn, -stolenCopper, 'theft', struck);
    stops.add('incident');
  };
  for (const kind of incidents.kinds) {
    if (kind.effect === 'theft') {
      if (turn.guild.chestCopper <= 0) continue;
      const best = cellsOf(house)
        .filter((c) => kind.roomKindIds.includes(c.kindId))
        .map((c) => c.level);
      const level = best.length > 0 ? Math.max(...best) : null;
      const bp = incidentChanceBp(incidents, kind.weeklyBp, level, inDebt, false);
      if (!rng.chance(bp)) continue;
      const share = level === null ? kind.noRoomShareBp : (kind.shareBp[level - 1] ?? 0);
      strike(kind, null, divRoundDown(turn.guild.chestCopper * share, BP));
      return;
    }
    for (const place of cellPlaces(house)) {
      const cell = slot(house, place);
      if (!cell || !kind.roomKindIds.includes(cell.kindId)) continue;
      if (held.some((p) => samePlace(p, place))) continue;
      const full = isFull(turn, house, rules, kindOf(rules, cell.kindId));
      if (kind.effect === 'sickness' && !full) continue;
      const level = roomLevelAt(house, place, cell.kindId);
      if (!rng.chance(incidentChanceBp(incidents, kind.weeklyBp, level, inDebt, full))) continue;
      strike(kind, place);
      return;
    }
  }
}

/** Settles the standing letter: the paid fee, then the effect (SPEC.md, Fire, Theft, Sickness). */
function settle(
  turn: GuildTurn,
  house: HouseState,
  rules: HouseRules,
  incidents: IncidentRules,
  answer: IncidentAnswer,
  byDefault: boolean,
  causeId: string,
): void {
  const letter = house.letter;
  if (!letter) return;
  const kind = incidents.kinds.find((k) => k.id === letter.kindId);
  if (!kind) throw new Error(`${letter.kindId} is not an incident kind.`);
  house.letter = null;
  const paid = answer === 'paid';
  const fee = paid ? pay(turn, -letter.feeCopper, 'incident', causeId) : causeId;
  let result: IncidentResult = 'saved';
  let recovered = false;
  if (kind.effect === 'fire') {
    const cell = letter.place ? slot(house, letter.place) : null;
    if (!paid && letter.place && cell) {
      if (!house.scars.some((x) => samePlace(x.place, letter.place!)))
        // non-null: checked in the condition above.
        house.scars.push({
          place: copyPlace(letter.place),
          kindId: cell.kindId,
          level: cell.level,
        });
      if (cell.level > 1) {
        cell.level -= 1;
        result = 'lowered';
      } else {
        const found = rowOf(house, letter.place);
        if (found) found.row[found.at] = null;
        result = 'burnt-out';
      }
    }
  } else if (kind.effect === 'theft') {
    result = 'written-off';
    if (paid) {
      recovered = streamFor(turn.state, 'house.incidents').chance(kind.recoverBp);
      result = recovered ? 'recovered' : 'not-recovered';
    }
  } else result = 'ill';
  const settled = turn.sink.emit({
    type: 'incident.settled',
    causeId: fee,
    subjectIds: [],
    kindId: kind.id,
    effect: kind.effect,
    place: letter.place ? copyPlace(letter.place) : null,
    answer,
    byDefault,
    result,
  });
  if (kind.effect === 'theft' && recovered && letter.stolenCopper)
    pay(turn, letter.stolenCopper, 'theft', settled);
  if (kind.effect === 'sickness') fallIll(turn, house, rules, kind, paid, settled);
}

/** Sickness: `count` members at home and fit, drawn on the incident stream, fall ill (SPEC.md, Sickness). */
function fallIll(
  turn: GuildTurn,
  house: HouseState,
  rules: HouseRules,
  kind: Extract<IncidentKind, { effect: 'sickness' }>,
  paid: boolean,
  causeId: string,
): void {
  const today = turn.state.calendar;
  const rng = streamFor(turn.state, 'house.incidents');
  const pool = turn.guild.members.filter((m) => isFree(m, today));
  const base = paid ? kind.paidDays : kind.freeDays;
  for (let n = Math.min(kind.count, pool.length); n > 0; n -= 1) {
    const [member] = pool.splice(rng.int(pool.length), 1);
    if (!member) continue;
    const held = house.sickbeds.filter(
      (b) => b.untilDay > today && turn.guild.members.some((m) => m.id === b.memberId),
    );
    house.sickbeds.splice(0, house.sickbeds.length, ...held);
    const sickbed = held.length < sickbedsOf(house, rules);
    const days = sickbed ? Math.max(1, divRoundDown(base * kind.sickbedBp, BP)) : base;
    member.outUntilDay = Math.max(member.outUntilDay, today + days);
    if (sickbed) house.sickbeds.push({ memberId: member.id, untilDay: member.outUntilDay });
    turn.sink.emit({
      type: 'member.fell-ill',
      causeId,
      subjectIds: [member.id],
      days,
      sickbed,
    });
  }
}

/** `incident.answer`: the standing letter's paid or free answer (SPEC.md, The letter). */
export function answerIncident(
  state: GameState,
  command: Extract<Command, { type: 'incident.answer' }>,
  sink: EventSink<GameEvent>,
): void {
  const { turn, house, rules } = houseTurn(state, command, sink);
  const incidents = rules.incidents;
  if (!incidents) throw new Error('This house has no incidents.');
  const letter = house.letter;
  if (!letter) throw new Error('No incident letter stands.');
  const fireWatch = incidents.kinds.find((k) => k.id === letter.kindId)?.effect === 'fire';
  // The fire watch may go into debt (D-193); the other paid answers need the coin.
  if (command.answer === 'paid' && !fireWatch && letter.feeCopper > turn.guild.chestCopper)
    throw new Error(
      `The chest holds ${turn.guild.chestCopper} copper; this costs ${letter.feeCopper}.`,
    );
  settle(turn, house, rules, incidents, command.answer, false, command.id);
}

/** Training at home (SPEC.md, D-187): members at home and fit, youngest first; the yard's places go first. */
function trainAtHome(turn: GuildTurn, house: HouseState, rules: HouseRules, causeId: string): void {
  const career = turn.rules.career;
  if (!career) return;
  const today = turn.state.calendar;
  const home: { id: string; age: number }[] = [];
  for (const m of turn.guild.members) {
    if (!isFree(m, today)) continue;
    const who = turn.state.roster.find((a) => a.id === m.id);
    const age = who ? ageOf(turn, who) : null;
    if (age !== null) home.push({ id: m.id, age });
  }
  home.sort((a, b) => a.age - b.age || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const places = trainingPlacesOf(house, rules);
  const rng = streamFor(turn.state, 'house.training');
  const { homeTraining } = rules;
  home.forEach(({ id, age }, rank) => {
    const who = turn.state.roster.find((a) => a.id === id);
    // Without a potential nobody can grow: no draws, as in growAfterQuest.
    if (!who?.potential) return;
    const base =
      age <= career.growth.youngAge
        ? homeTraining.youngBp
        : age <= career.primeAge
          ? homeTraining.primeBp
          : 0;
    const share = rank < places ? homeTraining.placedBp : homeTraining.unplacedBp;
    const scaled = divRoundDown(base * trainingBp(turn), BP_CERTAIN);
    const chance = divRoundDown(scaled * share, BP_CERTAIN);
    const potential = who.potential;
    const options = ATTRIBUTES.filter((a) => who.attributes[a] < potential[a]);
    // Always draw twice, so a member's outcome never shifts the stream for the next one.
    const grows = rng.chance(chance);
    const attribute = options[rng.int(Math.max(1, options.length))];
    if (grows && attribute)
      setAttribute(turn, id, attribute, who.attributes[attribute] + 1, 'training', causeId);
  });
}

function finish(house: HouseState, rules: HouseRules, job: HouseJob): void {
  if (job.kind === 'build' || job.kind === 'repair') {
    const found = rowOf(house, job.place);
    if (found) found.row[found.at] = { kindId: job.kindId, level: job.level };
    return;
  }
  if (job.kind === 'upgrade') {
    for (const place of job.places) {
      const cell = slot(house, place);
      if (cell) cell.level = job.toLevel;
    }
    return;
  }
  house.added[job.direction] += 1;
  if (job.direction === 'up') {
    house.highestFloor += 1;
    house.floors[house.highestFloor] = emptyCells(rules.cellsPerFloor);
  } else if (job.direction === 'down') {
    house.lowestFloor -= 1;
    house.floors[house.lowestFloor] = emptyCells(rules.cellsPerFloor);
  } else if (SIDES.includes(job.direction)) house.compound[job.direction].push(null);
}
