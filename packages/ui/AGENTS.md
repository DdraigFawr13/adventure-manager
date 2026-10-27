# ui

Screens. Full rules: `docs/STANDARDS.md`. The watched-quest prototype (D-127) and the Guild Desk (step 4, D-150, `src/desk/`) live here; their screens are throwaway, the engine underneath is kept (D-113).

- Reads state and events, sends commands through `simulate`; never computes a rule or rebuilds a number's breakdown (GAME-02). Chance breakdowns come from the event's `Value` parts. Replaying a save's commands on load may use `apply` (they were valid when played, D-148).
- Words come from content text files (`packages/content/data/*.json`), never from `.tsx`.
- 15 px ledger minimum with lining figures (D-084); fonts and colours per `docs/design/STYLE.md`.
- `npm run build -w @adventure-manager/ui`, then `node tools/build-prototype.mjs` writes the Quest Watch page; `npm run build:desk -w @adventure-manager/ui` then `node tools/build-prototype.mjs desk` writes the Guild Desk.
- The Guild Desk saves the seed and its commands in the browser (`guild-desk.save`); a save from another `SAVE_VERSION` is moved aside, never overwritten (GAME-05). Bump `SAVE_VERSION` whenever a change would replay old commands differently.
