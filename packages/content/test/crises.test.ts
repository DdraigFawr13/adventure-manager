import { describe, expect, it } from 'vitest';
import { composeQuest, fits } from '@adventure-manager/engine';
import { baseContracts, baseCrisisRules } from '../src/index.ts';

describe('base crises (D-147)', () => {
  it('composes every step from sites and monster kinds that fit its danger', () => {
    for (const chain of baseCrisisRules.chains)
      for (const step of chain.steps) {
        const site = baseContracts.sites.find((s) => s.id === step.siteId);
        const monster = baseContracts.monsters.find((m) => m.id === step.monsterId);
        expect(
          site && monster && fits(site, monster, step.danger),
          `${chain.id} ${step.siteId}`,
        ).toBe(true);
        const quest = composeQuest(baseContracts, { ...step, twistId: null });
        expect(quest.foes.length).toBeGreaterThan(0);
      }
  });
});
