// Shapes for guild year v0 (SPEC.md). Content supplies GuildRules; the engine only reads them.
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

export interface GuildRules {
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
  readonly templateId: string;
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
  /** Counters for ids, so ids stay unique and replayable. */
  nextOfferNo: number;
  nextPartyNo: number;
  nextPersonNo: number;
}

export type MoneyReason = 'founding' | 'grant' | 'wages' | 'upkeep' | 'fee' | 'loot';
export type StopClass = 'must' | 'digest';
export type StopReason =
  'week-report' | 'assembly' | 'new-contracts' | 'death' | 'signing-window' | 'party-home';

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
  | { readonly type: 'week.started'; readonly week: number }
  | {
      readonly type: 'offer.posted';
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
      readonly type: 'stop.raised';
      readonly stopClass: StopClass;
      readonly reason: StopReason;
    };
