// The balance runner's delve mode (tools/balance/README.md "Delves"; gate 1 spec "Balance").
import { describe, expect, it } from 'vitest';
import { gate1Content } from '@adventure-manager/content';
import { playDelve } from '../balance/delve-player.ts';
import { applyOverrides, parseOverride } from '../balance/overrides.ts';

describe('balance delves', () => {
  it('plays a whole barrow delve to an outcome, the same way twice from one seed', () => {
    for (const policy of ['careful', 'auto'] as const) {
      const a = playDelve('delve-0', policy);
      expect(['won', 'retreated', 'routed']).toContain(a.outcome);
      expect(a.rounds.length).toBeGreaterThan(0);
      expect(a.stalled).toBe(0);
      expect(playDelve('delve-0', policy)).toEqual(a);
    }
  });

  it('reaches a record keyed by ids with [id], and the delve plays the override', () => {
    const content = applyOverrides(gate1Content, [
      parseOverride('delve.foes[foe.restless-warden].health=1'),
    ]);
    expect(content.delve?.foes['foe.restless-warden']?.health).toBe(1);
    expect(gate1Content.delve?.foes['foe.restless-warden']?.health).toBe(34);
  });
});
