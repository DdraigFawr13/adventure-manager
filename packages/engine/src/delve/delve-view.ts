// Pure views of a delve between and around its fights (SPEC.md "Views"; D-232's screens): the
// room track, the party, choice odds, Scout ahead, the start card's approach odds and the end.
// Nothing here rolls or writes.
import type { Value } from '../core/value.ts';
import { chanceValue } from '../resolution/check.ts';
import type { Approach, Attribute, GameState } from '../resolution/types.ts';
import { adventurerOf, delveContent, isUp, usesLeft } from './actions.ts';
import {
  choiceChance,
  currentChoice,
  optionAttribute,
  scoutChance,
  scoutOf,
  scoutRefusal,
  siteOf,
  fightRoomOf,
} from './rooms.ts';
import { bandOf, type FightBand } from './view.ts';
import type { DelveOutcome, FighterStatus, MemberEnd, PackItem, PartDrop, Row } from './types.ts';

export interface RoomView {
  readonly index: number;
  /** Null while the room is unseen. */
  readonly kind: 'choice' | 'fight' | 'boss' | null;
  readonly roomId: string | null;
  readonly done: boolean;
  readonly current: boolean;
}

export interface MemberView {
  readonly id: string;
  readonly kindId: string;
  readonly row: Row;
  readonly health: number;
  readonly maxHealth: number;
  readonly status: FighterStatus;
  readonly band: FightBand;
  readonly skills: readonly { readonly actionId: string; readonly usesLeft: number }[];
}

export interface ChoiceView {
  readonly roomId: string;
  readonly options: readonly {
    readonly attribute: Attribute;
    readonly onFailure: 'hurt' | 'alert';
    readonly testers: readonly { readonly id: string; readonly chance: Value }[];
  }[];
}

export interface NextRoomView {
  readonly kind: 'choice' | 'fight' | 'boss';
  readonly roomId: string;
  readonly foes: readonly { readonly kindId: string; readonly row: Row }[];
}

export interface DelveView {
  readonly siteId: string;
  readonly phase: 'choice' | 'fight' | 'breather' | 'ended';
  readonly roomIndex: number;
  readonly rooms: readonly RoomView[];
  /** The room the party is in, or has just left during a breather. */
  readonly roomId: string;
  readonly members: readonly MemberView[];
  readonly pack: readonly PackItem[];
  readonly parts: readonly PartDrop[];
  readonly offGuard: boolean;
  readonly alerted: boolean;
  readonly choice: ChoiceView | null;
  readonly lastChoice: {
    readonly optionIndex: number;
    readonly testerId: string;
    readonly success: boolean;
  } | null;
  /** Null when no rogue stands (the button is hidden). */
  readonly scout: {
    readonly scoutId: string;
    readonly chance: Value;
    readonly open: boolean;
  } | null;
  readonly scouted: boolean;
  /** The next room, after a seen scout. */
  readonly next: NextRoomView | null;
  readonly canMoveOn: boolean;
  readonly auto: { readonly on: boolean; readonly saveSkillsForBoss: boolean };
  readonly outcome: DelveOutcome | null;
  readonly ends: readonly MemberEnd[];
  /** Health a failed `hurt` way costs the tester. */
  readonly choiceHurt: number;
}

export function delveView(state: GameState): DelveView | null {
  const run = state.delve;
  if (!run) return null;
  const site = siteOf(state, run.siteId);
  const content = delveContent(state);
  const rooms: RoomView[] = run.rooms.map((plan, index) => {
    const known =
      index <= run.roomIndex ||
      (plan.kind === 'fight' && plan.boss) ||
      (index === run.roomIndex + 1 && !!run.seen);
    const kind = plan.kind === 'choice' ? 'choice' : plan.boss ? 'boss' : 'fight';
    const finished = run.phase === 'breather' || run.outcome === 'won';
    return {
      index,
      kind: known ? kind : null,
      roomId: known ? plan.roomId : null,
      done: index < run.roomIndex || (index === run.roomIndex && finished),
      current: index === run.roomIndex,
    };
  });
  const members: MemberView[] = run.fighters.map((f) => ({
    id: f.id,
    kindId: f.kindId,
    row: f.row,
    health: f.health,
    maxHealth: f.maxHealth,
    status: f.status,
    band: bandOf(f),
    skills: (content.classes[f.kindId]?.skills ?? []).map((actionId) => ({
      actionId,
      usesLeft: usesLeft(run, f.id, actionId) ?? 0,
    })),
  }));
  let choice: ChoiceView | null = null;
  if (run.phase === 'choice') {
    const room = currentChoice(state, run);
    choice = {
      roomId: room.id,
      options: room.options.map((o, i) => ({
        attribute: optionAttribute(state, run, i),
        onFailure: o.onFailure,
        testers: run.fighters
          .filter(isUp)
          .map((f) => ({ id: f.id, chance: choiceChance(state, i, f.id) })),
      })),
    };
  }
  const scout = scoutOf(state, run);
  const between = run.phase === 'breather' && run.roomIndex < run.rooms.length - 1;
  const nextPlan = run.rooms[run.roomIndex + 1];
  const next: NextRoomView | null =
    between && run.seen && nextPlan
      ? {
          kind: nextPlan.kind === 'choice' ? 'choice' : nextPlan.boss ? 'boss' : 'fight',
          roomId: nextPlan.roomId,
          foes:
            nextPlan.kind === 'fight'
              ? fightRoomOf(site, nextPlan.roomId).foes.map((f) => ({
                  kindId: f.kindId,
                  row: f.row,
                }))
              : [],
        }
      : null;
  return {
    siteId: run.siteId,
    phase: run.phase,
    roomIndex: run.roomIndex,
    rooms,
    roomId: run.rooms[run.roomIndex]?.roomId ?? '',
    members,
    pack: run.pack.map((p) => ({ kindId: p.kindId })),
    parts: run.loot.parts.map((p) => ({ ...p })),
    offGuard: run.bonuses.offGuard,
    alerted: run.bonuses.alerted,
    choice,
    lastChoice: run.lastChoice ? { ...run.lastChoice } : null,
    scout:
      between && scout
        ? { scoutId: scout.id, chance: scoutChance(state), open: scoutRefusal(state) === null }
        : null,
    scouted: run.scouted,
    next,
    canMoveOn: between,
    auto: { ...run.auto },
    outcome: run.outcome,
    ends: (run.ends ?? []).map((e) => ({ ...e })),
    choiceHurt: content.rules.room.hurt,
  };
}

/**
 * The start card's odds (D-232): for each approach, the member with the best chance at the
 * site's entry room's first way, ties by the members' order.
 */
export function approachChances(
  state: GameState,
  siteId: string,
  memberIds: readonly string[],
): readonly { readonly approach: Approach; readonly bestId: string; readonly chance: Value }[] {
  const { rules } = delveContent(state);
  const site = siteOf(state, siteId);
  const difficulty = rules.room.difficulty[site.danger];
  const approaches: readonly Approach[] = ['stealth', 'assault', 'diplomacy'];
  return approaches.map((approach) => {
    const attribute = rules.approachAttribute[approach];
    const scored = memberIds.map((id) => ({
      id,
      chance: chanceValue(
        rules.check.baseBp,
        [
          {
            sourceId: 'check.difference',
            amount:
              rules.check.stepBp * (adventurerOf(state, id).attributes[attribute] - difficulty),
          },
        ],
        rules.check.minBp,
        rules.check.maxBp,
        siteId,
      ),
    }));
    const best = scored.reduce((a, b) => (b.chance.total > a.chance.total ? b : a));
    return { approach, bestId: best.id, chance: best.chance };
  });
}
