import { describe, expect, it } from 'vitest';
import {
  slotsOf,
  writeHistory,
  writeMemorial,
  type Adventurer,
  type HistoryEntry,
  type PersonSlot,
  type TemplateLibrary,
  type Variant,
} from '@adventure-manager/engine';
import {
  baseResolution,
  careerGuildRules,
  historyText,
  memorialText,
  names,
  reportText,
} from '../src/index.ts';

const content = { ...baseResolution, guild: careerGuildRules };
const FORMS = new Set(['they', 'them', 'their', 'theirs', 'themself']);
const textOf = (v: Variant) => (typeof v === 'string' ? v : v.text);
const nameOf = (id: string) => names[id] ?? id;

function badSlots(library: TemplateLibrary, slots: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  for (const [family, variants] of Object.entries(library))
    for (const slot of variants.flatMap((v) => slotsOf(textOf(v)))) {
      if (slot.startsWith('@')) {
        if (!library[slot.slice(1)]) problems.push(`${family}: no family ${slot}`);
        continue;
      }
      const [name = '', rest = ''] = slot.split(/[.~]/);
      if (!slots.has(name)) problems.push(`${family}: unknown slot {${slot}}`);
      if (slot.includes('.') && !FORMS.has(rest.toLowerCase()))
        problems.push(`${family}: unknown form {${slot}}`);
    }
  return problems;
}

const QUEST = 'shape:site.hollow-barrow+monster.barrow-dead+plain+hazardous';
const quest = (
  day: number,
  partyIds: string[],
  extra: Partial<Extract<HistoryEntry, { kind: 'quest' }>> = {},
): HistoryEntry => ({
  kind: 'quest',
  day,
  questId: `run.${day}`,
  templateId: QUEST,
  outcome: 'won',
  partyIds,
  hits: 0,
  actions: {},
  saved: [],
  savedBy: null,
  worst: 0,
  foeId: 'foe.barrow-hounds',
  ...extra,
});

describe('history and memorial text (R7)', () => {
  it('uses only families that exist and slots the writers fill', () => {
    const history = new Set([
      'who',
      'quest',
      'foe',
      'days',
      'attribute',
      'to',
      'count',
      'patient',
      'saver',
      'age',
    ]);
    const memorial = new Set([
      'dead',
      'writer',
      'first',
      'quest',
      'killer',
      'count',
      'years',
      'patient',
      'deedQuest',
      'age',
    ]);
    const problems = [
      ...badSlots(historyText.library, history),
      ...badSlots(memorialText.library, memorial),
      ...['joined', 'quest', 'injured', 'changed', 'retired', 'died']
        .filter((k) => !historyText.library[`history.${k}`])
        .map((k) => `no family history.${k}`),
      ...memorialText.sections
        .filter((s) => !memorialText.library[s.family])
        .map((s) => `no family ${s.family}`),
    ];
    expect(problems).toEqual([]);
  });

  it('writes a line for every kind of history entry', () => {
    const personOf = (id: string): PersonSlot => ({ name: id, pronouns: 'they' });
    const entries: HistoryEntry[] = [
      { kind: 'joined', day: 1 },
      ...(['won', 'partial', 'retreated', 'routed'] as const).map((outcome, n) =>
        quest(10 + n, ['a', 'b'], { outcome }),
      ),
      quest(20, ['a', 'b'], { saved: ['b'] }),
      quest(21, ['a', 'b'], { savedBy: 'b' }),
      quest(22, ['a', 'b'], { hits: 5 }),
      { kind: 'injured', day: 30, days: 21 },
      ...(['growth', 'age', 'injury'] as const).map((reason): HistoryEntry => ({
        kind: 'changed',
        day: 31,
        attribute: 'might',
        to: 12,
        reason,
      })),
      { kind: 'retired', day: 40, age: 41 },
      ...(['foe', 'retreat', 'scene'] as const).map((cause): HistoryEntry => ({
        kind: 'died',
        day: 50,
        questId: 'q',
        templateId: QUEST,
        cause,
        foeId: 'foe.barrow-hounds',
      })),
    ];
    const lines = writeHistory('a', entries, historyText, reportText, {
      personOf,
      nameOf,
      seed: 's',
    });
    for (const line of lines) {
      expect(line.text.length, JSON.stringify(line)).toBeGreaterThan(10);
      expect(line.text).not.toMatch(/[{}‹]|undefined/);
      expect(line.text.charAt(0)).toBe(line.text.charAt(0).toUpperCase());
    }
  });

  it('writes a whole letter for every kind of death, writer, service and deed', () => {
    const problems: string[] = [];
    let cases = 0;
    for (const pronouns of ['she', 'he', 'they'] as const)
      for (const classId of ['class.warrior', 'class.rogue', 'class.cleric'])
        for (const birthYear of [-20, -28, -40])
          for (const cause of ['foe', 'retreat', 'scene'] as const)
            for (const served of [1, 3, 9])
              for (const deed of ['saved', 'saved-writer', 'guard', 'striker', 'mend', 'none'])
                for (const writer of ['comrade', 'clerk', 'not-there'] as const) {
                  cases += 1;
                  const person = (id: string): PersonSlot => ({ name: `Name-${id}`, pronouns });
                  const roster: Adventurer[] = [
                    {
                      id: 'dead',
                      classId,
                      position: 'front',
                      attributes: {
                        might: 10,
                        agility: 10,
                        toughness: 10,
                        stealth: 10,
                        wits: 10,
                        presence: 10,
                        resolve: 10,
                        lore: 10,
                      },
                      weaponBp: 0,
                      armourBp: 0,
                      dead: true,
                      birthYear,
                    },
                  ];
                  const party = writer === 'not-there' ? ['dead', 'other'] : ['dead', 'pal'];
                  const quests = Array.from({ length: served }, (_, n) =>
                    quest(5 + n * 20, n === 0 && writer === 'not-there' ? ['dead', 'pal'] : party, {
                      ...(deed === 'saved' && n === 0 ? { saved: ['other'] } : {}),
                      ...(deed === 'saved-writer' && n === 0 ? { saved: ['pal'] } : {}),
                      ...(deed === 'striker' && n === 0 ? { hits: 6 } : {}),
                      ...(deed === 'guard' && n === 0 ? { actions: { 'action.guard': 1 } } : {}),
                      ...(deed === 'mend' && n === 0 ? { actions: { 'action.mend': 2 } } : {}),
                    }),
                  );
                  const last = quests[quests.length - 1]!; // non-null: at least one.
                  const histories = new Map<string, HistoryEntry[]>([
                    [
                      'dead',
                      [
                        { kind: 'joined', day: 1 },
                        ...quests,
                        {
                          kind: 'died',
                          day: last.day,
                          questId: (last as { questId: string }).questId,
                          templateId: QUEST,
                          cause,
                          foeId: 'foe.barrow-hounds',
                        },
                      ],
                    ],
                  ]);
                  const goneIds = new Set(writer === 'clerk' ? ['pal', 'other'] : []);
                  const letter = writeMemorial(
                    'dead',
                    histories,
                    roster,
                    content,
                    memorialText,
                    reportText,
                    {
                      personOf: person,
                      nameOf,
                      seed: `case-${cases}`,
                      goneIds,
                    },
                  );
                  const body = letter.lines.filter((l) => !l.formula).map((l) => l.text);
                  const label = `${pronouns} ${classId} ${birthYear} ${cause} ${served} ${deed} ${writer}`;
                  if (letter.lines.length < 5)
                    problems.push(`${label}: only ${letter.lines.length} lines`);
                  if (!letter.lines[0]?.formula || !letter.lines.at(-1)?.formula)
                    problems.push(`${label}: no salutation or sign-off`);
                  for (const line of body)
                    if (/[{}‹]|undefined/.test(line)) problems.push(`${label}: ${line}`);
                  if ((writer === 'clerk') !== (letter.writerId === null))
                    problems.push(`${label}: wrong writer`);
                }
    expect(cases).toBe(3 * 3 * 3 * 3 * 3 * 6 * 3);
    expect(problems.slice(0, 10)).toEqual([]);
  });
});
