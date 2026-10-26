import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { engineTestMapText } from '@adventure-manager/content';
import base from '../assets/engine-test/map-base.json' with { type: 'json' };

// The map falls back to showing a key when its text is missing; this test makes sure it never has to.
const dir = new URL('../src/engine-test/map/', import.meta.url);
const source = readdirSync(dir)
  .map((f) => readFileSync(new URL(f, dir), 'utf8'))
  .join('\n');

describe('kingdom-map words (no raw keys on the map)', () => {
  it('has every fixed key the map code names', () => {
    const fixed = [...source.matchAll(/(?:say\('|nameKey: ')([\w.-]+)'/g)].map((m) => m[1]!);
    expect(fixed.length).toBeGreaterThan(10);
    for (const key of fixed) expect(engineTestMapText).toHaveProperty([key]);
  });

  it('names every settlement, village, area and layer in the baked base', () => {
    const keys = [
      ...base.placeCells.map((_, k) => `place.${k}`),
      ...base.villageCells.map((_, k) => `village.${k}`),
      ...base.areas.map((a) => `area.${a.id}`),
      ...['names', 'guilds', 'factions', 'threat', 'party', 'fog'].map((l) => `layer.${l}`),
    ];
    for (const key of keys) expect(engineTestMapText).toHaveProperty([key]);
  });
});
