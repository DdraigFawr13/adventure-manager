import { describe, expect, it } from 'vitest';
import { baseResolution } from '@adventure-manager/content';
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
});
