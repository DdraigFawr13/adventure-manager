import { describe, expect, it } from 'vitest';
import type { GameEvent, HistoryRules, PeopleText, PronounForms } from '../src/index.ts';
import {
  assignDeeds,
  newChronicle,
  pairKey,
  recordEvents,
  summariseLife,
  summariseQuest,
  writeHistoryLine,
  writeMemorial,
} from '../src/index.ts';
import { foundedGuild, playDays, type Run } from './guild-fixture.ts';

const historyRules: HistoryRules = {
  friendAfterQuests: 2,
  deeds: [
    { kind: 'saved', family: 'd.saved', min: 1 },
    { kind: 'striker', family: 'd.striker', min: 1 },
  ],
};

/** Plays a guild day by day, folding each command's events into one chronicle. */
function chronicled(days: number, seed: string) {
  let run: Run = foundedGuild(3, {}, seed);
  const chronicle = newChronicle();
  recordEvents(chronicle, run.events, run.state, historyRules);
  let seen = run.events.length;
  for (let day = 2; day <= days; day += 1) {
    run = playDays(run, day);
    // playDays may run two commands (advance and take); each is folded with the state after the day.
    recordEvents(chronicle, run.events.slice(seen), run.state, historyRules);
    seen = run.events.length;
  }
  return { run, chronicle };
}

const questSlices = (events: readonly GameEvent[]) => {
  const slices: GameEvent[][] = [];
  let from = -1;
  events.forEach((e, at) => {
    if (e.type === 'quest.started') from = at;
    if (e.type === 'quest.ended') slices.push(events.slice(from, at + 1));
  });
  return slices;
};

describe('the chronicle (history SPEC.md)', () => {
  const { run, chronicle } = chronicled(120, 'history-seed');
  const quests = questSlices(run.events);

  it('gives everyone a joined entry and one quest entry per quest they set out on', () => {
    for (const m of run.state.roster) {
      const person = chronicle.people[m.id]!; // non-null: every member signed on.
      expect(person.entries[0]).toMatchObject({ kind: 'joined', founding: false, day: 1 });
      const setOut = quests.filter((q) => q[0]!.subjectIds.includes(m.id)).length;
      expect(person.quests).toBe(setOut);
      expect(person.entries.filter((e) => e.kind === 'quest')).toHaveLength(setOut);
    }
    expect(quests.length).toBeGreaterThan(3);
  });

  it('writes every deed the letter writes, and the writer gets their own', () => {
    for (const q of quests) {
      const summary = summariseQuest(q, run.state.roster, run.state.content);
      const letter = assignDeeds(
        summary,
        historyRules.deeds,
        summary.writerId ? [summary.writerId] : [],
      );
      for (const note of letter) {
        const entry = chronicle.people[note.id]!.entries.find(
          (e) => e.kind === 'quest' && e.questId === summary.questId,
        );
        expect(entry?.kind === 'quest' && entry.deed?.kind).toBe(note.kind);
        expect(entry?.kind === 'quest' && entry.writerId).toBe(summary.writerId);
      }
    }
  });

  it('counts quests together per pair and makes friends at the content number, once', () => {
    for (const [key, count] of Object.entries(chronicle.together)) {
      const [a = '', b = ''] = key.split('|');
      const together = quests.filter(
        (q) => q[0]!.subjectIds.includes(a) && q[0]!.subjectIds.includes(b),
      ).length;
      expect(count).toBe(together);
      const alive = (id: string) => !run.state.roster.find((x) => x.id === id)?.dead;
      if (count >= 2 && alive(a) && alive(b)) {
        expect(chronicle.people[a]!.friends).toContain(b);
        expect(chronicle.people[b]!.friends).toContain(a);
      }
    }
    for (const person of Object.values(chronicle.people))
      expect(new Set(person.friends).size).toBe(person.friends.length);
    expect(pairKey('adv.2', 'adv.1')).toBe('adv.1|adv.2');
  });

  it('keeps each site’s last result and clears quests out', () => {
    expect(Object.keys(chronicle.places).length).toBeGreaterThan(0);
    expect(chronicle.out).toEqual({});
  });
});

describe('deaths and the memorial (history SPEC.md)', () => {
  // A seed whose fixed player loses someone within the year (found by trying seeds).
  const { run, chronicle } = chronicled(336, 'history-death-0');
  const dead = run.state.roster.find((a) => a.dead);

  it('records how they fell and summarises their life', () => {
    expect(dead).toBeDefined();
    const entries = chronicle.people[dead!.id]!.entries; // non-null: the dead have histories.
    const fall = entries[entries.length - 1]!;
    expect(fall.kind).toBe('died');
    const quest = entries[entries.length - 2]!;
    expect(quest).toMatchObject({ kind: 'quest', died: true });
    const life = summariseLife(chronicle, dead!.id, run.state.roster, historyRules);
    expect(life.fall).toBe(fall);
    expect(life.deeds.length).toBeLessThanOrEqual(2);
    for (const f of life.friends)
      expect(run.state.roster.find((a) => a.id === f.id)?.dead).toBe(false);
    expect(life.leaderId === null || !life.friends.some((f) => f.id === life.leaderId)).toBe(true);
    expect(() =>
      summariseLife(
        chronicle,
        run.state.roster.find((a) => !a.dead)!.id,
        run.state.roster,
        historyRules,
      ),
    ).toThrow();
  });
});

const forms: PronounForms = {
  they: 'they',
  them: 'them',
  their: 'their',
  theirs: 'theirs',
  themself: 'themself',
  plural: true,
};
const text: PeopleText = {
  pronouns: { she: forms, he: forms, they: forms },
  library: {
    'history.quest': [
      { text: '{deed} at {site}', if: ['deed'] },
      { text: 'went to {site}', if: ['no-deed'] },
    ],
    'history.deed.striker': ['struck {count}'],
    'history.died': [{ text: 'fell to {killer}', if: ['cause.foe'] }],
    'memorial.opening': ['{who} died at {site}, {quests} quests'],
    'memorial.deed.striker': [
      { text: 'first {site}', if: ['first'] },
      { text: 'then {site}', if: ['later'] },
    ],
    'memorial.friend': ['{friend} ({count})'],
    'memorial.leader': [{ text: 'led by {leader}', if: ['leader'] }],
    'memorial.signoff': ['{chaplain}'],
  },
  memorial: {
    sections: [
      { family: 'memorial.opening' },
      { list: 'deeds' },
      { list: 'friends', max: 1 },
      { family: 'memorial.leader' },
      { family: 'memorial.signoff', formula: true },
    ],
    chaplains: ['Sister Test'],
  },
};
const options = {
  personOf: (id: string) => ({ name: id, pronouns: 'they' as const }),
  nameOf: (id: string) => id,
  seed: 'words',
};

describe('history lines and the memorial letter (history SPEC.md)', () => {
  it('renders a deed into the quest line and capitalises it', () => {
    const entry = {
      day: 3,
      kind: 'quest',
      questId: 'q',
      siteId: 'site.x',
      outcome: 'won',
      partyNameId: null,
      worst: 0,
      deed: { kind: 'striker', count: 4 },
      writerId: null,
      savedBy: null,
      died: false,
    } as const;
    expect(writeHistoryLine('adv.1', entry, 0, text, options)).toBe('Struck 4 at site.x');
    expect(writeHistoryLine('adv.1', { ...entry, deed: null }, 0, text, options)).toBe(
      'Went to site.x',
    );
  });

  it('writes the letter from the summary: deeds in order, friends capped, the chaplain signs', () => {
    const chronicle = newChronicle();
    chronicle.people['adv.1'] = {
      quests: 3,
      won: 2,
      injuries: 0,
      friends: ['adv.2', 'adv.3'],
      entries: [
        {
          day: 1,
          kind: 'quest',
          questId: 'q1',
          siteId: 'site.a',
          outcome: 'won',
          partyNameId: null,
          worst: 0,
          deed: { kind: 'striker', count: 3 },
          writerId: null,
          savedBy: null,
          died: false,
        },
        {
          day: 2,
          kind: 'quest',
          questId: 'q2',
          siteId: 'site.b',
          outcome: 'won',
          partyNameId: null,
          worst: 0,
          deed: { kind: 'striker', count: 1 },
          writerId: null,
          savedBy: null,
          died: false,
        },
        {
          day: 3,
          kind: 'quest',
          questId: 'q3',
          siteId: 'site.c',
          outcome: 'routed',
          partyNameId: null,
          worst: 4,
          deed: null,
          writerId: null,
          savedBy: null,
          died: true,
        },
        {
          day: 3,
          kind: 'died',
          questId: 'q3',
          siteId: 'site.c',
          cause: 'foe',
          foeId: 'foe.x',
          writerId: 'adv.4',
          partyNameId: null,
        },
      ],
    };
    chronicle.together[pairKey('adv.1', 'adv.2')] = 1;
    chronicle.together[pairKey('adv.1', 'adv.3')] = 5;
    const roster = ['adv.1', 'adv.2', 'adv.3', 'adv.4'].map((id) => ({ id, dead: id === 'adv.1' }));
    // cast-ok: summariseLife reads only ids, deaths and backgrounds from the roster.
    const life = summariseLife(chronicle, 'adv.1', roster as never, historyRules);
    expect(life.deeds.map((d) => d.siteId)).toEqual(['site.b', 'site.a']);
    expect(life.friends.map((f) => f.id)).toEqual(['adv.3', 'adv.2']);
    expect(life.leaderId).toBe('adv.4');
    const lines = writeMemorial(life, text, options);
    expect(lines.map((l) => l.text)).toEqual([
      'Adv.1 died at site.c, 3 quests',
      'First site.b',
      'Then site.a',
      'Adv.3 (5)',
      'Led by adv.4',
      'Sister Test',
    ]);
    expect(lines.at(-1)!.formula).toBe(true);
  });
});
