import { describe, expect, it } from 'vitest';
import { fillTemplate, pickVariant } from '../src/index.ts';

describe('template text (D-114, first slice)', () => {
  it('fills known slots and leaves unknown ones visible', () => {
    expect(fillTemplate('{actor} strikes {foe}{x}.', { actor: 'Odric', foe: 'the hounds' })).toBe(
      'Odric strikes the hounds{x}.',
    );
  });

  it('picks the same variant for the same key', () => {
    const variants = ['a', 'b', 'c'];
    expect(pickVariant(variants, 'e12')).toBe(pickVariant(variants, 'e12'));
    expect(() => pickVariant([], 'e1')).toThrow(/variant/);
  });
});
