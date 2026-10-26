import { describe, expect, it } from 'vitest';
import {
  fillTemplate,
  pickVariant,
  renderFamily,
  renderText,
  type PronounForms,
  type PronounKey,
  type TextContext,
} from '../src/index.ts';

const pronouns: Record<PronounKey, PronounForms> = {
  she: {
    they: 'she',
    them: 'her',
    their: 'her',
    theirs: 'hers',
    themself: 'herself',
    plural: false,
  },
  he: { they: 'he', them: 'him', their: 'his', theirs: 'his', themself: 'himself', plural: false },
  they: {
    they: 'they',
    them: 'them',
    their: 'their',
    theirs: 'theirs',
    themself: 'themself',
    plural: true,
  },
};

function ctx(overrides: Partial<TextContext> = {}): TextContext {
  return {
    library: {},
    pronouns,
    vars: {
      wenna: { name: 'Wenna', pronouns: 'she' },
      ash: { name: 'Ash', pronouns: 'they' },
      blows: 3,
      one: 1,
      quest: 'the Hollow Barrow',
    },
    facts: new Set(),
    ...overrides,
  };
}

describe('template text (D-114)', () => {
  it('fills known slots and leaves unknown ones visible', () => {
    expect(fillTemplate('{actor} strikes {foe}{x}.', { actor: 'Odric', foe: 'the hounds' })).toBe(
      'Odric strikes the hounds{x}.',
    );
    expect(renderText(ctx(), '{wenna} at {quest}{nobody}{wenna.thee}.', 'k')).toBe(
      'Wenna at the Hollow Barrow{nobody}{wenna.thee}.',
    );
  });

  it('picks the same variant for the same key', () => {
    const variants = ['a', 'b', 'c'];
    expect(pickVariant(variants, 'e12')).toBe(pickVariant(variants, 'e12'));
    expect(() => pickVariant([], 'e1')).toThrow(/variant/);
  });

  it('spreads picks evenly when keys share a suffix', () => {
    // FNV-1a alone sent most of these to the same few variants (fixed by the finaliser).
    const counts = new Map<string, number>();
    for (let n = 0; n < 800; n += 1) {
      const v = pickVariant(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], `quest.${n}/4/0/dd.lead`);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    expect(counts.size).toBe(8);
    for (const n of counts.values()) expect(n).toBeGreaterThan(60);
  });

  it('writes pronoun forms, capitalised on request', () => {
    expect(
      renderText(
        ctx(),
        '{wenna.They} lost {wenna.their} sword; {ash.they} found {ash.themself}.',
        'k',
      ),
    ).toBe('She lost her sword; they found themself.');
  });

  it('agrees verbs with a person or a number', () => {
    const t =
      '{wenna.they} {wenna~holds|hold}, {ash.they} {ash~holds|hold}: {blows} {blows~blow|blows}, {one} {one~blow|blows}.';
    expect(renderText(ctx(), t, 'k')).toBe('she holds, they hold: 3 blows, 1 blow.');
    expect(() => renderText(ctx(), '{quest~is|are}', 'k')).toThrow(/person or number/);
  });

  it('nests families and keeps only the variants whose facts hold (conditional lines)', () => {
    const library = {
      line: [
        { text: '{@greet} {wenna}.', if: ['won'] },
        { text: 'Bad news.', unless: ['won'] },
      ],
      greet: ['Well done', 'Bravo'],
      empty: [{ text: 'never', if: ['nothing'] }],
    };
    const won = renderFamily(ctx({ library, facts: new Set(['won']) }), 'line', 'k');
    expect(['Well done Wenna.', 'Bravo Wenna.']).toContain(won);
    expect(renderFamily(ctx({ library }), 'line', 'k')).toBe('Bad news.');
    expect(renderFamily(ctx({ library }), 'empty', 'k')).toBe('');
    expect(() => renderFamily(ctx({ library }), 'missing', 'k')).toThrow(/No template family/);
    const loop = { a: ['{@a}'] };
    expect(() => renderFamily(ctx({ library: loop }), 'a', 'k')).toThrow(/too deep/);
  });

  it('masks names and numbers with their slot names, keeping agreement', () => {
    expect(
      renderText(
        ctx({ mask: true }),
        '{wenna} struck {blows} {blows~blow|blows}; {wenna.they} won.',
        'k',
      ),
    ).toBe('‹wenna› struck ‹blows› blows; she won.');
  });
});
