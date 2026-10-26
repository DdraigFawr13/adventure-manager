// Resolution v0 starting numbers (packages/engine/src/resolution/SPEC.md, D-118..D-123).
// All are first guesses for R1 and R2 to tune against PLAN §4c, not measured values.
import type { QuestTemplate, ResolutionContent, ResolutionRules } from '@adventure-manager/engine';

export const baseResolutionRules: ResolutionRules = {
  partySize: { min: 3, max: 6 },
  baseChanceBp: 5000,
  stepBp: 500,
  minChanceBp: 500,
  maxChanceBp: 9500,
  strongHitShareBp: 2500,
  woundSteps: {
    failure: 1,
    badFailure: 2,
    alarmBadFailure: 1,
    hit: 1,
    strongHit: 2,
    failedRetreat: 1,
  },
  risk: {
    cautious: { chanceBp: -500, badFailureShareBp: 1500 },
    steady: { chanceBp: 0, badFailureShareBp: 3000 },
    bold: { chanceBp: 500, badFailureShareBp: 5000 },
  },
  approachAttribute: { stealth: 'stealth', assault: 'might', diplomacy: 'presence' },
  tagShifts: {
    guarded: { stealth: -2, assault: 2 },
    dark: { stealth: -1, diplomacy: 1 },
    open: { stealth: 2, assault: -1 },
  },
  alarmFoeBonus: 2,
  maxExchanges: 6,
  targetWeight: { front: 2, back: 1 },
  deathRoll: { baseBp: 2500, stepBp: 100, pivot: 10 },
  bleed: { baseBp: 2000, stepBp: 200, pivot: 10 },
  stabilise: { attribute: 'lore', difficulty: 10 },
  injuryBp: { badlyHurt: 1500, down: 4000, dying: 7000 },
  retreat: {
    attribute: 'wits',
    difficulty: { routine: 6, hazardous: 9, perilous: 12, deadly: 15 },
  },
  classes: {
    'class.warrior': { attackAttribute: 'might', canStabilise: false },
    'class.rogue': { attackAttribute: 'agility', canStabilise: false },
    'class.cleric': { attackAttribute: 'lore', canStabilise: true },
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
    { id: 'foe.barrow-hounds', attack: 10, defence: 9 },
    { id: 'foe.restless-warden', attack: 12, defence: 11 },
  ],
};

export const baseResolution: ResolutionContent = {
  rules: baseResolutionRules,
  quests: [barrowDelve],
};
