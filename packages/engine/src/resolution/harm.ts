// Wounds, healing and death (D-120, SPEC.md "Wounds, death and injury").
import { BP_CERTAIN } from '../core/rng.ts';
import type { ValuePart } from '../core/value.ts';
import { succeeded } from './check.ts';
import { living, member, partyCheck, roll, standing, stepOf, type Turn } from './turn.ts';
import type { Adventurer, FoeState } from './types.ts';
import { WOUND } from './types.ts';

/** Moves an adventurer down the wound steps; a step past Dying forces a death roll at once. */
export function wound(turn: Turn, id: string, steps: number, causeId: string): void {
  if (steps <= 0) return;
  const from = stepOf(turn, id);
  const to = Math.min(WOUND.dying, from + steps);
  let cause = causeId;
  if (to !== from) {
    turn.quest.steps[id] = to;
    cause = turn.sink.emit({ type: 'wound.changed', causeId, subjectIds: [id], from, to });
  }
  if (from + steps > WOUND.dying) deathRoll(turn, member(turn.state, id), cause);
}

export function woundFoe(turn: Turn, foe: FoeState, steps: number, causeId: string): void {
  const from = foe.step;
  const to = Math.min(foe.hits, from + steps);
  if (to === from) return;
  foe.step = to;
  turn.sink.emit({
    type: 'foe.wounded',
    causeId,
    subjectIds: [foe.id],
    from,
    to,
    hits: foe.hits,
  });
}

export function deathRoll(turn: Turn, who: Adventurer, causeId: string): void {
  if (who.dead) return;
  const { deathRoll: rule } = turn.rules;
  const parts: ValuePart[] = [];
  for (const attribute of ['toughness', 'resolve'] as const) {
    const above = Math.max(0, who.attributes[attribute] - rule.pivot);
    if (above > 0) parts.push({ sourceId: `attribute.${attribute}`, amount: -rule.stepBp * above });
  }
  const limits = [0, BP_CERTAIN] as const;
  const { roll: result, eventId } = roll(
    turn,
    'death',
    [who.id],
    rule.baseBp,
    parts,
    0,
    causeId,
    limits,
  );
  if (!succeeded(result.outcome)) return;
  who.dead = true;
  turn.sink.emit({ type: 'adventurer.died', causeId: eventId, subjectIds: [who.id] });
}

/**
 * End of a scene or exchange (D-120, D-124): each standing healer tends one fallen member,
 * Dying first; untended Down members may bleed to Dying; those already Dying roll for death.
 */
/** Returns the healers who tended someone this beat, so they don't also mend (D-130). */
export function tendTheFallen(turn: Turn, causeId: string): Set<string> {
  const { rules, quest } = turn;
  const at = (step: number) => living(turn).filter((a) => stepOf(turn, a.id) === step);
  const dyingAtStart = new Set(at(WOUND.dying).map((a) => a.id));
  const attempted = new Set<string>();
  const tended = new Set<string>();
  const busy = new Set<string>();
  for (const healer of standing(turn)) {
    if (!rules.classes[healer.classId]?.canStabilise) continue;
    const untended = (step: number) => at(step).filter((a) => !attempted.has(a.id));
    const patient = untended(WOUND.dying)[0] ?? untended(WOUND.down)[0];
    if (!patient) break;
    attempted.add(patient.id);
    busy.add(healer.id);
    const { attribute, difficulty } = rules.stabilise;
    const { roll: result, eventId } = partyCheck(
      turn,
      'stabilise',
      healer,
      attribute,
      difficulty,
      [],
      causeId,
      [patient.id],
    );
    if (!succeeded(result.outcome)) continue;
    tended.add(patient.id);
    const stabilised = turn.sink.emit({
      type: 'adventurer.stabilised',
      causeId: eventId,
      subjectIds: [patient.id, healer.id],
    });
    if (stepOf(turn, patient.id) !== WOUND.dying) continue;
    quest.steps[patient.id] = WOUND.down;
    dyingAtStart.delete(patient.id);
    turn.sink.emit({
      type: 'wound.changed',
      causeId: stabilised,
      subjectIds: [patient.id],
      from: WOUND.dying,
      to: WOUND.down,
    });
  }
  for (const patient of at(WOUND.down)) {
    if (tended.has(patient.id)) continue;
    bleed(turn, patient, causeId);
  }
  // Someone who slipped to Dying this beat first rolls for death at the next one.
  for (const patient of at(WOUND.dying)) {
    if (dyingAtStart.has(patient.id)) deathRoll(turn, patient, causeId);
  }
  return busy;
}

function bleed(turn: Turn, who: Adventurer, causeId: string): void {
  const rule = turn.rules.bleed;
  const above = Math.max(0, who.attributes.toughness - rule.pivot);
  const parts: ValuePart[] =
    above > 0 ? [{ sourceId: 'attribute.toughness', amount: -rule.stepBp * above }] : [];
  const twist = turn.template.twist;
  if (twist?.kind === 'bleed') parts.push({ sourceId: twist.id, amount: twist.amountBp });
  const limits = [0, BP_CERTAIN] as const;
  const { roll: result, eventId } = roll(
    turn,
    'bleed',
    [who.id],
    rule.baseBp,
    parts,
    0,
    causeId,
    limits,
  );
  if (succeeded(result.outcome)) wound(turn, who.id, 1, eventId);
}
