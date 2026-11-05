// The delve's fight (SPEC.md): start, turns in the kept order, foe turns, the round's end and the
// delve's end. Every roll is on `delve.fight` (streamFor only, engine AGENTS.md).
import { clamp } from '../core/math.ts';
import { BP_CERTAIN, streamFor, type RngStream } from '../core/rng.ts';
import type { EventSink } from '../core/events.ts';
import { WOUND, type GameEvent, type GameState } from '../resolution/types.ts';
import {
  FOE_ACTION,
  PACK_ACTION,
  SWAP_ACTION,
  actionOf,
  adventurerOf,
  byMostHurt,
  damageRange,
  delveContent,
  fighterOf,
  fightOf,
  foeKindOf,
  hitChance,
  isUp,
  packKindOf,
  reachableTargets,
  refusal,
  runOf,
} from './actions.ts';
import type {
  DelveCommand,
  DelveRun,
  FightRoom,
  Fighter,
  Intent,
  MemberEnd,
  TargetRule,
} from './types.ts';

type Sink = EventSink<GameEvent>;
type StartCommand = Extract<DelveCommand, { type: 'delve.start' }>;
type ActCommand = Extract<DelveCommand, { type: 'fight.act' }>;

const fightStream = (state: GameState): RngStream => streamFor(state, 'delve.fight');

/** Ties go by id (D-129); plain comparison, no locale (engine AGENTS.md). */
const byId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// ---- Start -------------------------------------------------------------------------------------

export function startDelve(state: GameState, command: StartCommand, sink: Sink): void {
  if (state.delve && state.delve.phase !== 'ended') throw new Error('A delve is already running.');
  const content = delveContent(state);
  const site = content.sites[command.siteId];
  if (!site) throw new Error(`No site ${command.siteId}.`);
  if (command.members.length === 0) throw new Error('A delve needs at least one member.');
  if (command.pack.length > content.rules.packMax) throw new Error('The pack holds too much.');
  const { rules } = content;
  const fighters: Fighter[] = command.members.map((m) => {
    const adventurer = adventurerOf(state, m.adventurerId);
    if (adventurer.dead) throw new Error(`${m.adventurerId} is dead.`);
    const cls = content.classes[adventurer.classId];
    if (!cls) throw new Error(`No delve class ${adventurer.classId}.`);
    const maxHealth = cls.health + adventurer.attributes.toughness - rules.toughnessPivot;
    return {
      id: adventurer.id,
      side: 'party',
      kindId: adventurer.classId,
      row: m.row,
      health: maxHealth,
      maxHealth,
      speed: adventurer.attributes.agility,
      armour: rules.armourWeight[m.loadout.armour.weight] + m.loadout.armour.rarity,
      loadout: m.loadout,
      status: 'up',
      sparked: false,
      hitThisRound: false,
    };
  });
  const skillUses: Record<string, Record<string, number>> = {};
  for (const f of fighters) {
    const cls = content.classes[f.kindId];
    skillUses[f.id] = Object.fromEntries((cls?.skills ?? []).map((s) => [s, rules.skillUses]));
  }
  const run: DelveRun = {
    id: command.id,
    siteId: site.id,
    danger: site.danger,
    approach: command.approach,
    memberIds: fighters.map((f) => f.id),
    tactics: command.tactics,
    rooms: site.fightRooms.map((r) => ({ kind: 'fight', roomId: r.id, boss: false })),
    roomIndex: 0,
    phase: 'fight',
    fighters,
    fight: null,
    pack: command.pack.map((p) => ({ kindId: p.kindId })),
    skillUses,
    auto: { on: false, saveSkillsForBoss: true },
    bonuses: { offGuard: false, alerted: false, drillBp: command.drillBp },
    scouted: false,
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
  const room = site.fightRooms[0];
  if (!room) throw new Error(`Site ${site.id} has no fight room.`);
  enterFight(state, run, room, sink, started);
}

function enterFight(
  state: GameState,
  run: DelveRun,
  room: FightRoom,
  sink: Sink,
  cause: string,
): void {
  const content = delveContent(state);
  const entered = sink.emit({
    type: 'room.entered',
    causeId: cause,
    subjectIds: [],
    roomId: room.id,
    roomIndex: run.roomIndex,
  });
  const foes: Fighter[] = room.foes.map((rf, i) => {
    const kind = content.foes[rf.kindId];
    if (!kind) throw new Error(`No foe kind ${rf.kindId}.`);
    return {
      id: `foe.${i + 1}`,
      side: 'foe',
      kindId: kind.id,
      row: rf.row,
      health: kind.health,
      maxHealth: kind.health,
      speed: kind.speed,
      armour: kind.armour,
      status: 'up',
      sparked: false,
      hitThisRound: false,
    };
  });
  // Every living member keeps a place, so one raised mid-fight acts from that place (SPEC.md).
  const everyone = [...run.fighters.filter((f) => f.status !== 'dead'), ...foes];
  const order = everyone.sort((a, b) => b.speed - a.speed || byId(a.id, b.id)).map((f) => f.id);
  run.fight = {
    round: 0,
    order,
    turn: -1,
    acted: [],
    intents: {},
    boss: foes.some((f) => foeKindOf(state, f).boss),
    warded: false,
    foes,
  };
  run.phase = 'fight';
  startRound(state, run, sink, entered);
  advance(state, run, sink, entered);
}

// ---- Rounds and turns --------------------------------------------------------------------------

function pickTarget(run: DelveRun, rule: TargetRule, reachable: Fighter[]): Fighter | null {
  if (reachable.length === 0) return null;
  const order = fightOf(run).order;
  const byOrder = (a: Fighter, b: Fighter): number => order.indexOf(a.id) - order.indexOf(b.id);
  const sorted = [...reachable].sort(byOrder);
  switch (rule) {
    case 'front-most':
      return sorted.find((f) => f.row === 'front') ?? sorted[0] ?? null;
    case 'most-hurt':
      return [...reachable].sort(byMostHurt(run))[0] ?? null;
    case 'back-row-first': {
      const back = sorted.filter((f) => f.row === 'back');
      const pool = back.length ? back : sorted;
      return [...pool].sort((a, b) => a.health - b.health || byOrder(a, b))[0] ?? null;
    }
  }
}

function foeTarget(state: GameState, run: DelveRun, foe: Fighter): Fighter | null {
  const kind = foeKindOf(state, foe);
  return pickTarget(run, kind.targetRule, reachableTargets(run, foe, kind.reach));
}

function startRound(state: GameState, run: DelveRun, sink: Sink, cause: string): void {
  const fight = fightOf(run);
  fight.round += 1;
  fight.turn = -1;
  fight.acted.length = 0;
  for (const id of Object.keys(fight.intents)) delete fight.intents[id];
  for (const foe of fight.foes.filter(isUp)) {
    const offGuard = fight.round === 1 && run.bonuses.offGuard && !run.bonuses.alerted;
    const target = foeTarget(state, run, foe);
    if (offGuard) fight.intents[foe.id] = 'off-guard';
    else if (target) fight.intents[foe.id] = { actionId: FOE_ACTION, targetId: target.id };
  }
  sink.emit({
    type: 'round.started',
    causeId: cause,
    subjectIds: [],
    round: fight.round,
    order: [...fight.order],
    // Copied value by value: an event never holds an object from the state (engine AGENTS.md).
    intents: Object.fromEntries(
      Object.entries(fight.intents).map(([id, v]) => [id, v === 'off-guard' ? v : { ...v }]),
    ),
  });
}

/**
 * Runs foe turns and round ends until an adventurer's turn or the fight's end. The next actor is
 * the first fighter after the current one in the order who has not acted this round; anyone passed
 * while Down, Dying, dead or fled counts as passed for the round (SPEC.md "Order").
 */
function advance(state: GameState, run: DelveRun, sink: Sink, cause: string): void {
  for (let guard = 0; guard < 10_000; guard += 1) {
    if (run.phase !== 'fight' || !run.fight) return;
    const fight = run.fight;
    let next: Fighter | null = null;
    for (let i = fight.turn + 1; i < fight.order.length; i += 1) {
      const id = fight.order[i]!;
      if (fight.acted.includes(id)) continue;
      const f = fighterOf(run, id);
      if (!isUp(f)) {
        fight.acted.push(id);
        continue;
      }
      fight.turn = i;
      next = f;
      break;
    }
    if (!next) {
      endRound(state, run, sink, cause);
      if (run.phase !== 'fight') return;
      startRound(state, run, sink, cause);
      continue;
    }
    if (next.side === 'party') return;
    foeTurn(state, run, next, sink, cause);
    fight.acted.push(next.id);
    if (checkEnd(state, run, sink, cause)) return;
  }
  throw new Error('The fight did not reach an adventurer turn.');
}

function foeTurn(state: GameState, run: DelveRun, foe: Fighter, sink: Sink, cause: string): void {
  const fight = fightOf(run);
  const intent: Intent | undefined = fight.intents[foe.id];
  if (intent === 'off-guard') return;
  const kind = foeKindOf(state, foe);
  const reachable = reachableTargets(run, foe, kind.reach);
  let target = intent ? run.fighters.find((f) => f.id === intent.targetId) : undefined;
  // A foe whose target fell or moved out of reach picks again by the same rule (D-218).
  if (!target || !reachable.includes(target)) target = foeTarget(state, run, foe) ?? undefined;
  if (!target) return;
  const guardId = target.guardedBy;
  const guard = guardId ? run.fighters.find((f) => f.id === guardId) : undefined;
  const struck = guard && isUp(guard) ? guard : target;
  strike(state, run, foe, FOE_ACTION, struck, sink, cause, false);
}

/** One rolled strike: the hit roll, then damage on a hit. Returns whether it hit. */
function strike(
  state: GameState,
  run: DelveRun,
  actor: Fighter,
  actionId: string,
  target: Fighter,
  sink: Sink,
  cause: string,
  auto: boolean,
): boolean {
  const rng = fightStream(state);
  const chance = hitChance(state, actor.id, actionId, target.id);
  const roll = rng.int(BP_CERTAIN) + 1;
  const hit = roll <= chance.total;
  let damage = 0;
  if (hit) {
    const range = damageRange(state, actor.id, actionId, target.id);
    damage = rng.between(range.min.total, range.max.total);
  }
  const acted = sink.emit({
    type: 'fight.acted',
    causeId: cause,
    subjectIds: [actor.id, target.id],
    actionId,
    targetId: target.id,
    hit: chance,
    roll,
    damage,
    auto,
  });
  if (hit) {
    target.hitThisRound = true;
    hurt(run, target, damage, sink, acted);
  }
  return hit;
}

function hurt(run: DelveRun, target: Fighter, amount: number, sink: Sink, cause: string): void {
  const from = target.health;
  target.health = Math.max(0, from - amount);
  sink.emit({
    type: 'health.changed',
    causeId: cause,
    subjectIds: [target.id],
    from,
    to: target.health,
  });
  if (target.health > 0 || target.status !== 'up') return;
  target.status = 'down';
  sink.emit({ type: 'fighter.down', causeId: cause, subjectIds: [target.id] });
  // A fallen warrior's guard ends (SPEC.md "Guard").
  for (const f of run.fighters) if (f.guardedBy === target.id) delete f.guardedBy;
}

function heal(target: Fighter, amount: number, raiseTo: number, sink: Sink, cause: string): void {
  const from = target.health;
  if (target.status === 'down' || target.status === 'dying') {
    target.status = 'up';
    target.health = Math.min(target.maxHealth, raiseTo);
    sink.emit({
      type: 'fighter.raised',
      causeId: cause,
      subjectIds: [target.id],
      health: target.health,
    });
  } else target.health = Math.min(target.maxHealth, from + amount);
  if (target.health !== from)
    sink.emit({
      type: 'health.changed',
      causeId: cause,
      subjectIds: [target.id],
      from,
      to: target.health,
    });
}

/** Moves a fighter in the kept order; `place` gets the order without them and returns the new index. */
function move(
  run: DelveRun,
  id: string,
  place: (without: readonly string[], from: number) => number,
  sink: Sink,
  cause: string,
): void {
  const order = fightOf(run).order;
  const from = order.indexOf(id);
  if (from < 0) return;
  order.splice(from, 1);
  order.splice(clamp(place(order, from), 0, order.length), 0, id);
  sink.emit({ type: 'order.changed', causeId: cause, subjectIds: [id], order: [...order] });
}

// ---- The adventurer's command ------------------------------------------------------------------

export function act(state: GameState, command: ActCommand, sink: Sink): void {
  const why = refusal(
    state,
    command.actorId,
    command.actionId,
    command.targetId,
    command.packIndex,
  );
  if (why) throw new Error(why);
  const run = runOf(state);
  const fight = fightOf(run);
  const actor = fighterOf(run, command.actorId);
  fight.acted.push(actor.id);
  resolveAction(state, run, actor, command, sink, false);
  fight.turn = fight.order.indexOf(actor.id);
  if (!checkEnd(state, run, sink, command.id)) advance(state, run, sink, command.id);
}

function resolveAction(
  state: GameState,
  run: DelveRun,
  actor: Fighter,
  command: Pick<ActCommand, 'id' | 'actionId' | 'targetId' | 'packIndex'>,
  sink: Sink,
  auto: boolean,
): void {
  const cause = command.id;
  const target = command.targetId === undefined ? null : fighterOf(run, command.targetId);
  const fight = fightOf(run);
  const plainActed = (actionId: string, targetId: string | null): string =>
    sink.emit({
      type: 'fight.acted',
      causeId: cause,
      subjectIds: targetId ? [actor.id, targetId] : [actor.id],
      actionId,
      targetId,
      hit: null,
      roll: null,
      damage: 0,
      auto,
    });
  if (command.actionId === SWAP_ACTION) {
    actor.row = actor.row === 'front' ? 'back' : 'front';
    const acted = plainActed(SWAP_ACTION, null);
    sink.emit({ type: 'rows.set', causeId: acted, subjectIds: [actor.id], row: actor.row });
    return;
  }
  if (command.actionId === PACK_ACTION) {
    const index = command.packIndex ?? -1;
    const item = packKindOf(state, run, index);
    if (!target) return;
    // Ranges are read before the item leaves the pack, through the same function the preview uses.
    const struck =
      item.kind === 'bomb' ? fight.foes.filter((f) => isUp(f) && f.row === target.row) : [];
    const ranges = struck.map((f) => damageRange(state, actor.id, PACK_ACTION, f.id, index));
    const kindId = run.pack[index]?.kindId ?? PACK_ACTION;
    run.pack.splice(index, 1);
    const acted = plainActed(kindId, target.id);
    if (item.kind === 'heal') heal(target, item.amount, item.raiseTo, sink, acted);
    const rng = fightStream(state);
    struck.forEach((foe, i) => {
      const range = ranges[i]!;
      foe.hitThisRound = true;
      hurt(run, foe, rng.between(range.min.total, range.max.total), sink, acted);
    });
    return;
  }
  const action = actionOf(state, command.actionId);
  const uses = run.skillUses[actor.id];
  if (uses && Object.hasOwn(uses, action.id)) uses[action.id] = (uses[action.id] ?? 0) - 1;
  switch (action.kind) {
    case 'strike': {
      if (!target) return;
      const hit = strike(state, run, actor, action.id, target, sink, cause, auto);
      if (hit && action.mark) target.sparked = true;
      if (hit && action.knockback) move(run, target.id, (_, from) => from + 1, sink, cause);
      if (hit && action.toLast) move(run, target.id, (without) => without.length, sink, cause);
      if (action.healMostHurt) {
        const hurtAlly = run.fighters
          .filter((f) => isUp(f) && f.health < f.maxHealth)
          .sort(byMostHurt(run))[0];
        if (hurtAlly) heal(hurtAlly, action.healMostHurt, 0, sink, cause);
      }
      return;
    }
    case 'cleave': {
      if (!target) return;
      const others = fight.order
        .map((id) => fighterOf(run, id))
        .filter((f) => f.side === 'foe' && isUp(f) && f.row === 'front' && f.id !== target.id);
      const after = others.find((f) => fight.order.indexOf(f.id) > fight.order.indexOf(target.id));
      const second = after ?? others[0];
      strike(state, run, actor, action.id, target, sink, cause, auto);
      if (second) strike(state, run, actor, action.id, second, sink, cause, auto);
      return;
    }
    case 'guard': {
      if (!target) return;
      target.guardedBy = actor.id;
      plainActed(action.id, target.id);
      return;
    }
    case 'heal': {
      if (!target) return;
      const acted = plainActed(action.id, target.id);
      heal(target, action.amount, action.raiseTo, sink, acted);
      return;
    }
    case 'ward':
      fight.warded = true;
      plainActed(action.id, null);
      return;
    case 'haste': {
      if (!target) return;
      const acted = plainActed(action.id, target.id);
      move(run, target.id, (without) => without.indexOf(actor.id) + 1, sink, acted);
      return;
    }
  }
}

// ---- The round's end and the fight's end -------------------------------------------------------

function chanceFrom(
  rule: { readonly baseBp: number; readonly stepBp: number; readonly pivot: number },
  points: number,
): number {
  return clamp(rule.baseBp - rule.stepBp * points, 0, BP_CERTAIN);
}

function endRound(state: GameState, run: DelveRun, sink: Sink, cause: string): void {
  const fight = fightOf(run);
  const { rules } = delveContent(state);
  const rng = fightStream(state);
  const inOrder = fight.order.map((id) => fighterOf(run, id)).filter((f) => f.side === 'party');
  const dyingBefore = new Set(inOrder.filter((f) => f.status === 'dying').map((f) => f.id));
  for (const f of inOrder.filter((x) => x.status === 'down')) {
    const a = adventurerOf(state, f.id);
    const chanceBp = chanceFrom(rules.bleed, a.attributes.toughness - rules.bleed.pivot);
    const roll = rng.int(BP_CERTAIN) + 1;
    if (roll <= chanceBp) {
      f.status = 'dying';
      sink.emit({ type: 'fighter.dying', causeId: cause, subjectIds: [f.id], roll, chanceBp });
    }
  }
  for (const f of inOrder.filter((x) => dyingBefore.has(x.id))) {
    const a = adventurerOf(state, f.id);
    const points =
      a.attributes.toughness -
      rules.deathRoll.pivot +
      (a.attributes.resolve - rules.deathRoll.pivot);
    const chanceBp = chanceFrom(rules.deathRoll, points);
    const roll = rng.int(BP_CERTAIN) + 1;
    if (roll <= chanceBp) {
      f.status = 'dead';
      sink.emit({ type: 'fighter.died', causeId: cause, subjectIds: [f.id], roll, chanceBp });
    }
  }
  for (const f of [...run.fighters, ...fight.foes]) {
    delete f.guardedBy;
    f.sparked = false;
    f.hitThisRound = false;
  }
  fight.warded = false;
  sink.emit({ type: 'round.ended', causeId: cause, subjectIds: [], round: fight.round });
  if (checkEnd(state, run, sink, cause)) return;
  // The flee check (D-226): a band whose Down foes are more than half of it flees; a boss fight
  // ends when the boss is Down, and its minions flee.
  const down = fight.foes.filter((f) => f.status === 'down').length;
  const bossDown = fight.foes.some((f) => foeKindOf(state, f).boss && f.status === 'down');
  if (fight.boss ? bossDown : down * 2 > fight.foes.length) {
    const standing = fight.foes.filter(isUp);
    for (const f of standing) f.status = 'fled';
    if (standing.length)
      sink.emit({ type: 'band.fled', causeId: cause, subjectIds: standing.map((f) => f.id) });
    endFight(state, run, 'won', sink, cause);
  }
}

/** Ends the fight when no adventurer or no foe stands. Returns whether it ended. */
function checkEnd(state: GameState, run: DelveRun, sink: Sink, cause: string): boolean {
  if (run.phase !== 'fight' || !run.fight) return true;
  if (!run.fighters.some(isUp)) {
    endFight(state, run, 'routed', sink, cause);
    return true;
  }
  if (!run.fight.foes.some(isUp)) {
    endFight(state, run, 'won', sink, cause);
    return true;
  }
  return false;
}

function endFight(
  state: GameState,
  run: DelveRun,
  outcome: 'won' | 'routed',
  sink: Sink,
  cause: string,
): void {
  const ended = sink.emit({
    type: 'fight.ended',
    causeId: cause,
    subjectIds: [...run.memberIds],
    outcome,
  });
  // Slice 1's site has one room; rooms, breathers and the boss arrive in slice 2.
  if (outcome === 'routed' || run.roomIndex >= run.rooms.length - 1)
    endDelve(state, run, outcome, sink, ended);
  else run.phase = 'breather';
}

export function woundStepOf(f: Fighter): number {
  if (f.status === 'dying' || f.status === 'dead') return WOUND.dying;
  if (f.status === 'down' || f.health === 0) return WOUND.down;
  if (f.health * 3 < f.maxHealth) return WOUND.badlyHurt;
  if (f.health * 3 < f.maxHealth * 2) return WOUND.hurt;
  return WOUND.fit;
}

function endDelve(
  state: GameState,
  run: DelveRun,
  outcome: 'won' | 'routed',
  sink: Sink,
  cause: string,
): void {
  const { rules } = delveContent(state);
  const rng = fightStream(state);
  const members: MemberEnd[] = run.fighters.map((f) => {
    const died = f.status === 'dead';
    const step = woundStepOf(f);
    const injuryBp =
      died || step < WOUND.badlyHurt
        ? 0
        : step === WOUND.badlyHurt
          ? rules.injuryBp.badlyHurt
          : step === WOUND.down
            ? rules.injuryBp.down
            : rules.injuryBp.dying;
    const injury = injuryBp > 0 && rng.int(BP_CERTAIN) + 1 <= injuryBp;
    return { adventurerId: f.id, woundStep: step, injury, died };
  });
  run.phase = 'ended';
  run.outcome = outcome;
  sink.emit({
    type: 'delve.ended',
    causeId: cause,
    subjectIds: [...run.memberIds],
    outcome,
    members,
  });
}
