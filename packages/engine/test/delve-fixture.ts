// Delve test helpers: the gate 1 pack's sample fight, with content variants that force hits or
// misses so one rule can be tested at a time. Tests own their states and may edit them.
import { gate1Content, gate1Delve, GATE1_SAMPLE_PACK } from '@adventure-manager/content';
import {
  sampleDelveState,
  sampleStart,
  simulate,
  type DelveContent,
  type DelveRun,
  type Fighter,
  type GameEvent,
  type GameState,
  type ResolutionContent,
} from '../src/index.ts';

export const SITE = 'site.sample-fight';
export const ODRIC = 'adv.odric-hale';
export const WENNA = 'adv.wenna-cray';
export const AMIS = 'adv.brother-amis';
export const MAUD = 'adv.maud-fenwick';

/** The gate 1 content with every check fixed at one chance (0 misses all, 10,000 hits all). */
export function fixedChance(bp: number, extra: Partial<DelveContent> = {}): ResolutionContent {
  return {
    ...gate1Content,
    delve: {
      ...gate1Delve,
      ...extra,
      rules: { ...gate1Delve.rules, check: { ...gate1Delve.rules.check, minBp: bp, maxBp: bp } },
    },
  };
}

let commandNo = 0;
export const nextId = (): string => `cmd.${(commandNo += 1)}`;

export function started(
  seed = 'delve-test',
  content: ResolutionContent = gate1Content,
): { state: GameState; events: readonly GameEvent[] } {
  const state = sampleDelveState(content, seed);
  return simulate(
    state,
    sampleStart(content, {
      id: 'cmd.start',
      siteId: SITE,
      tactics: 12,
      pack: GATE1_SAMPLE_PACK.map((p) => ({ ...p })),
    }),
  );
}

export function run(state: GameState): DelveRun {
  if (!state.delve) throw new Error('No delve.');
  return state.delve;
}

export function fighter(state: GameState, id: string): Fighter {
  const r = run(state);
  const f = r.fighters.find((x) => x.id === id) ?? r.fight?.foes.find((x) => x.id === id);
  if (!f) throw new Error(`No fighter ${id}.`);
  return f;
}

export function actor(state: GameState): string {
  const fight = run(state).fight;
  const id = fight?.order[fight.turn];
  if (!id) throw new Error('No actor.');
  return id;
}

export function act(
  state: GameState,
  actionId: string,
  targetId?: string,
  packIndex?: number,
): { state: GameState; events: readonly GameEvent[] } {
  return simulate(state, {
    type: 'fight.act',
    id: nextId(),
    day: 1,
    actorId: actor(state),
    actionId,
    ...(targetId === undefined ? {} : { targetId }),
    ...(packIndex === undefined ? {} : { packIndex }),
  });
}

/** Makes the fighter's turn come now: moves it to the front of the order with nobody acted. */
export function giveTurn(state: GameState, id: string): void {
  const fight = run(state).fight;
  if (!fight) throw new Error('No fight.');
  fight.order.splice(fight.order.indexOf(id), 1);
  fight.order.unshift(id);
  fight.turn = 0;
  fight.acted.length = 0;
}

export const ofType = <T extends GameEvent['type']>(
  events: readonly GameEvent[],
  type: T,
): Extract<GameEvent, { type: T }>[] =>
  events.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type);
