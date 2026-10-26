// From Story-Generator src/engine/core/rng.ts @ 8a5c4ef (D-116); constructor parameter properties written out (erasableSyntaxOnly).
// Named deterministic RNG streams (R-03). A stream's starting state is derived
// from (seed, name), so adding a new stream never reshuffles existing ones.
// Use one stream per system, e.g. 'worldgen.height', 'site.social'.
//
// Generator: sfc32 (Chris Doty-Humphrey's Small Fast Counting generator), 128 bits
// of state per stream. It passes PractRand and BigCrush, uses only 32-bit integer
// operations (identical in every JS engine), and its counter guarantees a period
// of at least 2^32 for any seed.

/** Four unsigned 32-bit words: sfc32's a, b, c and counter d. */
export type RngState = [number, number, number, number];

const UINT32_RANGE = 0x1_0000_0000;
/** Outputs discarded after seeding so similar seeds diverge before first use. */
const WARM_UP = 12;

/** FNV-1a 32-bit. Used for cheap digests and template variant choice. */
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  }
  return hash;
}

/** cyrb128: four independent 32-bit hashes of one string, used to seed sfc32. */
function hash128(text: string): RngState {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < text.length; i += 1) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** Advances `state` in place and returns the next unsigned 32-bit output. */
export function nextUint32(state: RngState): number {
  let [a, b, c, d] = state;
  const t = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) | 0;
  state[0] = a >>> 0;
  state[1] = b >>> 0;
  state[2] = c >>> 0;
  state[3] = d >>> 0;
  return t >>> 0;
}

export function deriveStreamState(seed: string, name: string): RngState {
  const state = hash128(`${seed}:${name}`);
  for (let i = 0; i < WARM_UP; i += 1) nextUint32(state);
  return state;
}

export class RngStream {
  private readonly states: Record<string, RngState>;
  private readonly name: string;

  constructor(states: Record<string, RngState>, name: string) {
    this.states = states;
    this.name = name;
    if (!states[name]) throw new Error(`RNG stream "${name}" has no state.`);
  }

  /** A standalone stream outside any world, e.g. for previews that must not change history. */
  static detached(seed: string, name: string): RngStream {
    return new RngStream({ [name]: deriveStreamState(seed, name) }, name);
  }

  private next(): number {
    return nextUint32(this.states[this.name]!);
  }

  /** Uniform integer in [0, range). Rejection sampling avoids modulo bias. */
  int(range: number): number {
    if (!Number.isInteger(range) || range < 1 || range > UINT32_RANGE) {
      throw new Error(`Invalid range ${range}.`);
    }
    const limit = Math.floor(UINT32_RANGE / range) * range;
    for (;;) {
      const value = this.next();
      if (value < limit) return value % range;
    }
  }

  /** Uniform integer in [min, max], inclusive. */
  between(min: number, max: number): number {
    return min + this.int(max - min + 1);
  }

  /** True with probability p (0–1), at one-in-a-million resolution. */
  chance(p: number): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.int(1_000_000) < Math.floor(p * 1_000_000);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Cannot pick from an empty list.');
    return items[this.int(items.length)]!;
  }

  /** Picks a key by integer-ish weight. Iterates in the given order (keep it stable). */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
    if (total <= 0) throw new Error('Weighted pick needs a positive total weight.');
    let roll = this.int(Math.ceil(total));
    for (const [item, weight] of entries) {
      roll -= Math.max(0, weight);
      if (roll < 0) return item;
    }
    return entries[entries.length - 1]![0];
  }
}

/** Returns the named stream for a world, creating its state from the seed on first use. */
export function streamFor(
  owner: { seed: string; rng: Record<string, RngState> },
  name: string,
): RngStream {
  if (owner.rng[name] === undefined) owner.rng[name] = deriveStreamState(owner.seed, name);
  return new RngStream(owner.rng, name);
}
