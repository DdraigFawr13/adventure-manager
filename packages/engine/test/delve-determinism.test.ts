// The one determinism test for delves (GAME-06, J2): save after round 2, reload, replay the same
// commands, and the end state and events match.
import { expect, it } from 'vitest';
import { gate1Content } from '@adventure-manager/content';
import { fightView, simulate, type Command, type GameEvent, type GameState } from '../src/index.ts';
import { started } from './delve-fixture.ts';

/** The first legal choice in the view, rotating through actions so the run uses skills too. */
function choose(state: GameState, n: number): Command {
  const view = fightView(state)!;
  const options = view.actions.flatMap((a) =>
    a.actionId === 'action.pack'
      ? a.packTargets.flatMap((ts, i) =>
          ts.map((t) => ({ actionId: a.actionId, targetId: t, packIndex: i })),
        )
      : a.needsTarget
        ? a.targets.map((t) => ({ actionId: a.actionId, targetId: t }))
        : a.usable
          ? [{ actionId: a.actionId }]
          : [],
  );
  const pick = options[(n * 7) % options.length]!;
  return { type: 'fight.act', id: `cmd.${n}`, day: 1, actorId: view.actorId!, ...pick };
}

function play(state: GameState, from: number, until: (s: GameState) => boolean) {
  const commands: Command[] = [];
  const events: GameEvent[] = [];
  let s = state;
  for (let n = from; !until(s) && s.delve?.phase === 'fight'; n += 1) {
    const command = choose(s, n);
    commands.push(command);
    const r = simulate(s, command);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, commands, events };
}

it('a reload after round 2 that repeats the same choices gives the same fight', () => {
  const start = started('determinism').state;
  const toRound3 = play(start, 0, (s) => (s.delve?.fight?.round ?? 0) > 2);
  // The save the page writes: the state as JSON without its shared content.
  const saved = JSON.stringify({ ...toRound3.state, content: null });
  const rest = play(toRound3.state, 100, () => false);
  expect(rest.state.delve?.phase).toBe('ended');

  const reloaded: GameState = { ...JSON.parse(saved), content: gate1Content };
  let s = reloaded;
  const events: GameEvent[] = [];
  for (const command of rest.commands) {
    const r = simulate(s, command);
    s = r.state;
    events.push(...r.events);
  }
  expect({ ...s, content: null }).toEqual({ ...rest.state, content: null });
  expect(events).toEqual(rest.events);
});
