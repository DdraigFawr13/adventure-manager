// Words for the step 4 page: every label comes from content (packages/content/data/step4.en.json),
// names from the content name tables; money and dates are only joined here, never computed as rules.
import {
  splitCoins,
  weekInYear,
  yearOf,
  type Adventurer,
  type PersonSlot,
} from '@adventure-manager/engine';
import {
  coinRates,
  houseIncidentGuildRules,
  names,
  peopleNames,
  step4Names,
  step4Text,
} from '@adventure-manager/content';

/** A label with `{slot}`s filled. */
export function t(key: string, vars: Readonly<Record<string, string | number>> = {}): string {
  return (step4Text[key] ?? key).replace(/\{(\w+)\}/g, (slot, k: string) =>
    vars[k] === undefined ? slot : String(vars[k]),
  );
}

/** A content id's display name. */
export function nameOf(id: string): string {
  return step4Names[id] ?? peopleNames[id] ?? names[id] ?? id;
}

/** A name that starts a sentence or heads a row ("the Fen Lanterns" → "The Fen Lanterns"). */
export function title(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function personOf(roster: readonly Adventurer[], id: string): PersonSlot {
  const a = roster.find((r) => r.id === id);
  return {
    name: a?.name ? `${a.name.given} ${a.name.family}` : nameOf(id),
    pronouns: a?.pronouns ?? 'they',
  };
}

/** Copper as the ledger shows it: "312 g 6 s", "8 s 4 c", "-3 g". */
export function money(copper: number): string {
  const c = splitCoins(copper, coinRates);
  const parts = [
    c.gold > 0 ? t('coin.gold', { n: c.gold }) : '',
    c.silver > 0 ? t('coin.silver', { n: c.silver }) : '',
    c.copper > 0 || copper === 0 ? t('coin.copper', { n: c.copper }) : '',
  ].filter(Boolean);
  return `${c.negative ? '−' : ''}${parts.join(' ')}`;
}

const rules = houseIncidentGuildRules;

/** "Wk 30 · Yr 1". */
export function date(day: number): string {
  return t('date', { week: weekInYear(day, rules), year: yearOf(day, rules) });
}

/** "Wk 30 Y1", the person card's history column. */
export function shortDate(day: number): string {
  return t('date.short', { week: weekInYear(day, rules), year: yearOf(day, rules) });
}

/** The day of the week, 1-7. */
export function weekday(day: number): number {
  return ((day - 1) % rules.daysPerWeek) + 1;
}
