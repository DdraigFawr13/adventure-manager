// Scenes and main-fight exchanges (D-118, D-123, SPEC.md "Scenes" and "Main fight").
import type { ValuePart } from '../core/value.ts';
import { succeeded } from './check.ts';
import { wound, woundFoe } from './harm.ts';
import { partyCheck, rankBy, roll, standing, type Turn } from './turn.ts';
import type { SceneTemplate } from './types.ts';
import { WOUND } from './types.ts';

export function resolveScene(turn: Turn, scene: SceneTemplate, commandId: string): void {
  const { quest, rules, template } = turn;
  const steps = rules.woundSteps;
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
      // A shift changes difficulty, so a negative shift makes the check easier.
      const shift = Object.hasOwn(rules.tagShifts, tag)
        ? (rules.tagShifts[tag]?.[quest.plan.approach] ?? 0)
        : 0;
      if (shift !== 0) extra.push({ sourceId: `site.tag.${tag}`, amount: -rules.stepBp * shift });
    }
  }
  const ranked = rankBy(standing(turn), attribute);
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
    if (scene.onFailure === 'wound') {
      wound(turn, tester.id, bad ? steps.badFailure : steps.failure, eventId);
      continue;
    }
    if (!quest.alarm) {
      quest.alarm = true;
      turn.sink.emit({ type: 'alarm.raised', causeId: eventId, subjectIds: [quest.id] });
    }
    if (bad) wound(turn, tester.id, steps.alarmBadFailure, eventId);
  }
}

export function resolveExchange(turn: Turn, commandId: string): void {
  const { quest, rules } = turn;
  const steps = rules.woundSteps;
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
      [foe.id],
    );
    if (!succeeded(result.outcome)) continue;
    woundFoe(turn, foe, result.outcome === 'strong-success' ? steps.strongHit : steps.hit, eventId);
  }
  foesStrike(turn, exchangeEvent);
}

/** Every standing foe group strikes one standing adventurer: in each exchange, and on a retreat. */
export function foesStrike(turn: Turn, causeId: string): void {
  const { quest, rules } = turn;
  const steps = rules.woundSteps;
  const alarm = quest.alarm ? rules.alarmFoeBonus : 0;
  for (const foe of quest.foes) {
    if (foe.step >= WOUND.down) continue;
    const targets = standing(turn);
    if (targets.length === 0) break;
    const target = turn.stream.weighted(
      targets.map((a) => [a, rules.targetWeight[a.position]] as const),
    );
    const parts: ValuePart[] = [
      { sourceId: 'foe.attack', amount: rules.stepBp * (foe.attack - target.attributes.agility) },
    ];
    if (alarm !== 0) parts.push({ sourceId: 'quest.alarm', amount: rules.stepBp * alarm });
    if (target.armourBp !== 0) parts.push({ sourceId: 'gear.armour', amount: -target.armourBp });
    const { roll: result, eventId } = roll(
      turn,
      'defence',
      [target.id, foe.id],
      rules.baseChanceBp,
      parts,
      0,
      causeId,
    );
    if (!succeeded(result.outcome)) continue;
    wound(
      turn,
      target.id,
      result.outcome === 'strong-success' ? steps.strongHit : steps.hit,
      eventId,
    );
  }
}
