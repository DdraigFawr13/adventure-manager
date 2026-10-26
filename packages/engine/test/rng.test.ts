import { describe, expect, it } from 'vitest';
import { RngStream, streamFor, type RngState } from '../src/index.ts';

function owner(seed: string): { seed: string; rng: Record<string, RngState> } {
  return { seed, rng: {} };
}

function draws(stream: RngStream, n: number): number[] {
  return Array.from({ length: n }, () => stream.int(1000));
}

describe('named random streams (PLAN §11h)', () => {
  it('gives the same draws for the same seed and name (determinism, GAME-06)', () => {
    expect(draws(RngStream.detached('s1', 'quest.combat'), 20)).toEqual(
      draws(RngStream.detached('s1', 'quest.combat'), 20),
    );
  });

  it('keeps a stream unchanged when another stream is added or used', () => {
    const a = owner('s1');
    const b = owner('s1');
    draws(streamFor(b, 'recruit.traits'), 50);
    expect(draws(streamFor(a, 'quest.combat'), 20)).toEqual(
      draws(streamFor(b, 'quest.combat'), 20),
    );
  });

  it('stores the stream position in the owner, so a copied state continues identically', () => {
    const state = owner('s2');
    draws(streamFor(state, 'quest.combat'), 7);
    const copy = { seed: state.seed, rng: structuredClone(state.rng) };
    expect(draws(streamFor(state, 'quest.combat'), 10)).toEqual(
      draws(streamFor(copy, 'quest.combat'), 10),
    );
  });

  it('does not depend on the order streams are first used', () => {
    const a = owner('s5');
    const b = owner('s5');
    streamFor(a, 'quest.combat');
    streamFor(a, 'recruit.traits');
    streamFor(b, 'recruit.traits');
    streamFor(b, 'quest.combat');
    expect(a.rng).toEqual(b.rng);
  });

  it('keeps (seed, name) pairs apart even when they share a joined string', () => {
    expect(draws(RngStream.detached('a:b', 'c'), 10)).not.toEqual(
      draws(RngStream.detached('a', 'b:c'), 10),
    );
  });

  it('does not mistake inherited properties for streams', () => {
    const state = owner('s6');
    expect(draws(streamFor(state, 'constructor'), 3)).toHaveLength(3);
    expect(() => new RngStream({}, 'toString')).toThrow();
  });

  it('takes chances in whole basis points', () => {
    const stream = RngStream.detached('s3', 'test');
    expect(stream.chance(0)).toBe(false);
    expect(stream.chance(10_000)).toBe(true);
    expect(() => stream.chance(0.5)).toThrow();
    let hits = 0;
    for (let i = 0; i < 10_000; i += 1) if (stream.chance(2_500)) hits += 1;
    expect(hits).toBeGreaterThan(2_300);
    expect(hits).toBeLessThan(2_700);
  });

  it('rejects fractional weights', () => {
    expect(() => RngStream.detached('s4', 'test').weighted([['a', 1.5]])).toThrow();
    expect(
      RngStream.detached('s4', 'test').weighted([
        ['a', 0],
        ['b', 3],
      ]),
    ).toBe('b');
  });
});
