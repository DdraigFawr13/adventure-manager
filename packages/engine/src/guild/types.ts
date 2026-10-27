// Shapes for guild year v0 (SPEC.md). Content supplies GuildRules; the engine only reads them.
import type { Band, CareerEnd, CareerRules, CareerState, TargetKind } from '../career/types.ts';
import type { PronounKey } from '../core/text.ts';
import type { CrisisLink, CrisisRules, CrisisState } from '../crisis/types.ts';
import type { ExtendDirection, HouseJob, HouseRules, HouseState, Place } from '../house/types.ts';
import type { Area, StaffRules, StaffState } from '../staff/types.ts';
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

/** One starter party's character (D-188): how its people differ from a normal draw. */
export interface FoundingCharacter {
  readonly id: string;
  /** Added to every drawn attribute, kept within 1-20. */
  readonly attributeShift: number;
  /** Age drawn from this band instead of the career's. */
  readonly age: Band;
  /** Added to each attribute's potential above its drawn value. */
  readonly potentialBonus: number;
  /** The party's signing fee as a share of the plain fee (10,000 is the plain fee, D-188). */
  readonly feeBp: number;
}

/** The founding draft (D-188, SPEC.md): one purse, three starter parties and a shortlist of extras. */
export interface FoundingRules {
  /** Paid into the chest at the founding, instead of `startingChestCopper`. */
  readonly purseCopper: number;
  /** People in each starter party. */
  readonly partySize: number;
  /** One listed party per character, in this order. */
  readonly characters: readonly FoundingCharacter[];
  readonly extras: { readonly offered: number; readonly min: number; readonly max: number };
  /** Each picked person costs this many weeks of their wage at the pick (like D-138's sign-on). */
  readonly feeWeeks: number;
}

/** How a person is drawn when it is not the plain recruit draw (people.ts). */
export interface PersonMods {
  /** Stream name; default `guild.recruit`. */
  readonly stream?: string;
  readonly attributeShift?: number;
  readonly age?: Band;
  readonly potentialBonus?: number;
}

/** The listed starter parties and extras, until `guild.pick` settles them. */
export interface Draft {
  readonly parties: Prospect[][];
  readonly extras: Prospect[];
}

export interface GuildRules {
  /** Absent: drawn people have no names (tests that don't read text). */
  readonly naming?: NamingRules;
  /** Absent: one year only, no rivals, ladder or patron (career/SPEC.md). */
  readonly career?: CareerRules;
  /** Absent: no staff; training and recovery run at their neutral rate (staff/SPEC.md). */
  readonly staff?: StaffRules;
  /** Absent: no house: no rooms, no upkeep, no bed limit (house/SPEC.md). */
  readonly house?: HouseRules;
  /** Absent: no crises (crisis/SPEC.md). */
  readonly crises?: CrisisRules;
  /** Absent: `guild.found` draws `size` people and pays `startingChestCopper` (SPEC.md, Founding draft). */
  readonly founding?: FoundingRules;
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
  /** Set when the offer is a crisis step (crisis/SPEC.md). */
  readonly crisis?: CrisisLink;
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
  /** The founding draft awaiting `guild.pick`; absent without founding rules and once picked. */
  draft?: Draft;
  /** Many years, rivals, the ladder and the patron; absent when the rules have no career. */
  career?: CareerState;
  /** Who runs training and recovery; absent when the rules have no staff. */
  staff?: StaffState;
  /** The guild house's rooms and work; absent when the rules have no house. */
  house?: HouseState;
  /** The standing crisis and those already had; absent until the first Assembly that checks. */
  crisis?: CrisisState;
  /** Real shape ids the board drew recently, oldest first, per danger (contract/SPEC.md). Engine-only: it can name a hidden twist, so views never read it. */
  readonly recentShapes: string[];
  /** Counters for ids, so ids stay unique and replayable. */
  nextOfferNo: number;
  nextPartyNo: number;
  nextPersonNo: number;
}

export type { CareerEnd, TargetKind };
export type MoneyReason =
  | 'founding'
  | 'grant'
  | 'wages'
  | 'upkeep'
  | 'fee'
  | 'loot'
  | 'funeral'
  | 'sign-on'
  | 'staff'
  | 'building'
  | 'rooms'
  | 'emergency'
  | 'crisis'
  | 'inn'
  | 'incident'
  | 'theft';
export type IncidentAnswer = 'paid' | 'free';
export type IncidentResult =
  'saved' | 'lowered' | 'burnt-out' | 'written-off' | 'recovered' | 'not-recovered' | 'ill';
export type StopClass = 'must' | 'digest';
export type StopReason =
  | 'week-report'
  | 'assembly'
  | 'new-contracts'
  | 'death'
  | 'signing-window'
  | 'party-home'
  | 'retirement'
  | 'career-ended'
  | 'training-plan'
  | 'infirmary'
  | 'patron-offer'
  | 'crisis'
  | 'incident';

export type GuildCommand =
  | {
      readonly type: 'guild.found';
      readonly id: string;
      readonly day: number;
      readonly size: number;
    }
  | {
      readonly type: 'guild.pick';
      readonly id: string;
      readonly day: number;
      readonly partyIndex: number;
      readonly extraIds: readonly string[];
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
    }
  | {
      readonly type: 'staff.hire';
      readonly id: string;
      readonly day: number;
      readonly candidateId: string;
    }
  | {
      readonly type: 'staff.release';
      readonly id: string;
      readonly day: number;
      readonly area: Area;
    }
  | { readonly type: 'patron.grant'; readonly id: string; readonly day: number }
  | {
      readonly type: 'incident.answer';
      readonly id: string;
      readonly day: number;
      readonly answer: IncidentAnswer;
    }
  | {
      readonly type: 'house.repair';
      readonly id: string;
      readonly day: number;
      readonly place: Place;
    }
  | {
      readonly type: 'house.build';
      readonly id: string;
      readonly day: number;
      readonly place: Place;
      readonly kindId: string;
    }
  | {
      readonly type: 'house.upgrade';
      readonly id: string;
      readonly day: number;
      readonly place: Place;
    }
  | {
      readonly type: 'house.extend';
      readonly id: string;
      readonly day: number;
      readonly direction: ExtendDirection;
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
  /** The days a lasting injury adds to someone's time out, after recovery's scaling (staff/SPEC.md); `sickbed` says whether they had one (house on only). */
  | { readonly type: 'member.laid-up'; readonly days: number; readonly sickbed?: boolean }
  | { readonly type: 'prospect.listed'; readonly classId: string; readonly wageCopper: number }
  | { readonly type: 'recruit.signed'; readonly wageCopper: number }
  /** A person on the founding draft: `party` is the starter party's index, null for an extra. */
  | {
      readonly type: 'founding.listed';
      readonly party: number | null;
      readonly classId: string;
      readonly wageCopper: number;
      readonly feeCopper: number;
    }
  | {
      readonly type: 'founding.picked';
      readonly party: number;
      readonly extraIds: readonly string[];
      readonly feeCopper: number;
    }
  | {
      readonly type: 'attribute.changed';
      readonly attribute: Attribute;
      readonly from: number;
      readonly to: number;
      readonly reason: 'growth' | 'age' | 'injury' | 'training';
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
      /** In a grace year (D-189): which growth goals were met; `room` is null without house rules. */
      readonly goals?: {
        readonly roster: boolean;
        readonly renown: boolean;
        readonly room: boolean | null;
      };
      readonly inDebt: boolean;
      /** A crisis still stood at the review (crisis/SPEC.md). */
      readonly crisis: boolean;
      readonly change: number;
      readonly confidence: number;
    }
  | { readonly type: 'patron.target'; readonly target: TargetKind; readonly tier: number }
  | { readonly type: 'career.ended'; readonly reason: CareerEnd; readonly years: number }
  | { readonly type: 'patron.offered'; readonly grantCopper: number }
  | { readonly type: 'crisis.started'; readonly chainId: string }
  | { readonly type: 'crisis.advanced'; readonly chainId: string; readonly step: number }
  | { readonly type: 'crisis.ended'; readonly chainId: string; readonly outcome: 'resolved' }
  | { readonly type: 'patron.granted'; readonly grantCopper: number; readonly confidence: number }
  | { readonly type: 'skill.grew'; readonly area: Area; readonly from: number; readonly to: number }
  | {
      readonly type: 'staff.listed';
      readonly area: Area;
      readonly quality: number;
      readonly wageCopper: number;
    }
  | {
      readonly type: 'staff.hired';
      readonly area: Area;
      readonly quality: number;
      readonly wageCopper: number;
    }
  | { readonly type: 'staff.released'; readonly area: Area }
  /** Work paid for and under way; `places` are copies, `kindId` and `level` (the level built or raised to) apply to build and upgrade, `direction` to extend (house/SPEC.md). */
  | {
      readonly type: 'house.started';
      readonly job: HouseJob['kind'];
      readonly places: readonly Place[];
      readonly kindId?: string;
      readonly level?: number;
      readonly direction?: ExtendDirection;
      readonly costCopper: number;
      /** The absolute week at whose start the work is done. */
      readonly doneWeek: number;
    }
  | {
      readonly type: 'house.finished';
      readonly job: HouseJob['kind'];
      readonly places: readonly Place[];
      readonly kindId?: string;
      readonly level?: number;
      readonly direction?: ExtendDirection;
      readonly doneWeek: number;
    }
  /** An incident struck (house/SPEC.md): `place` is null for theft; `feeCopper` is the paid answer's fee. */
  | {
      readonly type: 'incident.struck';
      readonly kindId: string;
      readonly effect: 'fire' | 'theft' | 'sickness';
      readonly place: Place | null;
      readonly feeCopper: number;
    }
  | {
      readonly type: 'incident.settled';
      readonly kindId: string;
      readonly effect: 'fire' | 'theft' | 'sickness';
      readonly place: Place | null;
      readonly answer: IncidentAnswer;
      readonly byDefault: boolean;
      readonly result: IncidentResult;
    }
  | { readonly type: 'member.fell-ill'; readonly days: number; readonly sickbed: boolean }
  | {
      readonly type: 'stop.raised';
      readonly stopClass: StopClass;
      readonly reason: StopReason;
    };
