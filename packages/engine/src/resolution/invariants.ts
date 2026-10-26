// Invariants (STANDARDS.md): run by the tests and by every balance sweep.
import type { GameEvent, GameState } from './types.ts';
import { WOUND } from './types.ts';

/** Returns a list of broken invariants; empty means the state and events are sound. */
export function checkInvariants(
  state: GameState,
  events: readonly GameEvent[],
  commandIds: readonly string[],
): string[] {
  const problems: string[] = [];
  const known = new Set(commandIds);
  for (const event of events) {
    if (!known.has(event.causeId))
      problems.push(`${event.id} has an unknown cause ${event.causeId}.`);
    known.add(event.id);
    if (event.type === 'wound.changed' && (event.to < WOUND.fit || event.to > WOUND.dying))
      problems.push(`${event.id} moves a wound past the steps: ${event.to}.`);
  }
  for (const [id, step] of Object.entries(state.quest?.steps ?? {})) {
    if (step < WOUND.fit || step > WOUND.dying) problems.push(`${id} is at wound step ${step}.`);
  }
  return problems;
}
