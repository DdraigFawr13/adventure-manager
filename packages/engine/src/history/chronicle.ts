// People's histories (SPEC.md, D-196): a chronicle folded from events. It is a view, like the quest
// report: it never changes the game state, and the same events always give the same chronicle.
import { shapeOf } from '../contract/compose.ts';
import type { Attribute, GameEvent, GameState, QuestOutcome } from '../resolution/types.ts';
import { WOUND } from '../resolution/types.ts';
import type { DeathNote, DeedKind, ReportText } from '../report/quest-report.ts';
import { assignDeeds, summariseQuest } from '../report/quest-report.ts';

/** Content numbers for histories: when comrades become friends, and the deed ranking (the quest report's). */
export interface HistoryRules {
  readonly friendAfterQuests: number;
  readonly deeds: ReportText['deeds'];
}

export interface DeedEntry {
  readonly kind: DeedKind;
  readonly count: number;
  readonly patientId?: string;
}

export type HistoryEntry = { readonly day: number } & (
  | {
      readonly kind: 'joined';
      founding: boolean;
      /** The standing party joined on the day, by its name id. */
      partyNameId: string | null;
    }
  | {
      readonly kind: 'quest';
      readonly questId: string;
      readonly siteId: string;
      readonly outcome: QuestOutcome;
      readonly partyNameId: string | null;
      /** Worst wound step reached. */
      readonly worst: number;
      readonly deed: DeedEntry | null;
      /** Who wrote the letter home (report/SPEC.md), fixed when the quest ended; views writing the letter later use this. */
      readonly writerId: string | null;
      /** Who held them back from Dying, if anyone did. */
      readonly savedBy: string | null;
      /** They died on it (a `died` entry follows). */
      readonly died: boolean;
    }
  | { readonly kind: 'injured'; readonly days: number; readonly siteId: string | null }
  | {
      readonly kind: 'attribute';
      readonly attribute: Attribute;
      readonly from: number;
      readonly to: number;
      readonly reason: 'growth' | 'age' | 'injury' | 'training';
    }
  | { readonly kind: 'friend'; readonly withId: string; readonly quests: number }
  | { readonly kind: 'fell-ill'; readonly days: number }
  | {
      readonly kind: 'died';
      readonly questId: string;
      readonly siteId: string;
      readonly cause: DeathNote['cause'];
      readonly foeId: string | null;
      /** The quest's writer, who leads the reaction in the memorial; null if nobody came back. */
      readonly writerId: string | null;
      readonly partyNameId: string | null;
    }
  | { readonly kind: 'retired'; readonly age: number }
);

export interface PersonHistory {
  readonly entries: HistoryEntry[];
  quests: number;
  won: number;
  injuries: number;
  readonly friends: string[];
}

export interface Chronicle {
  readonly people: Record<string, PersonHistory>;
  /** Quests set out on together, per pair `a|b` with a before b. */
  readonly together: Record<string, number>;
  /** Each site's last outcome, for the March. */
  readonly places: Record<string, { readonly day: number; readonly outcome: QuestOutcome }>;
  /** Standing party name id of each quest out (`run.party.N`), until it ends. */
  readonly out: Record<string, string | null>;
  /** Each standing party's name id, from `party.formed`, so a disbanded party keeps its name. */
  readonly partyNames: Record<string, string>;
}

export function newChronicle(): Chronicle {
  return { people: {}, together: {}, places: {}, out: {}, partyNames: {} };
}

/** The pair key for two people, order-free. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** The site a contract is at: a composed contract's site, else its template. */
export function siteOf(templateId: string): string {
  return shapeOf(templateId)?.siteId ?? templateId;
}

function personOf(chronicle: Chronicle, id: string): PersonHistory {
  return (chronicle.people[id] ??= { entries: [], quests: 0, won: 0, injuries: 0, friends: [] });
}

function lastEntry(chronicle: Chronicle, id: string): HistoryEntry | undefined {
  const entries = chronicle.people[id]?.entries ?? [];
  return entries[entries.length - 1];
}

/**
 * Folds one command's events into the chronicle, in place. `state` is the state after the command
 * (roster, standing parties, templates); call once per command, in order.
 */
export function recordEvents(
  chronicle: Chronicle,
  events: readonly GameEvent[],
  state: GameState,
  rules: HistoryRules,
): void {
  let questStart = -1;
  const nameOfStanding = (id: string | null) =>
    id === null ? null : (chronicle.partyNames[id] ?? null);
  events.forEach((e, at) => {
    const [subject = ''] = e.subjectIds;
    const add = (id: string, entry: HistoryEntry) => personOf(chronicle, id).entries.push(entry);
    switch (e.type) {
      case 'recruit.signed':
        add(subject, { day: e.day, kind: 'joined', founding: false, partyNameId: null });
        break;
      case 'founding.picked':
        for (const id of e.subjectIds) {
          const entry = lastEntry(chronicle, id);
          if (entry?.kind === 'joined') entry.founding = true;
        }
        break;
      case 'party.formed':
        chronicle.partyNames[subject] = e.nameId;
        break;
      case 'party.assigned': {
        const entry = lastEntry(chronicle, subject);
        if (entry?.kind === 'joined' && entry.day === e.day && e.to !== null)
          entry.partyNameId = nameOfStanding(e.to);
        break;
      }
      case 'party.departed':
        chronicle.out[`run.${subject}`] = nameOfStanding(e.standingId);
        break;
      case 'quest.started':
        questStart = at;
        break;
      case 'quest.ended':
        if (questStart >= 0) recordQuest(chronicle, events.slice(questStart, at + 1), state, rules);
        questStart = -1;
        break;
      case 'member.laid-up': {
        const entries = chronicle.people[subject]?.entries ?? [];
        const quest = [...entries].reverse().find((x) => x.kind === 'quest');
        add(subject, {
          day: e.day,
          kind: 'injured',
          days: e.days,
          siteId: quest?.kind === 'quest' ? quest.siteId : null,
        });
        personOf(chronicle, subject).injuries += 1;
        break;
      }
      case 'attribute.changed':
        add(subject, {
          day: e.day,
          kind: 'attribute',
          attribute: e.attribute,
          from: e.from,
          to: e.to,
          reason: e.reason,
        });
        break;
      case 'member.fell-ill':
        add(subject, { day: e.day, kind: 'fell-ill', days: e.days });
        break;
      case 'adventurer.retired':
        add(subject, { day: e.day, kind: 'retired', age: e.age });
        break;
      default:
        break;
    }
  });
}

/** One quest's entries: each member's quest line, deaths, bonds and the site's last result. */
function recordQuest(
  chronicle: Chronicle,
  events: readonly GameEvent[],
  state: GameState,
  rules: HistoryRules,
): void {
  const summary = summariseQuest(events, state.roster, state.content);
  const day = events[events.length - 1]?.day ?? 0;
  const siteId = siteOf(summary.templateId);
  const partyNameId = chronicle.out[summary.questId] ?? null;
  delete chronicle.out[summary.questId];
  const writer = summary.writerId;
  // The letter's pass first, so every deed it praises is in a history; then the writer's best
  // deed of a kind nobody else was given.
  const notes = assignDeeds(summary, rules.deeds, writer ? [writer] : []);
  if (writer) {
    const others = summary.partyIds.filter((id) => id !== writer);
    const left = rules.deeds.filter((d) => !notes.some((n) => n.kind === d.kind));
    notes.push(...assignDeeds(summary, left, others).filter((n) => n.id === writer));
  }
  const dead = new Map(summary.deaths.map((d) => [d.id, d]));
  for (const id of summary.partyIds) {
    const person = personOf(chronicle, id);
    const note = notes.find((n) => n.id === id);
    const save = summary.saves.find(([, patient]) => patient === id);
    person.entries.push({
      day,
      kind: 'quest',
      questId: summary.questId,
      siteId,
      outcome: summary.outcome,
      partyNameId,
      worst: summary.worst[id] ?? WOUND.fit,
      deed: note
        ? {
            kind: note.kind,
            count: note.count,
            ...(note.patientId !== undefined && { patientId: note.patientId }),
          }
        : null,
      writerId: writer,
      savedBy: save ? save[0] : null,
      died: dead.has(id),
    });
    person.quests += 1;
    if (summary.outcome === 'won') person.won += 1;
    const death = dead.get(id);
    if (death)
      person.entries.push({
        day,
        kind: 'died',
        questId: summary.questId,
        siteId,
        cause: death.cause,
        foeId: death.foeId,
        writerId: writer,
        partyNameId,
      });
  }
  summary.partyIds.forEach((a, n) => {
    for (const b of summary.partyIds.slice(n + 1)) {
      const key = pairKey(a, b);
      const count = (chronicle.together[key] ?? 0) + 1;
      chronicle.together[key] = count;
      if (count !== rules.friendAfterQuests || dead.has(a) || dead.has(b)) continue;
      for (const [x, y] of [
        [a, b],
        [b, a],
      ] as const) {
        personOf(chronicle, x).friends.push(y);
        personOf(chronicle, x).entries.push({ day, kind: 'friend', withId: y, quests: count });
      }
    }
  });
  chronicle.places[siteId] = { day, outcome: summary.outcome };
}
