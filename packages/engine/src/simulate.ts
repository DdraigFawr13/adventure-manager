// The one entry point (GAME-02, PLAN §11b): preview and commit both call simulate, and it never
// changes the state it is given, so a preview leaves the real game untouched.
import { EventSink } from './core/events.ts';
import { chooseMoment, startQuest, stepQuest } from './resolution/quest.ts';
import type { Command, GameEvent, GameState } from './resolution/types.ts';

export interface SimulationResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

export function simulate(state: GameState, command: Command): SimulationResult {
  const next = structuredClone(state);
  const sink = new EventSink<GameEvent>(next, command.day);
  switch (command.type) {
    case 'quest.start':
      startQuest(next, command, sink);
      break;
    case 'quest.step':
      stepQuest(next, command.id, sink);
      break;
    case 'quest.choose':
      chooseMoment(next, command, sink);
      break;
  }
  return { state: next, events: sink.events };
}
