# engine

The game rules: pure code with no UI. Full rules: `docs/STANDARDS.md` ("The engine is pure" and "Engine foundations"); this file is the short list.

- One rule function, `simulate(state, command)`, for preview and commit (GAME-02); it is a copy plus `apply`, which headless tools use (D-148). Nothing else changes state.
- `state.content` is shared between states, not copied (D-148): never write to content or to objects reachable from it.
- No clock, `Math.random`, I/O, DOM, `process`, `Intl`, `localeCompare` or timers; no `Math.sin`, `exp`, `pow`, `log` or `**`. `npm run boundaries` enforces this.
- Imports nothing outside this package; no external modules.
- Integers only: money in copper coins, whole stats, chances in basis points (`chance(bp)`).
- Randomness only from named streams via `streamFor(state, 'system.purpose')`; never share a stream between systems.
- Every state change emits an event with a cause id; hoverable numbers are `Value`s with parts.
- An event never holds an object or array from the state (copy it: `[...ids]`): headless tools change state in place with `apply` (D-148), so a shared array would change the event too.
- Numbers a designer tunes live in content data, not here. No player-facing English here.
- Each system folder starts with its half-page `SPEC.md`, written just before the code; every rule has a test in `test/`.
- `src/core/rng.ts` comes from Story-Generator (D-116); keep its provenance line.
