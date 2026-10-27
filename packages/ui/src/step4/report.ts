// The Copy report (D-198): the R7 answers, the play log and every person's history, as plain text
// the owner pastes into the chat, so the session can check the answers against what happened.
import { writeBackground, writeHistoryLine } from '@adventure-manager/engine';
import { peopleText } from '@adventure-manager/content';
import type { Save } from './game.ts';
import { date, nameOf, personOf, shortDate, t } from './words.ts';

/** One person's history lines, oldest first, as the person card writes them. */
export function historyLines(save: Save, id: string): { day: number; text: string }[] {
  const options = {
    personOf: (other: string) => personOf(save.state.roster, other),
    nameOf,
    seed: save.seed,
  };
  const entries = save.chronicle.people[id]?.entries ?? [];
  return entries.map((entry, at) => ({
    day: entry.day,
    text: writeHistoryLine(id, entry, at, peopleText, options),
  }));
}

export function backgroundLine(save: Save, id: string): string {
  const who = save.state.roster.find((a) => a.id === id);
  if (!who) return '';
  return writeBackground(who, peopleText, {
    personOf: (other: string) => personOf(save.state.roster, other),
    nameOf,
    seed: save.seed,
  });
}

export function buildReport(save: Save): string {
  const out: string[] = [];
  out.push(t('report.head', { seed: save.seed, date: date(save.state.calendar) }));
  out.push('');
  for (const s of save.sittings) {
    out.push(t('report.sitting', { no: s.no, date: date(s.day), minutes: s.minutes }));
    if (s.skipped) out.push(`  ${t('report.skipped')}`);
    else s.answers.forEach((a, n) => out.push(`  ${n + 1}. ${a || t('report.blank')}`));
  }
  out.push('');
  out.push(t('report.log'));
  for (const e of save.log)
    out.push(
      `  S${e.sitting} ${shortDate(e.day)}: ${t(`log.${e.what}`, {
        a: e.ids[0] ? label(save, e.ids[0]) : '',
        b: e.ids[1] ? label(save, e.ids[1]) : '',
      })}`,
    );
  out.push('');
  out.push(t('report.people'));
  for (const a of save.state.roster) {
    const status = a.dead
      ? t('status.dead')
      : a.retiredYear !== undefined
        ? t('status.retired')
        : '';
    out.push(
      `${personOf(save.state.roster, a.id).name} (${nameOf(a.classId)}${status ? `, ${status}` : ''})`,
    );
    const background = backgroundLine(save, a.id);
    if (background) out.push(`  ${background}`);
    for (const line of historyLines(save, a.id)) out.push(`  ${shortDate(line.day)}: ${line.text}`);
  }
  return out.join('\n');
}

/** A person's name, or a content id's name (a site, a party). */
function label(save: Save, id: string): string {
  if (save.state.roster.some((a) => a.id === id)) return personOf(save.state.roster, id).name;
  return nameOf(id);
}
