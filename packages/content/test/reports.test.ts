import { describe, expect, it } from 'vitest';
import {
  simulate,
  slotsOf,
  summariseQuest,
  writeQuestReport,
  type Command,
  type GameEvent,
  type GameState,
  type PersonSlot,
  type QuestSummary,
  type Variant,
} from '@adventure-manager/engine';
import { baseGuildRules, baseResolution, names, reportText } from '../src/index.ts';

const SLOTS = new Set([
  'quest',
  'foe',
  'party',
  'dead',
  'writer',
  'who',
  'patient',
  'killer',
  'count',
]);
const FORMS = new Set(['they', 'them', 'their', 'theirs', 'themself']);
const textOf = (v: Variant) => (typeof v === 'string' ? v : v.text);

describe('quest report text (R8)', () => {
  it('uses only families that exist and slots the report fills', () => {
    const problems: string[] = [];
    for (const [family, variants] of Object.entries(reportText.library)) {
      for (const slot of variants.flatMap((v) => slotsOf(textOf(v)))) {
        if (slot.startsWith('@')) {
          if (!reportText.library[slot.slice(1)]) problems.push(`${family}: no family ${slot}`);
          continue;
        }
        const [name = '', rest = ''] = slot.split(/[.~]/);
        if (!SLOTS.has(name)) problems.push(`${family}: unknown slot {${slot}}`);
        if (slot.includes('.') && !FORMS.has(rest.toLowerCase()))
          problems.push(`${family}: unknown form {${slot}}`);
      }
    }
    for (const s of reportText.sections)
      if (s.family && !reportText.library[s.family]) problems.push(`no section family ${s.family}`);
    for (const d of reportText.deeds)
      if (!reportText.library[d.family]) problems.push(`no deed family ${d.family}`);
    expect(problems).toEqual([]);
  });

  it('opens and closes every letter, whatever happened', () => {
    const person = (id: string): PersonSlot => ({ name: id, pronouns: 'they' });
    const base: QuestSummary = {
      questId: 'q',
      templateId: 'quest.barrow-delve',
      outcome: 'won',
      partyIds: ['a', 'b', 'c'],
      writerId: 'a',
      foeIds: ['foe.barrow-hounds'],
      foesBeaten: 1,
      exchanges: 3,
      alarm: false,
      retreated: false,
      hits: {},
      actions: {},
      saves: [],
      deaths: [],
      injuries: [],
      worst: { a: 0, b: 0, c: 0 },
    };
    const cases: QuestSummary[] = [];
    for (const outcome of ['won', 'partial', 'retreated', 'routed'] as const)
      for (const exchanges of [0, 1, 3, 5])
        for (const deaths of [
          [],
          [{ id: 'b', foeId: null }],
          [
            { id: 'b', foeId: 'foe.barrow-hounds' },
            { id: 'c', foeId: null },
          ],
        ])
          for (const worst of [
            { a: 0, b: 0, c: 0 },
            { a: 2, b: 4, c: 1 },
          ])
            cases.push({
              ...base,
              outcome,
              exchanges,
              deaths,
              worst,
              alarm: exchanges === 5,
              retreated: outcome === 'retreated',
            });
    cases.push({
      ...base,
      outcome: 'routed',
      writerId: null,
      deaths: ['a', 'b', 'c'].map((id) => ({ id, foeId: null })),
    });
    for (const [n, summary] of cases.entries()) {
      const lines = writeQuestReport({ ...summary, questId: `q${n}` }, reportText, {
        personOf: person,
        nameOf: (id) => names[id] ?? id,
      });
      const body = lines.filter((l) => !l.formula);
      expect(lines[0]?.formula, `case ${n} salutation`).toBe(true);
      expect(lines.at(-1)?.formula, `case ${n} sign-off`).toBe(true);
      expect(body.length, `case ${n} body`).toBeGreaterThanOrEqual(summary.writerId ? 2 : 1);
      for (const l of lines) expect(l.text, `case ${n}`).not.toMatch(/[{}]|\s,|\s\s|^\s|\s$/);
    }
  });

  it('matches the golden letters (change them only in a commit that says why)', async () => {
    await expect(goldenLetters(6)).toMatchFileSnapshot('./golden/quest-reports.txt');
  });
});

describe('naming for drawn people (STYLE §9a)', () => {
  it('lists names in every set and gives drawn people a name and pronouns', () => {
    const naming = baseGuildRules.naming;
    expect(naming?.given.she.length).toBeGreaterThan(0);
    expect(naming?.given.he.length).toBeGreaterThan(0);
    expect(naming?.family.length).toBeGreaterThan(0);
    const state = found('naming');
    for (const a of state.roster) {
      expect(a.name?.given).toBeTruthy();
      expect(a.name?.family).toBeTruthy();
      expect(['she', 'he', 'they']).toContain(a.pronouns);
    }
  });

  it('draws names on their own stream, so recruits roll the same stats with or without names', () => {
    const { naming: _unused, ...unnamed } = baseGuildRules;
    const withNames = found('same-stats');
    const without = found('same-stats', { ...baseResolution, guild: unnamed });
    expect(without.roster.map((a) => a.attributes)).toEqual(
      withNames.roster.map((a) => a.attributes),
    );
    expect(without.roster[0]?.name).toBeUndefined();
  });
});

function found(seed: string, content = baseResolution): GameState {
  const state: GameState = {
    seed,
    rng: {},
    nextEventNo: 1,
    content,
    roster: [],
    quest: null,
    calendar: 1,
    guild: null,
  };
  return simulate(state, { type: 'guild.found', id: 'c0', day: 1, size: 15 }).state;
}

/** A few letters from fixed quests with a drawn guild, for the golden file. */
function goldenLetters(count: number): string {
  let state = found('golden-letters');
  const out: string[] = [];
  for (let n = 0; n < count; n += 1) {
    const living = state.roster.filter((a) => !a.dead).map((a) => a.id);
    const template = baseResolution.quests[n % baseResolution.quests.length]!; // non-null: modulo the length.
    const events: GameEvent[] = [];
    const step = (command: Command) => {
      const result = simulate(state, command);
      state = result.state;
      events.push(...result.events);
    };
    step({
      type: 'quest.start',
      id: `s${n}`,
      day: 1,
      questId: `quest.golden-${n}`,
      templateId: template.id,
      partyIds: living.slice(n % 5, (n % 5) + 5),
      plan: { approach: 'assault', risk: 'steady', retreat: 'leader' },
      watched: false,
    });
    for (let k = 0; state.quest; k += 1) step({ type: 'quest.step', id: `s${n}.${k}`, day: 1 });
    const summary = summariseQuest(events, state.roster, baseResolution.quests);
    const personOf = (id: string): PersonSlot => {
      const a = state.roster.find((r) => r.id === id);
      return {
        name: a?.name ? `${a.name.given} ${a.name.family}` : id,
        pronouns: a?.pronouns ?? 'they',
      };
    };
    const lines = writeQuestReport(summary, reportText, {
      personOf,
      nameOf: (id) => names[id] ?? id,
    });
    out.push(lines.map((l) => l.text).join('\n'));
  }
  return `${out.join('\n\n---\n\n')}\n`;
}
