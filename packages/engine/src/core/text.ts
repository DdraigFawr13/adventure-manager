// Template text grammar (D-114): slots, pronouns, plurals, nested fragments and conditional
// lines, with deterministic picks so a replay reads the same. Words live in content; this file
// holds no English. Grammar, by example:
//   {quest}              a text or number slot
//   {actor.they}         a pronoun form of a person slot (forms come from content); {actor.They} capitalised
//   {actor~holds|hold}   singular or plural form: by the person's pronoun, or by a number (1 is singular)
//   {@road}              a variant of another family, picked by the same key
// A variant is a string, or { text, if, unless } where `if` facts must all hold and `unless`
// facts must all be absent; a family with no variant left renders nothing (a conditional line).
import { hashString } from './rng.ts';

/** Fills `{name}` slots; an unknown slot stays visible as `{name}` so a gap is easy to spot. */
export function fillTemplate(template: string, vars: Readonly<Record<string, string>>): string {
  return template.replace(/\{([a-z][a-zA-Z]*)\}/g, (slot, key: string) =>
    Object.hasOwn(vars, key) ? (vars[key] ?? slot) : slot,
  );
}

/** Picks a variant by a stable key (such as an event id), so a replay reads the same. */
export function pickVariant<T>(variants: readonly T[], key: string): T {
  if (variants.length === 0) throw new Error('A template needs at least one variant.');
  // The index is within bounds because of the modulo.
  return variants[mix(hashString(key)) % variants.length]!;
}

/**
 * Murmur3's finaliser. FNV-1a's low bits barely depend on the high bits of the input, so keys
 * that share a suffix ("…/dd.lead") picked the same variants far more often than chance.
 */
function mix(hash: number): number {
  let h = hash;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export type PronounKey = 'she' | 'he' | 'they';

/** One pronoun set's forms, keyed by the "they" form names; `plural` picks verb agreement. */
export interface PronounForms {
  readonly they: string;
  readonly them: string;
  readonly their: string;
  readonly theirs: string;
  readonly themself: string;
  readonly plural: boolean;
}

export interface PersonSlot {
  readonly name: string;
  readonly pronouns: PronounKey;
}

export type SlotValue = string | number | PersonSlot;

export type Variant =
  | string
  | { readonly text: string; readonly if?: readonly string[]; readonly unless?: readonly string[] };

export type TemplateLibrary = Readonly<Record<string, readonly Variant[]>>;

export interface TextContext {
  readonly library: TemplateLibrary;
  readonly pronouns: Readonly<Record<PronounKey, PronounForms>>;
  readonly vars: Readonly<Record<string, SlotValue>>;
  readonly facts: ReadonlySet<string>;
  /** Writes slot names (‹quest›) instead of names and numbers, so repeated sentences can be counted. */
  readonly mask?: boolean;
}

const FORMS = ['they', 'them', 'their', 'theirs', 'themself'] as const;
const MAX_DEPTH = 6;

function textOf(variant: Variant): string {
  return typeof variant === 'string' ? variant : variant.text;
}

function allowed(variant: Variant, facts: ReadonlySet<string>): boolean {
  if (typeof variant === 'string') return true;
  return (
    (variant.if ?? []).every((f) => facts.has(f)) &&
    (variant.unless ?? []).every((f) => !facts.has(f))
  );
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The variants of a family that the facts allow, in content order. */
export function allowedVariants(ctx: TextContext, family: string): Variant[] {
  const variants = ctx.library[family];
  if (!variants) throw new Error(`No template family ${family}.`);
  return variants.filter((v) => allowed(v, ctx.facts));
}

/** Renders one variant of `family` picked by `key`; empty when no variant's conditions hold. */
export function renderFamily(ctx: TextContext, family: string, key: string, depth = 0): string {
  if (depth > MAX_DEPTH) throw new Error(`Template ${family} nests too deep.`);
  const variants = allowedVariants(ctx, family);
  if (variants.length === 0) return '';
  return renderText(ctx, textOf(pickVariant(variants, `${key}/${family}`)), key, depth);
}

/** Fills every slot of one template string (see the grammar at the top of this file). */
export function renderText(ctx: TextContext, template: string, key: string, depth = 0): string {
  return template.replace(/\{([^{}]+)\}/g, (slot, body: string) => {
    if (body.startsWith('@')) return renderFamily(ctx, body.slice(1), key, depth + 1);
    const agree = /^([a-z][a-zA-Z]*)~([^|]*)\|(.*)$/.exec(body);
    if (agree) {
      const [, name = '', singular = '', plural = ''] = agree;
      return isPlural(ctx, name, slot) ? plural : singular;
    }
    const [name = '', form, ...rest] = body.split('.');
    if (rest.length > 0 || !Object.hasOwn(ctx.vars, name)) return slot;
    const value = ctx.vars[name];
    if (value === undefined) return slot;
    if (form === undefined) {
      if (ctx.mask) return `‹${name}›`;
      return typeof value === 'object' ? value.name : String(value);
    }
    if (typeof value !== 'object') return slot;
    const lower = form.toLowerCase();
    const known = FORMS.find((f) => f === lower);
    if (!known) return slot;
    const word = ctx.pronouns[value.pronouns][known];
    return form === lower ? word : capitalise(word);
  });
}

function isPlural(ctx: TextContext, name: string, slot: string): boolean {
  const value = ctx.vars[name];
  if (value === undefined) throw new Error(`Agreement slot ${slot} has no value.`);
  if (typeof value === 'number') return value !== 1;
  if (typeof value === 'string')
    throw new Error(`Agreement slot ${slot} needs a person or number.`);
  return ctx.pronouns[value.pronouns].plural;
}

/** Every `{...}` slot body a template uses, for validation and previews. */
export function slotsOf(template: string): string[] {
  return [...template.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1] ?? '');
}
