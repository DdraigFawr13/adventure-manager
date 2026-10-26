// Scenes and main-fight exchanges (D-118, D-123, SPEC.md "Scenes" and "Main fight").
import type { ValuePart } from '../core/value.ts';
import { actionOf, guardFor, scoutPart, used, wardPart } from './actions.ts';
import { succeeded } from './check.ts';
import { wound, woundFoe } from './harm.ts';
import { foeDown, partyCheck, rankBy, roll, standing, stepOf, type Turn } from './turn.ts';
import type { Adventurer, FoeState, SceneTemplate } from './types.ts';
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
    const scout = scoutPart(turn, sceneEvent);
    if (scout) extra.push(scout);
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

/**
 * One exchange (D-118, D-129): everyone standing acts once, fastest first (Agility against each
 * foe group's speed; ties by id). Adventurers attack the first foe group still standing.
 */
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
  const ward = wardPart(turn, exchangeEvent);
  const engaged = new Set<string>();
  const order = [
    ...standing(turn).map((a) => ({ id: a.id, speed: a.attributes.agility, who: a, foe: null })),
    ...quest.foes
      .filter((f) => !foeDown(f))
      .map((f) => ({ id: f.id, speed: f.speed, who: null, foe: f })),
  ].sort((a, b) => b.speed - a.speed || (a.id < b.id ? -1 : 1));
  for (const actor of order) {
    if (actor.foe) {
      if (!foeDown(actor.foe)) foeStrikes(turn, actor.foe, exchangeEvent, ward);
      continue;
    }
    const attacker = actor.who;
    if (attacker.dead || stepOf(turn, attacker.id) >= WOUND.down) continue;
    const foe = quest.foes.find((f) => !foeDown(f));
    if (!foe) break;
    const cls = rules.classes[attacker.classId];
    if (!cls) throw new Error(`Unknown class ${attacker.classId}.`);
    const extra: ValuePart[] = [];
    if (attacker.weaponBp !== 0) extra.push({ sourceId: 'gear.weapon', amount: attacker.weaponBp });
    if (alarm !== 0) extra.push({ sourceId: 'quest.alarm', amount: -rules.stepBp * alarm });
    const shadow = engaged.has(foe.id) ? actionOf(turn, attacker, 'shadow-strike') : null;
    if (shadow) extra.push({ sourceId: shadow.id, amount: shadow.bonusBp });
    engaged.add(foe.id);
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
    if (result.outcome === 'bad-failure') {
      // Overreach (D-131): the foe group swung at strikes the attacker at once, past any guard.
      foeStrikes(turn, foe, eventId, ward, attacker);
      continue;
    }
    if (!succeeded(result.outcome)) continue;
    if (shadow) used(turn, shadow.id, [attacker.id, foe.id], eventId);
    const strong = result.outcome === 'strong-success';
    woundFoe(turn, foe, strong ? steps.strongHit : steps.hit, eventId);
    const cleave = strong ? actionOf(turn, attacker, 'cleave') : null;
    const next = cleave ? quest.foes.find((f) => f !== foe && !foeDown(f)) : undefined;
    if (cleave && next) {
      const cleaveId = used(turn, cleave.id, [attacker.id, next.id], eventId);
      woundFoe(turn, next, steps.hit, cleaveId);
    }
  }
}

/** Every standing foe group strikes once: used on each beat of a retreat from a fight. */
export function foesStrike(turn: Turn, causeId: string): void {
  for (const foe of turn.quest.foes) {
    if (!foeDown(foe)) foeStrikes(turn, foe, causeId);
  }
}

/**
 * One foe group strikes one standing adventurer, front line weighted over back; a counter-strike
 * after an overreach names its target and no guard steps in.
 */
function foeStrikes(
  turn: Turn,
  foe: FoeState,
  causeId: string,
  ward: ValuePart | null = null,
  counterTarget: Adventurer | null = null,
): void {
  const { quest, rules } = turn;
  const steps = rules.woundSteps;
  const alarm = quest.alarm ? rules.alarmFoeBonus : 0;
  const targets = standing(turn);
  if (targets.length === 0) return;
  const target =
    counterTarget ??
    guardFor(
      turn,
      turn.stream.weighted(targets.map((a) => [a, rules.targetWeight[a.position]] as const)),
      foe.id,
      causeId,
    );
  const parts: ValuePart[] = [
    { sourceId: 'foe.attack', amount: rules.stepBp * (foe.attack - target.attributes.agility) },
  ];
  if (alarm !== 0) parts.push({ sourceId: 'quest.alarm', amount: rules.stepBp * alarm });
  if (target.armourBp !== 0) parts.push({ sourceId: 'gear.armour', amount: -target.armourBp });
  if (ward) parts.push({ ...ward });
  const { roll: result, eventId } = roll(
    turn,
    'defence',
    [target.id, foe.id],
    rules.baseChanceBp,
    parts,
    0,
    causeId,
  );
  if (!succeeded(result.outcome)) return;
  wound(
    turn,
    target.id,
    result.outcome === 'strong-success' ? steps.strongHit : steps.hit,
    eventId,
  );
}
