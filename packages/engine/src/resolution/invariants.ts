// Invariants (STANDARDS.md): run by the tests and by every balance sweep.
import type { GameEvent, GameState } from './types.ts';
import { WOUND } from './types.ts';

/**
 * Returns a list of broken invariants; empty means the state and events are sound. Replays the
 * wound events, so a state change without its event shows up as a broken chain.
 */
export function checkInvariants(
  state: GameState,
  events: readonly GameEvent[],
  commandIds: readonly string[],
): string[] {
  const problems: string[] = [];
  const known = new Set(commandIds);
  const steps = new Map<string, number>();
  const dead = new Set<string>();
  for (const event of events) {
    if (!known.has(event.causeId))
      problems.push(`${event.id} has an unknown cause ${event.causeId}.`);
    known.add(event.id);
    const [subject = ''] = event.subjectIds;
    if (event.type === 'quest.started')
      for (const id of event.subjectIds.slice(1)) steps.set(id, WOUND.fit);
    if (event.type === 'adventurer.died') dead.add(subject);
    if (event.type !== 'wound.changed') continue;
    if (event.to < WOUND.fit || event.to > WOUND.dying)
      problems.push(`${event.id} moves a wound past the steps: ${event.to}.`);
    if (steps.get(subject) !== event.from)
      problems.push(`${event.id} starts ${subject} at ${event.from}, not ${steps.get(subject)}.`);
    if (dead.has(subject)) problems.push(`${event.id} wounds ${subject} after death.`);
    steps.set(subject, event.to);
  }
  for (const [id, step] of Object.entries(state.quest?.steps ?? {})) {
    if (steps.has(id) && steps.get(id) !== step)
      problems.push(`${id} is at step ${step} but its events say ${steps.get(id)}.`);
  }
  for (const id of dead) {
    if (!state.roster.find((a) => a.id === id)?.dead) problems.push(`${id} died but is not dead.`);
  }
  return problems;
}
