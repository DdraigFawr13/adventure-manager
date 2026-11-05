// The gate 1 content pack (docs/specs/gate1-one-delve.md "Content"): the delve rules, classes, foes,
// pack and sites, the sample party, and its words.
import type {
  Adventurer,
  DelveContent,
  DelveRules,
  ResolutionContent,
  SampleMember,
} from '@adventure-manager/engine';
import party from '../../data/gate1-sample-party.json' with { type: 'json' };
import text from '../../data/gate1.en.json' with { type: 'json' };
import { baseResolution, baseResolutionRules } from '../base/resolution.ts';
import { gate1Actions, gate1Classes } from './classes.ts';
import { gate1Foes } from './foes.ts';
import { gate1Pack } from './pack.ts';
import { gate1Sites } from './sites.ts';

export * from './rarity.ts';

/** Bumped whenever a gate 1 number changes, so a seed and this version replay a run (GAME-01). */
export const GATE1_RULES_VERSION = 2;

/** The site slice 2's page plays (spec S2: the barrow only). */
export const GATE1_SITE = 'site.hollow-barrow';

/** The guildmaster's Tactics in gate 1 (D-226; one fixed guildmaster). */
export const GATE1_TACTICS = 12;

const v0 = baseResolutionRules;

export const gate1Rules: DelveRules = {
  // v0's check numbers (D-119), shared on purpose.
  check: {
    baseBp: v0.baseChanceBp,
    stepBp: v0.stepBp,
    minBp: v0.minChanceBp,
    maxBp: v0.maxChanceBp,
  },
  tactics: { stepBp: 100, pivot: 10 },
  weaponStep: { hitBp: 500, damage: 1 },
  sparkBp: 1000,
  wardBp: 1500,
  defence: { base: 10, pivot: 10, divisor: 2 },
  armourWeight: { light: 0, medium: 1, heavy: 2 },
  toughnessPivot: 10,
  skillUses: 3,
  packMax: 4,
  // Tuned in S2 (delve-careful, 1,000 delves): v0's 3,000 made about 1 delve in 3 cost a life.
  bleed: { ...v0.bleed, baseBp: 1200 },
  deathRoll: v0.deathRoll,
  injuryBp: v0.injuryBp,
  approachAttribute: baseResolution.rules.approachAttribute,
  room: {
    difficulty: { routine: 9, hazardous: 11, perilous: 13, deadly: 15 },
    hurt: 4,
    extraRoomBp: 5000,
    scoutAttribute: 'stealth',
    scoutClassId: 'class.rogue',
  },
  breatherRaiseTo: 3,
  loot: { dropBp: 5000, bossDropBp: 10000 },
  retreat: {
    attribute: v0.retreat.attribute,
    difficulty: v0.retreat.difficulty,
    beats: v0.retreat.beats,
    carryBeats: v0.retreat.carryBeats,
    failedCheckBeats: v0.retreat.failedCheckBeats,
  },
  auto: { baseBp: 6000, witsStepBp: 300, tacticsStepBp: 200, pivot: 10, minBp: 3000, maxBp: 9500 },
};

// cast-ok: a fixed data file written to the sample-member shape; the delve tests start from it.
const members = party.party as unknown as readonly (Adventurer & SampleMember)[];

export const gate1Delve: DelveContent = {
  rules: gate1Rules,
  classes: gate1Classes,
  actions: gate1Actions,
  foes: gate1Foes,
  pack: gate1Pack,
  sites: gate1Sites,
  sampleParty: members.map((m) => ({ adventurerId: m.id, loadout: m.loadout, row: m.row })),
  sampleRoster: members.map(({ row: _row, loadout: _loadout, ...a }) => ({ ...a, dead: false })),
};

/** Resolution v0 plus the delve pack: what the play page's state carries as content. */
export const gate1Content: ResolutionContent = { ...baseResolution, delve: gate1Delve };

/** The starting pack until S5: 2 draughts and 2 firebombs (D-222). */
export const GATE1_SAMPLE_PACK = [
  { kindId: 'item.draught' },
  { kindId: 'item.draught' },
  { kindId: 'item.firebomb' },
  { kindId: 'item.firebomb' },
] as const;

export const gate1Text = text;
