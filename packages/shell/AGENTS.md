# shell

The app wrapper: the Electron desktop window today (D-110, D-117); a phone wrapper replaces it for the launch (PLAN §11b, D-151), not yet chosen. Full rules: `docs/STANDARDS.md`.

- Window, saves on disk and store services only; no game rules. The page runs with context isolation, no Node integration and the sandbox on.
- Saves (later): write to a temporary file, then swap; never overwrite an unreadable save (GAME-05).
- Engine test: `npm run build:engine-test -w @adventure-manager/ui`, then `npm start -w @adventure-manager/shell` (or `node tools/engine-test-measure.mjs` for the measured run).
- After a fresh `npm ci`, run `node node_modules/electron/install.js` once if `node_modules/electron/dist` is missing: npm 11 here does not run Electron's install script, and CI does not need the binary.
