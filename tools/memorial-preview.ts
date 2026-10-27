// Memorial and history previewer (R7, PLAN §8): plays guild careers with careers on, then prints
// some people's histories and every memorial letter, and counts repeated memorial sentences.
// Usage: node tools/memorial-preview.ts [careers=4] [years=2] [histories=3]
import {
  historyOf,
  writeHistory,
  writeMemorial,
  yearOf,
  weekInYear,
  type PersonSlot,
} from '@adventure-manager/engine';
import {
  baseResolution,
  careerGuildRules,
  historyText,
  memorialText,
  names,
  reportText,
} from '@adventure-manager/content';
import { POLICIES, rules, runYear } from './year-sim-play.ts';

const careers = Number(process.argv[2] ?? 4);
const years = Number(process.argv[3] ?? 2);
const showHistories = Number(process.argv[4] ?? 3);
const content = { ...baseResolution, guild: careerGuildRules };
const yearDays = rules.weeksPerYear * rules.daysPerWeek;
const date = (day: number) =>
  `Y${yearOf(day, rules)} W${String(weekInYear(day, rules)).padStart(2, '0')}`;

const masked = new Map<string, number>();
let letters = 0;
/** The most times one sentence shape appears within a single save (what a player would notice). */
let worstInSave = 0;
for (let n = 0; n < careers; n += 1) {
  const seed = `memorial-${n}`;
  const { state, events } = runYear(seed, POLICIES.default!, {
    content,
    lastDay: years * yearDays,
  }); // non-null: a fixed policy.
  const personOf = (id: string): PersonSlot => {
    const a = state.roster.find((r) => r.id === id);
    return {
      name: a?.name ? `${a.name.given} ${a.name.family}` : (names[id] ?? id),
      pronouns: a?.pronouns ?? 'they',
    };
  };
  const nameOf = (id: string) => names[id] ?? id;
  const histories = historyOf(events, state.roster, content);
  const inSave = new Map<string, number>();
  const used = new Set<string>();
  console.log(
    `\n=== ${seed}: ${state.roster.length} people, ${state.roster.filter((a) => a.dead).length} dead`,
  );
  const busiest = [...histories]
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, showHistories);
  for (const [id, entries] of busiest) {
    console.log(`\n-- ${personOf(id).name}`);
    for (const line of writeHistory(id, entries, historyText, reportText, {
      personOf,
      nameOf,
      seed,
    }))
      console.log(`  ${date(line.day)}  ${line.text}`);
  }
  // Letters are written in the order people died, sharing one set of used sentence shapes.
  const dayOfDeath = (id: string) => histories.get(id)?.find((e) => e.kind === 'died')?.day ?? 0;
  const fallen = state.roster
    .filter((r) => r.dead)
    .sort((x, y) => dayOfDeath(x.id) - dayOfDeath(y.id));
  for (const a of fallen) {
    const death = histories.get(a.id)?.find((e) => e.kind === 'died');
    if (!death) continue;
    // Who was gone (dead or retired) by the end of the day the person died.
    const goneIds = new Set(
      [...histories]
        .filter(
          ([other, list]) =>
            other !== a.id &&
            list.some((e) => (e.kind === 'died' || e.kind === 'retired') && e.day <= death.day),
        )
        .map(([other]) => other),
    );
    const before = new Set(used);
    const opts = { personOf, nameOf, seed, goneIds, used };
    const memorial = writeMemorial(
      a.id,
      histories,
      state.roster,
      content,
      memorialText,
      reportText,
      opts,
    );
    console.log(`\n~~ Memorial for ${personOf(a.id).name} (${date(death.day)})`);
    for (const line of memorial.lines) console.log(`  ${line.text}`);
    letters += 1;
    // The same letter again, masked, from the used set as it was before: the same picks.
    const shapes = writeMemorial(a.id, histories, state.roster, content, memorialText, reportText, {
      ...opts,
      used: before,
      mask: true,
    });
    for (const line of shapes.lines.filter((l) => !l.formula)) {
      masked.set(line.text, (masked.get(line.text) ?? 0) + 1);
      inSave.set(line.text, (inSave.get(line.text) ?? 0) + 1);
    }
  }
  const worstHere = Math.max(0, ...inSave.values());
  if (worstHere >= 4)
    console.log(
      `!! ${seed}: ${[...inSave]
        .filter(([, c]) => c === worstHere)
        .map(([t]) => t)
        .join(' | ')}`,
    );
  worstInSave = Math.max(worstInSave, worstHere);
}
const top = [...masked].sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log(`\n${letters} memorial letters; most used sentence shapes:`);
for (const [s, c] of top) console.log(`  ${c}×  ${s}`);
console.log(`Most uses of one sentence shape within a single save: ${worstInSave}`);
