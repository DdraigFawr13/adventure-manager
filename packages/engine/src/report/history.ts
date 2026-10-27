// Histories and memorial letters (SPEC.md, R7): each person's dated record read from the events,
// one short line per entry, and the letter written when someone dies. Views only: nothing here
// changes state, and the same events always give the same words (GAME-03).
import { renderFamily, type SlotValue, type TextContext } from '../core/text.ts';
import { shapeOf } from '../contract/compose.ts';
import { yearOf } from '../guild/turn.ts';
import type {
  Adventurer,
  Attribute,
  GameEvent,
  QuestOutcome,
  ResolutionContent,
} from '../resolution/types.ts';
import {
  summariseQuest,
  type DeathNote,
  type ReportOptions,
  type ReportText,
} from './quest-report.ts';

export type HistoryEntry =
  | { readonly kind: 'joined'; readonly day: number }
  | {
      readonly kind: 'quest';
      readonly day: number;
      readonly questId: string;
      readonly templateId: string;
      readonly outcome: QuestOutcome;
      readonly partyIds: readonly string[];
      readonly hits: number;
      readonly actions: Readonly<Record<string, number>>;
      /** Whom they held back from Dying, and who held them back (null if nobody). */
      readonly saved: readonly string[];
      readonly savedBy: string | null;
      readonly worst: number;
      /** The contract's last foe group: the one the letter names. */
      readonly foeId: string | null;
    }
  | { readonly kind: 'injured'; readonly day: number; readonly days: number }
  | {
      readonly kind: 'changed';
      readonly day: number;
      readonly attribute: Attribute;
      readonly to: number;
      readonly reason: 'growth' | 'age' | 'injury';
    }
  | { readonly kind: 'retired'; readonly day: number; readonly age: number }
  | {
      readonly kind: 'died';
      readonly day: number;
      readonly questId: string;
      readonly templateId: string;
      readonly cause: DeathNote['cause'];
      readonly foeId: string | null;
    };

/** Everyone's history from a run's events, oldest first. */
export function historyOf(
  events: readonly GameEvent[],
  roster: readonly Adventurer[],
  content: ResolutionContent,
): ReadonlyMap<string, readonly HistoryEntry[]> {
  const out = new Map<string, HistoryEntry[]>();
  const add = (id: string, entry: HistoryEntry) => {
    const list = out.get(id);
    if (list) list.push(entry);
    else out.set(id, [entry]);
  };
  let quest: GameEvent[] | null = null;
  for (const e of events) {
    if (e.type === 'quest.started') quest = [];
    if (quest) {
      quest.push(e);
      if (e.type !== 'quest.ended') continue;
      const s = summariseQuest(quest, roster, content);
      quest = null;
      const lastFoe = s.foeIds[s.foeIds.length - 1] ?? null;
      for (const id of s.partyIds) {
        add(id, {
          kind: 'quest',
          day: e.day,
          questId: s.questId,
          templateId: s.templateId,
          outcome: s.outcome,
          partyIds: s.partyIds,
          hits: s.hits[id] ?? 0,
          actions: s.actions[id] ?? {},
          saved: s.saves.filter(([healer]) => healer === id).map(([, patient]) => patient),
          savedBy: s.saves.find(([, patient]) => patient === id)?.[0] ?? null,
          worst: s.worst[id] ?? 0,
          foeId: lastFoe,
        });
      }
      for (const d of s.deaths)
        add(d.id, {
          kind: 'died',
          day: e.day,
          questId: s.questId,
          templateId: s.templateId,
          cause: d.cause,
          foeId: d.foeId,
        });
      continue;
    }
    const [who] = e.subjectIds;
    if (!who) continue;
    if (e.type === 'recruit.signed') add(who, { kind: 'joined', day: e.day });
    if (e.type === 'member.laid-up') add(who, { kind: 'injured', day: e.day, days: e.days });
    if (e.type === 'attribute.changed')
      add(who, { kind: 'changed', day: e.day, attribute: e.attribute, to: e.to, reason: e.reason });
    if (e.type === 'adventurer.retired') add(who, { kind: 'retired', day: e.day, age: e.age });
  }
  return out;
}

export interface HistoryText {
  /** One family per entry kind: `history.<kind>`. */
  readonly library: ReportText['library'];
}

export interface HistoryLine {
  readonly day: number;
  readonly text: string;
}

/** One line per entry, in the clerk's plain voice. */
export function writeHistory(
  personId: string,
  entries: readonly HistoryEntry[],
  text: HistoryText,
  report: ReportText,
  options: ReportOptions,
): HistoryLine[] {
  return entries.map((entry, n) => {
    const { vars, facts } = entrySlots(entry, options);
    const ctx: TextContext = {
      library: text.library,
      pronouns: report.pronouns,
      vars: { who: options.personOf(personId), ...vars },
      facts: new Set(facts),
      ...(options.mask ? { mask: true } : {}),
    };
    return {
      day: entry.day,
      text: capitalise(
        renderFamily(ctx, `history.${entry.kind}`, `${options.seed}/${personId}/${n}`),
      ),
    };
  });
}

function entrySlots(
  entry: HistoryEntry,
  options: ReportOptions,
): { vars: Record<string, SlotValue>; facts: string[] } {
  switch (entry.kind) {
    case 'joined':
      return { vars: {}, facts: [] };
    case 'quest': {
      const facts = [`outcome.${entry.outcome}`];
      if (entry.saved.length > 0) facts.push('saved');
      if (entry.savedBy) facts.push('was-saved');
      if (entry.hits >= 3) facts.push('hits');
      const vars: Record<string, SlotValue> = {
        quest: siteName(entry.templateId, options),
        foe: entry.foeId ? options.nameOf(entry.foeId) : '',
        count: entry.hits,
      };
      const patient = entry.saved[0];
      if (patient) vars.patient = options.personOf(patient);
      if (entry.savedBy) vars.saver = options.personOf(entry.savedBy);
      return { vars, facts };
    }
    case 'injured':
      return { vars: { days: entry.days }, facts: [] };
    case 'changed':
      return {
        vars: { attribute: options.nameOf(`attribute.${entry.attribute}`), to: entry.to },
        facts: [entry.reason],
      };
    case 'retired':
      return { vars: { age: entry.age }, facts: [] };
    case 'died':
      return {
        vars: {
          quest: siteName(entry.templateId, options),
          foe: entry.foeId ? options.nameOf(entry.foeId) : '',
        },
        facts: [entry.cause === 'foe' ? 'struck' : entry.cause],
      };
  }
}

/** A composed contract is named by its site; a fixed quest template by its own id. */
function siteName(templateId: string, options: ReportOptions): string {
  const shape = shapeOf(templateId);
  return options.nameOf(shape ? shape.siteId : templateId);
}

function capitalise(line: string): string {
  return line.charAt(0).toUpperCase() + line.slice(1);
}

// --- Memorial letters ---------------------------------------------------------------------------

export interface MemorialText {
  readonly sections: readonly { readonly family: string; readonly formula?: boolean }[];
  readonly library: ReportText['library'];
  /** Who signs when no comrade is left. */
  readonly clerk: string;
  /** Best deed first: the facts `deed.<kind>` a letter can remember. */
  readonly deeds: readonly ('saved' | 'guard' | 'striker' | 'mend')[];
}

export interface Memorial {
  /** The comrade who writes, or null when the guild clerk does. */
  readonly writerId: string | null;
  readonly lines: readonly { readonly text: string; readonly formula: boolean }[];
}

const STRIKER_MIN = 4;
const MEMORIAL_REPICKS = 12;
const YOUNG = 25;
const VETERAN = 35;

/**
 * The letter for someone who died, from everyone's histories. `deadAfter` lists who was dead or
 * gone from the roster after the death, so a fallen or retired comrade does not write.
 */
export function writeMemorial(
  deadId: string,
  histories: ReadonlyMap<string, readonly HistoryEntry[]>,
  roster: readonly Adventurer[],
  content: ResolutionContent,
  text: MemorialText,
  report: ReportText,
  options: ReportOptions & {
    readonly goneIds: ReadonlySet<string>;
    /**
     * Sentence shapes the save's earlier letters used (masked text). A section re-picks a few
     * times to avoid them, and the chosen shapes are added, so letters in one save rarely repeat.
     * Write a save's letters in death order with one set, and every replay reads the same.
     */
    readonly used?: Set<string>;
  },
): Memorial {
  const mine = histories.get(deadId) ?? [];
  const death = mine.find((e) => e.kind === 'died');
  if (death?.kind !== 'died') throw new Error(`${deadId} has no death in their history.`);
  const quests = mine.filter((e) => e.kind === 'quest');
  const joined = mine.find((e) => e.kind === 'joined');
  const writer = comrade(deadId, quests, options.goneIds);
  const writerId = writer?.id ?? null;
  const person = roster.find((a) => a.id === deadId);
  const rules = content.guild;
  const deathYear = rules ? yearOf(death.day, rules) : 1;
  const age = person?.birthYear === undefined ? null : deathYear - person.birthYear;
  const years = joined && rules ? deathYear - yearOf(joined.day, rules) : 0;

  const facts = new Set<string>([
    quests.length <= 1 ? 'quests.one' : quests.length <= 5 ? 'quests.few' : 'quests.many',
    joined && rules && death.day - joined.day < rules.weeksPerYear * rules.daysPerWeek
      ? 'served.short'
      : 'served.long',
    death.cause === 'foe' ? 'struck' : death.cause,
    writerId ? 'writer' : 'clerk',
  ]);
  if (person) facts.add(`class.${person.classId}`);
  if (age !== null && age < YOUNG) facts.add('young');
  if (age !== null && age >= VETERAN) facts.add('veteran');
  const fatal = quests.find((q) => q.questId === death.questId);
  if (writerId && fatal?.partyIds.includes(writerId)) facts.add('together');
  if (quests.length === 1) facts.add('first-is-last');
  if (writer && writer.shared * 2 >= quests.length) facts.add('close');
  const deed = bestDeed(quests, text.deeds);
  facts.add(`deed.${deed?.kind ?? 'none'}`);

  const first = quests[0];
  const vars: Record<string, SlotValue> = {
    dead: options.personOf(deadId),
    writer: writerId ? options.personOf(writerId) : text.clerk,
    first: first ? siteName(first.templateId, options) : '',
    quest: siteName(death.templateId, options),
    killer: death.foeId ? options.nameOf(death.foeId) : '',
    count: quests.length,
    years,
  };
  if (age !== null) vars.age = age;
  if (deed?.patient) vars.patient = options.personOf(deed.patient);
  if (deed?.patient && deed.patient === writerId) facts.add('saved-writer');
  if (deed?.site) vars.deedQuest = siteName(deed.site, options);

  const lines = text.sections.flatMap((section, at) => {
    const ctx: TextContext = { library: text.library, pronouns: report.pronouns, vars, facts };
    const key = `${options.seed}/memorial/${deadId}/${at}`;
    let chosen = key;
    for (let n = 0; n < MEMORIAL_REPICKS && options.used && !section.formula; n += 1) {
      chosen = n === 0 ? key : `${key}/again${n}`;
      if (!options.used.has(renderFamily({ ...ctx, mask: true }, section.family, chosen))) break;
    }
    const shape = renderFamily({ ...ctx, mask: true }, section.family, chosen);
    if (options.used && !section.formula && shape) options.used.add(shape);
    const line = renderFamily(options.mask ? { ...ctx, mask: true } : ctx, section.family, chosen);
    return line ? [{ text: capitalise(line), formula: section.formula ?? false }] : [];
  });
  return { writerId, lines };
}

type QuestEntry = Extract<HistoryEntry, { kind: 'quest' }>;

/** The living comrade with the most shared contracts (ties: the latest shared one, then id). */
function comrade(
  deadId: string,
  quests: readonly QuestEntry[],
  gone: ReadonlySet<string>,
): { id: string; shared: number } | null {
  const shared = new Map<string, { count: number; last: number }>();
  quests.forEach((q, at) => {
    for (const id of q.partyIds) {
      if (id === deadId || gone.has(id)) continue;
      const s = shared.get(id) ?? { count: 0, last: -1 };
      shared.set(id, { count: s.count + 1, last: at });
    }
  });
  const best = [...shared].sort(
    ([a, x], [b, y]) => y.count - x.count || y.last - x.last || (a < b ? -1 : 1),
  )[0];
  return best ? { id: best[0], shared: best[1].count } : null;
}

/** The deed a letter should remember: the first kind in the content's order that they ever did. */
function bestDeed(
  quests: readonly QuestEntry[],
  order: MemorialText['deeds'],
): { kind: MemorialText['deeds'][number]; patient?: string; site?: string } | null {
  for (const kind of order) {
    const q = quests.find((e) =>
      kind === 'saved'
        ? e.saved.length > 0
        : kind === 'striker'
          ? e.hits >= STRIKER_MIN
          : (e.actions[`action.${kind}`] ?? 0) > 0,
    );
    if (!q) continue;
    return kind === 'saved' && q.saved[0]
      ? { kind, patient: q.saved[0], site: q.templateId }
      : { kind, site: q.templateId };
  }
  return null;
}
