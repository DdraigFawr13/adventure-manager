// Auto (SPEC.md "Auto", D-220): the class's rules tried in order, with a good-choice roll on
// `delve.auto` for each decision. `fight.step` takes one adventurer turn this way.
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import type { EventSink } from '../core/events.ts';
import type { Value } from '../core/value.ts';
import { chanceValue } from '../resolution/check.ts';
import type { GameEvent, GameState } from '../resolution/types.ts';
import {
  PACK_ACTION,
  adventurerOf,
  byMostHurt,
  classOf,
  delveContent,
  fighterOf,
  fightOf,
  foeKindOf,
  isUp,
  orderIndex,
  refusal,
  runOf,
  usesLeft,
} from './actions.ts';
import { advance, checkEnd, resolveAction } from './fight.ts';
import type { AutoRule, AutoTarget, AutoWhen, DelveCommand, DelveRun, Fighter } from './types.ts';

type Sink = EventSink<GameEvent>;
type Cmd<T extends DelveCommand['type']> = Extract<DelveCommand, { type: T }>;

export interface AutoChoice {
  readonly actionId: string;
  readonly targetId?: string;
  readonly packIndex?: number;
}

/** The standing member with the best Wits, ties by id. */
export function leaderOf(state: GameState, run: DelveRun): Fighter | null {
  const standing = run.fighters.filter(isUp);
  const wits = (f: Fighter): number => adventurerOf(state, f.id).attributes.wits;
  return (
    [...standing].sort(
      (a, b) => wits(b) - wits(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )[0] ?? null
  );
}

/** Auto's good-choice chance: base + Wits step × (leader's Wits − 10) + Tactics step, clamped. */
export function autoChance(state: GameState): Value {
  const run = runOf(state);
  const rules = delveContent(state).rules.auto;
  const leader = leaderOf(state, run);
  const wits = leader ? adventurerOf(state, leader.id).attributes.wits : rules.pivot;
  return chanceValue(
    rules.baseBp,
    [
      { sourceId: 'leader.wits', amount: rules.witsStepBp * (wits - rules.pivot) },
      { sourceId: 'guild.tactics', amount: rules.tacticsStepBp * (run.tactics - rules.pivot) },
    ],
    rules.minBp,
    rules.maxBp,
    run.id,
  );
}

const belowThird = (f: Fighter): boolean => isUp(f) && f.health * 3 < f.maxHealth;

function bossRoom(run: DelveRun): boolean {
  return fightOf(run).boss;
}

function applies(run: DelveRun, when: AutoWhen): boolean {
  const fight = fightOf(run);
  switch (when) {
    case 'ally-dying':
      return run.fighters.some((f) => f.status === 'dying');
    case 'ally-down':
      return run.fighters.some((f) => f.status === 'down');
    case 'ally-below-third':
      return run.fighters.some(belowThird);
    case 'foe-marked':
      return fight.foes.some((f) => isUp(f) && f.hitThisRound);
    case 'two-front-foes':
      return fight.foes.filter((f) => isUp(f) && f.row === 'front').length >= 2;
    case 'boss-room':
      return bossRoom(run);
    case 'always':
      return true;
  }
}

/** The first valid target by the rule, using the command's own refusal check. */
function targetFor(
  state: GameState,
  run: DelveRun,
  actor: Fighter,
  actionId: string,
  rule: AutoTarget,
): string | null | undefined {
  if (rule === 'none') return refusal(state, actor.id, actionId, undefined) ? undefined : null;
  const valid = (f: Fighter): boolean => refusal(state, actor.id, actionId, f.id) === null;
  const fight = fightOf(run);
  const byOrder = (a: Fighter, b: Fighter): number => orderIndex(run, a.id) - orderIndex(run, b.id);
  let pool: Fighter[];
  switch (rule) {
    case 'most-hurt-ally':
      pool = run.fighters.filter((f) => isUp(f) && f.health < f.maxHealth).sort(byMostHurt(run));
      break;
    case 'the-dying-or-down-ally':
      pool = [
        ...run.fighters.filter((f) => f.status === 'dying').sort(byOrder),
        ...run.fighters.filter((f) => f.status === 'down').sort(byOrder),
      ];
      break;
    case 'marked-foe':
      pool = fight.foes.filter((f) => isUp(f) && f.hitThisRound).sort(byOrder);
      break;
    case 'boss':
      pool = fight.foes.filter((f) => isUp(f) && foeKindOf(state, f).boss);
      break;
    case 'most-hurt-foe-in-reach':
      pool = fight.foes.filter(isUp).sort(byMostHurt(run));
      break;
  }
  return pool.find(valid)?.id;
}

/** The key a once-a-fight or once-a-round rule leaves in `autoOnce`. */
function onceKey(run: DelveRun, actor: Fighter, rule: AutoRule, actionId: string): string {
  const scope = rule.once === 'round' ? `round ${fightOf(run).round} ` : '';
  return `${scope}${actor.id} ${actionId}`;
}

/** What Auto would do on a good choice: the first rule that applies and can be taken. */
export function autoRuleChoice(state: GameState, actor: Fighter): AutoChoice | null {
  const run = runOf(state);
  const fight = fightOf(run);
  const cls = classOf(state, actor);
  const skills = new Set(cls.skills);
  for (const rule of cls.auto) {
    const actionId = rule.action === 'plain' ? cls.plain : rule.action;
    if (!applies(run, rule.when)) continue;
    const isSkill = skills.has(actionId);
    const mendsTheFallen = rule.when === 'ally-dying' || rule.when === 'ally-down';
    if (isSkill && run.auto.saveSkillsForBoss && !bossRoom(run) && !mendsTheFallen) continue;
    const left = usesLeft(run, actor.id, actionId);
    if (left !== null && left <= 0) continue;
    if (rule.once && fight.autoOnce?.includes(onceKey(run, actor, rule, actionId))) continue;
    // A draught for a Dying ally comes before the plain attack (spec: Auto's one pack use).
    if (rule.when === 'always') {
      const draught = draughtFor(state, run, actor);
      if (draught) return draught;
    }
    const target = targetFor(state, run, actor, actionId, rule.target);
    if (target === undefined) continue;
    return target === null ? { actionId } : { actionId, targetId: target };
  }
  return draughtFor(state, run, actor);
}

function draughtFor(state: GameState, run: DelveRun, actor: Fighter): AutoChoice | null {
  const dying = run.fighters.find((f) => f.status === 'dying');
  if (!dying) return null;
  const packIndex = run.pack.findIndex((p) => delveContent(state).pack[p.kindId].kind === 'heal');
  if (packIndex < 0) return null;
  if (refusal(state, actor.id, PACK_ACTION, dying.id, packIndex)) return null;
  return { actionId: PACK_ACTION, targetId: dying.id, packIndex };
}

/** A missed good-choice roll: the plain attack on the first reachable foe by order. */
function plainChoice(state: GameState, actor: Fighter): AutoChoice | null {
  const run = runOf(state);
  const { plain } = classOf(state, actor);
  const target = fightOf(run)
    .order.map((id) => fighterOf(run, id))
    .find((f) => f.side === 'foe' && refusal(state, actor.id, plain, f.id) === null);
  return target ? { actionId: plain, targetId: target.id } : null;
}

export function setAuto(state: GameState, command: Cmd<'fight.auto'>, sink: Sink): void {
  const run = runOf(state);
  if (run.phase === 'ended') throw new Error('The delve is over.');
  run.auto.on = command.on;
  if (command.saveSkillsForBoss !== undefined)
    run.auto.saveSkillsForBoss = command.saveSkillsForBoss;
  sink.emit({
    type: 'auto.set',
    causeId: command.id,
    subjectIds: [],
    on: run.auto.on,
    saveSkillsForBoss: run.auto.saveSkillsForBoss,
  });
}

/** One adventurer turn chosen by Auto, then the foe turns after it (`fight.step`). */
export function stepAuto(state: GameState, command: Cmd<'fight.step'>, sink: Sink): void {
  const run = runOf(state);
  if (run.phase !== 'fight' || !run.fight) throw new Error('No fight is running.');
  const fight = run.fight;
  const actor = fighterOf(run, fight.order[fight.turn] ?? '');
  if (actor.side !== 'party' || !isUp(actor)) throw new Error('It is not an adventurer turn.');
  const good = streamFor(state, 'delve.auto').int(BP_CERTAIN) < autoChance(state).total;
  // Swapping rows is always open, so an adventurer with no target still spends the turn.
  const choice = (good ? autoRuleChoice(state, actor) : null) ??
    plainChoice(state, actor) ??
    autoRuleChoice(state, actor) ?? { actionId: 'action.swap-row' };
  const why = refusal(state, actor.id, choice.actionId, choice.targetId, choice.packIndex);
  if (why) throw new Error(`Auto chose a refused action: ${why}`);
  const rule = classOf(state, actor).auto.find(
    (r) => (r.action === 'plain' ? classOf(state, actor).plain : r.action) === choice.actionId,
  );
  if (rule?.once) (fight.autoOnce ??= []).push(onceKey(run, actor, rule, choice.actionId));
  fight.acted.push(actor.id);
  resolveAction(state, run, actor, { id: command.id, ...choice }, sink, true);
  fight.turn = fight.order.indexOf(actor.id);
  if (!checkEnd(state, run, sink, command.id)) advance(state, run, sink, command.id);
}
