// The play page's game glue (S1–S2): a new game, and one command at a time through `simulate`.
// No rule lives here (GAME-02): every number on screen comes from `fightView`, `delveView`,
// `previewAction`, `approachChances` or the retreat preview.
import {
  delveView,
  fightView,
  sampleDelveState,
  sampleStart,
  simulate,
  type Approach,
  type DelveCommand,
  type DelveView,
  type FightView,
  type GameEvent,
  type GameState,
  type Row,
} from '@adventure-manager/engine';
import {
  GATE1_SAMPLE_PACK,
  GATE1_SITE,
  GATE1_TACTICS,
  gate1Content,
} from '@adventure-manager/content';
import { writeSave, type Store } from './save.ts';

export const SAMPLE_SITE = 'site.sample-fight';

/** One Auto turn every 0.6 s, so each is seen (D-232). */
export const AUTO_STEP_MS = 600;

export interface Game {
  readonly state: GameState;
  /** The fight, or null between fights and before a delve. */
  readonly view: FightView | null;
  /** The delve around it, or null before the first start. */
  readonly delve: DelveView | null;
  /** Events from the last command, for the log line. */
  readonly events: readonly GameEvent[];
}

export function withView(state: GameState, events: readonly GameEvent[] = []): Game {
  return { state, view: fightView(state), delve: delveView(state), events };
}

const pack = () => GATE1_SAMPLE_PACK.map((p) => ({ ...p }));

/** A new game on the start card: the sample party, no delve yet (D-232). */
export function newDelve(seed: string): Game {
  return withView(sampleDelveState(gate1Content, seed));
}

/** The start card's party and pack, from a throwaway start (the real one is the player's pick). */
export function previewStart(game: Game): DelveView | null {
  return startDelve(game, 'assault').delve;
}

/** `delve.start` with the picked approach: the sample party, Tactics 12, no drill, 2 + 2 pack. */
export function startDelve(game: Game, approach: Approach, siteId: string = GATE1_SITE): Game {
  return run(
    game,
    sampleStart(gate1Content, {
      id: 'cmd.start',
      siteId,
      tactics: GATE1_TACTICS,
      pack: pack(),
      approach,
    }),
  );
}

/** The S1 start (gate 1 spec, Commands): the sample fight, assault, no choice room. */
export function newFight(seed: string): Game {
  return startDelve(newDelve(seed), 'assault', SAMPLE_SITE);
}

const meta = (game: Game): { readonly id: string; readonly day: number } => ({
  id: `cmd.${game.state.nextEventNo}`,
  day: 1,
});

function run(game: Game, command: DelveCommand): Game {
  const result = simulate(game.state, command);
  return withView(result.state, result.events);
}

export interface Choice {
  readonly actorId: string;
  readonly actionId: string;
  readonly targetId?: string;
  readonly packIndex?: number;
}

export function play(game: Game, choice: Choice): Game {
  return run(game, { type: 'fight.act', ...meta(game), ...choice });
}

export const chooseWay = (game: Game, optionIndex: number, testerId: string): Game =>
  run(game, { type: 'delve.choose', ...meta(game), optionIndex, testerId });

export const scoutAhead = (game: Game): Game => run(game, { type: 'delve.scout', ...meta(game) });

export const setRows = (game: Game, rows: Readonly<Record<string, Row>>): Game =>
  run(game, { type: 'delve.rows', ...meta(game), rows });

export const nextRoom = (game: Game): Game => run(game, { type: 'delve.next', ...meta(game) });

export const setAuto = (game: Game, on: boolean, saveSkillsForBoss?: boolean): Game =>
  run(game, {
    type: 'fight.auto',
    ...meta(game),
    on,
    ...(saveSkillsForBoss === undefined ? {} : { saveSkillsForBoss }),
  });

export const stepAuto = (game: Game): Game => run(game, { type: 'fight.step', ...meta(game) });

export const retreatNow = (game: Game): Game => run(game, { type: 'fight.retreat', ...meta(game) });

/**
 * True while Auto should take the next turn: Auto is on, a fight is running and it is an
 * adventurer's turn. False the moment the fight ends, Auto is turned off or the delve is over.
 */
export function autoDue(game: Game): boolean {
  return (
    !!game.delve &&
    game.delve.phase === 'fight' &&
    game.delve.auto.on &&
    !!game.view &&
    game.view.phase === 'fight' &&
    game.view.actorId !== null
  );
}

/** Saves a game after its command (gate 1 spec: a save after every command). */
export function saved(game: Game, store: Store | null, savedAt: string): Game {
  if (store) writeSave(store, game.state, savedAt);
  return game;
}

/** One command as the page runs it: play it, then save at once. */
export function commit(game: Game, choice: Choice, store: Store | null, savedAt: string): Game {
  return saved(play(game, choice), store, savedAt);
}
