// Guild Desk session (step 4, R7, D-150): one guild from its founding, every player decision a
// command sent through simulate (GAME-02). The save is the seed and the commands, so a reload
// replays the same guild exactly (GAME-01); an older build's save is kept aside, never overwritten.
import {
  apply,
  simulate,
  type Command,
  type GameEvent,
  type GameState,
} from '@adventure-manager/engine';
import { baseResolution, staffGuildRules } from '@adventure-manager/content';

export const SAVE_VERSION = 1;
const KEY = 'guild-desk.save';
export const GUILD_SIZE = 15;
/** Days `continue` will play looking for a stop before it gives the page back. */
const MAX_DAYS = 60;

export const content = { ...baseResolution, guild: staffGuildRules };
export const rules = staffGuildRules;

export interface Save {
  readonly version: number;
  readonly seed: string;
  readonly startedAt: string;
  readonly commands: readonly Command[];
  /** Active seconds played, per in-game year (index 0 is year 1), for R3's timed year. */
  readonly seconds: readonly number[];
  readonly notes: string;
}

export interface Desk {
  readonly save: Save;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
  /** Where the latest `continue` began in `events`: what "today" shows. */
  readonly todayFrom: number;
}

type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

function blank(seed: string): GameState {
  return {
    seed,
    rng: {},
    nextEventNo: 1,
    content,
    roster: [],
    quest: null,
    calendar: 1,
    guild: null,
  };
}

/** A new guild: founded, with the founding day's stops showing. */
export function newDesk(seed: string, startedAt: string): Desk {
  const desk: Desk = {
    save: { version: SAVE_VERSION, seed, startedAt, commands: [], seconds: [], notes: '' },
    state: blank(seed),
    events: [],
    todayFrom: 0,
  };
  return send(desk, { type: 'guild.found', day: 1, size: GUILD_SIZE });
}

/** Sends one player command; a refused command throws and leaves the desk as it was. */
export function send(desk: Desk, bare: Bare): Desk {
  // cast-ok: the id is added back, so the union member is whole.
  const command = { ...bare, id: `c${desk.save.commands.length + 1}` } as Command;
  const result = simulate(desk.state, command);
  return {
    ...desk,
    save: { ...desk.save, commands: [...desk.save.commands, command] },
    state: result.state,
    events: [...desk.events, ...result.events],
  };
}

/** Plays day by day until a stop is raised, the career ends, or a long quiet spell. */
export function continueToStop(desk: Desk): Desk {
  let current: Desk = { ...desk, todayFrom: desk.events.length };
  for (let n = 0; n < MAX_DAYS; n += 1) {
    if (current.state.guild?.career?.ended) break;
    const before = current.events.length;
    current = send(current, { type: 'day.advance', day: current.state.calendar + 1 });
    if (current.events.slice(before).some((e) => e.type === 'stop.raised')) break;
  }
  return current;
}

/** Adds active seconds to the in-game year now being played. */
export function addTime(desk: Desk, year: number, seconds: number): Desk {
  const list = [...desk.save.seconds];
  while (list.length < year) list.push(0);
  list[year - 1] = (list[year - 1] ?? 0) + seconds;
  return { ...desk, save: { ...desk.save, seconds: list } };
}

export function withNotes(desk: Desk, notes: string): Desk {
  return { ...desk, save: { ...desk.save, notes } };
}

/** Set when an older save could not be moved aside: then nothing is stored over it. */
let storeBlocked = false;

export function store(desk: Desk): void {
  if (storeBlocked) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(desk.save));
  } catch {
    // Storage can be blocked; the guild still plays, it just won't survive a reload.
  }
}

export function forget(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored to forget.
  }
}

/**
 * The saved guild, replayed, or null with `kept` true when a save from another build was found:
 * it is copied aside (under a dated key) rather than overwritten.
 */
export function load(): { desk: Desk | null; kept: boolean } {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return { desk: null, kept: false };
  }
  if (!raw) return { desk: null, kept: false };
  try {
    // cast-ok: written by store() above; the version check below guards the shape.
    const save = JSON.parse(raw) as Save;
    if (save.version !== SAVE_VERSION) throw new Error('Another build wrote this save.');
    // The commands were valid when played, so they replay in place without a copy each (D-148).
    const state = blank(save.seed);
    const events: GameEvent[] = [];
    for (const command of save.commands) events.push(...apply(state, command));
    const lastStart = lastContinueStart(events);
    return { desk: { save, state, events, todayFrom: lastStart }, kept: false };
  } catch {
    try {
      localStorage.setItem(`${KEY}.kept`, raw);
      localStorage.removeItem(KEY);
    } catch {
      // It can't be moved aside, so it stays where it was and this guild is not stored over it.
      storeBlocked = true;
    }
    return { desk: null, kept: true };
  }
}

/** After a reload, "today" starts after the last stop before the latest one. */
function lastContinueStart(events: readonly GameEvent[]): number {
  const stopDay = events.findLast((e) => e.type === 'stop.raised')?.day;
  if (stopDay === undefined) return 0;
  const firstToday = events.findIndex((e) => e.day > lastStopBefore(events, stopDay));
  return Math.max(0, firstToday);
}

function lastStopBefore(events: readonly GameEvent[], day: number): number {
  return events.findLast((e) => e.type === 'stop.raised' && e.day < day)?.day ?? 0;
}
