// The one entry point (GAME-02, PLAN §11b): preview and commit both call simulate, and it never
// changes the state it is given, so a preview leaves the real game untouched.
import { EventSink } from './core/events.ts';
import { takeContract } from './guild/board.ts';
import { advanceDay, foundGuild } from './guild/day.ts';
import { signRecruit } from './guild/people.ts';
import { hireStaff, releaseStaff } from './staff/areas.ts';
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
    case 'guild.found':
      foundGuild(next, command, sink);
      break;
    case 'day.advance':
      advanceDay(next, command, sink);
      break;
    case 'contract.take':
      takeContract(next, command, sink);
      break;
    case 'recruit.sign':
      signRecruit(next, command, sink);
      break;
    case 'staff.hire':
      hireStaff(next, command, sink);
      break;
    case 'staff.release':
      releaseStaff(next, command, sink);
      break;
  }
  return { state: next, events: sink.events };
}
