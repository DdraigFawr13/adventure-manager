// What the Guild Desk shows, read from the state and the events (GAME-02: no rule is recomputed
// here). Words come from content text; letters and histories come from the engine's report views.
import {
  fillTemplate,
  historyOf,
  splitCoins,
  stopDays,
  summariseQuest,
  weekInYear,
  writeHistory,
  writeMemorial,
  writeQuestReport,
  yearOf,
  WOUND,
  type Adventurer,
  type GameEvent,
  type GameState,
  type HistoryEntry,
  type PersonSlot,
  type ReportOptions,
  type StopReason,
} from '@adventure-manager/engine';
import {
  coinRates,
  deskText,
  historyText,
  memorialText,
  names,
  reportText,
} from '@adventure-manager/content';
import { content, rules } from './session.ts';

export const t = (key: string, vars: Record<string, string | number> = {}): string =>
  fillTemplate(
    deskText[key] ?? key,
    Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)])),
  );

export const nameOf = (id: string): string => names[id] ?? deskText[id] ?? id;

export function personName(a: Adventurer | undefined, id: string): string {
  return a?.name ? `${a.name.given} ${a.name.family}` : (names[id] ?? id);
}

export function options(state: GameState): ReportOptions {
  const personOf = (id: string): PersonSlot => {
    const a = state.roster.find((r) => r.id === id);
    return { name: personName(a, id), pronouns: a?.pronouns ?? 'they' };
  };
  return { personOf, nameOf, seed: state.seed };
}

export function coins(copper: number): string {
  const sign = copper < 0 ? '−' : '';
  const c = splitCoins(Math.abs(copper), coinRates);
  const parts = (['gold', 'silver', 'copper'] as const)
    .filter((k, i, all) => c[k] > 0 || (i === all.length - 1 && copper === 0))
    .map((k) => `${c[k]}${t(`coins.${k}`)}`);
  return sign + parts.join(' ');
}

export const yearAt = (day: number): number => yearOf(day, rules);
export const dateOf = (day: number): string =>
  t('date', { year: yearOf(day, rules), week: weekInYear(day, rules) });

export function ageOf(a: Adventurer, day: number): number | null {
  return a.birthYear === undefined ? null : yearOf(day, rules) - a.birthYear;
}

export type Status = 'ready' | 'resting' | 'away' | 'dead' | 'retired';

export function statusOf(state: GameState, a: Adventurer): { status: Status; label: string } {
  if (a.dead) return { status: 'dead', label: t('status.dead') };
  const member = state.guild?.members.find((m) => m.id === a.id);
  if (!member) return { status: 'retired', label: t('status.retired') };
  if (member.away) return { status: 'away', label: t('status.away') };
  if (member.outUntilDay > state.calendar)
    return {
      status: 'resting',
      label: t('status.resting', { week: weekInYear(member.outUntilDay, rules) }),
    };
  return { status: 'ready', label: t('status.ready') };
}

export interface Letter {
  readonly id: string;
  readonly day: number;
  readonly kind: 'home' | 'memorial';
  readonly title: string;
  readonly about: string | null;
  readonly lines: readonly { readonly text: string; readonly formula: boolean }[];
}

export interface GuildRecord {
  readonly histories: ReadonlyMap<string, readonly HistoryEntry[]>;
  readonly letters: readonly Letter[];
}

/**
 * Every letter so far, newest first: one home from each contract, and a memorial for each death
 * in the order people died, sharing one set of used sentences (report SPEC.md).
 */
export function recordOf(state: GameState, events: readonly GameEvent[]): GuildRecord {
  const histories = historyOf(events, state.roster, content);
  const opts = options(state);
  const letters: Letter[] = [];
  let from = -1;
  events.forEach((e, at) => {
    if (e.type === 'quest.started') from = at;
    if (e.type !== 'quest.ended' || from < 0) return;
    const summary = summariseQuest(events.slice(from, at + 1), state.roster, content);
    letters.push({
      id: `home-${summary.questId}`,
      day: e.day,
      kind: 'home',
      title: t('letterHome', { quest: siteName(summary.templateId) }),
      about: null,
      lines: writeQuestReport(summary, reportText, opts),
    });
  });
  const deathDay = (id: string) => histories.get(id)?.find((h) => h.kind === 'died')?.day ?? 0;
  const used = new Set<string>();
  for (const a of state.roster
    .filter((r) => r.dead)
    .sort((x, y) => deathDay(x.id) - deathDay(y.id))) {
    const day = deathDay(a.id);
    const goneIds = new Set(
      [...histories]
        .filter(
          ([id, list]) =>
            id !== a.id &&
            list.some((h) => (h.kind === 'died' || h.kind === 'retired') && h.day <= day),
        )
        .map(([id]) => id),
    );
    const memorial = writeMemorial(
      a.id,
      histories,
      state.roster,
      content,
      memorialText,
      reportText,
      {
        ...opts,
        goneIds,
        used,
      },
    );
    letters.push({
      id: `memorial-${a.id}`,
      day,
      kind: 'memorial',
      title: t('memorial', { who: personName(a, a.id) }),
      about: a.id,
      lines: memorial.lines,
    });
  }
  letters.sort((x, y) => y.day - x.day || (x.kind === 'memorial' ? -1 : 1));
  return { histories, letters };
}

/** A history line is notable unless it is a routine, cleanly won contract. */
export function notable(entry: HistoryEntry): boolean {
  if (entry.kind !== 'quest') return true;
  return (
    entry.outcome !== 'won' ||
    entry.hits >= 3 ||
    entry.saved.length > 0 ||
    entry.savedBy !== null ||
    entry.worst >= WOUND.badlyHurt
  );
}

export function historyLines(state: GameState, id: string, entries: readonly HistoryEntry[]) {
  const lines = writeHistory(id, entries, historyText, reportText, options(state));
  return lines.map((line, n) => ({ ...line, notable: notable(entries[n]!) })); // non-null: one line per entry.
}

/** The stops the latest `continue` reached, in the engine's order. */
export function stopsOf(events: readonly GameEvent[], from: number): StopReason[] {
  return events.slice(from).flatMap((e) => (e.type === 'stop.raised' ? [e.reason] : []));
}

/** Short lines for what happened since the last stop. */
export function digestOf(state: GameState, events: readonly GameEvent[], from: number): string[] {
  const who = (id: string | undefined) =>
    personName(
      state.roster.find((a) => a.id === id),
      id ?? '',
    );
  const lines: string[] = [];
  const signed: string[] = [];
  for (const e of events.slice(from)) {
    switch (e.type) {
      case 'party.returned': {
        const [partyId = '', ...members] = e.subjectIds;
        const site = siteOfParty(events, partyId);
        lines.push(
          t('event.returned', {
            party: members.map((m) => who(m).split(' ')[0]).join(', '),
            quest: site,
            outcome: t(`outcome.${e.outcome}`),
          }),
        );
        break;
      }
      case 'adventurer.died':
        lines.push(t('event.died', { who: who(e.subjectIds[0]) }));
        break;
      case 'adventurer.retired':
        lines.push(t('event.retired', { who: who(e.subjectIds[0]), age: e.age }));
        break;
      case 'recruit.signed':
        signed.push(who(e.subjectIds[0]));
        break;
      case 'tier.changed':
        lines.push(t('event.tier', { tier: t(`tier.${e.to}`) }));
        break;
      case 'patron.reviewed':
        lines.push(
          t('event.reviewed', {
            change: e.change > 0 ? `+${e.change}` : e.change,
            confidence: e.confidence,
          }),
        );
        break;
      case 'crisis.started':
        lines.push(t('event.crisis', { crisis: t(e.chainId) }));
        break;
      case 'crisis.ended':
        lines.push(t('event.crisisEnded', { crisis: t(e.chainId) }));
        break;
      case 'attribute.changed':
        if (e.reason === 'growth')
          lines.push(
            t('event.grew', {
              who: who(e.subjectIds[0]),
              attribute: nameOf(`attribute.${e.attribute}`),
              to: e.to,
            }),
          );
        break;
      default:
        break;
    }
  }
  // A founding signs a whole roster at once: one line, not fifteen.
  if (signed.length > 3) lines.unshift(t('event.signedMany', { count: signed.length }));
  else lines.unshift(...signed.map((name) => t('event.signed', { who: name })));
  return lines;
}

/** The site a party went to, from its departure event and the offer it took. */
function siteOfParty(events: readonly GameEvent[], partyId: string): string {
  const left = events.find((e) => e.type === 'party.departed' && e.subjectIds[0] === partyId);
  const offerId = left?.subjectIds[1];
  const posted = events.find((e) => e.type === 'offer.posted' && e.subjectIds[0] === offerId);
  if (posted?.type !== 'offer.posted') return '';
  return siteName(posted.templateId);
}

export function siteName(templateId: string): string {
  return templateId.startsWith('shape:')
    ? nameOf(templateId.slice('shape:'.length).split('+')[0] ?? '')
    : nameOf(templateId);
}

/** The board's view of a contract: site, monster kind, a shown twist. */
export function offerParts(templateId: string): {
  site: string;
  monster: string;
  twist: string | null;
} {
  if (!templateId.startsWith('shape:'))
    return { site: nameOf(templateId), monster: '', twist: null };
  const [site = '', monster = '', twist = 'plain'] = templateId.slice('shape:'.length).split('+');
  return {
    site: nameOf(site),
    monster: nameOf(monster),
    twist: twist === 'plain' ? null : nameOf(twist),
  };
}

/** Stop days and active minutes per in-game year, deaths, roster: the playtest log (D-088). */
export function playtestLog(
  state: GameState,
  events: readonly GameEvent[],
  seconds: readonly number[],
  notes: string,
  meta: { seed: string; startedAt: string; version: number },
): string {
  const stops = stopDays(events);
  const lastYear = yearOf(state.calendar, rules);
  const out = [
    'Guild Desk playtest log',
    `seed ${meta.seed} · save version ${meta.version} · started ${meta.startedAt}`,
    `now ${dateOf(state.calendar)} · chest ${coins(state.guild?.chestCopper ?? 0)} · renown ${state.guild?.renown ?? 0}`,
    '',
  ];
  for (let y = 1; y <= lastYear; y += 1) {
    const days = stops.filter((d) => yearOf(d, rules) === y).length;
    const deaths = events
      .filter((e) => e.type === 'adventurer.died' && yearOf(e.day, rules) === y)
      .map((e) =>
        personName(
          state.roster.find((a) => a.id === e.subjectIds[0]),
          e.subjectIds[0] ?? '',
        ),
      );
    out.push(
      `Year ${y}: ${days} stop days, ${Math.round((seconds[y - 1] ?? 0) / 60)} active minutes, deaths: ${deaths.join(', ') || 'none'}`,
    );
  }
  out.push('', 'Roster:');
  for (const a of state.roster) {
    const age = ageOf(a, state.calendar);
    out.push(
      `- ${personName(a, a.id)}, ${nameOf(a.classId)}${age === null ? '' : `, ${age}`}: ${statusOf(state, a).label}`,
    );
  }
  out.push('', 'Notes:', notes || '(none)');
  return out.join('\n');
}
