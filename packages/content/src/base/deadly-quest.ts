// The deadly contract (PLAN §4c: about 7% deaths per adventurer per quest for the prototype
// party at the default plan). Numbers tuned with tools/resolution-sweep.ts.
import type { QuestTemplate } from '@adventure-manager/engine';

export const gallowsSpire: QuestTemplate = {
  id: 'quest.gallows-spire',
  danger: 'deadly',
  tags: ['guarded', 'open'],
  scenes: [
    {
      id: 'scene.spire-ascent',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 11,
      testers: 'all',
      onFailure: 'wound',
    },
    {
      id: 'scene.iron-stair',
      kind: 'approach',
      difficulty: 13,
      testers: 'best-two',
      onFailure: 'alarm',
    },
    {
      id: 'scene.bone-gallery',
      kind: 'fixed',
      attribute: 'resolve',
      difficulty: 13,
      testers: 'best-two',
      onFailure: 'wound',
    },
    {
      id: 'scene.high-cell',
      kind: 'approach',
      difficulty: 14,
      testers: 'best-two',
      onFailure: 'alarm',
    },
  ],
  foes: [
    { id: 'foe.spire-wardens', attack: 16, defence: 12, speed: 11, hits: 7 },
    { id: 'foe.gallows-lord', attack: 18, defence: 14, speed: 9, hits: 9 },
  ],
};
