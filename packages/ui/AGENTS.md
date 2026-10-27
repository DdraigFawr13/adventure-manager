# ui

Screens. Full rules: `docs/STANDARDS.md`. The step 4 text prototype (`src/step4/`, D-195–D-200) is the page at the Vercel root; the watched-quest prototype (D-127) is at `/quest-watch.html`. The phone map engine test (`src/engine-test/phone/`, D-154, D-164, D-204) is at `/map.html`. All are throwaway screens; the engine underneath is kept (D-113).

- Reads state and events, sends commands through `simulate`; never computes a rule or rebuilds a number's breakdown (GAME-02). Chance breakdowns come from the event's `Value` parts.
- Words come from content text files (`packages/content/data/*.json`), never from `.tsx`.
- 15 px ledger minimum with lining figures (D-084); fonts and colours per `docs/design/STYLE.md`.
- The step 4 build emits fonts as separate WOFF2 files (`dist/fonts/`), never inlined into the CSS; `@adventure-manager/content` is marked `sideEffects: false` so unused content (such as the engine-test roster) stays out of the bundle.
- `npm run build -w @adventure-manager/ui` builds the three pages; `node tools/build-prototype.mjs` then writes the Quest Watch as one file (`dist/quest-watch.single.html`) for publishing.
- The step 4 page's default player for the house is a copy of the career simulator's (`tools/year-sim-play.ts`); change both together.
