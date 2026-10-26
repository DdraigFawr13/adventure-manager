// Shared helpers for one command's resolution: lookups, who can act, and rolling a check.
import type { EventSink } from '../core/events.ts';
import { streamFor, type RngStream } from '../core/rng.ts';
import type { ValuePart } from '../core/value.ts';
import { chanceValue, rollCheck, type Roll } from './check.ts';
import type {
  Adventurer,
  Attribute,
  CheckPurpose,
  GameEvent,
  GameState,
  QuestRun,
  QuestTemplate,
  ResolutionRules,
} from './types.ts';
import { WOUND } from './types.ts';

/** Everything one command needs while it resolves. */
export interface Turn {
  readonly state: GameState;
  readonly quest: QuestRun;
  readonly template: QuestTemplate;
  readonly rules: ResolutionRules;
  readonly sink: EventSink<GameEvent>;
  readonly stream: RngStream;
}

export function turnFor(state: GameState, sink: EventSink<GameEvent>): Turn {
  const quest = state.quest;
  if (!quest) throw new Error('No quest is running.');
  return {
    state,
    quest,
    template: findTemplate(state, quest.templateId),
    rules: state.content.rules,
    sink,
    stream: streamFor(state, 'quest.resolution'),
  };
}

export function findTemplate(state: GameState, id: string): QuestTemplate {
  const template = state.content.quests.find((q) => q.id === id);
  if (!template) throw new Error(`Unknown quest template ${id}.`);
  return template;
}

export function member(state: GameState, id: string): Adventurer {
  const found = state.roster.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown adventurer ${id}.`);
  return found;
}

export function stepOf(turn: Turn, id: string): number {
  return turn.quest.steps[id] ?? WOUND.fit;
}

export function living(turn: Turn): Adventurer[] {
  return turn.quest.partyIds.map((id) => member(turn.state, id)).filter((a) => !a.dead);
}

export function standing(turn: Turn): Adventurer[] {
  return living(turn).filter((a) => stepOf(turn, a.id) < WOUND.down);
}

/** Best first by the attribute; ties by id, so the order never depends on the roster's order. */
export function rankBy(people: Adventurer[], attribute: Attribute): Adventurer[] {
  return people.sort(
    (a, b) => b.attributes[attribute] - a.attributes[attribute] || (a.id < b.id ? -1 : 1),
  );
}

/** A party check: base, attribute against difficulty, extra parts, the plan's risk. */
export function partyCheck(
  turn: Turn,
  purpose: CheckPurpose,
  who: Adventurer,
  attribute: Attribute,
  difficulty: number,
  extra: readonly ValuePart[],
  causeId: string,
  /** Others the check is about, e.g. the foe attacked or the member tended. */
  others: readonly string[] = [],
): { roll: Roll; eventId: string } {
  const { rules, quest } = turn;
  const risk = rules.risk[quest.plan.risk];
  const parts: ValuePart[] = [
    {
      sourceId: `attribute.${attribute}`,
      amount: rules.stepBp * (who.attributes[attribute] - difficulty),
    },
    ...extra.map((p) => ({ ...p })),
  ];
  if (risk.chanceBp !== 0)
    parts.push({ sourceId: `plan.risk.${quest.plan.risk}`, amount: risk.chanceBp });
  return roll(
    turn,
    purpose,
    [who.id, ...others],
    rules.baseChanceBp,
    parts,
    risk.badFailureShareBp,
    causeId,
  );
}

export function roll(
  turn: Turn,
  purpose: CheckPurpose,
  subjectIds: readonly string[],
  baseBp: number,
  parts: readonly ValuePart[],
  badShareBp: number,
  causeId: string,
  limits: readonly [number, number] = [turn.rules.minChanceBp, turn.rules.maxChanceBp],
): { roll: Roll; eventId: string } {
  const chance = chanceValue(baseBp, parts, limits[0], limits[1], causeId);
  const result = rollCheck(turn.stream, chance.total, turn.rules.strongHitShareBp, badShareBp);
  const eventId = turn.sink.emit({
    type: 'check.rolled',
    causeId,
    subjectIds,
    purpose,
    chance,
    roll: result.roll,
    outcome: result.outcome,
  });
  return { roll: result, eventId };
}
