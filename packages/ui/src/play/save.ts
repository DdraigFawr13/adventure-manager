// The play page's save (gate 1 spec, UI "save.ts"; GAME-05): written after every command under
// `play.save`, with the save format's version and the rules version, so a seed and rules version
// replay a run (GAME-01). An unreadable save is kept aside and never overwritten.
import type { DelveRun, GameState } from '@adventure-manager/engine';
import { GATE1_RULES_VERSION, gate1Content } from '@adventure-manager/content';

export const SAVE_KEY = 'play.save';
export const SEED_KEY = 'play.seedCounter';
/** The save format: 1 from S1, bumped with an upgrade whenever `GameState`'s shape changes. */
export const SAVE_VERSION = 1;

/** The part of `localStorage` the save uses, so tests can pass a plain map. */
export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PlaySave {
  readonly version: number;
  readonly rulesVersion: number;
  readonly savedAt: string;
  readonly state: GameState;
}

export type LoadNote = 'unreadable' | 'older-rules' | null;

export function toStored(state: GameState, savedAt: string): string {
  return JSON.stringify({
    version: SAVE_VERSION,
    rulesVersion: GATE1_RULES_VERSION,
    savedAt,
    state: { ...state, content: null },
  });
}

/** Writes the save; storage can be blocked or full, and then the game goes on in memory. */
export function writeSave(store: Store, state: GameState, savedAt: string): boolean {
  try {
    store.setItem(SAVE_KEY, toStored(state, savedAt));
    return true;
  } catch {
    return false;
  }
}

function validRun(run: Partial<DelveRun> | undefined): boolean {
  if (!run || !Array.isArray(run.fighters) || !Array.isArray(run.rooms)) return false;
  if (run.fight === null) return run.phase !== 'fight';
  return !!run.fight && Array.isArray(run.fight.order) && Array.isArray(run.fight.foes);
}

function parse(text: string): PlaySave | null {
  try {
    // cast-ok: checked field by field below; a save written by toStored has this shape.
    const save = JSON.parse(text) as Partial<PlaySave> | null;
    if (
      !save ||
      save.version !== SAVE_VERSION ||
      typeof save.rulesVersion !== 'number' ||
      typeof save.savedAt !== 'string' ||
      !save.state ||
      typeof save.state.seed !== 'string' ||
      !Array.isArray(save.state.roster) ||
      // A game on the start card has no delve yet (S2); a delve between fights has no fight.
      (save.state.delve !== null && !validRun(save.state.delve))
    )
      return null;
    return {
      version: save.version,
      rulesVersion: save.rulesVersion,
      savedAt: save.savedAt,
      state: { ...save.state, content: gate1Content },
    };
  } catch {
    return null;
  }
}

/**
 * The saved game, or null. An unreadable save is copied to `play.save.unreadable.<time>` before
 * anything else is written, so it is never lost (GAME-05).
 */
export interface Loaded {
  readonly state: GameState | null;
  readonly note: LoadNote;
  /** False when an unreadable save could not be copied aside: then nothing may write `play.save`. */
  readonly mayWrite: boolean;
}

export function readSave(store: Store, now: number): Loaded {
  let text: string | null;
  try {
    text = store.getItem(SAVE_KEY);
  } catch {
    return { state: null, note: null, mayWrite: false };
  }
  if (!text) return { state: null, note: null, mayWrite: true };
  const save = parse(text);
  if (!save) return { state: null, note: 'unreadable', mayWrite: keepAside(store, text, now) };
  return {
    state: save.state,
    note: save.rulesVersion < GATE1_RULES_VERSION ? 'older-rules' : null,
    mayWrite: true,
  };
}

/** Copies a save to `play.save.unreadable.<time>`; returns whether the copy is safely stored. */
export function keepAside(store: Store, text: string, now: number): boolean {
  try {
    store.setItem(`${SAVE_KEY}.unreadable.${now}`, text);
    return store.getItem(`${SAVE_KEY}.unreadable.${now}`) === text;
  } catch {
    return false;
  }
}

/** A new seed from the date and a counter kept beside the save (the UI may read the clock). */
export function nextSeed(store: Store, date: string): string {
  let counter = 0;
  try {
    counter = Number(store.getItem(SEED_KEY) ?? '0') || 0;
    store.setItem(SEED_KEY, String(counter + 1));
  } catch {
    // A blocked store still gives a seed; it may repeat across reloads.
  }
  return `${date}-${counter + 1}`;
}
