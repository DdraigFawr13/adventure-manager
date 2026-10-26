import { describe, expect, it } from 'vitest';
import { makeValue, withPart, withoutPart } from '../src/index.ts';

describe('values explain themselves (PLAN §11h)', () => {
  it('totals base and parts and keeps the cause of the last change', () => {
    let v = makeValue(10, 'cmd.recruit');
    v = withPart(v, { sourceId: 'item.sword', amount: 2 }, 'cmd.equip');
    v = withPart(v, { sourceId: 'wound.arm', amount: -3 }, 'event.wound');
    expect(v.total).toBe(9);
    expect(v.causeId).toBe('event.wound');
    expect(v.parts.map((p) => p.sourceId)).toEqual(['item.sword', 'wound.arm']);
  });

  it('replaces a part from the same source instead of stacking it', () => {
    let v = makeValue(5, 'c1');
    v = withPart(v, { sourceId: 'trait.brave', amount: 1 }, 'c2');
    v = withPart(v, { sourceId: 'trait.brave', amount: 2 }, 'c3');
    expect(v.total).toBe(7);
    expect(withoutPart(v, 'trait.brave', 'c4').total).toBe(5);
  });

  it('rejects fractions (integers only, PLAN §11c)', () => {
    expect(() => makeValue(1.5, 'c1')).toThrow();
    expect(() => withPart(makeValue(1, 'c1'), { sourceId: 'x', amount: 0.1 }, 'c2')).toThrow();
  });
});
