// Quest resolution v0 (SPEC.md, D-118..D-123): the commands, the end of each beat, retreat.
import type { EventSink } from '../core/events.ts';
import { divRoundDown } from '../core/math.ts';
import { BP_CERTAIN } from '../core/rng.ts';
import { succeeded } from './check.ts';
import { foesStrike, resolveExchange, resolveScene } from './encounters.ts';
import { mend } from './actions.ts';
import { tendTheFallen } from './harm.ts';
import {
  findTemplate,
  foeDown,
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
    retreatBeats: 0,
    fledFight: false,
    judgedFallen: 0,
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
  if (quest.phase === 'retreat') {
    retreatBeat(turn, causeId);
  } else if (quest.phase === 'scenes') {
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
  const { quest } = turn;
  mend(turn, tendTheFallen(turn, causeId), causeId);
  if (standing(turn).length === 0) return endQuest(turn, 'routed', causeId);
  if (inFight) {
    if (quest.foes.every(foeDown)) return endQuest(turn, 'won', causeId);
    if (quest.exchange >= maxExchanges(turn)) return endQuest(turn, 'partial', causeId);
  }
  let pullOutCause = quest.plan.retreat === 'leader' ? leaderJudges(turn, causeId) : null;
  const count = pastThreshold(turn);
  // A stabilised member can drop the count; the moment returns when it rises past the new low.
  quest.answeredCount = Math.min(quest.answeredCount, count);
  if (count > quest.answeredCount) pullOutCause ??= causeId;
  if (pullOutCause === null) return;
  if (quest.watched) {
    quest.momentPending = true;
    turn.sink.emit({
      type: 'moment.raised',
      causeId: pullOutCause,
      subjectIds: [quest.id],
      moment: 'retreat',
    });
  } else retreat(turn, pullOutCause);
}

/** Members (the dead included) at or past the plan's hard retreat line. */
function pastThreshold(turn: Turn): number {
  const threshold = turn.quest.plan.retreat;
  if (threshold === 'never') return 0;
  const line = threshold === 'leader' ? WOUND.dying : THRESHOLD_STEP[threshold];
  return turn.quest.partyIds.filter((id) => member(turn.state, id).dead || stepOf(turn, id) >= line)
    .length;
}

/**
 * D-125: when another member falls, the leader reads the fight. Winning means a larger share of
 * foe groups down than of the party fallen. A Wits check, easier when the gap is wide, gets the
 * read right; a failed one gets it wrong. Returns the judgement event's id on a pull-out call.
 */
function leaderJudges(turn: Turn, causeId: string): string | null {
  const { quest, rules } = turn;
  const fallen = quest.partyIds.filter(
    (id) => member(turn.state, id).dead || stepOf(turn, id) >= WOUND.down,
  ).length;
  if (fallen <= quest.judgedFallen) {
    quest.judgedFallen = Math.min(quest.judgedFallen, fallen);
    return null;
  }
  quest.judgedFallen = fallen;
  const call = rules.leaderCall;
  const leader = rankBy(standing(turn), call.attribute)[0];
  if (!leader) return null;
  const foesDown = quest.foes.filter(foeDown).length;
  const foeShareBp = quest.foes.length ? divRoundDown(foesDown * BP_CERTAIN, quest.foes.length) : 0;
  const fallenShareBp = divRoundDown(fallen * BP_CERTAIN, quest.partyIds.length);
  const winning = foeShareBp > fallenShareBp;
  const clarity = divRoundDown(Math.abs(foeShareBp - fallenShareBp), call.clarityStepBp);
  const { roll: result, eventId } = partyCheck(
    turn,
    'judgement',
    leader,
    call.attribute,
    call.difficulty - clarity,
    [],
    causeId,
  );
  const right = succeeded(result.outcome);
  const hold = right === winning;
  const judged = turn.sink.emit({
    type: 'leader.judged',
    causeId: eventId,
    subjectIds: [leader.id],
    situation: winning ? 'winning' : 'losing',
    call: hold ? 'hold' : 'pull-out',
  });
  return hold ? null : judged;
}

/** D-126: a retreat takes beats; the check, and carrying the fallen, decide how many. */
function retreat(turn: Turn, causeId: string): void {
  const { rules, template, quest } = turn;
  const plan = rules.retreat;
  let beats = plan.beats;
  if (living(turn).some((a) => stepOf(turn, a.id) >= WOUND.down)) beats += plan.carryBeats;
  const leader = rankBy(standing(turn), plan.attribute)[0];
  let cause = causeId;
  if (leader) {
    const { roll: result, eventId } = partyCheck(
      turn,
      'retreat',
      leader,
      plan.attribute,
      plan.difficulty[template.danger],
      [],
      causeId,
    );
    cause = eventId;
    if (!succeeded(result.outcome)) beats += plan.failedCheckBeats;
  }
  quest.fledFight = quest.phase === 'fight' && quest.exchange > 0;
  quest.phase = 'retreat';
  quest.retreatBeats = beats;
  turn.sink.emit({ type: 'quest.retreated', causeId: cause, subjectIds: [quest.id], beats });
}

/** One beat of the way out: foes strike if the party fled a fight, the fallen bleed. */
function retreatBeat(turn: Turn, commandId: string): void {
  const { quest } = turn;
  quest.retreatBeats -= 1;
  const beat = turn.sink.emit({
    type: 'retreat.beat',
    causeId: commandId,
    subjectIds: [quest.id],
    beatsLeft: quest.retreatBeats,
  });
  if (quest.fledFight) foesStrike(turn, beat);
  mend(turn, tendTheFallen(turn, beat), beat);
  if (standing(turn).length === 0) return endQuest(turn, 'routed', beat);
  if (quest.retreatBeats <= 0) endQuest(turn, 'retreated', beat);
}

/** A deadline twist (D-139) ends the fight sooner; the foes slip away. */
function maxExchanges(turn: Turn): number {
  const twist = turn.template.twist;
  const sooner = twist?.kind === 'deadline' ? twist.exchanges : 0;
  return Math.max(1, turn.rules.maxExchanges - sooner);
}

/** Rolls lasting injuries, then ends the quest. v0 records injuries as events only. */
function endQuest(turn: Turn, reached: QuestOutcome, causeId: string): void {
  // A hostage twist (D-139): once the alarm is up, a win is only half done.
  const hostageLost = turn.template.twist?.kind === 'hostage' && turn.quest.alarm;
  const outcome = hostageLost && reached === 'won' ? 'partial' : reached;
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
