// Fight rules both the commands and the views read (SPEC.md "Hit", "Damage", "Reach"): one
// function per number, so a preview and a strike can never disagree (GAME-02). Nothing here rolls.
import { divRoundDown } from '../core/math.ts';
import { BP_CERTAIN } from '../core/rng.ts';
import { makeValue, type Value, type ValuePart } from '../core/value.ts';
import { chanceValue } from '../resolution/check.ts';
import type { Adventurer, GameState } from '../resolution/types.ts';
import type {
  DelveAction,
  DelveClass,
  DelveContent,
  DelveRun,
  Fighter,
  FightState,
  FoeKind,
  PackKind,
  Reach,
} from './types.ts';

export const PACK_ACTION = 'action.pack';
export const SWAP_ACTION = 'action.swap-row';
/** The one action every foe has: its kind's strike. */
export const FOE_ACTION = 'action.foe-strike';

export function delveContent(state: GameState): DelveContent {
  const content = state.content.delve;
  if (!content) throw new Error('This game has no delve content.');
  return content;
}

export function runOf(state: GameState): DelveRun {
  if (!state.delve) throw new Error('No delve is running.');
  return state.delve;
}

export function fightOf(run: DelveRun): FightState {
  if (!run.fight) throw new Error('No fight is running.');
  return run.fight;
}

export function fighterOf(run: DelveRun, id: string): Fighter {
  const fighter = run.fighters.find((f) => f.id === id) ?? run.fight?.foes.find((f) => f.id === id);
  if (!fighter) throw new Error(`No fighter ${id}.`);
  return fighter;
}

export function adventurerOf(state: GameState, id: string): Adventurer {
  const adventurer = state.roster.find((a) => a.id === id);
  if (!adventurer) throw new Error(`No adventurer ${id}.`);
  return adventurer;
}

export function classOf(state: GameState, fighter: Fighter): DelveClass {
  const rules = delveContent(state).classes[fighter.kindId];
  if (!rules) throw new Error(`No delve class ${fighter.kindId}.`);
  return rules;
}

export function foeKindOf(state: GameState, fighter: Fighter): FoeKind {
  const kind = delveContent(state).foes[fighter.kindId];
  if (!kind) throw new Error(`No foe kind ${fighter.kindId}.`);
  return kind;
}

export function actionOf(state: GameState, actionId: string): DelveAction {
  const action = delveContent(state).actions[actionId];
  if (!action) throw new Error(`No delve action ${actionId}.`);
  return action;
}

export function packKindOf(state: GameState, run: DelveRun, packIndex: number): PackKind {
  const item = run.pack[packIndex];
  if (!item) throw new Error(`No pack item at ${packIndex}.`);
  return delveContent(state).pack[item.kindId];
}

export const isUp = (f: Fighter): boolean => f.status === 'up';

/** Everyone in the fight, party first then foes, in a stable order. */
export function allFighters(run: DelveRun): Fighter[] {
  return [...run.fighters, ...(run.fight?.foes ?? [])];
}

export function opponentsOf(run: DelveRun, fighter: Fighter): Fighter[] {
  return fighter.side === 'party' ? (run.fight?.foes ?? []) : run.fighters;
}

/** Standing targets a reach can hit: melee only the front row while anyone stands there. */
export function reachableTargets(run: DelveRun, actor: Fighter, reach: Reach): Fighter[] {
  const standing = opponentsOf(run, actor).filter(isUp);
  if (reach === 'any') return standing;
  const front = standing.filter((f) => f.row === 'front');
  return front.length ? front : standing;
}

/** Position in the fight's order, for "ties by order" rules. */
export function orderIndex(run: DelveRun, id: string): number {
  return run.fight ? run.fight.order.indexOf(id) : run.fighters.findIndex((f) => f.id === id);
}

/** Lowest health share first, ties by order; exact integer comparison. */
export function byMostHurt(run: DelveRun): (a: Fighter, b: Fighter) => number {
  return (a, b) =>
    a.health * b.maxHealth - b.health * a.maxHealth ||
    orderIndex(run, a.id) - orderIndex(run, b.id);
}

export function attackOf(state: GameState, fighter: Fighter): number {
  if (fighter.side === 'foe') return foeKindOf(state, fighter).attack;
  return adventurerOf(state, fighter.id).attributes[classOf(state, fighter).attackAttribute];
}

export function defenceOf(state: GameState, fighter: Fighter): number {
  if (fighter.side === 'foe') return foeKindOf(state, fighter).defence;
  const { defence, armourWeight } = delveContent(state).rules;
  const agility = adventurerOf(state, fighter.id).attributes.agility;
  const weight = fighter.loadout ? armourWeight[fighter.loadout.armour.weight] : 0;
  return defence.base + divRoundDown(agility - defence.pivot, defence.divisor) + weight;
}

/** The strike's reach and damage range for an actor's action, before gear and armour. */
function strikeOf(
  state: GameState,
  actor: Fighter,
  actionId: string,
): { reach: Reach; damage: { min: number; max: number }; doubleIfHit: boolean } | null {
  if (actor.side === 'foe') {
    const kind = foeKindOf(state, actor);
    return { reach: kind.reach, damage: kind.damage, doubleIfHit: false };
  }
  if (actionId === PACK_ACTION || actionId === SWAP_ACTION) return null;
  const action = actionOf(state, actionId);
  if (action.kind === 'strike')
    return { reach: action.reach, damage: action.damage, doubleIfHit: !!action.doubleIfHit };
  if (action.kind === 'cleave')
    return { reach: 'melee', damage: action.damage, doubleIfHit: false };
  return null;
}

/** Whether an action can miss: strikes and cleaves can; heals, Guard, Ward, Haste and items never. */
export function canMiss(state: GameState, actor: Fighter, actionId: string): boolean {
  return strikeOf(state, actor, actionId) !== null;
}

/** The hit chance in basis points with its parts (SPEC.md "Hit"); certain for actions that never miss. */
export function hitChance(
  state: GameState,
  actorId: string,
  actionId: string,
  targetId: string,
): Value {
  const run = runOf(state);
  const actor = fighterOf(run, actorId);
  const target = fighterOf(run, targetId);
  const cause = run.id;
  if (!canMiss(state, actor, actionId)) return makeValue(BP_CERTAIN, cause);
  const rules = delveContent(state).rules;
  const fight = fightOf(run);
  const parts: ValuePart[] = [
    {
      sourceId: 'check.difference',
      amount: rules.check.stepBp * (attackOf(state, actor) - defenceOf(state, target)),
    },
  ];
  if (actor.side === 'party') {
    const weapon = actor.loadout?.weapon.rarity ?? 0;
    if (weapon) parts.push({ sourceId: 'gear.weapon', amount: weapon * rules.weaponStep.hitBp });
    const tactics = Math.max(0, rules.tactics.stepBp * (run.tactics - rules.tactics.pivot));
    if (tactics) parts.push({ sourceId: 'guild.tactics', amount: tactics });
    if (target.sparked) parts.push({ sourceId: 'mark.spark', amount: rules.sparkBp });
    if (fight.round === 1 && run.bonuses.drillBp)
      parts.push({ sourceId: 'guild.drill', amount: run.bonuses.drillBp });
  } else if (fight.warded) parts.push({ sourceId: 'skill.ward', amount: -rules.wardBp });
  return chanceValue(rules.check.baseBp, parts, rules.check.minBp, rules.check.maxBp, cause);
}

/** At least 1, with a clamp part so the hover adds up. */
function atLeastOne(base: number, parts: ValuePart[], cause: string): Value {
  const raw = makeValue(base, cause, parts);
  if (raw.total >= 1) return raw;
  return makeValue(base, cause, [...parts, { sourceId: 'rule.minimum', amount: 1 - raw.total }]);
}

/**
 * Damage range on a hit (SPEC.md "Damage"): the action's range (doubled by Strike from shadow on a
 * foe hit this round) plus the weapon's rarity, less the target's armour, at least 1. Heals give
 * the health they restore; Guard, Ward, Haste and swapping rows give 0.
 */
export function damageRange(
  state: GameState,
  actorId: string,
  actionId: string,
  targetId: string,
  packIndex?: number,
): { min: Value; max: Value } {
  const run = runOf(state);
  const actor = fighterOf(run, actorId);
  const target = fighterOf(run, targetId);
  const cause = run.id;
  const rules = delveContent(state).rules;
  const flat = (n: number): { min: Value; max: Value } => ({
    min: makeValue(n, cause),
    max: makeValue(n, cause),
  });
  const healed = (amount: number, raiseTo: number): number =>
    target.status === 'down' || target.status === 'dying'
      ? raiseTo
      : Math.min(amount, target.maxHealth - target.health);
  if (actionId === PACK_ACTION) {
    const item = packKindOf(state, run, packIndex ?? -1);
    if (item.kind === 'heal') return flat(healed(item.amount, item.raiseTo));
    const armour = [{ sourceId: 'target.armour', amount: -target.armour }];
    return {
      min: atLeastOne(item.damage.min, armour, cause),
      max: atLeastOne(item.damage.max, armour, cause),
    };
  }
  const strike = strikeOf(state, actor, actionId);
  if (!strike) {
    if (actionId === SWAP_ACTION) return flat(0);
    const action = actionOf(state, actionId);
    return flat(action.kind === 'heal' ? healed(action.amount, action.raiseTo) : 0);
  }
  const doubled = strike.doubleIfHit && target.hitThisRound;
  const parts: ValuePart[] = [];
  const weapon = actor.side === 'party' ? (actor.loadout?.weapon.rarity ?? 0) : 0;
  if (weapon) parts.push({ sourceId: 'gear.weapon', amount: weapon * rules.weaponStep.damage });
  if (target.armour) parts.push({ sourceId: 'target.armour', amount: -target.armour });
  const factor = doubled ? 2 : 1;
  const withDouble = (n: number): ValuePart[] =>
    doubled ? [{ sourceId: 'skill.shadow', amount: n }, ...parts] : parts;
  return {
    min: atLeastOne(strike.damage.min, withDouble(strike.damage.min * (factor - 1)), cause),
    max: atLeastOne(strike.damage.max, withDouble(strike.damage.max * (factor - 1)), cause),
  };
}

/** Uses left of an action this delve; null for the plain attack, items and swapping rows. */
export function usesLeft(run: DelveRun, actorId: string, actionId: string): number | null {
  const uses = run.skillUses[actorId];
  return uses && Object.hasOwn(uses, actionId) ? (uses[actionId] ?? 0) : null;
}

/** The actions an adventurer has: plain attack, skills, the pack, swapping rows. */
export function actionsOf(state: GameState, actor: Fighter): string[] {
  const cls = classOf(state, actor);
  return [cls.plain, ...cls.skills, PACK_ACTION, SWAP_ACTION];
}

/** Whether an action needs a target tapped. */
export function needsTarget(state: GameState, actionId: string): boolean {
  if (actionId === SWAP_ACTION) return false;
  if (actionId === PACK_ACTION) return true;
  return actionOf(state, actionId).kind !== 'ward';
}

/**
 * Why the actor can't take this action on this target, or null when it can. The one check the
 * command and the view share, so the screen offers exactly what the engine accepts.
 */
export function refusal(
  state: GameState,
  actorId: string,
  actionId: string,
  targetId: string | undefined,
  packIndex?: number,
): string | null {
  const run = state.delve;
  if (!run || run.phase !== 'fight' || !run.fight) return 'No fight is running.';
  const fight = run.fight;
  if (fight.order[fight.turn] !== actorId) return `It is not ${actorId}'s turn.`;
  const actor = fighterOf(run, actorId);
  if (actor.side !== 'party' || !isUp(actor)) return `${actorId} cannot act.`;
  if (!actionsOf(state, actor).includes(actionId)) return `${actorId} has no action ${actionId}.`;
  const left = usesLeft(run, actorId, actionId);
  if (left !== null && left <= 0) return `${actionId} has no uses left.`;
  if (!needsTarget(state, actionId)) return null;
  if (targetId === undefined) return `${actionId} needs a target.`;
  const target = allFighters(run).find((f) => f.id === targetId);
  if (!target) return `No fighter ${targetId}.`;
  const ally = target.side === 'party';
  const raisable = ally && target.status !== 'dead' && target.status !== 'fled';
  if (actionId === PACK_ACTION) {
    if (packIndex === undefined || !run.pack[packIndex]) return 'No such pack item.';
    const item = packKindOf(state, run, packIndex);
    if (item.kind === 'heal') return raisable ? null : 'A draught goes to an ally.';
    return !ally && isUp(target) ? null : 'A firebomb is thrown at a standing foe.';
  }
  const action = actionOf(state, actionId);
  switch (action.kind) {
    case 'strike':
    case 'cleave': {
      const reach = action.kind === 'cleave' ? 'melee' : action.reach;
      return reachableTargets(run, actor, reach).includes(target) ? null : 'Out of reach.';
    }
    case 'heal':
      return raisable ? null : 'Mend goes to an ally who is not dead.';
    case 'guard':
    case 'haste':
      return ally && isUp(target) && target.id !== actorId ? null : 'Pick another standing ally.';
    case 'ward':
      return null;
  }
}
