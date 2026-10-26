import { describe, expect, it } from 'vitest';
import { baseResolution } from '@adventure-manager/content';
import { narrate } from '../src/narrate.ts';
import { RETREATS_FOR_TEST, narrateAll } from './support.ts';

describe('log narration (D-127)', () => {
  it('turns every event of every quest into finished English, with no raw keys or empty slots', () => {
    const problems: string[] = [];
    for (const quest of baseResolution.quests) {
      for (const retreat of RETREATS_FOR_TEST) {
        for (let seed = 0; seed < 15; seed += 1) {
          for (const line of narrateAll(quest.id, retreat, `n${seed}`)) {
            if (
              /[{}]/.test(line) ||
              /^[a-z]+(\.[a-z-]+)+$/.test(line) ||
              /\b[a-z]+\.[a-z-]+\b/.test(line)
            )
              problems.push(line);
          }
        }
      }
    }
    expect([...new Set(problems)]).toEqual([]);
  });

  it('names every class action in its log line (D-132)', () => {
    const ids = Object.values(baseResolution.rules.classes).flatMap((c) =>
      c.actions.map((a) => a.id),
    );
    expect(ids.length).toBeGreaterThan(0);
    for (const actionId of ids) {
      const line = narrate({
        type: 'action.used',
        id: 'e1',
        day: 1,
        causeId: 'c0',
        subjectIds: ['a1', 'a2'],
        actionId,
      });
      expect(line?.label).toBeTruthy();
      expect(line?.label).not.toMatch(/^action\./);
    }
  });
});
