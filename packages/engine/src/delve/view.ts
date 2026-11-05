// Pure views of a delve fight (SPEC.md "Views"): what the screen shows, read from the state with
// the same rule functions the commands use. Nothing here rolls or writes (J2's preview test).
import type { Value } from '../core/value.ts';
import type { GameState } from '../resolution/types.ts';
import {
  PACK_ACTION,
  SWAP_ACTION,
  actionOf,
  canMiss,
  packKindOf,
  actionsOf,
  allFighters,
  damageRange,
  hitChance,
  needsTarget,
  refusal,
  usesLeft,
} from './actions.ts';
import { woundStepOf } from './fight.ts';
import type { DelveOutcome, Fighter, FighterStatus, Intent, PackItem, Row } from './types.ts';

/** D-218's bands on the bar. */
export type FightBand = 'unhurt' | 'hurt' | 'badly-hurt' | 'down' | 'dying' | 'dead' | 'fled';

export interface FighterView {
  readonly id: string;
  readonly side: 'party' | 'foe';
  readonly kindId: string;
  readonly row: Row;
  readonly health: number;
  readonly maxHealth: number;
  readonly status: FighterStatus;
  readonly band: FightBand;
  readonly sparked: boolean;
  readonly guarded: boolean;
  readonly hitThisRound: boolean;
}

export interface ActionView {
  readonly actionId: string;
  /** Null for actions without a limit (the plain attack, the pack, swapping rows). */
  readonly usesLeft: number | null;
  readonly needsTarget: boolean;
  /** Fighter ids this action may be aimed at now; for the pack, per item index. */
  readonly targets: readonly string[];
  readonly packTargets: readonly (readonly string[])[];
  readonly usable: boolean;
}

export interface FightView {
  readonly round: number;
  readonly order: readonly { readonly id: string; readonly acted: boolean }[];
  /** The adventurer whose turn it is, or null when the fight is over. */
  readonly actorId: string | null;
  readonly intents: Readonly<Record<string, Intent>>;
  readonly fighters: readonly FighterView[];
  readonly actions: readonly ActionView[];
  readonly pack: readonly PackItem[];
  readonly phase: 'choice' | 'fight' | 'breather' | 'ended';
  readonly outcome: DelveOutcome | null;
}

export function bandOf(f: Fighter): FightBand {
  if (f.status === 'fled' || f.status === 'dead' || f.status === 'dying') return f.status;
  if (f.status === 'down') return 'down';
  const step = woundStepOf(f);
  return step === 2 ? 'badly-hurt' : step === 1 ? 'hurt' : 'unhurt';
}

export function fightView(state: GameState): FightView | null {
  const run = state.delve;
  if (!run?.fight) return null;
  const fight = run.fight;
  const current = fight.order[fight.turn];
  const fighters = allFighters(run);
  const actor =
    run.phase === 'fight'
      ? fighters.find((f) => f.id === current && f.side === 'party')
      : undefined;
  const ok = (actionId: string, targetId?: string, packIndex?: number): boolean =>
    !!actor && refusal(state, actor.id, actionId, targetId, packIndex) === null;
  const actions: ActionView[] = actor
    ? actionsOf(state, actor).map((actionId) => {
        const targeted = needsTarget(state, actionId);
        const packTargets =
          actionId === PACK_ACTION
            ? run.pack.map((_, i) => fighters.filter((f) => ok(actionId, f.id, i)).map((f) => f.id))
            : [];
        const targets =
          actionId === PACK_ACTION
            ? []
            : fighters.filter((f) => ok(actionId, f.id)).map((f) => f.id);
        const usable =
          actionId === PACK_ACTION
            ? packTargets.some((t) => t.length > 0)
            : targeted
              ? targets.length > 0
              : ok(actionId);
        return {
          actionId,
          usesLeft: usesLeft(run, actor.id, actionId),
          needsTarget: targeted,
          targets,
          packTargets,
          usable,
        };
      })
    : [];
  return {
    round: fight.round,
    order: fight.order.map((id) => ({ id, acted: fight.acted.includes(id) })),
    actorId: actor ? actor.id : null,
    intents: Object.fromEntries(
      Object.entries(fight.intents).map(([id, v]) => [id, v === 'off-guard' ? v : { ...v }]),
    ),
    fighters: fighters.map((f) => ({
      id: f.id,
      side: f.side,
      kindId: f.kindId,
      row: f.row,
      health: f.health,
      maxHealth: f.maxHealth,
      status: f.status,
      band: bandOf(f),
      sparked: f.sparked,
      guarded: f.guardedBy !== undefined,
      hitThisRound: f.hitThisRound,
    })),
    actions,
    pack: run.pack.map((p) => ({ kindId: p.kindId })),
    phase: run.phase,
    outcome: run.outcome,
  };
}

/** The odds and damage (or healing) a tap would show before the strike (D-218). */
export function previewAction(
  state: GameState,
  actorId: string,
  actionId: string,
  targetId: string,
  packIndex?: number,
): ActionPreview {
  const run = state.delve;
  const actor = run ? allFighters(run).find((f) => f.id === actorId) : undefined;
  const target = run ? allFighters(run).find((f) => f.id === targetId) : undefined;
  if (!run || !actor || !target) throw new Error('No such fighter in a running fight.');
  const heals =
    actionId === PACK_ACTION
      ? packKindOf(state, run, packIndex ?? -1).kind === 'heal'
      : actionId !== SWAP_ACTION &&
        actor.side === 'party' &&
        actionOf(state, actionId).kind === 'heal';
  const fallen = target.status === 'down' || target.status === 'dying';
  return {
    hit: hitChance(state, actorId, actionId, targetId),
    damage: damageRange(state, actorId, actionId, targetId, packIndex),
    effect: heals
      ? fallen
        ? 'raise'
        : 'heal'
      : canMiss(state, actor, actionId) || actionId === PACK_ACTION
        ? 'harm'
        : 'other',
    canMiss: canMiss(state, actor, actionId),
  };
}

/** What a tap would do: hit chance and the damage, or the health a heal gives (or raises to). */
export interface ActionPreview {
  readonly hit: Value;
  readonly damage: { readonly min: Value; readonly max: Value };
  /** `harm` strikes or bombs, `heal` and `raise` restore health, `other` is Guard or Haste. */
  readonly effect: 'harm' | 'heal' | 'raise' | 'other';
  readonly canMiss: boolean;
}
