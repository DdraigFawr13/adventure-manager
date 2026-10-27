import { describe, expect, it } from 'vitest';
import {
  newChronicle,
  recordEvents,
  simulate,
  slotsOf,
  summariseLife,
  writeBackground,
  writeHistoryLine,
  writeMemorial,
  type Chronicle,
  type Command,
  type GameEvent,
  checkGuildInvariants,
  type GameState,
  type PersonSlot,
  type Variant,
} from '@adventure-manager/engine';
import {
  baseBackgroundRules,
  baseHistoryRules,
  baseResolution,
  baseStandingRules,
  houseGuildRules,
  names,
  peopleNames,
  peopleText,
} from '../src/index.ts';

const SLOTS = new Set([
  'who',
  'site',
  'party',
  'deed',
  'saver',
  'patient',
  'friend',
  'count',
  'days',
  'attribute',
  'from',
  'to',
  'killer',
  'age',
  'home',
  'trade',
  'quests',
  'leader',
  'chaplain',
]);
const FORMS = new Set(['they', 'them', 'their', 'theirs', 'themself']);
const textOf = (v: Variant) => (typeof v === 'string' ? v : v.text);
const deedSuffix = (kind: string) => kind.replace(/^action:(action\.)?/, '');
const nameOf = (id: string) => peopleNames[id] ?? names[id] ?? id;

describe('people text (history SPEC.md)', () => {
  it('uses only families that exist and slots the writers fill', () => {
    const problems: string[] = [];
    const library = peopleText.library;
    for (const [family, variants] of Object.entries(library)) {
      for (const slot of variants.flatMap((v) => slotsOf(textOf(v)))) {
        if (slot.startsWith('@')) {
          if (!library[slot.slice(1)]) problems.push(`${family}: no family ${slot}`);
          continue;
        }
        const [name = '', rest = ''] = slot.split(/[.~]/);
        if (!SLOTS.has(name)) problems.push(`${family}: unknown slot {${slot}}`);
        if (slot.includes('.') && !FORMS.has(rest.toLowerCase()))
          problems.push(`${family}: unknown form {${slot}}`);
      }
    }
    const need = [
      ...baseBackgroundRules.trades.map((t) => `background.${t.slice('trade.'.length)}`),
      ...baseHistoryRules.deeds.flatMap((d) => [
        `history.deed.${deedSuffix(d.kind)}`,
        `memorial.deed.${deedSuffix(d.kind)}`,
      ]),
      ...['joined', 'quest', 'injured', 'attribute', 'friend', 'fell-ill', 'died', 'retired'].map(
        (k) => `history.${k}`,
      ),
      ...peopleText.memorial.sections.flatMap((s) => (s.family ? [s.family] : [])),
    ];
    for (const family of need) if (!library[family]) problems.push(`no family ${family}`);
    for (const id of [
      ...baseStandingRules.names,
      ...baseBackgroundRules.homes,
      ...baseBackgroundRules.trades,
    ])
      if (!peopleNames[id]) problems.push(`no name for ${id}`);
    expect(problems).toEqual([]);
    expect(baseStandingRules.names.length).toBeGreaterThanOrEqual(6);
  });

  it('writes every background for every pronoun set', () => {
    for (const trade of baseBackgroundRules.trades)
      for (const pronouns of ['she', 'he', 'they'] as const) {
        const line = writeBackground(
          {
            id: `adv.${trade}`,
            background: { home: baseBackgroundRules.homes[0]!, trade }, // non-null: content has homes.
            classId: 'warrior',
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
            dead: false,
          },
          peopleText,
          { personOf: () => ({ name: 'Kit Mallow', pronouns }), nameOf, seed: trade + pronouns },
        );
        expect(line).toMatch(/^[A-Z].*\.$/);
        expect(line).not.toMatch(/[{}]/);
      }
  });
});

type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

interface Played {
  readonly state: GameState;
  readonly chronicle: Chronicle;
  readonly events: readonly GameEvent[];
  readonly commandIds: readonly string[];
}

/**
 * Two years of a founded guild with a plain player: the balanced starter party and 2 extras, and
 * with a bold plan, whenever the first standing party's members are all free, they take the first offer.
 */
function playTwoYears(seed: string): Played {
  let state: GameState = {
    seed,
    rng: {},
    nextEventNo: 1,
    content: { ...baseResolution, guild: houseGuildRules },
    roster: [],
    quest: null,
    calendar: 1,
    guild: null,
  };
  const chronicle = newChronicle();
  const events: GameEvent[] = [];
  const commandIds: string[] = [];
  let n = 0;
  const run = (command: Bare) => {
    // cast-ok: the id added back makes the union member whole.
    const result = simulate(state, { ...command, id: `c${(n += 1)}` } as Command);
    state = result.state;
    events.push(...result.events);
    commandIds.push(`c${n}`);
    recordEvents(chronicle, result.events, state, baseHistoryRules);
  };
  run({ type: 'guild.found', day: 1, size: 0 });
  const extras = state.guild!.draft!.extras.slice(0, 2).map((p) => p.adventurer.id); // non-null: the draft is pending.
  run({ type: 'guild.pick', day: 1, partyIndex: 1, extraIds: extras });
  // A bold plan, so two years hold a death or two for the memorial.
  run({
    type: 'party.plan',
    day: 1,
    standingId: 'sp.1',
    plan: { approach: 'assault', risk: 'bold', retreat: 'never' },
  });
  const lastDay = 2 * 48 * 7;
  while (state.calendar < lastDay && !state.guild!.career?.ended) {
    run({ type: 'day.advance', day: state.calendar + 1 });
    const guild = state.guild!; // non-null: founded.
    const party = guild.standing[0];
    const offer = guild.board[0];
    if (!party || !offer) continue;
    const free = party.memberIds.filter((id) => {
      const m = guild.members.find((x) => x.id === id);
      return m && !m.away && m.outUntilDay <= state.calendar;
    });
    if (free.length < party.memberIds.length || free.length < houseGuildRules.partySize.min)
      continue;
    run({
      type: 'contract.take',
      day: state.calendar,
      offerId: offer.id,
      partyIds: free,
      plan: party.plan,
      standingId: party.id,
    });
  }
  return { state, chronicle, events, commandIds };
}

describe('histories over two played years (history SPEC.md)', () => {
  const played = playTwoYears('b');
  const { state, chronicle } = played;
  const personOf = (id: string): PersonSlot => {
    const a = state.roster.find((r) => r.id === id);
    return {
      name: a?.name ? `${a.name.given} ${a.name.family}` : id,
      pronouns: a?.pronouns ?? 'they',
    };
  };
  const options = { personOf, nameOf, seed: state.seed };

  it('writes every entry as one clean sentence', () => {
    const kinds = new Set<string>();
    for (const [id, person] of Object.entries(chronicle.people))
      person.entries.forEach((entry, at) => {
        kinds.add(entry.kind);
        const line = writeHistoryLine(id, entry, at, peopleText, options);
        expect(line, `${id} ${entry.kind}`).toMatch(/^[A-Z].*[.)]$/);
        expect(line).not.toMatch(/[{}]/);
      });
    expect([...kinds]).toEqual(expect.arrayContaining(['joined', 'quest', 'friend', 'died']));
  });

  it('keeps the guild invariants, standing parties included, over the two years', () => {
    expect(checkGuildInvariants(state, played.events, played.commandIds)).toEqual([]);
    expect(state.roster.some((a) => a.dead)).toBe(true);
  });

  it('writes the memorial cleanly for she, he and they', () => {
    const who = state.roster.find((a) => a.dead)!; // non-null: the run has a death.
    const life = summariseLife(chronicle, who.id, state.roster, baseHistoryRules);
    for (const pronouns of ['she', 'he', 'they'] as const) {
      const lines = writeMemorial(life, peopleText, {
        ...options,
        personOf: (id) => ({ ...personOf(id), pronouns }),
      });
      for (const l of lines) expect(l.text).not.toMatch(/[{}]|  /);
      expect(lines.some((l) => /\b(he|she|they) (is|are) remembered\b/i.test(l.text))).toBe(
        life.deeds.length > 0,
      );
      const agree = lines.find((l) => / remembered /.test(l.text))?.text ?? '';
      expect(agree).not.toMatch(pronouns === 'they' ? /They is/ : /(She|He) are/);
    }
  });

  it('writes a short life with no background or deeds, and a fall with no foe', () => {
    const who = state.roster.find((a) => a.dead)!; // non-null: the run has a death.
    const lines = writeMemorial(
      {
        id: who.id,
        background: null,
        quests: 1,
        deeds: [],
        fall: {
          day: 9,
          kind: 'died',
          questId: 'q',
          siteId: 'site.hollow-barrow',
          cause: 'foe',
          foeId: null,
          writerId: null,
          partyNameId: null,
        },
        friends: [],
        leaderId: null,
      },
      peopleText,
      options,
    ).map((l) => l.text);
    expect(lines.join(' ')).toContain('on 1 quest.');
    expect(lines.join(' ')).toContain('barely begun');
    expect(lines.join(' ')).not.toMatch(/struck down by|[{}]/);
  });

  it('records the founding party, quests and friends after 5 quests together', () => {
    // The roster lists the picked starter party first, then the extras.
    const joined = state.roster.map((a) => chronicle.people[a.id]!.entries[0]); // non-null: everyone picked has a history.
    const partyOf = (n: number) => {
      const entry = joined[n];
      return entry?.kind === 'joined' && entry.founding ? entry.partyNameId : 'not a founder';
    };
    const party = partyOf(0);
    expect(baseStandingRules.names).toContain(party);
    expect([0, 1, 2, 3, 4, 5, 6].map(partyOf)).toEqual([
      party,
      party,
      party,
      party,
      party,
      null,
      null,
    ]);
    const friendships = Object.values(chronicle.people).flatMap((p) =>
      p.entries.filter((e) => e.kind === 'friend'),
    );
    expect(friendships.length).toBeGreaterThan(0);
    for (const f of friendships) expect(f.kind === 'friend' && f.quests).toBe(5);
    for (const person of Object.values(chronicle.people))
      expect(person.quests).toBe(person.entries.filter((e) => e.kind === 'quest').length);
  });

  it('matches the golden memorial (change it only in a commit that says why)', async () => {
    const dead = state.roster.filter((a) => a.dead);
    expect(dead.length).toBeGreaterThan(0);
    const out = dead.slice(0, 2).map((who) => {
      const life = summariseLife(chronicle, who.id, state.roster, baseHistoryRules);
      const letter = writeMemorial(life, peopleText, options).map((l) => l.text);
      const card = [
        writeBackground(who, peopleText, options),
        ...chronicle.people[who.id]!.entries.map((e, at) =>
          // non-null: the dead have histories.
          writeHistoryLine(who.id, e, at, peopleText, options),
        ),
      ];
      return [...letter, '', ...card].join('\n');
    });
    await expect(`${out.join('\n\n---\n\n')}\n`).toMatchFileSnapshot('./golden/memorials.txt');
  });
});

describe('step 4 content numbers', () => {
  it('fits the founding party in one standing party', () => {
    const founding = houseGuildRules.founding!; // non-null: the house rules found through the draft.
    expect(founding.partySize).toBeLessThanOrEqual(houseGuildRules.partySize.max);
    expect(baseStandingRules.defaultPlan).toBeDefined();
  });
});
