// Resolution v0 starting numbers (packages/engine/src/resolution/SPEC.md, D-118..D-123).
// Second tuning pass (2026-10-26, tools/resolution-sweep.ts, D-131): death, bleed and the mill
// cellar's numbers put the prototype party near PLAN §4c on all three contracts at the default
// plan. Cautious and reckless plans hit §4c's half and double only on the perilous chapel (D-131).
import { gallowsSpire } from './deadly-quest.ts';
import { baseGuildRules } from './guild.ts';
import type { QuestTemplate, ResolutionContent, ResolutionRules } from '@adventure-manager/engine';

export const baseResolutionRules: ResolutionRules = {
  partySize: { min: 3, max: 6 },
  baseChanceBp: 5000,
  stepBp: 500,
  minChanceBp: 500,
  maxChanceBp: 9500,
  strongHitShareBp: 3000,
  woundSteps: {
    failure: 1,
    badFailure: 2,
    alarmBadFailure: 1,
    hit: 1,
    strongHit: 2,
  },
  risk: {
    cautious: { chanceBp: -500, badFailureShareBp: 1500 },
    steady: { chanceBp: 0, badFailureShareBp: 3000 },
    bold: { chanceBp: 500, badFailureShareBp: 5000 },
  },
  riskPurposes: ['scene', 'attack'],
  approachAttribute: { stealth: 'stealth', assault: 'might', diplomacy: 'presence' },
  tagShifts: {
    guarded: { stealth: -2, assault: 2 },
    dark: { stealth: -1, diplomacy: 1 },
    open: { stealth: 2, assault: -1 },
  },
  alarmFoeBonus: 2,
  maxExchanges: 6,
  targetWeight: { front: 2, back: 1 },
  deathRoll: { baseBp: 3500, stepBp: 150, pivot: 10 },
  bleed: { baseBp: 3000, stepBp: 200, pivot: 10 },
  stabilise: { attribute: 'lore', difficulty: 10 },
  injuryBp: { badlyHurt: 750, down: 2250, dying: 4100 },
  retreat: {
    attribute: 'wits',
    difficulty: { routine: 6, hazardous: 9, perilous: 12, deadly: 15 },
    beats: 1,
    failedCheckBeats: 1,
    carryBeats: 1,
  },
  leaderCall: { attribute: 'wits', difficulty: 12, clarityStepBp: 2500 },
  classes: {
    'class.warrior': {
      attackAttribute: 'might',
      canStabilise: false,
      actions: [
        { id: 'action.guard', kind: 'guard', chanceBp: 2500 },
        { id: 'action.cleave', kind: 'cleave' },
      ],
    },
    'class.rogue': {
      attackAttribute: 'agility',
      canStabilise: false,
      actions: [
        { id: 'action.scout', kind: 'scout', bonusBp: 1000 },
        { id: 'action.shadow-strike', kind: 'shadow-strike', bonusBp: 1500 },
      ],
    },
    'class.cleric': {
      attackAttribute: 'lore',
      canStabilise: true,
      actions: [
        { id: 'action.mend', kind: 'mend', attribute: 'lore', difficulty: 16 },
        { id: 'action.ward', kind: 'ward', penaltyBp: 500 },
      ],
    },
  },
};

/** One hazardous barrow delve: enough for the watch test (R1) to run end to end. */
export const barrowDelve: QuestTemplate = {
  id: 'quest.barrow-delve',
  danger: 'hazardous',
  tags: ['dark', 'guarded'],
  scenes: [
    {
      id: 'scene.fen-road',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 8,
      testers: 'all',
      onFailure: 'wound',
    },
    {
      id: 'scene.barrow-mouth',
      kind: 'approach',
      difficulty: 10,
      testers: 'best',
      onFailure: 'alarm',
    },
    {
      id: 'scene.fallen-passage',
      kind: 'fixed',
      attribute: 'wits',
      difficulty: 11,
      testers: 'best-two',
      onFailure: 'wound',
    },
    {
      id: 'scene.burial-hall',
      kind: 'approach',
      difficulty: 12,
      testers: 'best-two',
      onFailure: 'alarm',
    },
  ],
  foes: [
    { id: 'foe.barrow-hounds', attack: 13, defence: 9, speed: 14, hits: 5 },
    { id: 'foe.restless-warden', attack: 15, defence: 11, speed: 8, hits: 7 },
  ],
};

/** A routine job close to home. */
export const millCellar: QuestTemplate = {
  id: 'quest.mill-cellar',
  danger: 'routine',
  tags: ['dark'],
  scenes: [
    {
      id: 'scene.mill-yard',
      kind: 'approach',
      difficulty: 7,
      testers: 'best',
      onFailure: 'alarm',
    },
    {
      id: 'scene.flooded-steps',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 10,
      testers: 'all',
      onFailure: 'wound',
    },
  ],
  foes: [{ id: 'foe.cellar-rats', attack: 14, defence: 6, speed: 13, hits: 8 }],
};

/** A perilous delve: the drowned chapel and what keeps it. */
export const drownedChapel: QuestTemplate = {
  id: 'quest.drowned-chapel',
  danger: 'perilous',
  tags: ['dark', 'open'],
  scenes: [
    {
      id: 'scene.reed-causeway',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 9,
      testers: 'all',
      onFailure: 'wound',
    },
    {
      id: 'scene.bell-tower',
      kind: 'approach',
      difficulty: 12,
      testers: 'best-two',
      onFailure: 'alarm',
    },
    {
      id: 'scene.sunken-nave',
      kind: 'fixed',
      attribute: 'wits',
      difficulty: 12,
      testers: 'best-two',
      onFailure: 'wound',
    },
    {
      id: 'scene.crypt-stair',
      kind: 'fixed',
      attribute: 'resolve',
      difficulty: 11,
      testers: 'best-two',
      onFailure: 'wound',
    },
  ],
  foes: [
    { id: 'foe.drowned-dead', attack: 13, defence: 10, speed: 7, hits: 6 },
    { id: 'foe.chapel-keeper', attack: 15, defence: 12, speed: 10, hits: 8 },
  ],
};

export const baseResolution: ResolutionContent = {
  rules: baseResolutionRules,
  quests: [barrowDelve, millCellar, drownedChapel, gallowsSpire],
  guild: baseGuildRules,
};
