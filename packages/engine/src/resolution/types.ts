// Shapes for resolution v0 (SPEC.md). Content packs supply the numbers; the engine only reads them.
import type { EventBase } from '../core/events.ts';
import type { PronounKey } from '../core/text.ts';
import type { RngState } from '../core/rng.ts';
import type { Value } from '../core/value.ts';
import type { ContractContent, Twist } from '../contract/types.ts';
import type { GuildCommand, GuildEventBody, GuildRules, GuildState } from '../guild/types.ts';

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
/** 'leader': the party's leader judges at each fall whether to hold to first Dying (D-125). */
export type RetreatThreshold = 'badly-hurt' | 'down' | 'dying' | 'leader' | 'never';

/** Wound steps as numbers, so "worse" is "greater" (D-120). */
export const WOUND = { fit: 0, hurt: 1, badlyHurt: 2, down: 3, dying: 4 } as const;

export interface PersonName {
  readonly given: string;
  readonly family: string;
}

export interface Adventurer {
  readonly id: string;
  /** Drawn people carry their name and pronouns; fixed test and sample people take theirs from text data. */
  readonly name?: PersonName;
  readonly pronouns?: PronounKey;
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
  /** Turn order in an exchange, against adventurers' Agility (D-129). */
  readonly speed: number;
  /** Hits (wound steps) to beat before the group is down (D-129). */
  readonly hits: number;
}

export interface QuestTemplate {
  readonly id: string;
  readonly danger: Danger;
  readonly tags: readonly string[];
  readonly scenes: readonly SceneTemplate[];
  readonly foes: readonly FoeGroupTemplate[];
  /** A composed contract's twist (D-139); bleed, hostage and deadline twists act during the quest. */
  readonly twist?: Twist;
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
  /** Wound steps each kind of harm costs (D-120). */
  readonly woundSteps: {
    readonly failure: number;
    readonly badFailure: number;
    readonly alarmBadFailure: number;
    readonly hit: number;
    readonly strongHit: number;
  };
  readonly risk: Readonly<
    Record<Risk, { readonly chanceBp: number; readonly badFailureShareBp: number }>
  >;
  /** The checks the plan's risk changes (D-131): pressing on, not tending or getting out. */
  readonly riskPurposes: readonly CheckPurpose[];
  readonly approachAttribute: Readonly<Record<Approach, Attribute>>;
  /** Difficulty change per site tag and approach; negative is easier (guarded: stealth -2, assault +2). */
  readonly tagShifts: Readonly<Record<string, Readonly<Partial<Record<Approach, number>>>>>;
  /** Added to every foe's attack and defence once the alarm is raised. */
  readonly alarmFoeBonus: number;
  readonly maxExchanges: number;
  readonly targetWeight: Readonly<Record<Position, number>>;
  /** Death chance: base minus step per Toughness and Resolve point above the pivot. */
  readonly deathRoll: { readonly baseBp: number; readonly stepBp: number; readonly pivot: number };
  /** Chance per beat that an untended Down member slips to Dying, less per Toughness above the pivot. */
  readonly bleed: { readonly baseBp: number; readonly stepBp: number; readonly pivot: number };
  readonly stabilise: { readonly attribute: Attribute; readonly difficulty: number };
  readonly injuryBp: { readonly badlyHurt: number; readonly down: number; readonly dying: number };
  /** A retreat takes beats (D-126): a base, more on a failed check, more while carrying the fallen. */
  readonly retreat: {
    readonly attribute: Attribute;
    readonly difficulty: Readonly<Record<Danger, number>>;
    readonly beats: number;
    readonly failedCheckBeats: number;
    readonly carryBeats: number;
  };
  /** The leader's read at a fall (D-125): a clearer situation lowers the difficulty. */
  readonly leaderCall: {
    readonly attribute: Attribute;
    readonly difficulty: number;
    /** Gap between foes down and party fallen, in basis points, worth one point of difficulty. */
    readonly clarityStepBp: number;
  };
  readonly classes: Readonly<Record<string, ClassRules>>;
}

export interface ClassRules {
  readonly attackAttribute: Attribute;
  readonly canStabilise: boolean;
  /** Signature actions (D-130), used on their own when the situation fits. */
  readonly actions: readonly ClassAction[];
}

/** One kind per engine rule; content chooses which class has which, and the numbers (D-130). */
export type ClassAction = { readonly id: string } & (
  | { readonly kind: 'guard'; readonly chanceBp: number }
  | { readonly kind: 'cleave' }
  | { readonly kind: 'scout'; readonly bonusBp: number }
  | { readonly kind: 'shadow-strike'; readonly bonusBp: number }
  | { readonly kind: 'mend'; readonly attribute: Attribute; readonly difficulty: number }
  | { readonly kind: 'ward'; readonly penaltyBp: number }
);

export interface ResolutionContent {
  readonly rules: ResolutionRules;
  readonly quests: readonly QuestTemplate[];
  /** Sites, monster kinds and twists the board composes contracts from (contract/SPEC.md). */
  readonly contracts?: ContractContent;
  /** Guild year rules (guild/SPEC.md); absent in resolution-only games. */
  readonly guild?: GuildRules;
}

export interface FoeState {
  readonly id: string;
  readonly attack: number;
  readonly defence: number;
  readonly speed: number;
  readonly hits: number;
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
  phase: 'scenes' | 'fight' | 'retreat';
  /** Retreat beats still to cover; foes strike on each if the party fled a fight. */
  retreatBeats: number;
  fledFight: boolean;
  /** Members fallen (Down or worse) when the leader last judged. */
  judgedFallen: number;
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
  /** Day number of the guild's calendar; 1 is the first day of week 1. */
  calendar: number;
  guild: GuildState | null;
}

export type CheckPurpose =
  | 'scene'
  | 'attack'
  | 'defence'
  | 'stabilise'
  | 'bleed'
  | 'death'
  | 'injury'
  | 'retreat'
  | 'judgement'
  | 'guard'
  | 'mend';
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
    }
  | GuildCommand;

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
    | {
        readonly type: 'foe.wounded';
        readonly from: number;
        readonly to: number;
        /** The group is down when `to` reaches this. */
        readonly hits: number;
      }
    | { readonly type: 'alarm.raised' }
    | { readonly type: 'action.used'; readonly actionId: string }
    | { readonly type: 'adventurer.stabilised' }
    | { readonly type: 'adventurer.died' }
    | { readonly type: 'moment.raised'; readonly moment: 'retreat' }
    | { readonly type: 'moment.resolved'; readonly choice: 'push-on' | 'pull-out' }
    | { readonly type: 'quest.retreated'; readonly beats: number }
    | { readonly type: 'retreat.beat'; readonly beatsLeft: number }
    | {
        readonly type: 'leader.judged';
        readonly situation: 'winning' | 'losing';
        readonly call: 'hold' | 'pull-out';
      }
    | { readonly type: 'injury.gained' }
    | { readonly type: 'quest.ended'; readonly outcome: QuestOutcome }
    | GuildEventBody
  );
