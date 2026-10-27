// Step 4 text prototype (D-195–D-200): one guild, its chronicle and its letters, kept as one save.
// Every change goes through simulate (GAME-02); this file only decides when to call it and keeps
// what the page shows. Throwaway, like the screens; the engine underneath is kept.
import {
  PLAYER_ID,
  newChronicle,
  recordEvents,
  simulate,
  summariseLife,
  summariseQuest,
  upkeepOf,
  writeMemorial,
  writeQuestReport,
  type Chronicle,
  type Command,
  type GameEvent,
  type GameState,
  type GuildRules,
  type Place,
  type ResolutionContent,
} from '@adventure-manager/engine';
import {
  baseHistoryRules,
  baseResolution,
  fullHousePlan,
  houseIncidentGuildRules,
  peopleText,
  reportText,
  type HousePlanStep,
} from '@adventure-manager/content';
import { nameOf, personOf } from './words.ts';

export const SAVE_VERSION = 1;

/** The rules the prototype plays: careers, the house with incidents, the draft, standing parties. */
export const content: ResolutionContent = { ...baseResolution, guild: houseIncidentGuildRules };
export const rules: GuildRules = houseIncidentGuildRules;

/** Two in-game years (D-160): the pull stops at the end of the second. */
export const LAST_DAY = 2 * rules.weeksPerYear * rules.daysPerWeek;

export type LetterKind =
  | 'home'
  | 'memorial'
  | 'incident'
  | 'patron-offer'
  | 'assembly'
  | 'signing'
  | 'retired'
  | 'built'
  | 'week'
  | 'career-ended';

/** A letter on the Desk. Lines are written when it arrives, so it reads the same later. */
export interface Letter {
  readonly id: string;
  readonly day: number;
  readonly kind: LetterKind;
  /** Written lines (home and memorial letters); other kinds are worded by the page from `facts`. */
  readonly lines: readonly string[];
  /** Ids and numbers the page words with (ids of people, sites, rooms; copper amounts). */
  readonly facts: Readonly<Record<string, string | number>>;
  /** People named in it, for the tappable names. */
  readonly people: readonly string[];
  read: boolean;
  /** Incident and patron letters: the player's answer once given. */
  answer?: string;
}

/** One line of the play log the report carries (D-198). */
export interface LogEntry {
  readonly sitting: number;
  readonly day: number;
  readonly what: string;
  readonly ids: readonly string[];
}

/** The R7 check's answers for one sitting (D-198). */
export interface Sitting {
  readonly no: number;
  readonly day: number;
  readonly minutes: number;
  readonly answers: readonly string[];
  readonly skipped: boolean;
}

export interface Save {
  readonly version: number;
  readonly seed: string;
  state: GameState;
  chronicle: Chronicle;
  commandNo: number;
  letters: Letter[];
  /** Letters home written when a quest ends, delivered when the party is home, by party id. */
  pending: Record<string, Letter>;
  log: LogEntry[];
  sittings: Sitting[];
  sitting: number;
  /** The default player's next build step (house/SPEC.md, What the simulator measures). */
  planStep: number;
  nextLetterNo: number;
  /** Each drafted person's fee at the founding (`founding.listed`), for the draft screen. */
  draftFees: Record<string, number>;
}

/** A command without its id; the save numbers commands itself. */
export type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

export function newGame(seed: string): Save {
  const save: Save = {
    version: SAVE_VERSION,
    seed,
    state: {
      seed,
      rng: {},
      nextEventNo: 1,
      content,
      roster: [],
      quest: null,
      calendar: 1,
      guild: null,
    },
    chronicle: newChronicle(),
    commandNo: 0,
    letters: [],
    pending: {},
    log: [],
    sittings: [],
    sitting: 1,
    planStep: 0,
    nextLetterNo: 1,
    draftFees: {},
  };
  for (const e of run(save, { type: 'guild.found', day: 1, size: 0 }))
    if (e.type === 'founding.listed' && e.subjectIds[0])
      save.draftFees[e.subjectIds[0]] = e.feeCopper;
  return save;
}

/** The save as stored: the content is code, so it is left out and put back on load. */
export function toStored(save: Save): string {
  return JSON.stringify({ ...save, state: { ...save.state, content: null } });
}

/** A stored save, or null when it can't be read (GAME-05: the caller keeps the text). */
export function fromStored(text: string): Save | null {
  try {
    // cast-ok: checked by version below; a save written by toStored has this shape.
    const save = JSON.parse(text) as Save;
    if (
      save?.version !== SAVE_VERSION ||
      !save.state ||
      !save.chronicle ||
      !Array.isArray(save.letters) ||
      !Array.isArray(save.log) ||
      !Array.isArray(save.sittings) ||
      typeof save.pending !== 'object'
    )
      return null;
    save.state = { ...save.state, content };
    return save;
  } catch {
    return null;
  }
}

/** Runs one command on the save; throws the engine's refusal unchanged. */
export function run(save: Save, command: Bare): readonly GameEvent[] {
  // cast-ok: the id added back makes the union member whole.
  const result = simulate(save.state, { ...command, id: `c${save.commandNo + 1}` } as Command);
  save.state = result.state;
  save.commandNo += 1;
  recordEvents(save.chronicle, result.events, save.state, baseHistoryRules);
  readLetters(save, result.events);
  return result.events;
}

/** A player's command, logged for the report. */
export function act(save: Save, command: Bare, what: string, ids: readonly string[] = []): void {
  run(save, command);
  save.log.push({ sitting: save.sitting, day: save.state.calendar, what, ids });
}

export function guildOf(save: Save) {
  const guild = save.state.guild;
  if (!guild) throw new Error('The guild is not founded.');
  return guild;
}

/** Letters that stop the calendar until answered or read: a death, an incident, the patron's offer. */
export function blocking(save: Save): Letter[] {
  // A signing letter doesn't hold the calendar (D-201); the recruits wait on the Roster.
  return save.letters.filter(
    (l) => !l.read && (l.kind === 'memorial' || l.kind === 'incident' || l.kind === 'patron-offer'),
  );
}

export function canPull(save: Save): boolean {
  const guild = save.state.guild;
  return (
    !!guild &&
    !guild.draft &&
    !guild.career?.ended &&
    save.state.calendar < LAST_DAY &&
    blocking(save).length === 0
  );
}

/**
 * Moves on a day at a time until something needs the player (a stop, PLAN §2f) or a letter
 * arrives, playing the house on defaults each morning (D-195). Returns the days moved.
 */
export function pull(save: Save): number {
  let days = 0;
  while (canPull(save)) {
    const before = save.letters.length;
    const events = run(save, { type: 'day.advance', day: save.state.calendar + 1 });
    days += 1;
    playHouse(save);
    if (events.some((e) => e.type === 'stop.raised') || save.letters.length > before) break;
  }
  return days;
}

/** Weeks of spending the default player keeps in the chest after paying for a step (the simulator's, D-204). */
const HOUSE_RESERVE_WEEKS = 24;

const samePlace = (a: Place, b: Place) =>
  a.area === 'hall' && b.area === 'hall'
    ? a.floor === b.floor && a.cell === b.cell
    : a.area === 'compound' && b.area === 'compound' && a.side === b.side && a.plot === b.plot;

/**
 * House and staff on defaults (D-195), the career simulator's policy (tools/year-sim-play.ts): at
 * a week start with no work running, repair fire damage first (barracks at once, into debt),
 * else start the full-house plan's next step if the chest keeps HOUSE_RESERVE_WEEKS of spending after it.
 * The rules have no hired staff, so the guildmaster runs training and recovery.
 */
export function playHouse(save: Save): void {
  const guild = guildOf(save);
  const house = guild.house;
  const houseRules = rules.house;
  const day = save.state.calendar;
  if (!house || !houseRules || (day - 1) % rules.daysPerWeek !== 0 || house.work.length > 0) return;
  const wages = guild.members.reduce((sum, m) => sum + m.wageCopper, 0);
  const weekly = wages + rules.runningCostCopper + upkeepOf(house, houseRules);
  const tryRun = (command: Bare, urgent: boolean, reason: 'building' | 'repair'): boolean => {
    let cost: number;
    try {
      // cast-ok: as in run().
      const preview = simulate(save.state, { ...command, id: 'preview' } as Command);
      cost = -(
        preview.events.flatMap((e) =>
          e.type === 'money.changed' && e.reason === reason ? [e.amountCopper] : [],
        )[0] ?? 0
      );
    } catch {
      // No coin yet, a cell held by work or a standing letter, a scar in the way: next week.
      return false;
    }
    if (!urgent && guild.chestCopper - cost < HOUSE_RESERVE_WEEKS * weekly) return false;
    run(save, command);
    return true;
  };
  const scars = [...house.scars].sort(
    (a, b) => Number(b.kindId === 'room.barracks') - Number(a.kindId === 'room.barracks'),
  );
  for (const scar of scars)
    if (
      tryRun(
        { type: 'house.repair', day, place: scar.place },
        scar.kindId === 'room.barracks',
        'repair',
      )
    )
      return;
  const step: HousePlanStep | undefined = fullHousePlan[save.planStep];
  if (!step) return;
  // A step on a scarred place waits for its repair.
  if (step.type !== 'extend' && house.scars.some((s) => samePlace(s.place, step.place))) return;
  const command: Bare =
    step.type === 'build'
      ? { type: 'house.build', day, place: step.place, kindId: step.kindId }
      : step.type === 'upgrade'
        ? { type: 'house.upgrade', day, place: step.place }
        : { type: 'house.extend', day, direction: step.direction };
  if (tryRun(command, false, 'building')) save.planStep += 1;
}

const fullName = (save: Save, id: string) => personOf(save.state.roster, id).name;

function letter(
  save: Save,
  day: number,
  kind: LetterKind,
  facts: Letter['facts'],
  people: readonly string[] = [],
  lines: readonly string[] = [],
): Letter {
  const made: Letter = {
    id: `l${save.nextLetterNo}`,
    day,
    kind,
    lines,
    facts,
    people,
    read: false,
  };
  save.nextLetterNo += 1;
  return made;
}

const writeOptions = (save: Save) => ({
  personOf: (id: string) => personOf(save.state.roster, id),
  nameOf,
  seed: save.seed,
});

/** Letters from one command's events (after the chronicle has read them). */
function readLetters(save: Save, events: readonly GameEvent[]): void {
  const add = (l: Letter) => save.letters.push(l);
  let questFrom = -1;
  events.forEach((e, at) => {
    switch (e.type) {
      case 'quest.started':
        questFrom = at;
        break;
      case 'quest.ended': {
        const slice = events.slice(questFrom, at + 1);
        const summary = summariseQuest(slice, save.state.roster, content);
        const [questId = ''] = e.subjectIds;
        const partyId = questId.replace(/^run\./, '');
        // The chronicle fixed the writer when the quest ended (history/SPEC.md).
        const lines = writeQuestReport(summary, reportText, writeOptions(save)).map((l) => l.text);
        save.pending[partyId] = letter(
          save,
          e.day,
          'home',
          { site: summary.templateId, outcome: summary.outcome, writer: summary.writerId ?? '' },
          summary.partyIds,
          lines,
        );
        break;
      }
      case 'party.returned': {
        const [partyId = ''] = e.subjectIds;
        const home = save.pending[partyId];
        if (home) {
          delete save.pending[partyId];
          add({ ...home, day: e.day });
        }
        break;
      }
      case 'adventurer.died': {
        const [id = ''] = e.subjectIds;
        const life = summariseLife(save.chronicle, id, save.state.roster, baseHistoryRules);
        const lines = writeMemorial(life, peopleText, writeOptions(save)).map((l) => l.text);
        const named = [
          id,
          ...life.friends.map((f) => f.id),
          ...(life.leaderId ? [life.leaderId] : []),
        ];
        add(letter(save, e.day, 'memorial', { who: id }, named, lines));
        break;
      }
      case 'incident.struck': {
        const stolen = save.state.guild?.house?.letter?.stolenCopper ?? 0;
        add(
          letter(save, e.day, 'incident', {
            kind: e.kindId,
            fee: e.feeCopper,
            stolen,
            room: roomAt(save, e.place),
          }),
        );
        break;
      }
      case 'incident.settled': {
        const standing = [...save.letters].reverse().find((l) => l.kind === 'incident');
        if (standing && e.byDefault && !standing.answer) standing.answer = 'free';
        break;
      }
      case 'patron.offered':
        add(letter(save, e.day, 'patron-offer', { grant: e.grantCopper }));
        break;
      case 'year.settled': {
        const career = save.state.guild?.career;
        const place = e.standings.findIndex((s) => s.id === PLAYER_ID) + 1;
        add(
          letter(save, e.day, 'assembly', {
            year: e.year,
            place,
            of: e.standings.length,
            target: career?.target ?? '',
            confidence: career?.confidence ?? 0,
          }),
        );
        break;
      }
      case 'adventurer.retired': {
        const [id = ''] = e.subjectIds;
        add(letter(save, e.day, 'retired', { who: id, age: e.age }, [id]));
        break;
      }
      case 'house.finished':
        if (e.job === 'extend')
          add(letter(save, e.day, 'built', { kind: `extend.${e.direction}` }));
        else add(letter(save, e.day, 'built', { kind: e.kindId ?? '', level: e.level ?? 1 }));
        break;
      case 'career.ended':
        add(letter(save, e.day, 'career-ended', { reason: e.reason }));
        break;
      case 'stop.raised':
        if (e.reason === 'signing-window' && (save.state.guild?.prospects.length ?? 0) > 0)
          add(letter(save, e.day, 'signing', { count: save.state.guild?.prospects.length ?? 0 }));
        if (e.reason === 'week-report') add(weekReport(save, events, e.day));
        break;
    }
  });
}

/** The week report: what this week start paid, and the chest. */
function weekReport(save: Save, events: readonly GameEvent[], day: number): Letter {
  let wages = 0;
  let rooms = 0;
  for (const e of events)
    if (e.type === 'money.changed' && e.amountCopper < 0) {
      if (e.reason === 'wages') wages -= e.amountCopper;
      else rooms -= e.amountCopper;
    }
  const l = letter(save, day, 'week', {
    wages,
    other: rooms,
    chest: save.state.guild?.chestCopper ?? 0,
  });
  l.read = true;
  return l;
}

/** The room kind at a place, or empty. */
function roomAt(save: Save, place: Place | null): string {
  const house = save.state.guild?.house;
  if (!house || !place) return '';
  if (place.area === 'hall') return house.floors[place.floor]?.[place.cell]?.kindId ?? '';
  return house.compound[place.side][place.plot]?.kindId ?? '';
}

export { fullName };
