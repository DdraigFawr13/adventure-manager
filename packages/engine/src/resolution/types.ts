// Shapes for resolution v0 (SPEC.md). Content packs supply the numbers; the engine only reads them.
import type { EventBase } from '../core/events.ts';
import type { RngState } from '../core/rng.ts';
import type { Value } from '../core/value.ts';

export const ATTRIBUTES = [
  'might',
  'agility',
  'toughness',
  'stealth',
  'wits',
  'presence',
  'resolve',
  'lore',
] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Approach = 'stealth' | 'assault' | 'diplomacy';
export type Risk = 'cautious' | 'steady' | 'bold';
export type Danger = 'routine' | 'hazardous' | 'perilous' | 'deadly';
export type Position = 'front' | 'back';
export type RetreatThreshold = 'badly-hurt' | 'down' | 'dying' | 'never';

/** Wound steps as numbers, so "worse" is "greater" (D-120). */
export const WOUND = { fit: 0, hurt: 1, badlyHurt: 2, down: 3, dying: 4 } as const;

export interface Adventurer {
  readonly id: string;
  readonly classId: string;
  readonly position: Position;
  readonly attributes: Readonly<Record<Attribute, number>>;
  readonly weaponBp: number;
  readonly armourBp: number;
  dead: boolean;
}

export interface Plan {
  readonly approach: Approach;
  readonly risk: Risk;
  readonly retreat: RetreatThreshold;
}

/** An approach scene tests the plan's attribute; a fixed scene (travel, a trap) its own. */
export type SceneTemplate = {
  readonly id: string;
  readonly difficulty: number;
  readonly testers: 'best' | 'best-two' | 'all';
  readonly onFailure: 'wound' | 'alarm';
} & ({ readonly kind: 'approach' } | { readonly kind: 'fixed'; readonly attribute: Attribute });

export interface FoeGroupTemplate {
  readonly id: string;
  readonly attack: number;
  readonly defence: number;
}

export interface QuestTemplate {
  readonly id: string;
  readonly danger: Danger;
  readonly tags: readonly string[];
  readonly scenes: readonly SceneTemplate[];
  readonly foes: readonly FoeGroupTemplate[];
}

export interface ResolutionRules {
  readonly partySize: { readonly min: number; readonly max: number };
  readonly baseChanceBp: number;
  /** Chance per point of attribute above or below the difficulty. */
  readonly stepBp: number;
  readonly minChanceBp: number;
  readonly maxChanceBp: number;
  /** A hit whose roll is in this lowest share of the chance moves two wound steps. */
  readonly strongHitShareBp: number;
  readonly risk: Readonly<
    Record<Risk, { readonly chanceBp: number; readonly badFailureShareBp: number }>
  >;
  readonly approachAttribute: Readonly<Record<Approach, Attribute>>;
  /** Difficulty change per site tag and approach, e.g. guarded: stealth -2, assault +2. */
  readonly tagShifts: Readonly<Record<string, Readonly<Partial<Record<Approach, number>>>>>;
  /** Added to every foe's attack and defence once the alarm is raised. */
  readonly alarmFoeBonus: number;
  readonly maxExchanges: number;
  readonly targetWeight: Readonly<Record<Position, number>>;
  /** Death chance: base minus step per Toughness and Resolve point above the pivot. */
  readonly deathRoll: { readonly baseBp: number; readonly stepBp: number; readonly pivot: number };
  readonly stabilise: { readonly attribute: Attribute; readonly difficulty: number };
  readonly injuryBp: { readonly badlyHurt: number; readonly down: number; readonly dying: number };
  readonly retreat: {
    readonly attribute: Attribute;
    readonly difficulty: Readonly<Record<Danger, number>>;
  };
  readonly classes: Readonly<
    Record<string, { readonly attackAttribute: Attribute; readonly canStabilise: boolean }>
  >;
}

export interface ResolutionContent {
  readonly rules: ResolutionRules;
  readonly quests: readonly QuestTemplate[];
}

export interface FoeState {
  readonly id: string;
  readonly attack: number;
  readonly defence: number;
  step: number;
}

export interface QuestRun {
  readonly id: string;
  readonly templateId: string;
  readonly plan: Plan;
  readonly watched: boolean;
  readonly partyIds: readonly string[];
  /** Wound step per adventurer id. */
  readonly steps: Record<string, number>;
  phase: 'scenes' | 'fight';
  sceneIndex: number;
  exchange: number;
  alarm: boolean;
  readonly foes: FoeState[];
  momentPending: boolean;
  /** Members at or past the retreat threshold when the player last chose to push on. */
  answeredCount: number;
}

export interface GameState {
  readonly seed: string;
  readonly rng: Record<string, RngState>;
  nextEventNo: number;
  readonly content: ResolutionContent;
  readonly roster: Adventurer[];
  quest: QuestRun | null;
}

export type CheckPurpose =
  'scene' | 'attack' | 'defence' | 'stabilise' | 'death' | 'injury' | 'retreat';
export type CheckOutcome = 'strong-success' | 'success' | 'failure' | 'bad-failure';
export type QuestOutcome = 'won' | 'partial' | 'retreated' | 'routed';

export type Command =
  | {
      readonly type: 'quest.start';
      readonly id: string;
      readonly day: number;
      readonly questId: string;
      readonly templateId: string;
      readonly partyIds: readonly string[];
      readonly plan: Plan;
      readonly watched: boolean;
    }
  | { readonly type: 'quest.step'; readonly id: string; readonly day: number }
  | {
      readonly type: 'quest.choose';
      readonly id: string;
      readonly day: number;
      readonly choice: 'push-on' | 'pull-out';
    };

export type GameEvent = EventBase &
  (
    | { readonly type: 'quest.started'; readonly templateId: string; readonly plan: Plan }
    | { readonly type: 'scene.started'; readonly sceneId: string }
    | { readonly type: 'exchange.started'; readonly exchange: number }
    | {
        readonly type: 'check.rolled';
        readonly purpose: CheckPurpose;
        readonly chance: Value;
        /** 1–10,000; the check succeeds when the roll is at or under the chance. */
        readonly roll: number;
        readonly outcome: CheckOutcome;
      }
    | { readonly type: 'wound.changed'; readonly from: number; readonly to: number }
    | { readonly type: 'foe.wounded'; readonly from: number; readonly to: number }
    | { readonly type: 'alarm.raised' }
    | { readonly type: 'adventurer.stabilised' }
    | { readonly type: 'adventurer.died' }
    | { readonly type: 'moment.raised'; readonly moment: 'retreat' }
    | { readonly type: 'moment.resolved'; readonly choice: 'push-on' | 'pull-out' }
    | { readonly type: 'quest.retreated' }
    | { readonly type: 'injury.gained' }
    | { readonly type: 'quest.ended'; readonly outcome: QuestOutcome }
  );
