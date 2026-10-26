# ui

Screens. Full rules: `docs/STANDARDS.md`. The watched-quest prototype (D-127) lives here; its screens are throwaway, the engine underneath is kept (D-113).

- Reads state and events, sends commands through `simulate`; never computes a rule or rebuilds a number's breakdown (GAME-02). Chance breakdowns come from the event's `Value` parts.
- Words come from content text files (`packages/content/data/*.json`), never from `.tsx`.
- 15 px ledger minimum with lining figures (D-084); fonts and colours per `docs/design/STYLE.md`.
- `npm run build -w @adventure-manager/ui`, then `node tools/build-prototype.mjs` writes the single-file page for publishing.
