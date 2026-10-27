// Crises v0 (packages/engine/src/crisis/SPEC.md, D-112, D-147). The one chain and every number are
// ASSUMPTIONS for the §9d late-goals run (tools/career-sim.ts); none is settled.
//
// - From year 5, a 25% chance at each Assembly that a crisis wakes (so about 96% of careers that
//   reach year 15 have seen it).
// - The Wendle troll wakes: wolves driven out of Blackthorn Wood (hazardous), the troll on the
//   Ashford road (perilous), its lair in the Wendle mine (deadly). Each step pays 150% of its
//   danger's fee.
// - Ending it: 15 renown and 15 patron confidence. While it stands: 300 copper a week (upkeep is
//   500) and 10 confidence at each patron review.
import type { CrisisRules } from '@adventure-manager/engine';

export const baseCrisisRules: CrisisRules = {
  fromYear: 5,
  startBp: 2500,
  chains: [
    {
      id: 'crisis.wendle-troll',
      steps: [
        {
          siteId: 'site.blackthorn-wood',
          monsterId: 'monster.wolves',
          danger: 'hazardous',
          feeBp: 15_000,
        },
        {
          siteId: 'site.ashford-bridge',
          monsterId: 'monster.trolls',
          danger: 'perilous',
          feeBp: 15_000,
        },
        {
          siteId: 'site.wendle-mine',
          monsterId: 'monster.trolls',
          danger: 'deadly',
          feeBp: 15_000,
        },
      ],
      reward: { renown: 15, confidence: 15 },
      pressure: { weeklyCopper: 300, confidencePerReview: 10 },
    },
  ],
};
