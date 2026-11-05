// Showing intents and odds draws no roll (D-218, J2): the views leave `state.rng` untouched.
import { expect, it } from 'vitest';
import { allActionIds } from './delve-preview-ids.ts';
import { fightView, previewAction } from '../src/index.ts';
import { act, run, started } from './delve-fixture.ts';

it('fightView and previewAction never draw; a strike does', () => {
  const { state } = started('preview');
  const before = structuredClone(state.rng);
  const view = fightView(state)!;
  const fighters = view.fighters.map((f) => f.id);
  for (const actorId of fighters)
    for (const actionId of allActionIds(state))
      for (const targetId of fighters)
        for (const packIndex of [undefined, 0, 1, 2, 3]) {
          try {
            previewAction(state, actorId, actionId, targetId, packIndex);
          } catch {
            // Some combinations name no real action for that actor; only the draws matter here.
          }
        }
  expect(state.rng).toEqual(before);
  expect(run(state).fight?.round).toBe(1);
  // Control: a command on the same state does draw.
  const next = act(state, 'action.throw-knife', 'foe.4').state;
  expect(next.rng).not.toEqual(before);
});
