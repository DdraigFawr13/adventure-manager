# content

Game data: classes, monsters, sites, quests, rules numbers, text templates. Full rules: `docs/STANDARDS.md` ("Content and text").

- Data and schemas only; no logic beyond validation. Imports only itself and the engine.
- Every number a designer tunes lives here, never in the engine (GAME-04).
- Ids are lowercase `kind.name` and never renamed once shipped (saves reference them).
- No Paizo names, terms or stat blocks (AGENTS.md).
- Resolution v0 data is TypeScript typed by the engine's types; it moves to JSON packs with one schema source when the content loader is built (PLAN §11d).
