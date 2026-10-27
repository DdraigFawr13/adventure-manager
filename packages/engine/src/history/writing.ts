// History lines, background lines and the memorial letter (SPEC.md): which families to render and
// with what facts and slots. Words live in content; this file holds no English.
import type {
  PersonSlot,
  PronounForms,
  PronounKey,
  SlotValue,
  TemplateLibrary,
  TextContext,
} from '../core/text.ts';
import { pickVariant, renderFamily } from '../core/text.ts';
import type { ReportLine } from '../report/quest-report.ts';
import type { Adventurer } from '../resolution/types.ts';
import { WOUND } from '../resolution/types.ts';
import type { Chronicle, HistoryEntry, HistoryRules } from './chronicle.ts';
import { pairKey } from './chronicle.ts';

/** One section of the memorial, as in the quest report: a fixed family or a list. */
export interface MemorialSection {
  readonly family?: string;
  readonly list?: 'deeds' | 'friends';
  readonly max?: number;
  readonly formula?: boolean;
}

export interface PeopleText {
  readonly library: TemplateLibrary;
  readonly pronouns: Readonly<Record<PronounKey, PronounForms>>;
  readonly memorial: {
    readonly sections: readonly MemorialSection[];
    /** The guild's chaplain is one of these, picked by the save's seed. */
    readonly chaplains: readonly string[];
  };
}

export interface WriteOptions {
  readonly personOf: (id: string) => PersonSlot;
  readonly nameOf: (id: string) => string;
  /** The save's seed: picks are keyed by it, so a replay reads the same and two saves differ. */
  readonly seed: string;
}

/** `action:guard` → `guard`; the deed's line family is `<prefix>.<suffix>`. */
function deedSuffix(kind: string): string {
  return kind.replace(/^action:(action\.)?/, '');
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function context(
  text: PeopleText,
  vars: Record<string, SlotValue>,
  facts: Iterable<string>,
): TextContext {
  return { library: text.library, pronouns: text.pronouns, vars, facts: new Set(facts) };
}

/** One dated history line for a person (SPEC.md, Lines); `at` is the entry's index. */
export function writeHistoryLine(
  personId: string,
  entry: HistoryEntry,
  at: number,
  text: PeopleText,
  options: WriteOptions,
): string {
  const key = `${options.seed}/history/${personId}/${entry.day}/${at}`;
  const vars: Record<string, SlotValue> = { who: options.personOf(personId) };
  const facts: string[] = [];
  switch (entry.kind) {
    case 'joined':
      facts.push(entry.founding ? 'founding' : 'signed');
      if (entry.partyNameId) {
        vars.party = options.nameOf(entry.partyNameId);
        facts.push('party');
      }
      break;
    case 'quest':
      vars.site = options.nameOf(entry.siteId);
      facts.push(`outcome.${entry.outcome}`);
      if (entry.died) facts.push('died');
      else if (entry.worst >= WOUND.badlyHurt) facts.push('badly-hurt');
      if (entry.savedBy) {
        vars.saver = options.personOf(entry.savedBy);
        facts.push('saved');
      }
      if (entry.deed) {
        const deedVars: Record<string, SlotValue> = { ...vars, count: entry.deed.count };
        if (entry.deed.patientId) deedVars.patient = options.personOf(entry.deed.patientId);
        vars.deed = renderFamily(
          context(text, deedVars, [entry.deed.count === 1 ? 'once' : 'many']),
          `history.deed.${deedSuffix(entry.deed.kind)}`,
          key,
        );
        facts.push('deed');
      } else facts.push('no-deed');
      break;
    case 'injured':
      vars.days = entry.days;
      if (entry.siteId) {
        vars.site = options.nameOf(entry.siteId);
        facts.push('site');
      }
      break;
    case 'attribute':
      vars.attribute = options.nameOf(`attribute.${entry.attribute}`);
      vars.from = entry.from;
      vars.to = entry.to;
      facts.push(`reason.${entry.reason}`);
      break;
    case 'friend':
      vars.friend = options.personOf(entry.withId);
      vars.count = entry.quests;
      break;
    case 'fell-ill':
      vars.days = entry.days;
      break;
    case 'died':
      vars.site = options.nameOf(entry.siteId);
      vars.killer = entry.foeId ? options.nameOf(entry.foeId) : '';
      facts.push(`cause.${entry.cause}`);
      break;
    case 'retired':
      vars.age = entry.age;
      break;
  }
  return capitalise(renderFamily(context(text, vars, facts), `history.${entry.kind}`, key));
}

/** The person's background line, or empty when they have none (SPEC.md, Lines). */
export function writeBackground(who: Adventurer, text: PeopleText, options: WriteOptions): string {
  if (!who.background) return '';
  const vars = { who: options.personOf(who.id), home: options.nameOf(who.background.home) };
  const family = `background.${who.background.trade.replace(/^trade\./, '')}`;
  return capitalise(
    renderFamily(context(text, vars, []), family, `${options.seed}/background/${who.id}`),
  );
}

export interface LifeSummary {
  readonly id: string;
  readonly background: Adventurer['background'] | null;
  readonly quests: number;
  /** Best deeds, up to 2: content's deed order first, the latest first within a kind. */
  readonly deeds: readonly { readonly kind: string; readonly siteId: string }[];
  readonly fall: Extract<HistoryEntry, { kind: 'died' }>;
  /** Living friends, up to 2, most quests together first. */
  readonly friends: readonly { readonly id: string; readonly quests: number }[];
  readonly leaderId: string | null;
}

/** What the chaplain knows of the dead (SPEC.md, The memorial letter). */
export function summariseLife(
  chronicle: Chronicle,
  id: string,
  roster: readonly Adventurer[],
  rules: HistoryRules,
): LifeSummary {
  const person = chronicle.people[id];
  const fall = person?.entries.find((e) => e.kind === 'died');
  if (!person || fall?.kind !== 'died') throw new Error(`${id} has not died.`);
  const order: string[] = rules.deeds.map((d) => d.kind);
  const deeds = person.entries
    .flatMap((e, at) =>
      e.kind === 'quest' && e.deed ? [{ kind: e.deed.kind, siteId: e.siteId, at }] : [],
    )
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || b.at - a.at)
    .slice(0, 2)
    .map(({ kind, siteId }) => ({ kind, siteId }));
  const living = (other: string) => roster.some((a) => a.id === other && !a.dead);
  const friends = person.friends
    .filter(living)
    .map((other) => ({ id: other, quests: chronicle.together[pairKey(id, other)] ?? 0 }))
    .sort((a, b) => b.quests - a.quests || (a.id < b.id ? -1 : 1))
    .slice(0, 2);
  const writer = fall.writerId;
  const leaderId =
    writer && writer !== id && living(writer) && !friends.some((f) => f.id === writer)
      ? writer
      : null;
  const who = roster.find((a) => a.id === id);
  return {
    id,
    background: who?.background ?? null,
    quests: person.quests,
    deeds,
    fall,
    friends,
    leaderId,
  };
}

/** The chaplain's letter: one line per section that has something to say. */
export function writeMemorial(
  life: LifeSummary,
  text: PeopleText,
  options: WriteOptions,
): ReportLine[] {
  const facts = new Set<string>([
    `cause.${life.fall.cause}`,
    life.background ? 'background' : 'no-background',
    life.deeds.length > 0 ? 'deeds' : 'no-deeds',
    life.friends.length > 0 ? 'friends' : 'no-friends',
    life.leaderId ? 'leader' : 'no-leader',
  ]);
  if (life.quests <= 1) facts.add('first-quest');
  if (life.quests >= 10) facts.add('veteran');
  if (life.fall.partyNameId) facts.add('party');
  const vars: Record<string, SlotValue> = {
    who: options.personOf(life.id),
    site: options.nameOf(life.fall.siteId),
    killer: life.fall.foeId ? options.nameOf(life.fall.foeId) : '',
    quests: life.quests,
    chaplain: text.memorial.chaplains.length > 0 ? pickChaplain(text, options.seed) : '',
  };
  if (life.background) {
    vars.home = options.nameOf(life.background.home);
    vars.trade = options.nameOf(life.background.trade);
  }
  if (life.leaderId) vars.leader = options.personOf(life.leaderId);
  if (life.fall.partyNameId) vars.party = options.nameOf(life.fall.partyNameId);
  const items: Record<'deeds' | 'friends', { family: string; vars: Record<string, SlotValue> }[]> =
    {
      deeds: life.deeds.map((d) => ({
        family: `memorial.deed.${deedSuffix(d.kind)}`,
        vars: { site: options.nameOf(d.siteId) },
      })),
      friends: life.friends.map((f) => ({
        family: 'memorial.friend',
        vars: { friend: options.personOf(f.id), count: f.quests },
      })),
    };
  const lines: ReportLine[] = [];
  text.memorial.sections.forEach((section, at) => {
    const key = `${options.seed}/memorial/${life.id}/${at}`;
    const formula = section.formula ?? false;
    if (section.family) {
      const line = renderFamily(context(text, vars, facts), section.family, key);
      if (line) lines.push({ text: capitalise(line), formula });
    }
    if (section.list) {
      const list = items[section.list].slice(0, section.max ?? Infinity);
      list.forEach((item, n) => {
        const itemFacts = [...facts, n === 0 ? 'first' : 'later'];
        const line = renderFamily(
          context(text, { ...vars, ...item.vars }, itemFacts),
          item.family,
          `${key}/${n}`,
        );
        if (line) lines.push({ text: capitalise(line), formula });
      });
    }
  });
  return lines;
}

/** Picked like a template variant, keyed by the seed alone, so one guild keeps one chaplain. */
function pickChaplain(text: PeopleText, seed: string): string {
  return pickVariant(text.memorial.chaplains, `${seed}/chaplain`);
}
