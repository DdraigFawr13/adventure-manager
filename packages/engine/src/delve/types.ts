// Shapes for the delve system (SPEC.md): content rules the engine reads, and the run it keeps in
// `GameState.delve`. Content packs supply every number (packages/content/src/gate1/).
import type { Value } from '../core/value.ts';
import type { Adventurer, Approach, Attribute, Danger, Position } from '../resolution/types.ts';

export type Row = Position;
export type Rarity = 0 | 1 | 2;
export type ArmourWeight = 'light' | 'medium' | 'heavy';
export type PackKindId = 'item.draught' | 'item.firebomb';
/** Melee needs the target in the front row while anyone stands there; `any` reaches every row. */
export type Reach = 'melee' | 'any';
export type TargetRule = 'front-most' | 'most-hurt' | 'back-row-first';

export interface Range {
  readonly min: number;
  readonly max: number;
}

/** One kind per engine rule; content gives each class its actions and the numbers. */
export type DelveAction = { readonly id: string } & (
  | {
      readonly kind: 'strike';
      readonly reach: Reach;
      readonly damage: Range;
      /** The target moves one place later in the order. */
      readonly knockback?: boolean;
      /** After the strike, the most hurt standing ally heals this much. */
      readonly healMostHurt?: number;
      /** The target is marked: allies' hits on it gain the Spark part this round. */
      readonly mark?: boolean;
      /** The damage range doubles when the target was hit this round. */
      readonly doubleIfHit?: boolean;
      /** The target moves to last in the order. */
      readonly toLast?: boolean;
    }
  | { readonly kind: 'cleave'; readonly damage: Range }
  | { readonly kind: 'guard' }
  | { readonly kind: 'heal'; readonly amount: number; readonly raiseTo: number }
  | { readonly kind: 'ward' }
  | { readonly kind: 'haste' }
);

export interface DelveClass {
  readonly health: number;
  readonly attackAttribute: Attribute;
  /** The plain attack, used without limit. */
  readonly plain: string;
  /** Class skills, each with `skillUses` uses a delve. */
  readonly skills: readonly string[];
}

export interface FoeKind {
  readonly id: string;
  readonly health: number;
  readonly attack: number;
  readonly defence: number;
  readonly armour: number;
  readonly speed: number;
  readonly reach: Reach;
  readonly damage: Range;
  readonly targetRule: TargetRule;
  readonly partId: string;
  readonly partRarity: Rarity;
  readonly tag: 'beast' | 'undead';
  readonly boss?: boolean;
}

export type PackKind =
  | { readonly kind: 'heal'; readonly amount: number; readonly raiseTo: number }
  | { readonly kind: 'bomb'; readonly damage: Range };

export interface RoomFoe {
  readonly kindId: string;
  readonly row: Row;
}

export interface FightRoom {
  readonly id: string;
  readonly foes: readonly RoomFoe[];
}

export interface Site {
  readonly id: string;
  readonly danger: Danger;
  /** Gate 1's sample site has one fight room, no entry and no boss (S1). */
  readonly fightRooms: readonly FightRoom[];
}

export interface DelveRules {
  readonly check: {
    readonly baseBp: number;
    readonly stepBp: number;
    readonly minBp: number;
    readonly maxBp: number;
  };
  /** Party hit per point of Tactics above the pivot, never below 0. */
  readonly tactics: { readonly stepBp: number; readonly pivot: number };
  readonly weaponStep: { readonly hitBp: number; readonly damage: number };
  readonly sparkBp: number;
  readonly wardBp: number;
  readonly defence: { readonly base: number; readonly pivot: number; readonly divisor: number };
  readonly armourWeight: Readonly<Record<ArmourWeight, number>>;
  readonly toughnessPivot: number;
  readonly skillUses: number;
  readonly packMax: number;
  readonly bleed: { readonly baseBp: number; readonly stepBp: number; readonly pivot: number };
  readonly deathRoll: { readonly baseBp: number; readonly stepBp: number; readonly pivot: number };
  readonly injuryBp: { readonly badlyHurt: number; readonly down: number; readonly dying: number };
}

export interface SampleMember {
  readonly adventurerId: string;
  readonly loadout: Loadout;
  readonly row: Row;
}

export interface DelveContent {
  readonly rules: DelveRules;
  readonly classes: Readonly<Record<string, DelveClass>>;
  readonly actions: Readonly<Record<string, DelveAction>>;
  readonly foes: Readonly<Record<string, FoeKind>>;
  readonly pack: Readonly<Record<PackKindId, PackKind>>;
  readonly sites: Readonly<Record<string, Site>>;
  /** The S1–S2 sample party: who, their loadouts and rows (adventurers are in the state's roster). */
  readonly sampleParty: readonly SampleMember[];
  /** The sample party's people, for `sampleDelveState`. */
  readonly sampleRoster: readonly Adventurer[];
}

export interface Loadout {
  readonly weapon: { readonly kindId: string; readonly rarity: Rarity };
  readonly armour: { readonly weight: ArmourWeight; readonly rarity: Rarity };
  readonly trinket: { readonly kindId: string; readonly rarity: Rarity } | null;
}

export type FighterStatus = 'up' | 'down' | 'dying' | 'dead' | 'fled';

export interface Fighter {
  readonly id: string;
  readonly side: 'party' | 'foe';
  /** Class id for adventurers, foe kind id for foes. */
  readonly kindId: string;
  row: Row;
  health: number;
  readonly maxHealth: number;
  readonly speed: number;
  /** Damage taken off each hit: foes their kind's, adventurers armour weight plus rarity. */
  readonly armour: number;
  readonly loadout?: Loadout;
  status: FighterStatus;
  /** On a guarded ally: the warrior who takes hits aimed at them this round. */
  guardedBy?: string;
  /** On a foe: Spark's mark this round. */
  sparked: boolean;
  hitThisRound: boolean;
}

export type Intent = { readonly actionId: string; readonly targetId: string } | 'off-guard';

export interface FightState {
  round: number;
  /** Fighter ids, kept across rounds; skills that move someone change it for good. */
  readonly order: string[];
  /** Index in `order` of the fighter whose turn it is. */
  turn: number;
  /** Fighters who have acted, or been passed while unable, this round. */
  readonly acted: string[];
  readonly intents: Record<string, Intent>;
  readonly boss: boolean;
  warded: boolean;
  readonly foes: Fighter[];
}

export interface PackItem {
  readonly kindId: PackKindId;
}

export interface PartDrop {
  readonly partId: string;
  readonly rarity: Rarity;
  readonly foeKindId: string;
}

export type RoomPlan =
  | { readonly kind: 'choice'; readonly roomId: string }
  | { readonly kind: 'fight'; readonly roomId: string; readonly boss: boolean };

export type DelveOutcome = 'won' | 'retreated' | 'routed';

export interface DelveRun {
  readonly id: string;
  readonly siteId: string;
  readonly danger: Danger;
  readonly approach: Approach;
  readonly memberIds: readonly string[];
  readonly tactics: number;
  readonly rooms: readonly RoomPlan[];
  roomIndex: number;
  phase: 'choice' | 'fight' | 'breather' | 'ended';
  /** The party, health carried between rooms. */
  readonly fighters: Fighter[];
  fight: FightState | null;
  readonly pack: PackItem[];
  readonly skillUses: Record<string, Record<string, number>>;
  readonly auto: { on: boolean; saveSkillsForBoss: boolean };
  readonly bonuses: { offGuard: boolean; alerted: boolean; drillBp: number };
  scouted: boolean;
  readonly loot: { readonly parts: PartDrop[]; readonly gear: string[] };
  outcome: DelveOutcome | null;
}

export interface MemberEnd {
  readonly adventurerId: string;
  /** 0 fit … 4 Dying, as v0's WOUND. */
  readonly woundStep: number;
  readonly injury: boolean;
  readonly died: boolean;
}

export type DelveCommand =
  | {
      readonly type: 'delve.start';
      readonly id: string;
      readonly day: number;
      readonly siteId: string;
      readonly approach: Approach;
      readonly tactics: number;
      readonly members: readonly {
        readonly adventurerId: string;
        readonly loadout: Loadout;
        readonly row: Row;
      }[];
      readonly pack: readonly PackItem[];
      readonly drillBp: number;
    }
  | {
      readonly type: 'fight.act';
      readonly id: string;
      readonly day: number;
      readonly actorId: string;
      /** A class action id, or `action.pack` (with `packIndex`) or `action.swap-row`. */
      readonly actionId: string;
      readonly targetId?: string;
      readonly packIndex?: number;
    };

export type DelveEventBody =
  | { readonly type: 'delve.started'; readonly siteId: string }
  | { readonly type: 'room.entered'; readonly roomId: string; readonly roomIndex: number }
  | {
      readonly type: 'round.started';
      readonly round: number;
      readonly order: readonly string[];
      readonly intents: Readonly<Record<string, Intent>>;
    }
  | {
      readonly type: 'fight.acted';
      readonly actionId: string;
      readonly targetId: string | null;
      /** Absent for actions that never miss. */
      readonly hit: Value | null;
      /** 1–10,000; the action hits when the roll is at or under the chance. */
      readonly roll: number | null;
      readonly damage: number;
      readonly auto: boolean;
    }
  | {
      readonly type: 'health.changed';
      readonly from: number;
      readonly to: number;
    }
  | { readonly type: 'rows.set'; readonly row: Row }
  | { readonly type: 'order.changed'; readonly order: readonly string[] }
  | { readonly type: 'fighter.raised'; readonly health: number }
  | { readonly type: 'fighter.down' }
  | { readonly type: 'fighter.dying'; readonly roll: number; readonly chanceBp: number }
  | { readonly type: 'fighter.died'; readonly roll: number; readonly chanceBp: number }
  | { readonly type: 'band.fled' }
  | { readonly type: 'fight.ended'; readonly outcome: 'won' | 'routed' }
  | {
      readonly type: 'delve.ended';
      readonly outcome: DelveOutcome;
      readonly members: readonly MemberEnd[];
    };
