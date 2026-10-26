// Stops (PLAN §2c, §2f): all stops raised on one day are one stop for the player.
import type { GameEvent } from '../resolution/types.ts';

/** The distinct days, in order, that have at least one stop event passing `filter`. */
export function stopDays(
  events: readonly GameEvent[],
  filter: (stop: Extract<GameEvent, { type: 'stop.raised' }>) => boolean = () => true,
): number[] {
  const days = new Set<number>();
  for (const e of events) if (e.type === 'stop.raised' && filter(e)) days.add(e.day);
  return [...days].sort((a, b) => a - b);
}
