import { describe, expect, it } from 'vitest';
import { baseGuildRules, baseResolution } from '@adventure-manager/content';

describe('guild year content (guild SPEC.md)', () => {
  it('keeps every journey at least a day long, so a party always arrives before it comes home', () => {
    for (const d of baseGuildRules.dangers) expect(d.travelDays).toBeGreaterThanOrEqual(1);
  });

  it('keeps the guild party size inside the resolution rules, so a party sent out can always fight', () => {
    const { min, max } = baseResolution.rules.partySize;
    expect(baseGuildRules.partySize.min).toBeGreaterThanOrEqual(min);
    expect(baseGuildRules.partySize.max).toBeLessThanOrEqual(max);
  });

  it('has a quest template for every danger the board can post', () => {
    for (const d of baseGuildRules.dangers) {
      expect(baseResolution.quests.some((q) => q.danger === d.danger)).toBe(true);
    }
  });
});
