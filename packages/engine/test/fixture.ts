// Test content for resolution v0. Extreme numbers (0% or 100% chances) make single rules
// testable without depending on particular draws.
import type {
  Adventurer,
  Attribute,
  Command,
  GameEvent,
  GameState,
  Plan,
  QuestTemplate,
  ResolutionRules,
} from '../src/index.ts';
import { ATTRIBUTES, simulate } from '../src/index.ts';

export const rules: ResolutionRules = {
  partySize: { min: 1, max: 6 },
  baseChanceBp: 5000,
  stepBp: 500,
  minChanceBp: 500,
  maxChanceBp: 9500,
  strongHitShareBp: 2500,
  woundSteps: {
    failure: 1,
    badFailure: 2,
    alarmBadFailure: 1,
    hit: 1,
    strongHit: 2,
    failedRetreat: 1,
  },
  risk: {
    cautious: { chanceBp: -500, badFailureShareBp: 1500 },
    steady: { chanceBp: 0, badFailureShareBp: 3000 },
    bold: { chanceBp: 500, badFailureShareBp: 5000 },
  },
  approachAttribute: { stealth: 'stealth', assault: 'might', diplomacy: 'presence' },
  tagShifts: { guarded: { stealth: -2, assault: 2 } },
  alarmFoeBonus: 2,
  maxExchanges: 6,
  targetWeight: { front: 2, back: 1 },
  deathRoll: { baseBp: 2500, stepBp: 100, pivot: 10 },
  stabilise: { attribute: 'lore', difficulty: 10 },
  injuryBp: { badlyHurt: 1500, down: 4000, dying: 7000 },
  retreat: {
    attribute: 'wits',
    difficulty: { routine: 6, hazardous: 9, perilous: 12, deadly: 15 },
  },
  classes: {
    warrior: { attackAttribute: 'might', canStabilise: false },
    rogue: { attackAttribute: 'agility', canStabilise: false },
    cleric: { attackAttribute: 'lore', canStabilise: true },
  },
};

export function adventurer(
  id: string,
  attrs: Partial<Record<Attribute, number>> = {},
  classId = 'warrior',
): Adventurer {
  const attributes = Object.fromEntries(ATTRIBUTES.map((a) => [a, attrs[a] ?? 10]));
  return {
    id,
    classId,
    position: 'front',
    // cast-ok: built from every name in ATTRIBUTES just above.
    attributes: attributes as Record<Attribute, number>,
    weaponBp: 0,
    armourBp: 0,
    dead: false,
  };
}

export const quest: QuestTemplate = {
  id: 'quest.test-barrow',
  danger: 'hazardous',
  tags: ['guarded'],
  scenes: [
    {
      id: 'scene.road',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 8,
      testers: 'all',
      onFailure: 'wound',
    },
    { id: 'scene.gate', kind: 'approach', difficulty: 10, testers: 'best', onFailure: 'alarm' },
  ],
  foes: [{ id: 'foe.wights', attack: 10, defence: 10 }],
};

export function game(
  roster: Adventurer[],
  overrides: {
    rules?: Partial<ResolutionRules>;
    quest?: Partial<QuestTemplate>;
    seed?: string;
  } = {},
): GameState {
  return {
    seed: overrides.seed ?? 'test-seed',
    rng: {},
    nextEventNo: 1,
    content: {
      rules: { ...rules, ...overrides.rules },
      quests: [{ ...quest, ...overrides.quest }],
    },
    roster,
    quest: null,
  };
}

export const steadyPlan: Plan = { approach: 'stealth', risk: 'steady', retreat: 'never' };

export function start(
  state: GameState,
  plan: Plan = steadyPlan,
  watched = false,
): { state: GameState; events: GameEvent[]; commandIds: string[] } {
  const command: Command = {
    type: 'quest.start',
    id: 'c0',
    day: 1,
    questId: 'q1',
    templateId: quest.id,
    partyIds: state.roster.map((a) => a.id),
    plan,
    watched,
  };
  const result = simulate(state, command);
  return { state: result.state, events: [...result.events], commandIds: ['c0'] };
}

/** Steps until the quest ends or a moment waits; returns every event, in order. */
export function run(
  state: GameState,
  plan: Plan = steadyPlan,
  watched = false,
): { state: GameState; events: GameEvent[]; commandIds: string[] } {
  let current = start(state, plan, watched);
  for (let n = 1; current.state.quest && !current.state.quest.momentPending; n += 1) {
    const id = `c${n}`;
    const result = simulate(current.state, { type: 'quest.step', id, day: 1 });
    current = {
      state: result.state,
      events: [...current.events, ...result.events],
      commandIds: [...current.commandIds, id],
    };
  }
  return current;
}

export function ofType<T extends GameEvent['type']>(
  events: readonly GameEvent[],
  type: T,
): Extract<GameEvent, { type: T }>[] {
  return events.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type);
}
