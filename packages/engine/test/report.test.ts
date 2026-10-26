import { describe, expect, it } from 'vitest';
import {
  summariseQuest,
  writeQuestReport,
  type PersonSlot,
  type QuestSummary,
  type ReportText,
} from '../src/index.ts';
import { adventurer, game, quest, run } from './fixture.ts';

const pronouns = {
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
} as const;

const text: ReportText = {
  pronouns,
  sections: [
    { family: 'hello', formula: true },
    { family: 'open' },
    { list: 'deeds', max: 1 },
    { list: 'deaths' },
    { list: 'injuries' },
    { family: 'bye', formula: true },
  ],
  deeds: [{ kind: 'striker', family: 'striker', min: 1 }],
  library: {
    hello: [
      { text: 'guildmaster,', if: ['writer'] },
      { text: 'to the hall:', if: ['no-writer'] },
    ],
    open: [
      { text: 'we won at {quest}.', if: ['writer', 'outcome.won'] },
      { text: 'we did not win at {quest}.', if: ['writer'], unless: ['outcome.won'] },
      { text: 'nobody came back from {quest}.', if: ['no-writer'] },
    ],
    striker: ['{who} landed {count} {count~blow|blows}.'],
    'report.death': [
      { text: 'we lost {who} to {killer}.', if: ['struck'] },
      { text: 'we lost {who}.', if: ['bled'] },
    ],
    'report.injury': [
      { text: 'I am hurt.', if: ['self'] },
      { text: '{who} is hurt.', unless: ['self'] },
    ],
    bye: ['{writer}', { text: 'the reeve', if: ['no-writer'] }],
  },
};

const people: Record<string, PersonSlot> = {
  a: { name: 'Odric', pronouns: 'he' },
  b: { name: 'Wenna', pronouns: 'she' },
};
const options = {
  personOf: (id: string) => people[id] ?? { name: id, pronouns: 'they' as const },
  nameOf: (id: string) => `«${id}»`,
};

describe('quest report (report SPEC.md)', () => {
  it('summarises a quest from its events, and the best-Wits survivor writes home', () => {
    const roster = [adventurer('a', { might: 20, wits: 8 }), adventurer('b', { wits: 15 })];
    const { events, state } = run(
      game(roster, {
        quest: { foes: [{ id: 'foe.wights', attack: 1, defence: 1, speed: 1, hits: 3 }] },
      }),
    );
    const summary = summariseQuest(events, state.roster, state.content.quests);
    expect(summary.outcome).toBe('won');
    expect(summary.partyIds).toEqual(['a', 'b']);
    expect(summary.writerId).toBe('b');
    expect(summary.foeIds).toEqual(['foe.wights']);
    expect(summary.foesBeaten).toBe(1);
    const landed = Object.values(summary.hits).reduce((s, n) => s + n, 0);
    expect(landed).toBeGreaterThanOrEqual(3);
    const lines = writeQuestReport(summary, text, options);
    expect(lines[0]).toEqual({ text: 'Guildmaster,', formula: true });
    expect(lines[1]?.text).toBe(`We won at «${quest.id}».`);
    expect(lines.at(-1)).toEqual({ text: 'Wenna', formula: true });
  });

  it('refuses events that are not one whole quest', () => {
    expect(() => summariseQuest([], [], [quest])).toThrow(/start to end/);
  });

  const base: QuestSummary = {
    questId: 'q',
    templateId: quest.id,
    outcome: 'routed',
    partyIds: ['a', 'b'],
    writerId: 'b',
    foeIds: ['foe.wights'],
    foesBeaten: 0,
    exchanges: 3,
    alarm: false,
    retreated: false,
    hits: { a: 1, b: 2 },
    actions: {},
    saves: [],
    deaths: [{ id: 'a', foeId: 'foe.wights' }],
    injuries: ['b'],
    worst: { a: 4, b: 2 },
  };

  it('writes deaths and injuries; the dead and the writer get no deed line, the writer says "I"', () => {
    const lines = writeQuestReport(base, text, options).map((l) => l.text);
    expect(lines).toEqual([
      'Guildmaster,',
      `We did not win at «${quest.id}».`,
      'We lost Odric to «foe.wights».',
      'I am hurt.',
      'Wenna',
    ]);
  });

  it('writes in the third person when nobody came back', () => {
    const lines = writeQuestReport(
      {
        ...base,
        writerId: null,
        deaths: [
          { id: 'a', foeId: null },
          { id: 'b', foeId: null },
        ],
        injuries: [],
      },
      text,
      options,
    ).map((l) => l.text);
    expect(lines).toEqual([
      'To the hall:',
      `Nobody came back from «${quest.id}».`,
      'We lost Odric.',
      'We lost Wenna.',
      'The reeve',
    ]);
  });

  it('masks names for the repetition count', () => {
    const lines = writeQuestReport(base, text, { ...options, mask: true }).map((l) => l.text);
    expect(lines[2]).toBe('We lost ‹who› to ‹killer›.');
  });
});
