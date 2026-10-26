// Class signature actions (D-130): content says which class has which action and its numbers;
// each action kind below is one rule. Every use emits `action.used`, so the log shows it.
import { BP_CERTAIN } from '../core/rng.ts';
import type { ValuePart } from '../core/value.ts';
import { succeeded } from './check.ts';
import { partyCheck, roll, standing, stepOf, type Turn } from './turn.ts';
import type { Adventurer, ClassAction } from './types.ts';
import { WOUND } from './types.ts';

type ActionOf<K extends ClassAction['kind']> = Extract<ClassAction, { kind: K }>;

export function actionOf<K extends ClassAction['kind']>(
  turn: Turn,
  who: Adventurer,
  kind: K,
): ActionOf<K> | null {
  const actions = turn.rules.classes[who.classId]?.actions ?? [];
  const found = actions.find((a): a is ActionOf<K> => a.kind === kind);
  return found ?? null;
}

/** The first standing member (party order) with an action of this kind, other than `except`. */
export function firstWith<K extends ClassAction['kind']>(
  turn: Turn,
  kind: K,
  except = '',
): { who: Adventurer; action: ActionOf<K> } | null {
  for (const who of standing(turn)) {
    if (who.id === except) continue;
    const action = actionOf(turn, who, kind);
    if (action) return { who, action };
  }
  return null;
}

export function used(turn: Turn, actionId: string, subjectIds: string[], causeId: string): string {
  return turn.sink.emit({ type: 'action.used', causeId, subjectIds, actionId });
}

/** Scout ahead: a standing scout adds a bonus to every tester in an approach scene. */
export function scoutPart(turn: Turn, causeId: string): ValuePart | null {
  const scout = firstWith(turn, 'scout');
  if (!scout) return null;
  used(turn, scout.action.id, [scout.who.id], causeId);
  return { sourceId: scout.action.id, amount: scout.action.bonusBp };
}

/** Ward: a standing warder makes every foe attack this exchange less likely. */
export function wardPart(turn: Turn, causeId: string): ValuePart | null {
  const warder = firstWith(turn, 'ward');
  if (!warder) return null;
  used(turn, warder.action.id, [warder.who.id], causeId);
  return { sourceId: warder.action.id, amount: -warder.action.penaltyBp };
}

/** Guard: a standing guard may step in front of a blow meant for a comrade. Returns who takes it. */
export function guardFor(
  turn: Turn,
  target: Adventurer,
  foeId: string,
  causeId: string,
): Adventurer {
  const guard = firstWith(turn, 'guard', target.id);
  if (!guard) return target;
  const limits = [0, BP_CERTAIN] as const;
  const { roll: result, eventId } = roll(
    turn,
    'guard',
    [guard.who.id, target.id, foeId],
    guard.action.chanceBp,
    [],
    0,
    causeId,
    limits,
  );
  if (!succeeded(result.outcome)) return target;
  used(turn, guard.action.id, [guard.who.id, target.id], eventId);
  return guard.who;
}

/**
 * Mend, at the end of a scene or exchange: each standing mender who did not tend the fallen this
 * beat tries to bring the most hurt standing member (Hurt or Badly hurt) up one step.
 */
export function mend(turn: Turn, busy: ReadonlySet<string>, causeId: string): void {
  for (const mender of standing(turn)) {
    if (busy.has(mender.id)) continue;
    const action = actionOf(turn, mender, 'mend');
    if (!action) continue;
    const patient = standing(turn)
      .filter((a) => stepOf(turn, a.id) > WOUND.fit)
      .sort((a, b) => stepOf(turn, b.id) - stepOf(turn, a.id) || (a.id < b.id ? -1 : 1))[0];
    if (!patient) return;
    const { roll: result, eventId } = partyCheck(
      turn,
      'mend',
      mender,
      action.attribute,
      action.difficulty,
      [],
      causeId,
      [patient.id],
    );
    if (!succeeded(result.outcome)) continue;
    const from = stepOf(turn, patient.id);
    turn.quest.steps[patient.id] = from - 1;
    const usedId = used(turn, action.id, [mender.id, patient.id], eventId);
    turn.sink.emit({
      type: 'wound.changed',
      causeId: usedId,
      subjectIds: [patient.id],
      from,
      to: from - 1,
    });
  }
}
