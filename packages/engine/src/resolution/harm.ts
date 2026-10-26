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
  const to = Math.min(WOUND.down, from + steps);
  if (to === from) return;
  foe.step = to;
  turn.sink.emit({ type: 'foe.wounded', causeId, subjectIds: [foe.id], from, to });
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

/** End of a scene or exchange: each standing healer tries one Dying member, then the rest roll. */
export function tendTheDying(turn: Turn, causeId: string): void {
  const { rules, quest } = turn;
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
    const stabilised = turn.sink.emit({
      type: 'adventurer.stabilised',
      causeId: eventId,
      subjectIds: [patient.id, healer.id],
    });
    turn.sink.emit({
      type: 'wound.changed',
      causeId: stabilised,
      subjectIds: [patient.id],
      from: WOUND.dying,
      to: WOUND.down,
    });
  }
  for (const patient of dying()) deathRoll(turn, patient, causeId);
}
