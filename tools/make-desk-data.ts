// Data for the desk-density mock-up (R4, PLAN §9a): plays a 30-strong guild (six parties, the
// top-guild load of §9d) to the start of week 23 and writes its roster, weekly ledger, board,
// parties and latest letter into docs/design/mockups/desk-density.html between the DATA markers.
// Usage: node tools/make-desk-data.ts [seed=desk-1]
import { readFileSync, writeFileSync } from 'node:fs';
import {
  shapeOf,
  splitCoins,
  summariseQuest,
  writeQuestReport,
  type GameEvent,
  type PersonSlot,
} from '@adventure-manager/engine';
import { baseResolution, coinRates, names, reportText } from '@adventure-manager/content';
import { rules, runYear } from './year-sim-play.ts';

const seed = process.argv[2] ?? 'desk-1';
const WEEK = 23;
const SIZE = 30;
const PAGE = 'docs/design/mockups/desk-density.html';
const today = (WEEK - 1) * rules.daysPerWeek + 1;
const { state, events } = runYear(
  seed,
  { approach: 'assault', risk: 'steady', retreat: 'leader' },
  {
    size: SIZE,
    lastDay: today,
  },
);
const guild = state.guild!; // non-null: runYear founds the guild.
const weekOf = (day: number) => Math.floor((day - 1) / rules.daysPerWeek) + 1;
const coins = (copper: number) => {
  const c = splitCoins(copper, coinRates);
  return { negative: c.negative, g: c.gold, s: c.silver, c: c.copper, copper };
};
const fullName = (id: string) => {
  const a = state.roster.find((r) => r.id === id);
  return a?.name ? `${a.name.given} ${a.name.family}` : (names[id] ?? id);
};
const contractName = (templateId: string) => {
  const shape = shapeOf(templateId);
  if (!shape)
    return { site: names[templateId] ?? templateId, monster: '', twist: null, danger: '' };
  return {
    site: names[shape.siteId] ?? shape.siteId,
    monster: names[shape.monsterId] ?? shape.monsterId,
    twist: shape.twistId ? (names[shape.twistId] ?? shape.twistId) : null,
    danger: shape.danger,
  };
};

// Per-person record from events.
const record = new Map<
  string,
  {
    quests: number;
    won: number;
    hits: number;
    injuries: number;
    signedDay: number;
    diedDay: number | null;
    diedAt: string | null;
  }
>();
for (const a of state.roster)
  record.set(a.id, {
    quests: 0,
    won: 0,
    hits: 0,
    injuries: 0,
    signedDay: 1,
    diedDay: null,
    diedAt: null,
  });
const quests: {
  week: number;
  site: string;
  danger: string;
  outcome: string;
  party: string[];
  dead: string[];
}[] = [];
let from = -1;
events.forEach((e, at) => {
  if (e.type === 'recruit.signed') record.get(e.subjectIds[0] ?? '')!.signedDay = e.day; // non-null: every signed person is on the roster.
  if (e.type === 'quest.started') from = at;
  if (e.type !== 'quest.ended' || from < 0) return;
  const quest = events.slice(from, at + 1);
  const s = summariseQuest(quest, state.roster, baseResolution);
  const outcome = s.outcome;
  for (const id of s.partyIds) {
    const r = record.get(id)!; // non-null: party members are on the roster.
    r.quests += 1;
    if (outcome === 'won') r.won += 1;
    r.hits += s.hits[id] ?? 0;
  }
  for (const id of s.injuries) record.get(id)!.injuries += 1; // non-null: as above.
  const c = contractName(s.templateId);
  for (const d of s.deaths) {
    const r = record.get(d.id)!; // non-null: as above.
    r.diedDay = e.day;
    r.diedAt = c.site;
  }
  quests.push({
    week: weekOf(e.day),
    site: c.site,
    danger: c.danger,
    outcome,
    party: s.partyIds.map(fullName),
    dead: s.deaths.map((d) => fullName(d.id)),
  });
});

const away = new Map<string, { site: string; homeDay: number }>();
for (const p of guild.parties)
  if (p.homeDay > today)
    for (const id of p.memberIds)
      away.set(id, { site: contractName(p.offer.shownTemplateId).site, homeDay: p.homeDay });

const roster = state.roster.map((a) => {
  const m = guild.members.find((x) => x.id === a.id);
  const r = record.get(a.id)!; // non-null: seeded for everyone above.
  const trip = away.get(a.id);
  const status = a.dead
    ? { kind: 'dead', day: r.diedDay, where: r.diedAt }
    : trip
      ? { kind: 'away', where: trip.site, day: trip.homeDay }
      : m && m.outUntilDay > today
        ? { kind: 'out', day: m.outUntilDay }
        : { kind: 'fit' };
  return {
    id: a.id,
    name: fullName(a.id),
    pronouns: a.pronouns ?? 'they',
    class: names[a.classId] ?? a.classId,
    position: a.position,
    attributes: a.attributes,
    wage: coins(m?.wageCopper ?? 0),
    wageCopper: m?.wageCopper ?? 0,
    status,
    ...r,
  };
});

const reasons = ['grant', 'fee', 'loot', 'wages', 'upkeep', 'funeral', 'sign-on'] as const;
const weeks: { week: number; lines: Record<string, number>; chest: number }[] = [];
let chest = 0;
for (const e of events) {
  if (e.type !== 'money.changed') continue;
  const w = weekOf(e.day);
  while (weeks.length < w) weeks.push({ week: weeks.length + 1, lines: {}, chest });
  const row = weeks[w - 1]!; // non-null: filled up to w just above.
  if (e.reason !== 'founding') row.lines[e.reason] = (row.lines[e.reason] ?? 0) + e.amountCopper;
  else row.lines.founding = e.amountCopper;
  chest = e.chestCopper;
  row.chest = chest;
}

const board = guild.board.map((o) => ({
  id: o.id,
  ...contractName(o.shownTemplateId),
  fee: coins(o.feeCopper),
  feeCopper: o.feeCopper,
  travelDays: o.travelDays,
  expiresWeek: o.expiresWeek,
}));
const parties = guild.parties
  .filter((p) => p.homeDay > today)
  .map((p) => ({
    id: p.id,
    ...contractName(p.offer.shownTemplateId),
    members: p.memberIds.map(fullName),
    arriveDay: p.arriveDay,
    homeDay: p.homeDay,
    fee: coins(p.offer.feeCopper),
  }));

// The most recent letter home.
const lastEnd = events.map((e) => e.type).lastIndexOf('quest.ended');
const lastStart = events
  .slice(0, lastEnd)
  .map((e) => e.type)
  .lastIndexOf('quest.started');
const personOf = (id: string): PersonSlot => ({
  name: fullName(id),
  pronouns: state.roster.find((r) => r.id === id)?.pronouns ?? 'they',
});
const lastQuest: GameEvent[] = events.slice(lastStart, lastEnd + 1);
const letter = writeQuestReport(
  summariseQuest(lastQuest, state.roster, baseResolution),
  reportText,
  {
    personOf,
    nameOf: (id) => names[id] ?? id,
    seed,
  },
).map((l) => l.text);

const data = {
  seed,
  today,
  week: WEEK,
  dayOfWeek: 1,
  chest: coins(guild.chestCopper),
  renown: guild.renown,
  roster,
  weeks,
  reasons,
  board,
  parties,
  quests: quests.slice(-24).reverse(),
  letter,
};
const page = readFileSync(PAGE, 'utf8');
const start = page.indexOf('/*DATA*/');
const end = page.indexOf('/*END*/');
if (start < 0 || end < 0) throw new Error(`${PAGE} has no DATA markers.`);
writeFileSync(
  PAGE,
  `${page.slice(0, start)}/*DATA*/ ${JSON.stringify(data)} /*END*/${page.slice(end + '/*END*/'.length)}`,
);
console.log(
  `Wrote ${roster.length} people, ${weeks.length} weeks, ${board.length} offers, ${parties.length} parties out, ${quests.length} quests to ${PAGE}.`,
);
