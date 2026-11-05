// The play page's game glue (S1): a new sample fight and one command at a time through `simulate`.
// No rule lives here (GAME-02): every number on screen comes from `fightView` or `previewAction`.
import {
  fightView,
  sampleDelveState,
  sampleStart,
  simulate,
  type FightView,
  type GameEvent,
  type GameState,
} from '@adventure-manager/engine';
import { GATE1_SAMPLE_PACK, GATE1_TACTICS, gate1Content } from '@adventure-manager/content';

export const SAMPLE_SITE = 'site.sample-fight';

export interface Game {
  readonly state: GameState;
  readonly view: FightView | null;
  /** Events from the last command, for the log line. */
  readonly events: readonly GameEvent[];
}

export function withView(state: GameState, events: readonly GameEvent[] = []): Game {
  return { state, view: fightView(state), events };
}

/** The S1 start (gate 1 spec, Commands): the sample party, Tactics 12, no drill, 2 + 2 pack. */
export function newFight(seed: string): Game {
  const state = sampleDelveState(gate1Content, seed);
  const result = simulate(
    state,
    sampleStart(gate1Content, {
      id: 'cmd.start',
      siteId: SAMPLE_SITE,
      tactics: GATE1_TACTICS,
      pack: GATE1_SAMPLE_PACK.map((p) => ({ ...p })),
    }),
  );
  return withView(result.state, result.events);
}

export interface Choice {
  readonly actorId: string;
  readonly actionId: string;
  readonly targetId?: string;
  readonly packIndex?: number;
}

export function play(game: Game, choice: Choice): Game {
  const result = simulate(game.state, {
    type: 'fight.act',
    id: `cmd.${game.state.nextEventNo}`,
    day: 1,
    ...choice,
  });
  return withView(result.state, result.events);
}
