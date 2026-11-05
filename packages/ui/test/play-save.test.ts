// The play page's save (gate 1 spec, S1 checks): written after each command at version 1, read
// back the same, and an unreadable save kept aside (GAME-05).
import { describe, expect, it } from 'vitest';
import { GATE1_RULES_VERSION } from '@adventure-manager/content';
import {
  SAVE_KEY,
  SAVE_VERSION,
  nextSeed,
  readSave,
  writeSave,
  type Store,
} from '../src/play/save.ts';
import { newFight, play } from '../src/play/game.ts';

class MapStore implements Store {
  readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('play save', () => {
  it('writes version 1 with the rules version after each command, and reads back the same game', () => {
    const store = new MapStore();
    let game = newFight('save-test');
    writeSave(store, game.state, 't0');
    const first = store.getItem(SAVE_KEY);
    const actor = game.view!.actorId!;
    game = play(game, { actorId: actor, actionId: 'action.throw-knife', targetId: 'foe.4' });
    writeSave(store, game.state, 't1');
    const text = store.getItem(SAVE_KEY)!;
    expect(text).not.toBe(first);
    const parsed = JSON.parse(text);
    expect(parsed.version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(1);
    expect(parsed.rulesVersion).toBe(GATE1_RULES_VERSION);
    expect(parsed.state.content).toBeNull();
    const loaded = readSave(store, 1);
    expect(loaded.note).toBeNull();
    expect({ ...loaded.state, content: null }).toEqual({ ...game.state, content: null });
  });

  it('keeps an unreadable save under its own key and never overwrites it', () => {
    const store = new MapStore();
    store.setItem(SAVE_KEY, '{"version": 99, "broken": true');
    const loaded = readSave(store, 1234);
    expect(loaded).toEqual({ state: null, note: 'unreadable' });
    expect(store.getItem(`${SAVE_KEY}.unreadable.1234`)).toBe('{"version": 99, "broken": true');
  });

  it('notes a save written under older rules', () => {
    const store = new MapStore();
    writeSave(store, newFight('old').state, 't');
    const old = JSON.parse(store.getItem(SAVE_KEY)!);
    store.setItem(SAVE_KEY, JSON.stringify({ ...old, rulesVersion: GATE1_RULES_VERSION - 1 }));
    expect(readSave(store, 1).note).toBe('older-rules');
  });

  it('makes a new seed from the date and a stored counter', () => {
    const store = new MapStore();
    expect(nextSeed(store, '2026-11-05')).toBe('2026-11-05-1');
    expect(nextSeed(store, '2026-11-05')).toBe('2026-11-05-2');
  });
});
