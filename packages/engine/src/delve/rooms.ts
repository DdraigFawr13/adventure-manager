// The delve's rooms (SPEC.md "Rooms"): the start and the layout, choice rooms, Scout ahead, rows
// after a scout, and moving on. Layout, choice and scout rolls are on `delve.rooms` only.
import { BP_CERTAIN, streamFor, type RngStream } from '../core/rng.ts';
import type { EventSink } from '../core/events.ts';
import type { Value } from '../core/value.ts';
import { chanceValue } from '../resolution/check.ts';
import type { Attribute, GameEvent, GameState } from '../resolution/types.ts';
import { adventurerOf, delveContent, isUp, runOf } from './actions.ts';
import { endDelve, enterFight, partyFighter } from './fight.ts';
import type {
  ChoiceRoom,
  DelveCommand,
  DelveRun,
  FightRoom,
  Fighter,
  RoomPlan,
  Site,
} from './types.ts';

type Sink = EventSink<GameEvent>;
type Cmd<T extends DelveCommand['type']> = Extract<DelveCommand, { type: T }>;

const roomStream = (state: GameState): RngStream => streamFor(state, 'delve.rooms');

export function siteOf(state: GameState, siteId: string): Site {
  const site = delveContent(state).sites[siteId];
  if (!site) throw new Error(`No site ${siteId}.`);
  return site;
}

export function fightRoomOf(site: Site, roomId: string): FightRoom {
  const room = site.boss?.id === roomId ? site.boss : site.fightRooms.find((r) => r.id === roomId);
  if (!room) throw new Error(`No fight room ${roomId} in ${site.id}.`);
  return room;
}

export function choiceRoomOf(site: Site, roomId: string): ChoiceRoom {
  const room =
    site.entry?.id === roomId ? site.entry : site.choiceRooms?.find((r) => r.id === roomId);
  if (!room) throw new Error(`No choice room ${roomId} in ${site.id}.`);
  return room;
}

/** Draws `count` items without repeats, in drawn order. */
function draw<T>(rng: RngStream, pool: readonly T[], count: number): T[] {
  const left = [...pool];
  const out: T[] = [];
  for (let i = 0; i < count && left.length; i += 1)
    out.push(left.splice(rng.int(left.length), 1)[0]!);
  return out;
}

/**
 * Entry, fight, fight, then with `extraRoomBp` one more room (a choice room or a fourth fight at
 * equal odds), fight, boss. A site without an entry and a boss is S1's one-room sample.
 */
function layout(state: GameState, site: Site): RoomPlan[] {
  if (!site.entry || !site.boss) {
    const first = site.fightRooms[0];
    if (!first) throw new Error(`Site ${site.id} has no fight room.`);
    return [{ kind: 'fight', roomId: first.id, boss: false }];
  }
  const { rules } = delveContent(state);
  const rng = roomStream(state);
  const extra = rng.int(BP_CERTAIN) < rules.room.extraRoomBp;
  const extraIsChoice = extra && rng.int(2) === 0 && (site.choiceRooms?.length ?? 0) > 0;
  const fights = draw(rng, site.fightRooms, extra && !extraIsChoice ? 4 : 3);
  if (fights.length < 3) throw new Error(`Site ${site.id} needs at least 3 fight rooms.`);
  const fight = (r: FightRoom): RoomPlan => ({ kind: 'fight', roomId: r.id, boss: false });
  const plan: RoomPlan[] = [
    { kind: 'choice', roomId: site.entry.id },
    fight(fights[0]!),
    fight(fights[1]!),
  ];
  if (extraIsChoice) {
    const room = draw(rng, site.choiceRooms ?? [], 1)[0]!;
    plan.push({ kind: 'choice', roomId: room.id });
  } else if (extra) plan.push(fight(fights[3]!));
  plan.push(fight(fights[2]!));
  plan.push({ kind: 'fight', roomId: site.boss.id, boss: true });
  return plan;
}

export function startDelve(state: GameState, command: Cmd<'delve.start'>, sink: Sink): void {
  if (state.delve && state.delve.phase !== 'ended') throw new Error('A delve is already running.');
  const content = delveContent(state);
  const site = siteOf(state, command.siteId);
  if (command.members.length === 0) throw new Error('A delve needs at least one member.');
  if (command.pack.length > content.rules.packMax) throw new Error('The pack holds too much.');
  const fighters = command.members.map((m) => partyFighter(state, m));
  const skillUses: Record<string, Record<string, number>> = {};
  for (const f of fighters) {
    const cls = content.classes[f.kindId];
    skillUses[f.id] = Object.fromEntries(
      (cls?.skills ?? []).map((s) => [s, content.rules.skillUses]),
    );
  }
  const run: DelveRun = {
    id: command.id,
    siteId: site.id,
    danger: site.danger,
    approach: command.approach,
    memberIds: fighters.map((f) => f.id),
    tactics: command.tactics,
    rooms: layout(state, site),
    roomIndex: 0,
    phase: 'choice',
    fighters,
    fight: null,
    pack: command.pack.map((p) => ({ kindId: p.kindId })),
    skillUses,
    auto: { on: false, saveSkillsForBoss: true },
    bonuses: { offGuard: false, alerted: false, drillBp: command.drillBp },
    scouted: false,
    seen: false,
    loot: { parts: [], gear: [] },
    outcome: null,
  };
  state.delve = run;
  const started = sink.emit({
    type: 'delve.started',
    causeId: command.id,
    subjectIds: [...run.memberIds],
    siteId: site.id,
  });
  enterRoom(state, run, sink, started);
}

function enterRoom(state: GameState, run: DelveRun, sink: Sink, cause: string): void {
  const plan = run.rooms[run.roomIndex];
  if (!plan) throw new Error('No room to enter.');
  const site = siteOf(state, run.siteId);
  if (plan.kind === 'fight') {
    enterFight(state, run, fightRoomOf(site, plan.roomId), sink, cause);
    return;
  }
  run.phase = 'choice';
  run.scouted = false;
  run.seen = false;
  delete run.lastChoice;
  sink.emit({
    type: 'room.entered',
    causeId: cause,
    subjectIds: [],
    roomId: plan.roomId,
    roomIndex: run.roomIndex,
  });
}

/** v0's check: base + step × (attribute − difficulty), clamped (D-119). */
export function checkChance(
  state: GameState,
  run: DelveRun,
  adventurerId: string,
  attribute: Attribute,
  difficulty: number,
): Value {
  const { check } = delveContent(state).rules;
  const score = adventurerOf(state, adventurerId).attributes[attribute];
  return chanceValue(
    check.baseBp,
    [{ sourceId: 'check.difference', amount: check.stepBp * (score - difficulty) }],
    check.minBp,
    check.maxBp,
    run.id,
  );
}

export function optionAttribute(state: GameState, run: DelveRun, optionIndex: number): Attribute {
  const room = currentChoice(state, run);
  const option = room.options[optionIndex];
  if (!option) throw new Error(`No way ${optionIndex} in ${room.id}.`);
  return option.attribute === 'approach'
    ? delveContent(state).rules.approachAttribute[run.approach]
    : option.attribute;
}

export function currentChoice(state: GameState, run: DelveRun): ChoiceRoom {
  const plan = run.rooms[run.roomIndex];
  if (run.phase !== 'choice' || plan?.kind !== 'choice') throw new Error('Not in a choice room.');
  return choiceRoomOf(siteOf(state, run.siteId), plan.roomId);
}

/** The chance a tester gets through one way of the current choice room. */
export function choiceChance(state: GameState, optionIndex: number, testerId: string): Value {
  const run = runOf(state);
  const difficulty = delveContent(state).rules.room.difficulty[run.danger];
  return checkChance(state, run, testerId, optionAttribute(state, run, optionIndex), difficulty);
}

const memberOf = (run: DelveRun, id: string): Fighter | undefined =>
  run.fighters.find((f) => f.id === id);

export function chooseWay(state: GameState, command: Cmd<'delve.choose'>, sink: Sink): void {
  const run = runOf(state);
  const room = currentChoice(state, run);
  const option = room.options[command.optionIndex];
  if (!option) throw new Error(`No way ${command.optionIndex} in ${room.id}.`);
  const tester = memberOf(run, command.testerId);
  if (!tester || !isUp(tester)) throw new Error(`${command.testerId} cannot try.`);
  const chance = choiceChance(state, command.optionIndex, tester.id);
  const roll = roomStream(state).int(BP_CERTAIN) + 1;
  const success = roll <= chance.total;
  const rolled = sink.emit({
    type: 'choice.rolled',
    causeId: command.id,
    subjectIds: [tester.id],
    roomId: room.id,
    optionIndex: command.optionIndex,
    attribute: optionAttribute(state, run, command.optionIndex),
    chance,
    roll,
    success,
    failure: success ? null : option.onFailure,
  });
  const isEntry = siteOf(state, run.siteId).entry?.id === room.id;
  // Success either way through the entry puts the first fight's foes off guard (D-232).
  if (success && isEntry) run.bonuses.offGuard = true;
  if (!success && option.onFailure === 'alert') run.bonuses.alerted = true;
  if (!success && option.onFailure === 'hurt') {
    const { hurt } = delveContent(state).rules.room;
    const from = tester.health;
    tester.health = Math.max(1, from - hurt);
    if (tester.health !== from)
      sink.emit({
        type: 'health.changed',
        causeId: rolled,
        subjectIds: [tester.id],
        from,
        to: tester.health,
      });
  }
  run.lastChoice = { optionIndex: command.optionIndex, testerId: tester.id, success };
  run.phase = 'breather';
}

/** The standing member who may scout ahead, or null (spec: only with a standing rogue). */
export function scoutOf(state: GameState, run: DelveRun): Fighter | null {
  const { scoutClassId } = delveContent(state).rules.room;
  return run.fighters.find((f) => f.kindId === scoutClassId && isUp(f)) ?? null;
}

/** Why Scout ahead can't be tried now, or null. */
export function scoutRefusal(state: GameState): string | null {
  const run = state.delve;
  if (!run || run.phase !== 'breather') return 'Scout ahead is between rooms.';
  if (run.scouted) return 'Scout ahead is spent for this gap.';
  if (run.roomIndex >= run.rooms.length - 1) return 'There is no room ahead.';
  if (!scoutOf(state, run)) return 'No rogue stands to scout.';
  return null;
}

export function scoutChance(state: GameState): Value {
  const run = runOf(state);
  const scout = scoutOf(state, run);
  if (!scout) throw new Error('No rogue stands to scout.');
  const { room } = delveContent(state).rules;
  return checkChance(state, run, scout.id, room.scoutAttribute, room.difficulty[run.danger]);
}

export function scoutAhead(state: GameState, command: Cmd<'delve.scout'>, sink: Sink): void {
  const why = scoutRefusal(state);
  if (why) throw new Error(why);
  const run = runOf(state);
  const scout = scoutOf(state, run)!;
  const chance = scoutChance(state);
  const roll = roomStream(state).int(BP_CERTAIN) + 1;
  const success = roll <= chance.total;
  run.scouted = true;
  run.seen = success;
  if (!success) run.bonuses.alerted = true;
  sink.emit({
    type: 'scout.rolled',
    causeId: command.id,
    subjectIds: [scout.id],
    chance,
    roll,
    success,
  });
}

export function setRows(state: GameState, command: Cmd<'delve.rows'>, sink: Sink): void {
  const run = runOf(state);
  if (run.phase !== 'breather' || !run.seen) throw new Error('Rows are set after a seen scout.');
  for (const [id, row] of Object.entries(command.rows)) {
    const member = memberOf(run, id);
    if (!member || member.status === 'dead') throw new Error(`${id} is not in the party.`);
    if (member.row === row) continue;
    member.row = row;
    sink.emit({ type: 'rows.set', causeId: command.id, subjectIds: [id], row });
  }
}

export function nextRoom(state: GameState, command: Cmd<'delve.next'>, sink: Sink): void {
  const run = runOf(state);
  if (run.phase !== 'breather') throw new Error('Move on only between rooms.');
  if (run.roomIndex >= run.rooms.length - 1) throw new Error('There is no room ahead.');
  if (!run.fighters.some(isUp)) {
    endDelve(state, run, 'routed', sink, command.id);
    return;
  }
  run.roomIndex += 1;
  enterRoom(state, run, sink, command.id);
}
