// Quest resolution v0 (SPEC.md, D-118..D-123): the commands, the end of each beat, retreat.
import type { EventSink } from '../core/events.ts';
import { BP_CERTAIN } from '../core/rng.ts';
import { succeeded } from './check.ts';
import { resolveExchange, resolveScene } from './encounters.ts';
import { tendTheDying, wound } from './harm.ts';
import {
  findTemplate,
  living,
  member,
  partyCheck,
  rankBy,
  roll,
  standing,
  stepOf,
  turnFor,
  type Turn,
} from './turn.ts';
import type { Command, GameEvent, GameState, QuestOutcome } from './types.ts';
import { WOUND } from './types.ts';

const THRESHOLD_STEP = { 'badly-hurt': WOUND.badlyHurt, down: WOUND.down, dying: WOUND.dying };

export function startQuest(
  state: GameState,
  command: Extract<Command, { type: 'quest.start' }>,
  sink: EventSink<GameEvent>,
): void {
  if (state.quest) throw new Error(`Quest ${state.quest.id} is still running.`);
  const template = findTemplate(state, command.templateId);
  const { rules } = state.content;
  const { min, max } = rules.partySize;
  const ids = command.partyIds;
  if (ids.length < min || ids.length > max)
    throw new Error(`A party has ${min}–${max} members, not ${ids.length}.`);
  if (new Set(ids).size !== ids.length) throw new Error('A party lists someone twice.');
  for (const id of ids) {
    const who = member(state, id);
    if (who.dead) throw new Error(`Adventurer ${id} is dead.`);
    if (!Object.hasOwn(rules.classes, who.classId))
      throw new Error(`Adventurer ${id} has an unknown class ${who.classId}.`);
  }
  const steps: Record<string, number> = {};
  for (const id of ids) steps[id] = WOUND.fit;
  state.quest = {
    id: command.questId,
    templateId: template.id,
    plan: { ...command.plan },
    watched: command.watched,
    partyIds: [...ids],
    steps,
    phase: template.scenes.length > 0 ? 'scenes' : 'fight',
    sceneIndex: 0,
    exchange: 0,
    alarm: false,
    foes: template.foes.map((f) => ({ ...f, step: WOUND.fit })),
    momentPending: false,
    answeredCount: 0,
  };
  sink.emit({
    type: 'quest.started',
    causeId: command.id,
    subjectIds: [command.questId, ...ids],
    templateId: template.id,
    plan: { ...command.plan },
  });
}

/** Resolves one scene or one fight exchange. */
export function stepQuest(state: GameState, causeId: string, sink: EventSink<GameEvent>): void {
  const turn = turnFor(state, sink);
  if (turn.quest.momentPending) throw new Error('A moment is waiting for the player.');
  const { quest, template } = turn;
  if (quest.phase === 'scenes') {
    const scene = template.scenes[quest.sceneIndex];
    if (!scene) throw new Error(`Scene ${quest.sceneIndex} is missing.`);
    resolveScene(turn, scene, causeId);
    quest.sceneIndex += 1;
    if (quest.sceneIndex >= template.scenes.length) quest.phase = 'fight';
    afterBeat(turn, causeId, false);
  } else {
    quest.exchange += 1;
    resolveExchange(turn, causeId);
    afterBeat(turn, causeId, true);
  }
}

export function chooseMoment(
  state: GameState,
  command: Extract<Command, { type: 'quest.choose' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = turnFor(state, sink);
  if (!turn.quest.momentPending) throw new Error('No moment is waiting.');
  turn.quest.momentPending = false;
  const id = sink.emit({
    type: 'moment.resolved',
    causeId: command.id,
    subjectIds: [turn.quest.id],
    choice: command.choice,
  });
  if (command.choice === 'pull-out') retreat(turn, id);
  else turn.quest.answeredCount = pastThreshold(turn);
}

/** After a scene or exchange: healing, death rolls, then whether the quest ends or pauses. */
function afterBeat(turn: Turn, causeId: string, inFight: boolean): void {
  const { quest, rules } = turn;
  tendTheDying(turn, causeId);
  if (standing(turn).length === 0) return endQuest(turn, 'routed', causeId);
  if (inFight) {
    if (quest.foes.every((f) => f.step >= WOUND.down)) return endQuest(turn, 'won', causeId);
    if (quest.exchange >= rules.maxExchanges) return endQuest(turn, 'partial', causeId);
  }
  const count = pastThreshold(turn);
  // A stabilised member can drop the count; the moment returns when it rises past the new low.
  quest.answeredCount = Math.min(quest.answeredCount, count);
  if (count <= quest.answeredCount) return;
  if (quest.watched) {
    quest.momentPending = true;
    turn.sink.emit({ type: 'moment.raised', causeId, subjectIds: [quest.id], moment: 'retreat' });
  } else retreat(turn, causeId);
}

/** Members (the dead included) at or past the plan's retreat threshold. */
function pastThreshold(turn: Turn): number {
  const threshold = turn.quest.plan.retreat;
  if (threshold === 'never') return 0;
  return turn.quest.partyIds.filter(
    (id) => member(turn.state, id).dead || stepOf(turn, id) >= THRESHOLD_STEP[threshold],
  ).length;
}

function retreat(turn: Turn, causeId: string): void {
  const { rules, template, quest } = turn;
  const retreatEvent = turn.sink.emit({ type: 'quest.retreated', causeId, subjectIds: [quest.id] });
  const { attribute } = rules.retreat;
  const leader = rankBy(standing(turn), attribute)[0];
  if (leader) {
    const difficulty = rules.retreat.difficulty[template.danger];
    const { roll: result, eventId } = partyCheck(
      turn,
      'retreat',
      leader,
      attribute,
      difficulty,
      [],
      retreatEvent,
    );
    if (!succeeded(result.outcome))
      wound(turn, turn.stream.pick(living(turn)).id, rules.woundSteps.failedRetreat, eventId);
  }
  endQuest(turn, 'retreated', retreatEvent);
}

/** Rolls lasting injuries, then ends the quest. v0 records injuries as events only. */
function endQuest(turn: Turn, outcome: QuestOutcome, causeId: string): void {
  const { injuryBp } = turn.rules;
  const chanceByStep: Readonly<Record<number, number>> = {
    [WOUND.badlyHurt]: injuryBp.badlyHurt,
    [WOUND.down]: injuryBp.down,
    [WOUND.dying]: injuryBp.dying,
  };
  for (const who of living(turn)) {
    const chanceBp = chanceByStep[stepOf(turn, who.id)] ?? 0;
    if (chanceBp === 0) continue;
    const limits = [0, BP_CERTAIN] as const;
    const { roll: result, eventId } = roll(
      turn,
      'injury',
      [who.id],
      chanceBp,
      [],
      0,
      causeId,
      limits,
    );
    if (succeeded(result.outcome))
      turn.sink.emit({ type: 'injury.gained', causeId: eventId, subjectIds: [who.id] });
  }
  turn.sink.emit({ type: 'quest.ended', causeId, subjectIds: [turn.quest.id], outcome });
  turn.state.quest = null;
}
