// Money is whole copper coins in game state (PLAN §11c, D-135); players read it as gold, silver
// and copper. The rates come from content, so the split lives here and the ui only joins words.

export interface CoinRates {
  /** Copper in one silver. */
  readonly copperPerSilver: number;
  /** Silver in one gold. */
  readonly silverPerGold: number;
}

export interface Coins {
  readonly negative: boolean;
  readonly gold: number;
  readonly silver: number;
  readonly copper: number;
}

/** Splits a copper amount into gold, silver and copper; the sign is kept apart. */
export function splitCoins(copper: number, rates: CoinRates): Coins {
  if (!Number.isSafeInteger(copper)) throw new Error(`Money must be whole copper: ${copper}.`);
  const negative = copper < 0;
  const left = Math.abs(copper);
  const perGold = rates.copperPerSilver * rates.silverPerGold;
  return {
    negative,
    gold: Math.floor(left / perGold),
    silver: Math.floor((left % perGold) / rates.copperPerSilver),
    copper: left % rates.copperPerSilver,
  };
}
