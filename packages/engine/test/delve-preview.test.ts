// Showing intents and odds draws no roll and changes nothing (D-218, J2).
import { expect, it } from 'vitest';
import { allActionIds } from './delve-preview-ids.ts';
import { fightView, previewAction, type GameState } from '../src/index.ts';
import { act, started } from './delve-fixture.ts';

/** Errors a preview may give for a combination that names no real action; anything else fails. */
const EXPECTED = /^(No delve action|No pack item|No delve class|No foe kind|No such fighter)/;

const snapshot = (state: GameState): string => JSON.stringify({ ...state, content: null });

it('fightView and previewAction change nothing in the state; a strike does', () => {
  const { state } = started('preview');
  const before = snapshot(state);
  const view = fightView(state)!;
  const fighters = view.fighters.map((f) => f.id);
  let previews = 0;
  for (const actorId of fighters)
    for (const actionId of allActionIds(state))
      for (const targetId of fighters)
        for (const packIndex of [undefined, 0, 1, 2, 3]) {
          try {
            previewAction(state, actorId, actionId, targetId, packIndex);
            previews += 1;
          } catch (error) {
            expect(String(error instanceof Error ? error.message : error)).toMatch(EXPECTED);
          }
        }
  expect(previews).toBeGreaterThan(100);
  expect(snapshot(state)).toBe(before);
  // Control: a command on the same state draws from the fight's stream.
  const next = act(state, 'action.throw-knife', 'foe.4').state;
  expect(next.rng).not.toEqual(state.rng);
});
