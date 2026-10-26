import { describe, expect, it } from 'vitest';
import { splitCoins } from '../src/index.ts';

describe('money (D-135)', () => {
  it('splits whole copper into gold, silver and copper at the content rates', () => {
    const rates = { copperPerSilver: 10, silverPerGold: 10 };
    expect(splitCoins(1234, rates)).toEqual({ negative: false, gold: 12, silver: 3, copper: 4 });
    expect(splitCoins(-56, rates)).toEqual({ negative: true, gold: 0, silver: 5, copper: 6 });
    expect(() => splitCoins(1.5, rates)).toThrow();
  });
});
