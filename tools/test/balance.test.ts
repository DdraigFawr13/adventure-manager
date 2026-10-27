import { describe, expect, it } from 'vitest';
import { baseIncidentRules, houseIncidentGuildRules } from '@adventure-manager/content';
import { contentFor, type Career } from '../career-play.ts';
import { hashCareer } from '../balance/baseline.ts';
import { applyOverrides, parseOverride } from '../balance/overrides.ts';
import { verdict } from '../balance/report.ts';
import { estimate, paired, resamples } from '../balance/stats.ts';

describe('balance overrides (tools/balance/README.md)', () => {
  it('reads numbers, flags and words from path=value', () => {
    expect(parseOverride('a.b=12')).toEqual({ path: 'a.b', value: 12 });
    expect(parseOverride('a=false')).toEqual({ path: 'a', value: false });
    expect(parseOverride('a=room.forge')).toEqual({ path: 'a', value: 'room.forge' });
    expect(() => parseOverride('a.b')).toThrow(/path=value/);
  });

  it('changes a copy, picking list entries by [id] or by index, and leaves the content alone', () => {
    const before = structuredClone(houseIncidentGuildRules);
    const out = applyOverrides(houseIncidentGuildRules, [
      parseOverride('house.incidents.kinds[incident.fire].weeklyBp=60'),
      parseOverride('house.incidents.levelBp.0=9000'),
    ]);
    expect(out.house?.incidents?.kinds[0]?.weeklyBp).toBe(60);
    expect(out.house?.incidents?.levelBp[0]).toBe(9000);
    expect(houseIncidentGuildRules).toEqual(before);
    expect(baseIncidentRules.kinds[0]?.weeklyBp).toBe(30);
  });

  it('refuses a path the content does not have, and a value of another type', () => {
    const rules = houseIncidentGuildRules;
    expect(() => applyOverrides(rules, [parseOverride('house.nope=1')])).toThrow(
      /does not name a value/,
    );
    expect(() =>
      applyOverrides(rules, [parseOverride('house.incidents.kinds[incident.flood].weeklyBp=1')]),
    ).toThrow(/no entry with id incident.flood/);
    expect(() =>
      applyOverrides(rules, [parseOverride('house.incidents.innFeeCopper=cheap')]),
    ).toThrow(/is a number/);
  });

  it('reaches a career setup: the content a career plays carries the override', () => {
    const setup = {
      maxYears: 1,
      staffMode: 'off',
      size: 7,
      refuseGrants: false,
      houseMode: 'on',
      incidentsMode: 'on',
    } as const;
    const plain = contentFor(setup);
    const changed = contentFor({
      ...setup,
      overrides: [parseOverride('guild.house.incidents.innFeeCopper=90')],
    });
    expect(plain.guild.house?.incidents?.innFeeCopper).toBe(60);
    expect(changed.guild.house?.incidents?.innFeeCopper).toBe(90);
    expect(contentFor(setup)).toBe(plain);
  });
});

describe('balance intervals', () => {
  const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
  const values = Array.from({ length: 50 }, (_, i) => (i * 37) % 11);

  it('draws the same resamples for the same number of seeds', () => {
    expect(resamples(50, 20)).toEqual(resamples(50, 20));
  });

  it('puts the estimate inside its interval', () => {
    const e = estimate(values, mean, resamples(50));
    expect(e.low).toBeLessThanOrEqual(e.value);
    expect(e.high).toBeGreaterThanOrEqual(e.value);
    expect(e.high - e.low).toBeGreaterThan(0);
  });

  it('pairs by seed: a constant shift has an interval of exactly that shift', () => {
    const shifted = values.map((v) => v + 2);
    const { now, change: d } = paired(values, shifted, mean, resamples(50));
    expect([d.value, d.low, d.high]).toEqual([2, 2, 2]);
    expect(now.value).toBe(mean(shifted));
    expect(() => paired(values, shifted.slice(1), mean, resamples(50))).toThrow(/same seeds/);
  });

  it('calls a target ok inside the band, near when the interval reaches it, OFF otherwise', () => {
    const t = { min: 1.5, max: 2.5, source: 'test' };
    expect(verdict({ value: 2, low: 1.8, high: 2.2 }, t)).toBe('ok');
    expect(verdict({ value: 2.7, low: 2.4, high: 3 }, t)).toBe('near');
    expect(verdict({ value: 3, low: 2.8, high: 3.2 }, t)).toBe('OFF');
    expect(verdict({ value: 3, low: 2.8, high: 3.2 }, undefined)).toBe('');
  });

  it('hashes a career without its runtime', () => {
    // cast-ok: only the fields the hash reads matter here.
    const career = { years: 3, end: 'cap', seconds: 1.5 } as unknown as Career;
    expect(hashCareer({ ...career, seconds: 9 })).toBe(hashCareer(career));
    expect(hashCareer({ ...career, years: 4 })).not.toBe(hashCareer(career));
  });
});
