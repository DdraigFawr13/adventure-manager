// S2's streams across a reload (GAME-01) and its views never rolling (spec "Views"): a whole barrow
// delve played by choices, scouting, Auto and moving on, stopped and reloaded from JSON halfway,
// ends exactly as the same delve played straight through.
import { describe, expect, it } from 'vitest';
import { gate1Content, GATE1_SAMPLE_PACK } from '@adventure-manager/content';
import {
  approachChances,
  autoChance,
  delveView,
  retreatPreview,
  sampleDelveState,
  sampleStart,
  scoutChance,
  simulate,
  type DelveCommand,
  type GameState,
} from '../src/index.ts';

const BARROW = 'site.hollow-barrow';

function start(seed: string): GameState {
  return simulate(
    sampleDelveState(gate1Content, seed),
    sampleStart(gate1Content, {
      id: 'cmd.start',
      siteId: BARROW,
      tactics: 12,
      pack: GATE1_SAMPLE_PACK.map((p) => ({ ...p })),
      approach: 'stealth',
    }),
  ).state;
}

/** The next command a scripted player gives: best way, scout, move on, Auto in fights. */
function nextCommand(state: GameState, n: number): DelveCommand {
  const d = state.delve!;
  const base = { id: `cmd.${n}`, day: 1 };
  if (d.phase === 'choice') {
    const tester = delveView(state)!.choice!.options[0]!.testers[0]!;
    return { ...base, type: 'delve.choose', optionIndex: 0, testerId: tester.id };
  }
  if (d.phase === 'breather')
    return delveView(state)!.scout?.open
      ? { ...base, type: 'delve.scout' }
      : { ...base, type: 'delve.next' };
  return { ...base, type: 'fight.step' };
}

/** Plays from `state` to the delve's end, reloading from JSON before command `reloadAt`. */
function play(state: GameState, reloadAt = -1): GameState {
  let s = state;
  for (let n = 1; n < 2000 && s.delve!.phase !== 'ended'; n += 1) {
    if (n === reloadAt)
      s = { ...JSON.parse(JSON.stringify({ ...s, content: null })), content: s.content };
    s = simulate(s, nextCommand(s, n)).state;
  }
  return s;
}

const plain = (s: GameState) => JSON.parse(JSON.stringify({ ...s, content: null })) as unknown;

describe('delve: replay and views', () => {
  it('a delve reloaded from JSON halfway ends exactly as one played straight through', () => {
    for (const seed of ['replay-1', 'replay-2', 'replay-3']) {
      const straight = play(start(seed));
      const reloaded = play(start(seed), 40);
      expect(straight.delve!.phase).toBe('ended');
      expect(plain(reloaded)).toEqual(plain(straight));
      // Rooms, Auto, loot and fight streams were all used.
      expect(Object.keys(straight.rng)).toEqual(
        expect.arrayContaining(['delve.rooms', 'delve.auto', 'delve.loot', 'delve.fight']),
      );
    }
  });

  it('the delve views never roll or write', () => {
    let s = start('views');
    const seen = new Set<string>();
    for (let n = 1; n < 2000 && s.delve!.phase !== 'ended'; n += 1) {
      const before = plain(s);
      delveView(s);
      approachChances(s, BARROW, s.delve!.memberIds);
      if (s.delve!.phase === 'fight') {
        const fight = s.delve!.fight!;
        const actor = s.delve!.fighters.find((f) => f.id === fight.order[fight.turn]);
        if (actor?.status === 'up') {
          retreatPreview(s);
          autoChance(s);
          seen.add('fight');
        }
      }
      if (delveView(s)!.scout) {
        scoutChance(s);
        seen.add('scout');
      }
      expect(plain(s)).toEqual(before);
      s = simulate(s, nextCommand(s, n)).state;
    }
    expect([...seen].sort()).toEqual(['fight', 'scout']);
  });
});
