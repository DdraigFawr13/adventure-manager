// Template text, first slice of the grammar (D-114): `{name}` slots and deterministic variants.
// Plurals, pronouns and conditional lines come with the writing test (R8).
import { hashString } from './rng.ts';

/** Fills `{name}` slots; an unknown slot stays visible as `{name}` so a gap is easy to spot. */
export function fillTemplate(template: string, vars: Readonly<Record<string, string>>): string {
  return template.replace(/\{([a-z][a-zA-Z]*)\}/g, (slot, key: string) =>
    Object.hasOwn(vars, key) ? (vars[key] ?? slot) : slot,
  );
}

/** Picks a variant by a stable key (such as an event id), so a replay reads the same. */
export function pickVariant(variants: readonly string[], key: string): string {
  if (variants.length === 0) throw new Error('A template needs at least one variant.');
  // The index is within bounds because of the modulo.
  return variants[hashString(key) % variants.length]!;
}
