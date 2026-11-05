// Retreat (SPEC.md "Retreat", D-126 with v0's numbers): on an adventurer's turn, one Wits check by
// the standing member with the best Wits; beats in which every standing foe strikes once, then the
// round-end rolls. Rolls are on `delve.fight`.
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import type { EventSink } from '../core/events.ts';
import type { Value } from '../core/value.ts';
import type { GameEvent, GameState } from '../resolution/types.ts';
import { delveContent, fighterOf, fightOf, isUp, runOf } from './actions.ts';
import { leaderOf } from './auto.ts';
import { endDelve, endRoundRolls, foeTurn } from './fight.ts';
import { checkChance } from './rooms.ts';
import type { DelveCommand, Fighter } from './types.ts';

type Sink = EventSink<GameEvent>;

export interface RetreatPreview {
  readonly leaderId: string;
  readonly chance: Value;
  /** Beats if the check passes; one more if it fails. */
  readonly beats: number;
  readonly failedBeats: number;
}

/** Why the party can't retreat now, or null. */
export function retreatRefusal(state: GameState): string | null {
  const run = state.delve;
  if (!run || run.phase !== 'fight' || !run.fight) return 'Retreat is from a fight.';
  const actor = run.fighters.find((f) => f.id === run.fight?.order[run.fight.turn]);
  if (!actor || !isUp(actor)) return 'Retreat on an adventurer’s turn.';
  return null;
}

export function retreatPreview(state: GameState): RetreatPreview {
  const why = retreatRefusal(state);
  if (why) throw new Error(why);
  const run = runOf(state);
  const rules = delveContent(state).rules.retreat;
  const leader = leaderOf(state, run)!;
  const carrying = run.fighters.some((f) => f.status === 'down' || f.status === 'dying');
  const beats = rules.beats + (carrying ? rules.carryBeats : 0);
  return {
    leaderId: leader.id,
    chance: checkChance(state, run, leader.id, rules.attribute, rules.difficulty[run.danger]),
    beats,
    failedBeats: beats + rules.failedCheckBeats,
  };
}

export function retreat(
  state: GameState,
  command: Extract<DelveCommand, { type: 'fight.retreat' }>,
  sink: Sink,
): void {
  const preview = retreatPreview(state);
  const run = runOf(state);
  const fight = fightOf(run);
  const roll = streamFor(state, 'delve.fight').int(BP_CERTAIN) + 1;
  const success = roll <= preview.chance.total;
  const beats = success ? preview.beats : preview.failedBeats;
  const rolled = sink.emit({
    type: 'retreat.rolled',
    causeId: command.id,
    subjectIds: [preview.leaderId],
    chance: preview.chance,
    roll,
    success,
    beats,
  });
  for (let beat = 1; beat <= beats; beat += 1) {
    const cause = sink.emit({ type: 'retreat.beat', causeId: rolled, subjectIds: [], beat });
    // Each standing foe strikes once by its target rule, in the fight's order.
    for (const id of [...fight.order]) {
      const foe: Fighter = fighterOf(run, id);
      if (foe.side !== 'foe' || !isUp(foe)) continue;
      if (!run.fighters.some(isUp)) break;
      delete fight.intents[foe.id];
      foeTurn(state, run, foe, sink, cause);
    }
    endRoundRolls(state, run, sink, cause);
    if (!run.fighters.some(isUp)) break;
  }
  endDelve(state, run, run.fighters.some(isUp) ? 'retreated' : 'routed', sink, rolled);
}
