// Quest resolution v0 (SPEC.md, D-118..D-123): scenes, the main fight, wounds, death, retreat.
import type { EventSink } from '../core/events.ts';
import { BP_CERTAIN, streamFor, type RngStream } from '../core/rng.ts';
import type { ValuePart } from '../core/value.ts';
import { chanceValue, rollCheck, succeeded, type Roll } from './check.ts';
import type {
  Adventurer,
  Attribute,
  CheckPurpose,
  Command,
  FoeState,
  GameEvent,
  GameState,
  QuestOutcome,
  QuestRun,
  QuestTemplate,
  ResolutionRules,
  SceneTemplate,
} from './types.ts';
import { WOUND } from './types.ts';

const THRESHOLD_STEP = { 'badly-hurt': WOUND.badlyHurt, down: WOUND.down, dying: WOUND.dying };

/** Everything one command needs while it resolves. */
interface Turn {
  readonly state: GameState;
  readonly quest: QuestRun;
  readonly template: QuestTemplate;
  readonly rules: ResolutionRules;
  readonly sink: EventSink<GameEvent>;
  readonly stream: RngStream;
}

export function startQuest(
  state: GameState,
  command: Extract<Command, { type: 'quest.start' }>,
  sink: EventSink<GameEvent>,
): void {
  if (state.quest) throw new Error(`Quest ${state.quest.id} is still running.`);
  const template = findTemplate(state, command.templateId);
  const { min, max } = state.content.rules.partySize;
  const ids = command.partyIds;
  if (ids.length < min || ids.length > max)
    throw new Error(`A party has ${min}–${max} members, not ${ids.length}.`);
  if (new Set(ids).size !== ids.length) throw new Error('A party lists someone twice.');
  for (const id of ids) {
    if (member(state, id).dead) throw new Error(`Adventurer ${id} is dead.`);
  }
  const steps: Record<string, number> = {};
  for (const id of ids) steps[id] = WOUND.fit;
  state.quest = {
    id: command.questId,
    templateId: template.id,
    plan: command.plan,
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
    plan: command.plan,
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

function turnFor(state: GameState, sink: EventSink<GameEvent>): Turn {
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

function findTemplate(state: GameState, id: string): QuestTemplate {
  const template = state.content.quests.find((q) => q.id === id);
  if (!template) throw new Error(`Unknown quest template ${id}.`);
  return template;
}

function member(state: GameState, id: string): Adventurer {
  const found = state.roster.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown adventurer ${id}.`);
  return found;
}

function stepOf(turn: Turn, id: string): number {
  return turn.quest.steps[id] ?? WOUND.fit;
}

function living(turn: Turn): Adventurer[] {
  return turn.quest.partyIds.map((id) => member(turn.state, id)).filter((a) => !a.dead);
}

function standing(turn: Turn): Adventurer[] {
  return living(turn).filter((a) => stepOf(turn, a.id) < WOUND.down);
}

/** A party check: base, attribute against difficulty, extra parts, the plan's risk. */
function partyCheck(
  turn: Turn,
  purpose: CheckPurpose,
  who: Adventurer,
  attribute: Attribute,
  difficulty: number,
  extra: readonly ValuePart[],
  causeId: string,
): { roll: Roll; eventId: string } {
  const { rules, quest } = turn;
  const risk = rules.risk[quest.plan.risk];
  const parts: ValuePart[] = [
    {
      sourceId: `attribute.${attribute}`,
      amount: rules.stepBp * (who.attributes[attribute] - difficulty),
    },
    ...extra,
  ];
  if (risk.chanceBp !== 0)
    parts.push({ sourceId: `plan.risk.${quest.plan.risk}`, amount: risk.chanceBp });
  return roll(turn, purpose, [who.id], rules.baseChanceBp, parts, risk.badFailureShareBp, causeId);
}

function roll(
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

function resolveScene(turn: Turn, scene: SceneTemplate, commandId: string): void {
  const { quest, rules, template } = turn;
  const sceneEvent = turn.sink.emit({
    type: 'scene.started',
    causeId: commandId,
    subjectIds: [quest.id],
    sceneId: scene.id,
  });
  const attribute =
    scene.kind === 'approach' ? rules.approachAttribute[quest.plan.approach] : scene.attribute;
  const extra: ValuePart[] = [];
  if (scene.kind === 'approach') {
    for (const tag of template.tags) {
      const shift = rules.tagShifts[tag]?.[quest.plan.approach] ?? 0;
      if (shift !== 0) extra.push({ sourceId: `site.tag.${tag}`, amount: -rules.stepBp * shift });
    }
  }
  const ranked = standing(turn).sort(
    (a, b) => b.attributes[attribute] - a.attributes[attribute] || (a.id < b.id ? -1 : 1),
  );
  const count = scene.testers === 'best' ? 1 : scene.testers === 'best-two' ? 2 : ranked.length;
  for (const tester of ranked.slice(0, count)) {
    const { roll: result, eventId } = partyCheck(
      turn,
      'scene',
      tester,
      attribute,
      scene.difficulty,
      extra,
      sceneEvent,
    );
    if (succeeded(result.outcome)) continue;
    const bad = result.outcome === 'bad-failure';
    if (scene.onFailure === 'wound') wound(turn, tester.id, bad ? 2 : 1, eventId);
    else {
      if (!quest.alarm) {
        quest.alarm = true;
        turn.sink.emit({ type: 'alarm.raised', causeId: eventId, subjectIds: [quest.id] });
      }
      if (bad) wound(turn, tester.id, 1, eventId);
    }
  }
}

function resolveExchange(turn: Turn, commandId: string): void {
  const { quest, rules } = turn;
  const exchangeEvent = turn.sink.emit({
    type: 'exchange.started',
    causeId: commandId,
    subjectIds: [quest.id],
    exchange: quest.exchange,
  });
  const alarm = quest.alarm ? rules.alarmFoeBonus : 0;
  for (const attacker of standing(turn)) {
    const foe = quest.foes.find((f) => f.step < WOUND.down);
    if (!foe) break;
    const cls = rules.classes[attacker.classId];
    if (!cls) throw new Error(`Unknown class ${attacker.classId}.`);
    const extra: ValuePart[] = [];
    if (attacker.weaponBp !== 0) extra.push({ sourceId: 'gear.weapon', amount: attacker.weaponBp });
    if (alarm !== 0) extra.push({ sourceId: 'quest.alarm', amount: -rules.stepBp * alarm });
    const { roll: result, eventId } = partyCheck(
      turn,
      'attack',
      attacker,
      cls.attackAttribute,
      foe.defence,
      extra,
      exchangeEvent,
    );
    if (succeeded(result.outcome))
      woundFoe(turn, foe, result.outcome === 'strong-success' ? 2 : 1, eventId);
  }
  for (const foe of quest.foes) {
    if (foe.step >= WOUND.down) continue;
    const targets = standing(turn);
    if (targets.length === 0) break;
    const target = turn.stream.weighted(
      targets.map((a) => [a, rules.targetWeight[a.position]] as const),
    );
    const parts: ValuePart[] = [
      {
        sourceId: 'foe.attack',
        amount: rules.stepBp * (foe.attack + alarm - target.attributes.agility),
      },
    ];
    if (target.armourBp !== 0) parts.push({ sourceId: 'gear.armour', amount: -target.armourBp });
    const { roll: result, eventId } = roll(
      turn,
      'defence',
      [target.id, foe.id],
      rules.baseChanceBp,
      parts,
      0,
      exchangeEvent,
    );
    if (succeeded(result.outcome))
      wound(turn, target.id, result.outcome === 'strong-success' ? 2 : 1, eventId);
  }
}

/** Moves an adventurer down the wound steps; a step past Dying forces a death roll at once. */
function wound(turn: Turn, id: string, steps: number, causeId: string): void {
  const from = stepOf(turn, id);
  const to = Math.min(WOUND.dying, from + steps);
  let cause = causeId;
  if (to !== from) {
    turn.quest.steps[id] = to;
    cause = turn.sink.emit({ type: 'wound.changed', causeId, subjectIds: [id], from, to });
  }
  if (from + steps > WOUND.dying) deathRoll(turn, member(turn.state, id), cause);
}

function woundFoe(turn: Turn, foe: FoeState, steps: number, causeId: string): void {
  const from = foe.step;
  foe.step = Math.min(WOUND.down, from + steps);
  turn.sink.emit({ type: 'foe.wounded', causeId, subjectIds: [foe.id], from, to: foe.step });
}

function deathRoll(turn: Turn, who: Adventurer, causeId: string): void {
  if (who.dead) return;
  const { deathRoll: rule } = turn.rules;
  const parts: ValuePart[] = [];
  for (const attribute of ['toughness', 'resolve'] as const) {
    const above = Math.max(0, who.attributes[attribute] - rule.pivot);
    if (above > 0) parts.push({ sourceId: `attribute.${attribute}`, amount: -rule.stepBp * above });
  }
  const { roll: result, eventId } = roll(turn, 'death', [who.id], rule.baseBp, parts, 0, causeId, [
    0,
    BP_CERTAIN,
  ]);
  if (!succeeded(result.outcome)) return;
  who.dead = true;
  turn.sink.emit({ type: 'adventurer.died', causeId: eventId, subjectIds: [who.id] });
}

/** After a scene or exchange: healing, death rolls, then whether the quest ends or pauses. */
function afterBeat(turn: Turn, causeId: string, inFight: boolean): void {
  const { quest, rules } = turn;
  const dying = () => living(turn).filter((a) => stepOf(turn, a.id) === WOUND.dying);
  for (const healer of standing(turn)) {
    if (!rules.classes[healer.classId]?.canStabilise) continue;
    const patient = dying()[0];
    if (!patient) break;
    const { attribute, difficulty } = rules.stabilise;
    const { roll: result, eventId } = partyCheck(
      turn,
      'stabilise',
      healer,
      attribute,
      difficulty,
      [],
      causeId,
    );
    if (!succeeded(result.outcome)) continue;
    quest.steps[patient.id] = WOUND.down;
    turn.sink.emit({
      type: 'adventurer.stabilised',
      causeId: eventId,
      subjectIds: [patient.id, healer.id],
    });
  }
  for (const patient of dying()) deathRoll(turn, patient, causeId);

  if (standing(turn).length === 0) return endQuest(turn, 'routed', causeId);
  if (inFight) {
    if (quest.foes.every((f) => f.step >= WOUND.down)) return endQuest(turn, 'won', causeId);
    if (quest.exchange >= rules.maxExchanges) return endQuest(turn, 'partial', causeId);
  }
  const count = pastThreshold(turn);
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
  const leader = standing(turn).sort(
    (a, b) => b.attributes[attribute] - a.attributes[attribute] || (a.id < b.id ? -1 : 1),
  )[0];
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
    if (!succeeded(result.outcome)) wound(turn, turn.stream.pick(living(turn)).id, 1, eventId);
  }
  endQuest(turn, 'retreated', retreatEvent);
}

function endQuest(turn: Turn, outcome: QuestOutcome, causeId: string): void {
  const { injuryBp } = turn.rules;
  for (const who of living(turn)) {
    const step = stepOf(turn, who.id);
    const chanceBp =
      step === WOUND.dying
        ? injuryBp.dying
        : step === WOUND.down
          ? injuryBp.down
          : step === WOUND.badlyHurt
            ? injuryBp.badlyHurt
            : 0;
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
