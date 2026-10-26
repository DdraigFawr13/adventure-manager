# Agent instructions

Adventure Manager: a management game where the player runs an adventurers' guild (Football Manager's depth of squad, staff, finances and scouting, applied to Pathfinder-style parties, classes and quests). Single-player; Windows first (D-106); TypeScript, web-first engine test (D-110).

Shared rules come from AI-Master-Instructions and load through CLAUDE.md (`.claude/master/RULES.md`). This file holds only what is specific to this project. Keep it under 80 lines.

## Read first

1. `docs/HANDOFF.md`: current state and next step.
2. `docs/DECISIONS.md`: settled rules. Don't reopen them.
3. `docs/LESSONS.md`: entries for the area you are about to work in.
4. `docs/design/CONCEPT.md`: the game concept (once written). Style guide and plan follow in `docs/design/`.

## Phases

The owner runs this project in order; don't skip ahead:

1. **Concept** until the owner calls it 100% fleshed out (`docs/design/CONCEPT.md`).
2. **Style design**: theme, tone and visual identity (`docs/design/STYLE.md`).
3. **Full plan**: game-design best practices first, then architecture and milestones (`docs/design/PLAN.md`).

No game code before phase 3 is approved.

## Local checks (run before pushing)

- Every push: `node .claude/master/sync.mjs --check` and `node tools/docs-check.mjs` (decision ids exist; no draft markers left in accepted PLAN sections).
- Every HTML mock-up or page before publishing: `node tools/mockup-shot.mjs <file>` (desktop and phone render, fonts, no sideways scroll), then look at the screenshots (VER-06).
- Every push that touches code: `npm run check` (format, typecheck, package boundaries, tests). Install with npm 11 (`npx npm@11.9.0 ci`); npm 10 crashes on this lockfile's optional peers.
- Code rules: `docs/STANDARDS.md`; each package's `AGENTS.md` adds its local rules.

## What CI runs

- **CI** (`ci.yml`): on every PR update and `main` push, one Linux job runs the drift check, the docs check and `npm run check`. Markdown-only and `docs/` changes skip it, so run the docs check locally for those.
- No deploys yet.

## Project rules

- Pathfinder is inspiration only: no Paizo names, text, stat blocks or trade dress. Original setting, classes and rules (legal: the ORC/OGL terms don't cover a commercial clone of its brand).
- Every design decision the owner approves goes into `docs/DECISIONS.md` the same session, so later sessions don't reopen it.
- Every session updates and republishes the roadmap page `docs/roadmap.html` (owner's rule, D-128; link in HANDOFF).
- Design docs describe what the player experiences and why before how it is built.
- Before creating any pull request, and again before marking one ready, do an adversarial review of the whole branch diff (owner's rule, D-093): look for what is wrong, inconsistent with DECISIONS, unverified or missing; fix or report each finding first. Use the `reviewer` agent or the `code-review` skill for large diffs.
- Reviewers are independent (owner's rule, D-107): a review agent's brief gives the goal, the files or diff, the lens and open questions, never the main session's findings, conclusions or preferred answer. The main session verifies the returned findings afterwards (DEL-05).

## Overrides

Master rules this project deliberately changes. Each line names the rule id and the reason; the same entry is in `.ai-master.json` "overrides".

- None.
