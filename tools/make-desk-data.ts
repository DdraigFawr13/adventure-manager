// Data for the desk-density mock-up (R4, PLAN §9a): plays a 30-strong guild (six parties, the
// top-guild load of §9d) to the start of week 23 and writes its roster, weekly ledger, board,
// parties and latest letter into a mock-up page between the DATA markers: the desk page, or the
// phone R4 page (D-154, D-159).
// Usage: node tools/make-desk-data.ts [seed=desk-1] [page=docs/design/mockups/desk-density.html]
import { readFileSync, writeFileSync } from 'node:fs';
import {
  shapeOf,
  splitCoins,
  summariseQuest,
  writeQuestReport,
  type GameEvent,
  type PersonSlot,
} from '@adventure-manager/engine';
import {
  baseContracts,
  baseResolution,
  coinRates,
  engineTestMapText,
  names,
  reportText,
} from '@adventure-manager/content';
import { rules, runYear } from './year-sim-play.ts';

const seed = process.argv[2] ?? 'desk-1';
const WEEK = 23;
const SIZE = 30;
const PAGE = process.argv[3] ?? 'docs/design/mockups/desk-density.html';
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
    history: {
      week: number;
      site: string;
      danger: string;
      outcome: string;
      hits: number;
      injured: boolean;
    }[];
    party: { key: string; label: string } | null;
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
    history: [],
    party: null,
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
  // Standing parties are not simulated yet (D-014): the mock-up groups people by the party they
  // last went out with, named after its writer (best Wits).
  const label = s.writerId ? `${fullName(s.writerId)}'s party` : 'A lost party';
  for (const id of s.partyIds) {
    const r = record.get(id)!; // non-null: as above.
    r.history.push({
      week: weekOf(e.day),
      site: c.site,
      danger: c.danger,
      outcome,
      hits: s.hits[id] ?? 0,
      injured: s.injuries.includes(id),
    });
    r.party = { key: s.questId, label };
  }
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
    for (const id of p.memberIds) {
      away.set(id, { site: contractName(p.offer.shownTemplateId).site, homeDay: p.homeDay });
      // A party still out is their party now, whatever they did before.
      const leader = [...p.memberIds].sort(
        (x, y) =>
          (state.roster.find((r) => r.id === y)?.attributes.wits ?? 0) -
            (state.roster.find((r) => r.id === x)?.attributes.wits ?? 0) || (x < y ? -1 : 1),
      )[0]!; // non-null: a party has members.
      record.get(id)!.party = { key: p.id, label: `${fullName(leader)}'s party` }; // non-null: members are on the roster.
    }

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
    weaponBp: a.weaponBp,
    armourBp: a.armourBp,
    actions: (baseResolution.rules.classes[a.classId]?.actions ?? []).map(
      (x) => names[x.id] ?? x.id,
    ),
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

// The March from the engine test's bake (D-134), halved to 150 × 100 cells for a small sheet.
// Sites are not placed on the map yet (PLAN §7c): the tool puts each one at about its travel
// distance from the guild hall on its own bearing, on dry land. Placeholders, labelled as such.
// cast-ok: our own bake, read as tools/bake-map.ts wrote it; the fields used are checked below.
const baked = JSON.parse(readFileSync('packages/ui/assets/engine-test/map-base.json', 'utf8')) as {
  width: number;
  height: number;
  dayCells: number;
  water: string;
  biome: string;
  biomeIds: string[];
  guildCell: number;
  placeCells: number[];
  villageCells: number[];
  roads: { cells: number[] }[];
  rivers: { cells: number[] }[];
};
// Checked before use: halving needs even sides, and the fields read below must be there.
if (
  typeof baked.water !== 'string' ||
  typeof baked.biome !== 'string' ||
  !(baked.width > 0 && baked.height > 0) ||
  !Number.isInteger(baked.width / 2) ||
  !Number.isInteger(baked.height / 2) ||
  !(baked.dayCells > 0) ||
  !Number.isInteger(baked.guildCell) ||
  ![baked.placeCells, baked.villageCells, baked.roads, baked.rivers, baked.biomeIds].every(
    Array.isArray,
  )
)
  throw new Error('map-base.json is not the bake this tool expects.');
const water = Buffer.from(baked.water, 'base64');
const biome = Buffer.from(baked.biome, 'base64');
if (water.length !== baked.width * baked.height || biome.length !== baked.width * baked.height)
  throw new Error('map-base.json water or biome does not cover the whole sheet.');
const W = baked.width / 2;
const H = baked.height / 2;
const xy = (cell: number): [number, number] => [
  Math.floor((cell % baked.width) / 2),
  Math.floor(Math.floor(cell / baked.width) / 2),
];
// A half-size cell is water when at least 3 of its 4 full cells are.
const isWater = (x: number, y: number) => {
  let wet = 0;
  for (const [dx, dy] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const)
    if (water[(y * 2 + dy) * baked.width + x * 2 + dx] !== 0) wet += 1;
  return wet >= 3;
};
let grid = '';
for (let y = 0; y < H; y += 1)
  for (let x = 0; x < W; x += 1)
    grid += isWater(x, y)
      ? '~'
      : String.fromCharCode(97 + (biome[y * 2 * baked.width + x * 2] ?? 0));
const line = (cells: number[]) =>
  cells.filter((_, i) => i % 2 === 0 || i === cells.length - 1).map(xy);
const [gx, gy] = xy(baked.guildCell);
const daysFor: Record<string, number> = Object.fromEntries(
  rules.dangers.map((d) => [d.danger, d.travelDays + 1]),
);
// Sites keep clear of each other, the hall, the towns and the villages (about 6 half-cells).
const taken: [number, number][] = [
  xy(baked.guildCell),
  ...baked.placeCells.map(xy),
  ...baked.villageCells.map(xy),
];
const sitePlaces = baseContracts.sites.map((site, i) => {
  const days = Math.min(...site.dangers.map((d) => daysFor[d] ?? 6));
  const angle = (i * 2 * Math.PI) / baseContracts.sites.length + 0.4;
  const r = (days * baked.dayCells) / 2;
  let best: [number, number] = [gx, gy];
  let bestScore = Infinity;
  for (let y = 0; y < H; y += 1)
    for (let x = 0; x < W; x += 1) {
      // Dry land, and far enough from the sheet's edge for the label.
      if (isWater(x, y) || x < 8 || y < 6 || x > W - 9 || y > H - 7) continue;
      if (taken.some(([ax, ay]) => (x - ax) ** 2 + (y - ay) ** 2 < 36)) continue;
      const tx = gx + Math.cos(angle) * r;
      const ty = gy + Math.sin(angle) * r;
      const score = (x - tx) ** 2 + (y - ty) ** 2;
      if (score < bestScore) {
        bestScore = score;
        best = [x, y];
      }
    }
  if (bestScore === Infinity) throw new Error(`No room on the map for ${site.id}.`);
  taken.push(best);
  return { name: names[site.id] ?? site.id, x: best[0], y: best[1] };
});
const text = engineTestMapText;
const map = {
  w: W,
  h: H,
  dayCells: baked.dayCells / 2,
  biomes: baked.biomeIds,
  grid,
  roads: baked.roads.map((r) => line(r.cells)),
  rivers: baked.rivers.map((r) => line(r.cells)),
  hall: { name: text['place.guild-hall'] ?? 'the guild hall', x: gx, y: gy },
  towns: baked.placeCells.map((c, i) => ({
    name: text[`place.${i}`] ?? '',
    x: xy(c)[0],
    y: xy(c)[1],
  })),
  villages: baked.villageCells.map((c, i) => ({
    name: text[`village.${i}`] ?? '',
    x: xy(c)[0],
    y: xy(c)[1],
  })),
  sites: sitePlaces,
};

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
  map,
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
