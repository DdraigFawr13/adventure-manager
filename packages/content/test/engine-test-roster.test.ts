import { describe, expect, it } from 'vitest';
import { ATTRIBUTES, makeValue } from '@adventure-manager/engine';
import { engineTestLedgerText, engineTestRoster } from '@adventure-manager/content';

describe('engine-test roster (D-110)', () => {
  it('has 30 rows whose totals equal base plus parts (D-078 breakdowns read, never rebuild)', () => {
    expect(engineTestRoster).toHaveLength(30);
    for (const row of engineTestRoster) {
      for (const value of [
        row.morale,
        row.wagePennies,
        ...ATTRIBUTES.map((a) => row.attributes[a]),
      ]) {
        expect(makeValue(value.base, value.causeId, value.parts).total).toBe(value.total);
      }
    }
  });

  it('names every source, ancestry, class and condition it uses', () => {
    const t = engineTestLedgerText;
    for (const row of engineTestRoster) {
      expect(t.ancestries).toHaveProperty([row.ancestryId]);
      expect(t.classes).toHaveProperty([row.classId]);
      expect(t.conditions).toHaveProperty([row.condition]);
      const values = [row.morale, row.wagePennies, ...ATTRIBUTES.map((a) => row.attributes[a])];
      for (const part of values.flatMap((v) => v.parts))
        expect(t.sources).toHaveProperty([part.sourceId]);
    }
  });
});
