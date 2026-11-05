// The play page's S2 glue: the start card's command, Auto's stepping rule, and a whole delve played
// through the same functions the page calls (gate 1 spec, S2 checks). No DOM.
import { describe, expect, it } from 'vitest';
import { SAVE_KEY, readSave, writeSave, type Store } from '../src/play/save.ts';
import {
  autoDue,
  chooseWay,
  newDelve,
  nextRoom,
  previewStart,
  retreatNow,
  saved,
  setAuto,
  startDelve,
  stepAuto,
  type Game,
} from '../src/play/game.ts';

class MapStore implements Store {
  readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

/** Plays a whole delve the way the page does with Auto on; returns the game and the steps taken. */
function playAll(seed: string): { game: Game; steps: number } {
  let game = startDelve(newDelve(seed), 'assault');
  let steps = 0;
  for (let i = 0; i < 400 && game.delve?.phase !== 'ended'; i += 1) {
    const phase = game.delve!.phase;
    if (phase === 'choice') {
      const tester = game.delve!.choice!.options[0]!.testers[0]!.id;
      game = chooseWay(game, 0, tester);
    } else if (phase === 'breather') game = nextRoom(game);
    else if (!game.delve!.auto.on) game = setAuto(game, true);
    else if (autoDue(game)) {
      game = stepAuto(game);
      steps += 1;
    } else throw new Error('the page would be stuck');
  }
  return { game, steps };
}

describe('play page glue (S2)', () => {
  it('opens on the start card: no delve, a preview of the party and the pack', () => {
    const game = newDelve('start-card');
    expect(game.delve).toBeNull();
    expect(game.state.delve).toBeNull();
    const preview = previewStart(game);
    expect(preview?.members).toHaveLength(4);
    expect(preview?.pack).toHaveLength(4);
    expect(game.state.delve).toBeNull();
  });

  it('issues delve.start with the picked approach and lands in the entry choice', () => {
    for (const approach of ['stealth', 'assault', 'diplomacy'] as const) {
      const game = startDelve(newDelve('approach'), approach);
      expect(game.state.delve?.approach).toBe(approach);
      expect(game.delve?.phase).toBe('choice');
      expect(game.delve?.choice?.options).toHaveLength(2);
    }
  });

  it('saves and reloads the start card and every phase of a delve', () => {
    const store = new MapStore();
    let game = newDelve('reload');
    const roundTrip = (): void => {
      saved(game, store, 't');
      const loaded = readSave(store, 1);
      expect(loaded.note).toBeNull();
      expect({ ...loaded.state, content: null }).toEqual({ ...game.state, content: null });
    };
    roundTrip();
    game = startDelve(game, 'stealth');
    roundTrip();
    game = chooseWay(game, 0, game.delve!.choice!.options[0]!.testers[0]!.id);
    expect(game.delve?.phase).toBe('breather');
    roundTrip();
    game = nextRoom(game);
    expect(game.delve?.phase).toBe('fight');
    roundTrip();
    expect(store.getItem(SAVE_KEY)).not.toBeNull();
    writeSave(store, game.state, 't2');
  });

  it('Auto steps only while it is on, in a fight, on an adventurer turn', () => {
    let game = startDelve(newDelve('auto-rule'), 'assault');
    expect(autoDue(game)).toBe(false);
    game = chooseWay(game, 0, game.delve!.choice!.options[0]!.testers[0]!.id);
    expect(autoDue(game)).toBe(false);
    game = nextRoom(game);
    expect(autoDue(game)).toBe(false);
    game = setAuto(game, true);
    expect(autoDue(game)).toBe(true);
    game = setAuto(game, false);
    expect(autoDue(game)).toBe(false);
    game = setAuto(game, true);
    // Run the fight out: Auto stops asking for steps the moment the fight ends.
    for (let i = 0; i < 200 && autoDue(game); i += 1) game = stepAuto(game);
    expect(autoDue(game)).toBe(false);
    expect(game.delve?.phase).not.toBe('fight');
  });

  it('keeps the save-skills switch for the party across fights', () => {
    let game = startDelve(newDelve('switch'), 'assault');
    game = chooseWay(game, 0, game.delve!.choice!.options[0]!.testers[0]!.id);
    game = nextRoom(game);
    game = setAuto(game, true, false);
    expect(game.delve?.auto).toEqual({ on: true, saveSkillsForBoss: false });
    game = setAuto(game, true, true);
    expect(game.delve?.auto.saveSkillsForBoss).toBe(true);
  });

  it('plays a whole delve with Auto to an outcome, the same way twice (GAME-01)', () => {
    const a = playAll('whole-delve');
    expect(a.game.delve?.phase).toBe('ended');
    expect(a.game.delve?.outcome).not.toBeNull();
    expect(a.game.delve?.ends).toHaveLength(4);
    expect(a.steps).toBeGreaterThan(0);
    const b = playAll('whole-delve');
    expect({ ...b.game.state, content: null }).toEqual({ ...a.game.state, content: null });
  });

  it('retreats from a fight and ends the delve', () => {
    let game = startDelve(newDelve('retreat'), 'assault');
    game = chooseWay(game, 0, game.delve!.choice!.options[0]!.testers[0]!.id);
    game = nextRoom(game);
    game = retreatNow(game);
    expect(game.delve?.phase).toBe('ended');
    expect(['retreated', 'routed']).toContain(game.delve?.outcome);
  });
});
