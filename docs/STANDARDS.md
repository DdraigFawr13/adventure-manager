# Code standards

Written at the start of M1, before the first line of game code (D-114, PLAN §11i). Rules for every package; each package's own `AGENTS.md` adds its local rules (see the end). Shared rules (`.claude/master/RULES.md`) still apply; this file does not repeat them.

## Language and layout

- TypeScript, ES modules, one repository with npm workspaces under `packages/`: `engine`, `content`, `ui`, `shell`, `tools` (D-091). If the engine test moves the client to Godot (D-110), only `ui` and `shell` change language; the engine stays as specified here unless the owner decides otherwise.
- Compiler settings: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `verbatimModuleSyntax` (same set as Story-Generator's `tsconfig.json`).
- No `any`, no `@ts-ignore`, no `as` casts except `as const` and at a validated boundary (loaded JSON after schema checking, saves after migration), where the line above says `// cast-ok: <why>`. A non-null `!` needs a one-line comment saying why it holds (not checked automatically; reviewers check it).
- Formatting by Prettier, never by hand.

## The engine is pure (GAME-01, GAME-02)

- One entry point: `simulate(state, command) → { state, events }`, used for preview and commit. Nothing else changes game state.
- No clock, no `Math.random`, no I/O, no DOM, no `process`, no `Intl` or `localeCompare` (results differ by machine), no timers. Time arrives in commands.
- Package boundaries are checked by `tools/check-boundaries.mjs`, the project's lint (D-114; it needs no extra dependency under D-117): the engine imports only itself; content imports only itself and the engine; ui, shell and tools import engine and content, never each other. The same script enforces the type rules above, the banned globals and the banned Math functions, and has its own tests. It runs in `npm run check`; CI runs it once `ci.yml` gains that step (HANDOFF Next).
- **Integers only** in game state (PLAN §11c): money in pennies, stats as whole numbers, chances in basis points (1 bp = 1/10,000). No `Math.sin`, `exp`, `pow`, `log` and similar in the engine (they can differ between JS engines); use integer maths or lookup tables. Rounding is explicit and named (`divRoundDown`, `divRoundHalfUp`).
- Ordering is explicit: iterate arrays or sorted ids, never rely on object or `Map` insertion order across saves; sort with a comparator on ids.

## Engine foundations (PLAN §11h)

- **Values explain themselves.** A game number that a player can hover is a `Value`: total plus its parts (base, modifiers with source ids) and the cause id of its last change. The UI reads the parts; it never rebuilds them.
- **Named random streams.** Each system draws from its own stream, derived from (seed, stream name) and stored in the state. Names are `system.purpose` (`quest.combat`, `recruit.traits`). The generator is sfc32, taken from Story-Generator `src/engine/core/rng.ts` (owner's own code, D-116).
- **Every change is an event** with a type, the week and day, the ids it touches and a cause id pointing at the command or event that led to it. Histories, the Trace, the Chronicle, reports and letters are views of events (D-082, D-091).
- **Replayable saves.** Playtest builds keep the commands since the last daily snapshot, so a save plus its commands replays exactly. A replay that diverges is a bug.
- **Invariants** (money adds up, no negative health, every event has a cause, no orphan ids) are functions in the engine, run by the tests and by every balance sweep.

## Content and text

- Content is JSON in packs, base pack first (D-091, PLAN §11d). Types and validation come from one schema source in `content`; nothing hand-writes a second copy of a shape.
- Every number a designer might tune lives in data, never in engine code (GAME-04). A new monster, site or quest is a data entry, not an engine branch.
- World text lives in template files with the template grammar (variables, pronouns, plurals, conditional lines); interface labels live in string files. No player-facing English in `.ts` files.
- Pathfinder is inspiration only: no Paizo names, terms or stat blocks in code, data or tests (AGENTS.md).

## Tests

- Vitest. Every rule has a test that names the rule; a bug fix adds the test that would have caught it.
- One determinism test: same seed and commands, same events (GAME-06).
- Generated text has golden-file tests; a golden file changes only in a commit that says why.
- Balance runs (the headless simulator) are tools, not unit tests; they report numbers and run the invariants.

## Naming and size

- Files `kebab-case.ts`; types and classes `PascalCase`; functions and variables `camelCase`; constants `UPPER_SNAKE` only for true constants.
- Units in names when a number has one: `wagePennies`, `hitChanceBp`, `lengthDays`.
- Content ids are lowercase `kind.name` (`monster.marsh-wight`, `site.old-mill`) and never change once shipped (saves reference them).
- Files stay under about 300 lines; one system per folder with its rules, its types and its tests side by side.
- Comments say why, not what. Each system's folder starts with its half-page rules spec (`SPEC.md`), written just before the code (PLAN §11i).

## Dependencies and provenance

- The approved dependency list is D-117 (D-114, SAFE-03); anything outside it is asked for first. Versions are pinned exactly and the lockfile is committed.
- Code copied from Story-Generator keeps a first-line comment naming its source path and commit (provenance, SAFE-05, D-116).

## Definition of done (per feature)

1. Local checks green: format, typecheck, boundaries, tests (and the docs checks in AGENTS.md).
2. The behaviour is tested end to end where the project can (VER-07); UI work is looked at in a screenshot (VER-06).
3. The system's `SPEC.md`, HANDOFF and any affected design doc are updated; decisions are in DECISIONS.

## Per-package `AGENTS.md`

Each package gets a short `AGENTS.md` (under 30 lines) when it is created, so a coding session starts inside its rules:

| Package | Its rules |
|---|---|
| engine | `packages/engine/AGENTS.md` (written): the short form of the two engine sections above. |
| content | Data and schemas only; no logic beyond validation. Ids never renamed once shipped. No Paizo terms. |
| ui | Reads state and events, sends commands; never computes a rule or a number's breakdown. Labels from string files. 15 px ledger minimum with lining figures (D-084). |
| shell | Window, saves, Steam. Saves written to a temporary file then swapped; unreadable saves never overwritten (GAME-05). |
| tools | Headless simulator, validator, save inspector, template previewer. May use the clock and files; never changes engine rules. |
