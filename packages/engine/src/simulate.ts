// The one entry point (GAME-02, PLAN §11b): preview and commit both call simulate, and it never
// changes the state it is given, so a preview leaves the real game untouched. The new state shares
// the given state's read-only content object (D-148), so nothing may write to content.
// `apply` is the same rule path changing the state in place, for headless tools that own their
// state (D-148); `simulate` is a copy plus `apply`, so preview and commit still share one function.
import { takeEmergency } from './career/emergency.ts';
import { EventSink } from './core/events.ts';
import { takeContract } from './guild/board.ts';
import { advanceDay, foundGuild } from './guild/day.ts';
import { pickDraft } from './guild/founding.ts';
import { signRecruit } from './guild/people.ts';
import { buildRoom, extendHouse, upgradeRoom } from './house/house.ts';
import { hireStaff, releaseStaff } from './staff/areas.ts';
import { chooseMoment, startQuest, stepQuest } from './resolution/quest.ts';
import type { Command, GameEvent, GameState } from './resolution/types.ts';

export interface SimulationResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

export function simulate(state: GameState, command: Command): SimulationResult {
  // Content is read-only rules, so the copy shares it rather than cloning it on every command.
  const next: GameState = {
    ...structuredClone({ ...state, content: null }),
    content: state.content,
  };
  return { state: next, events: apply(next, command) };
}

/**
 * Runs a command on the given state in place and returns its events. If it throws, the state may
 * be half changed: callers that must survive a refused command use `simulate`.
 */
export function apply(state: GameState, command: Command): readonly GameEvent[] {
  const sink = new EventSink<GameEvent>(state, command.day);
  switch (command.type) {
    case 'quest.start':
      startQuest(state, command, sink);
      break;
    case 'quest.step':
      stepQuest(state, command.id, sink);
      break;
    case 'quest.choose':
      chooseMoment(state, command, sink);
      break;
    case 'guild.found':
      foundGuild(state, command, sink);
      break;
    case 'guild.pick':
      pickDraft(state, command, sink);
      break;
    case 'day.advance':
      advanceDay(state, command, sink);
      break;
    case 'contract.take':
      takeContract(state, command, sink);
      break;
    case 'recruit.sign':
      signRecruit(state, command, sink);
      break;
    case 'staff.hire':
      hireStaff(state, command, sink);
      break;
    case 'staff.release':
      releaseStaff(state, command, sink);
      break;
    case 'house.build':
      buildRoom(state, command, sink);
      break;
    case 'house.upgrade':
      upgradeRoom(state, command, sink);
      break;
    case 'house.extend':
      extendHouse(state, command, sink);
      break;
    case 'patron.grant':
      takeEmergency(state, command, sink);
      break;
  }
  // No event may hold an object that belongs to the state (engine AGENTS.md), so later commands
  // can't change events already returned; test/apply.test.ts checks it.
  return sink.events;
}
