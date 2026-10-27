# ui

Screens. Full rules: `docs/STANDARDS.md`. The step 4 text prototype (`src/step4/`, D-195–D-200) is the page at the Vercel root; the watched-quest prototype (D-127) is at `/quest-watch.html`. Both are throwaway screens; the engine underneath is kept (D-113).

- Reads state and events, sends commands through `simulate`; never computes a rule or rebuilds a number's breakdown (GAME-02). Chance breakdowns come from the event's `Value` parts.
- Words come from content text files (`packages/content/data/*.json`), never from `.tsx`.
- 15 px ledger minimum with lining figures (D-084); fonts and colours per `docs/design/STYLE.md`.
- `npm run build -w @adventure-manager/ui` builds both pages; `node tools/build-prototype.mjs` then writes the Quest Watch as one file (`dist/quest-watch.single.html`) for publishing.
- The step 4 page's default player for the house is a copy of the career simulator's (`tools/year-sim-play.ts`); change both together.
