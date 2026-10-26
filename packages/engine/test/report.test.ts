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
      { text: 'we lost {who}.', if: ['scene'] },
    ],
    'report.injury': [
      { text: 'I am hurt.', if: ['self'] },
      { text: '{who} is hurt.', unless: ['self'] },
    ],
    bye: [
      { text: '{writer}', if: ['writer'] },
      { text: 'the reeve', if: ['no-writer'] },
    ],
  },
};

const people: Record<string, PersonSlot> = {
  a: { name: 'Odric', pronouns: 'he' },
  b: { name: 'Wenna', pronouns: 'she' },
};
const options = {
  seed: 'test-seed',
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
    const summary = summariseQuest(events, state.roster, state.content);
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

  it('traces each death to the foe whose blow knocked the member down, even when a later death roll kills', () => {
    // a and b are always hit; c is never hit and cannot win, so the fight runs on while the
    // fallen bleed (certain) and die on a later beat's death roll (certain).
    const roster = [
      adventurer('a', { agility: 1 }),
      adventurer('b', { agility: 1 }),
      adventurer('c', { agility: 60, might: 1 }),
    ];
    const certain = { baseBp: 10_000, stepBp: 0, pivot: 10 };
    const { events, state } = run(
      game(roster, {
        rules: { minChanceBp: 0, maxChanceBp: 10_000, bleed: certain, deathRoll: certain },
        quest: {
          scenes: [],
          foes: [{ id: 'foe.wights', attack: 30, defence: 30, speed: 30, hits: 9 }],
        },
      }),
    );
    const byId = new Map(events.map((e) => [e.id, e]));
    const died = events.filter((e) => e.type === 'adventurer.died');
    expect(died.map((e) => e.subjectIds[0]).sort()).toEqual(['a', 'b']);
    // Each death roll was caused by a step command, not by the blow: the old trace found no killer.
    for (const e of died) expect(byId.get(byId.get(e.causeId)?.causeId ?? '')).toBeUndefined();
    const summary = summariseQuest(events, state.roster, state.content);
    for (const d of summary.deaths)
      expect(d).toEqual({ id: d.id, foeId: 'foe.wights', cause: 'foe' });
  });

  it('a member a scene knocked down is written as lost on the way in, with no killer', () => {
    // a and b cannot pass the road; three road scenes put them down before any fight.
    const roster = [
      adventurer('a', { agility: -100 }),
      adventurer('b', { agility: -100 }),
      adventurer('c', { agility: 60, might: 1 }),
    ];
    const certain = { baseBp: 10_000, stepBp: 0, pivot: 10 };
    const road = {
      id: 'scene.road',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 8,
      testers: 'all',
      onFailure: 'wound',
    } as const;
    const { events, state } = run(
      game(roster, {
        rules: { minChanceBp: 0, maxChanceBp: 10_000, bleed: certain, deathRoll: certain },
        quest: {
          scenes: [road, road, road],
          foes: [{ id: 'foe.wights', attack: 0, defence: 30, speed: 1, hits: 9 }],
        },
      }),
    );
    const summary = summariseQuest(events, state.roster, state.content);
    expect(summary.deaths.map((d) => d.id).sort()).toEqual(['a', 'b']);
    for (const d of summary.deaths) expect(d).toEqual({ id: d.id, foeId: null, cause: 'scene' });
  });

  it('a member a foe struck down while the party fell back is written as lost in the retreat', () => {
    // c stands at the back and is never hit, so the party can still walk out; three foe groups
    // strike on every retreat beat.
    const roster = [
      adventurer('a', { agility: 1 }),
      adventurer('b', { agility: 1 }),
      { ...adventurer('c', { agility: 60, might: 1, wits: 30 }), position: 'back' as const },
    ];
    const certain = { baseBp: 10_000, stepBp: 0, pivot: 10 };
    const wights = (n: number) => ({
      id: `foe.wights-${n}`,
      attack: 30,
      defence: 30,
      speed: 30,
      hits: 9,
    });
    const { events, state } = run(
      game(roster, {
        rules: { minChanceBp: 0, maxChanceBp: 10_000, bleed: certain, deathRoll: certain },
        quest: { scenes: [], foes: [wights(1), wights(2), wights(3)] },
      }),
      { approach: 'assault', risk: 'steady', retreat: 'down' },
    );
    const summary = summariseQuest(events, state.roster, state.content);
    expect(summary.retreated).toBe(true);
    expect(summary.deaths.some((d) => d.cause === 'retreat')).toBe(true);
    for (const d of summary.deaths) expect(d.foeId).toMatch(/^foe\.wights-/);
  });

  it('refuses events that are not one whole quest', () => {
    expect(() => summariseQuest([], [], game([]).content)).toThrow(/start to end/);
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
    deaths: [{ id: 'a', foeId: 'foe.wights', cause: 'foe' }],
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
          { id: 'a', foeId: null, cause: 'scene' },
          { id: 'b', foeId: null, cause: 'scene' },
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
