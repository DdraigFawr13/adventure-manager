// Shapes for guild year v0 (SPEC.md). Content supplies GuildRules; the engine only reads them.
import type { CareerEnd, CareerRules, CareerState, TargetKind } from '../career/types.ts';
import type { PronounKey } from '../core/text.ts';
import type { Adventurer, Attribute, Danger, Plan, QuestOutcome } from '../resolution/types.ts';

export interface DangerRules {
  readonly danger: Danger;
  /** Share of new offers (whole-number weight). */
  readonly weight: number;
  readonly feeCopper: number;
  /** Fee spread either way, in basis points. */
  readonly feeSpreadBp: number;
  /** Days each way; the offer adds 0 to `travelSpreadDays` more. */
  readonly travelDays: number;
  readonly travelSpreadDays: number;
  /** Renown for a win; a rout loses the same. */
  readonly renownWin: number;
}

export interface ClassLeaning {
  readonly classId: string;
  /** Whole-number weight when drawing a person. */
  readonly weight: number;
  readonly wageBaseCopper: number;
  /** The two attributes that get the lead bonus. */
  readonly lead: readonly [Attribute, Attribute];
  readonly position: Adventurer['position'];
}

export interface WeekRange {
  readonly from: number;
  readonly to: number;
}

/** Naming for drawn people (STYLE §9a): pronouns by weight, then a given name that fits them. */
export interface NamingRules {
  readonly pronouns: readonly (readonly [PronounKey, number])[];
  /** Given names by the pronoun set they suit; 'they' draws from all of them. */
  readonly given: Readonly<Record<'she' | 'he' | 'any', readonly string[]>>;
  readonly family: readonly string[];
}

export interface GuildRules {
  /** Absent: drawn people have no names (tests that don't read text). */
  readonly naming?: NamingRules;
  /** Absent: one year only, no rivals, ladder or patron (career/SPEC.md). */
  readonly career?: CareerRules;
  readonly weeksPerYear: number;
  readonly daysPerWeek: number;
  /** Weeks 1..assemblyWeeks are the Assembly; winter starts at winterFromWeek. */
  readonly assemblyWeeks: number;
  readonly winterFromWeek: number;
  readonly signingWindows: readonly WeekRange[];
  readonly offersPerWeek: {
    readonly assembly: number;
    readonly campaign: number;
    readonly winter: number;
  };
  readonly offerLifeWeeks: number;
  readonly dangers: readonly DangerRules[];
  /** Share of the fee paid by outcome, in basis points. */
  readonly payBp: Readonly<Record<QuestOutcome, number>>;
  /** Extra share of the fee on a win. */
  readonly lootBp: number;
  /** What a death costs the guild (D-138): a funeral, a share of wages to the family, and renown when the plan was reckless. */
  readonly death: {
    readonly funeralCopper: number;
    readonly familyShareWeeks: number;
    readonly recklessRenownLoss: number;
  };
  /** Signing a recruit in a window costs this many weeks of their wage up front (D-138). */
  readonly signOnWeeks: number;
  readonly runningCostCopper: number;
  readonly patronGrantCopper: number;
  readonly startingChestCopper: number;
  readonly partySize: { readonly min: number; readonly max: number };
  readonly classes: readonly ClassLeaning[];
  /** Wage: base + this per point the best three attributes average above `wagePivot`, floored. */
  readonly wageStepCopper: number;
  readonly wagePivot: number;
  readonly wageFloorBelowBaseCopper: number;
  readonly restDaysPerWoundStep: number;
  /** Days every survivor spends home refitting after a quest, before the wound rest is added. */
  readonly refitDays: number;
  readonly injuryWeeks: { readonly min: number; readonly max: number };
  readonly prospectsPerWindowWeek: number;
  readonly attributeRange: { readonly min: number; readonly max: number };
  readonly leadBonus: { readonly min: number; readonly max: number };
  readonly weaponBp: number;
  readonly armourBp: number;
}

export interface GuildMember {
  readonly id: string;
  wageCopper: number;
  /** First day the member is fit again; fit when this is at or before today. */
  outUntilDay: number;
  away: boolean;
}

export interface Offer {
  readonly id: string;
  /** The contract as it really is; only the quest reads it (a hidden twist is in here). */
  readonly templateId: string;
  /** The contract as the board shows it: a hidden twist reads as none (D-139). Views use this. */
  readonly shownTemplateId: string;
  readonly danger: Danger;
  readonly feeCopper: number;
  readonly travelDays: number;
  readonly expiresWeek: number;
}

export interface Party {
  readonly id: string;
  readonly memberIds: string[];
  readonly plan: Plan;
  readonly offer: Offer;
  readonly arriveDay: number;
  readonly homeDay: number;
  outcome: QuestOutcome | null;
}

export interface Prospect {
  readonly adventurer: Adventurer;
  readonly wageCopper: number;
}

export interface GuildState {
  chestCopper: number;
  renown: number;
  readonly members: GuildMember[];
  readonly board: Offer[];
  readonly parties: Party[];
  readonly prospects: Prospect[];
  /** Many years, rivals, the ladder and the patron; absent when the rules have no career. */
  career?: CareerState;
  /** Real shape ids the board drew recently, oldest first, per danger (contract/SPEC.md). Engine-only: it can name a hidden twist, so views never read it. */
  readonly recentShapes: string[];
  /** Counters for ids, so ids stay unique and replayable. */
  nextOfferNo: number;
  nextPartyNo: number;
  nextPersonNo: number;
}

export type { CareerEnd, TargetKind };
export type MoneyReason =
  'founding' | 'grant' | 'wages' | 'upkeep' | 'fee' | 'loot' | 'funeral' | 'sign-on';
export type StopClass = 'must' | 'digest';
export type StopReason =
  | 'week-report'
  | 'assembly'
  | 'new-contracts'
  | 'death'
  | 'signing-window'
  | 'party-home'
  | 'retirement'
  | 'career-ended';

export type GuildCommand =
  | {
      readonly type: 'guild.found';
      readonly id: string;
      readonly day: number;
      readonly size: number;
    }
  | { readonly type: 'day.advance'; readonly id: string; readonly day: number }
  | {
      readonly type: 'contract.take';
      readonly id: string;
      readonly day: number;
      readonly offerId: string;
      readonly partyIds: readonly string[];
      readonly plan: Plan;
    }
  | {
      readonly type: 'recruit.sign';
      readonly id: string;
      readonly day: number;
      readonly prospectId: string;
    };

export type GuildEventBody =
  | { readonly type: 'week.started'; readonly week: number; readonly year: number }
  | {
      readonly type: 'offer.posted';
      /** The board's view of the contract (`Offer.shownTemplateId`), never the hidden twist. */
      readonly templateId: string;
      readonly danger: Danger;
      readonly feeCopper: number;
      readonly travelDays: number;
      readonly expiresWeek: number;
    }
  | { readonly type: 'offer.expired' }
  | {
      readonly type: 'money.changed';
      readonly amountCopper: number;
      readonly reason: MoneyReason;
      readonly chestCopper: number;
    }
  | { readonly type: 'party.departed'; readonly arriveDay: number; readonly homeDay: number }
  | { readonly type: 'party.returned'; readonly outcome: QuestOutcome }
  | { readonly type: 'renown.changed'; readonly amount: number; readonly renown: number }
  | { readonly type: 'member.recovered' }
  | { readonly type: 'prospect.listed'; readonly classId: string; readonly wageCopper: number }
  | { readonly type: 'recruit.signed'; readonly wageCopper: number }
  | {
      readonly type: 'attribute.changed';
      readonly attribute: Attribute;
      readonly from: number;
      readonly to: number;
      readonly reason: 'growth' | 'age' | 'injury';
    }
  | { readonly type: 'adventurer.retired'; readonly age: number }
  | {
      readonly type: 'year.settled';
      readonly year: number;
      readonly tier: number;
      /** The player's tier, best first: guild ids and the renown each earned in the year. */
      readonly standings: readonly { readonly id: string; readonly renown: number }[];
      /** Each tier's winner, bottom tier first (R2's runaway-rival check reads these). */
      readonly leaders: readonly string[];
    }
  | { readonly type: 'tier.changed'; readonly from: number; readonly to: number }
  | {
      readonly type: 'patron.reviewed';
      readonly target: TargetKind;
      readonly place: number;
      readonly met: boolean;
      readonly inDebt: boolean;
      readonly change: number;
      readonly confidence: number;
    }
  | { readonly type: 'patron.target'; readonly target: TargetKind; readonly tier: number }
  | { readonly type: 'career.ended'; readonly reason: CareerEnd; readonly years: number }
  | {
      readonly type: 'stop.raised';
      readonly stopClass: StopClass;
      readonly reason: StopReason;
    };
