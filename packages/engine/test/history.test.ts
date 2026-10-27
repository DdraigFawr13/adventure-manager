import { describe, expect, it } from 'vitest';
import {
  historyOf,
  writeMemorial,
  type Adventurer,
  type HistoryEntry,
  type MemorialText,
  type ReportText,
} from '../src/index.ts';
import { adventurer, ofType } from './fixture.ts';
import { foundedGuild, playDays } from './guild-fixture.ts';

describe('histories (report SPEC.md, R7)', () => {
  it('records joining, every contract, injuries and deaths from the events', () => {
    const run = playDays(foundedGuild(6, {}, 'history-seed'), 200);
    const histories = historyOf(run.events, run.state.roster, run.state.content);
    for (const member of run.state.roster)
      expect(histories.get(member.id)?.[0]?.kind, member.id).toBe('joined');
    // One quest entry per member per party that reached its site.
    const started = ofType(run.events, 'quest.started');
    const quests = [...histories.values()].flat().filter((e) => e.kind === 'quest');
    expect(quests.length).toBe(started.reduce((n, e) => n + e.subjectIds.length - 1, 0));
    const deaths = ofType(run.events, 'adventurer.died').map((e) => e.subjectIds[0]);
    const died = [...histories]
      .filter(([, l]) => l.some((e) => e.kind === 'died'))
      .map(([id]) => id);
    expect(died.sort()).toEqual([...deaths].sort());
    const laidUp = ofType(run.events, 'member.laid-up').length;
    expect([...histories.values()].flat().filter((e) => e.kind === 'injured').length).toBe(laidUp);
    expect(deaths.length + laidUp).toBeGreaterThan(0);
  });
});

// A text whose sections each print one fact when it holds, so the facts can be read back.
const FACTS = [
  'writer',
  'clerk',
  'together',
  'close',
  'first-is-last',
  'saved-writer',
  'quests.one',
  'quests.few',
  'quests.many',
  'deed.saved',
  'deed.guard',
  'deed.striker',
  'deed.none',
  'young',
  'veteran',
  'struck',
];
const text: MemorialText = {
  clerk: 'The Clerk',
  deeds: ['saved', 'guard', 'striker', 'mend'],
  sections: [...FACTS.map((f) => ({ family: `f.${f}` })), { family: 'by' }],
  library: {
    ...Object.fromEntries(FACTS.map((f) => [`f.${f}`, [{ text: f, if: [f] }]])),
    by: ['by {writer}'],
  },
};
const report: ReportText = {
  sections: [],
  deeds: [],
  library: {},
  pronouns: {
    they: {
      they: 'they',
      them: 'them',
      their: 'their',
      theirs: 'theirs',
      themself: 'themself',
      plural: true,
    },
    she: {
      they: 'she',
      them: 'her',
      their: 'her',
      theirs: 'hers',
      themself: 'herself',
      plural: false,
    },
    he: {
      they: 'he',
      them: 'him',
      their: 'his',
      theirs: 'his',
      themself: 'himself',
      plural: false,
    },
  },
};
const quest = (
  day: number,
  partyIds: string[],
  extra: Partial<Extract<HistoryEntry, { kind: 'quest' }>> = {},
): HistoryEntry => ({
  kind: 'quest',
  day,
  questId: `q${day}`,
  templateId: 'quest.test-barrow',
  outcome: 'won',
  partyIds,
  hits: 0,
  actions: {},
  saved: [],
  savedBy: null,
  worst: 0,
  foeId: null,
  ...extra,
});

function letter(
  entries: HistoryEntry[],
  gone: string[] = [],
  roster: Adventurer[] = [adventurer('dead')],
) {
  const last = entries.filter((e) => e.kind === 'quest').at(-1)!; // non-null: tests give a quest.
  const all: HistoryEntry[] = [
    { kind: 'joined', day: 1 },
    ...entries,
    {
      kind: 'died',
      day: last.day,
      questId: (last as { questId: string }).questId,
      templateId: 'quest.test-barrow',
      cause: 'foe',
      foeId: null,
    },
  ];
  const m = writeMemorial(
    'dead',
    new Map([['dead', all]]),
    roster,
    foundedGuild(1).state.content,
    text,
    report,
    {
      personOf: (id) => ({ name: id, pronouns: 'they' }),
      nameOf: (id) => id,
      seed: 's',
      goneIds: new Set(gone),
    },
  );
  return {
    writer: m.writerId,
    facts: m.lines.map((l) => l.text).filter((t) => !t.startsWith('By')),
    by: m.lines.at(-1)?.text,
  };
}

describe('memorial letters (report SPEC.md, R7)', () => {
  it('is written by the comrade who shared the most contracts, then the latest, else the clerk', () => {
    expect(
      letter([quest(10, ['dead', 'a']), quest(20, ['dead', 'b']), quest(30, ['dead', 'a'])]).writer,
    ).toBe('a');
    // A tie goes to the comrade of the most recent shared contract.
    expect(letter([quest(10, ['dead', 'a']), quest(20, ['dead', 'b'])]).writer).toBe('b');
    // The dead and the gone don't write; with nobody left, the clerk does.
    expect(letter([quest(10, ['dead', 'a']), quest(20, ['dead', 'a', 'b'])], ['a']).writer).toBe(
      'b',
    );
    const clerk = letter([quest(10, ['dead', 'a'])], ['a']);
    expect([clerk.writer, clerk.by]).toEqual([null, 'By The Clerk']);
    expect(clerk.facts).toContain('Clerk');
  });

  it('knows whether the writer was there, how close they were, and the best deed', () => {
    const one = letter([quest(10, ['dead', 'a'], { saved: ['a'] })]);
    expect(one.facts).toEqual([
      'Writer',
      'Together',
      'Close',
      'First-is-last',
      'Saved-writer',
      'Quests.one',
      'Deed.saved',
      'Struck',
    ]);
    // Not on the fatal contract, and shared only one of four: neither together nor close.
    const far = letter(
      [
        quest(10, ['dead', 'a'], { hits: 6 }),
        quest(20, ['dead', 'b']),
        quest(30, ['dead', 'c']),
        quest(40, ['dead', 'd']),
      ],
      ['b', 'c', 'd'],
    );
    expect(far.facts).toEqual(['Writer', 'Quests.few', 'Deed.striker', 'Struck']);
    // A guard counts before a striker; with no deed at all, deed.none.
    expect(
      letter([quest(10, ['dead', 'a'], { hits: 6, actions: { 'action.guard': 1 } })]).facts,
    ).toContain('Deed.guard');
    expect(letter([quest(10, ['dead', 'a'], { hits: 2 })]).facts).toContain('Deed.none');
    const many = Array.from({ length: 7 }, (_, n) => quest(10 + n, ['dead', 'a']));
    expect(letter(many).facts).toContain('Quests.many');
  });

  it('knows the young and the old', () => {
    const young = { ...adventurer('dead'), birthYear: 1 - 20 };
    const old = { ...adventurer('dead'), birthYear: 1 - 40 };
    expect(letter([quest(10, ['dead', 'a'])], [], [young]).facts).toContain('Young');
    expect(letter([quest(10, ['dead', 'a'])], [], [old]).facts).toContain('Veteran');
  });
});
