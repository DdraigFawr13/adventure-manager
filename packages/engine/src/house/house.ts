// House v0 (SPEC.md): the guild house's space, what building costs and takes, upkeep, and beds.
import type { EventSink } from '../core/events.ts';
import { divRoundDown } from '../core/math.ts';
import { guildTurn, pay, weekInYear, weekOf, type GuildTurn } from '../guild/turn.ts';
import type { Command, GameEvent, GameState } from '../resolution/types.ts';
import type {
  BuiltCell,
  CompoundSide,
  ExtendDirection,
  HouseJob,
  HouseRules,
  HouseState,
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
    added: { up: 0, down: 0, west: 0, east: 0 },
    nextWorkNo: 0,
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
    w.job.kind === 'build' ? [w.job.place] : w.job.kind === 'upgrade' ? [...w.job.places] : [],
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
): void {
  if (costCopper > turn.guild.chestCopper)
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

/** Each week start: finish the work that is due, then charge upkeep for every finished cell. */
export function houseWeek(turn: GuildTurn, causeId: string): void {
  const house = turn.guild.house;
  const rules = turn.rules.house;
  if (!house || !rules) return;
  const week = weekOf(turn.state.calendar, turn.rules);
  for (const work of [...house.work]) {
    if (work.doneWeek > week) continue;
    house.work.splice(house.work.indexOf(work), 1);
    finish(house, rules, work.job);
    turn.sink.emit({
      type: 'house.finished',
      causeId,
      subjectIds: [work.id],
      ...jobParts(work.job),
      doneWeek: work.doneWeek,
    });
  }
  const upkeep = upkeepOf(house, rules);
  if (upkeep > 0) pay(turn, -upkeep, 'rooms', causeId);
}

function finish(house: HouseState, rules: HouseRules, job: HouseJob): void {
  if (job.kind === 'build') {
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
