# Agent instructions

Adventure Manager: a management game where the player runs an adventurers' guild (Football Manager's depth of squad, staff, finances and scouting, applied to Pathfinder-style parties, classes and quests). Single-player; phones first, iPhone and Android held upright, Windows after launch (D-151); TypeScript, web-first engine test (D-110).

Shared rules come from AI-Master-Instructions and load through CLAUDE.md (`.claude/master/RULES.md`). This file holds only what is specific to this project. Keep it under 80 lines.

## Read first

1. `docs/HANDOFF.md`: current state and next step.
2. `docs/DECISIONS.md`: settled rules. Don't reopen them. Read the index (`grep '^## D-' docs/DECISIONS.md`), then only the entries you need.
3. `docs/LESSONS.md`: entries for the area you are about to work in.
4. `docs/design/CONCEPT.md`, `STYLE.md` and `PLAN.md` in `docs/design/`: the concept, style and plan, by section.

## Phases

Concept, style and plan are done; the plan was approved on 2026-10-26 (D-115), and the build runs through milestones M1–M7 (`docs/design/PLAN.md` §13). Don't skip a milestone gate.

## Local checks (run before pushing)

- Every push: `node .claude/master/sync.mjs --check` and `node tools/docs-check.mjs` (decision ids exist; no draft markers left in accepted PLAN sections).
- Every HTML mock-up or page before publishing: `node tools/mockup-shot.mjs <file>` (desktop and phone render, fonts, no sideways scroll), then look at the screenshots (VER-06).
- Every push that touches code: `npm run check` (format, typecheck, package boundaries, tests). Install with npm 11 (`npx npm@11.9.0 ci`); npm 10 crashes on this lockfile's optional peers.
- Chain checks, commit and push with `&&`, never `;`, so a failed check stops the commit (LESSONS ×2).
- Stop a background run by its PID (`ps -eo pid,args`), never `pkill -f`: the pattern matches the shell running it (LESSONS ×3).
- Code rules: `docs/STANDARDS.md`; each package's `AGENTS.md` adds its local rules.

## What CI runs

- **CI** (`ci.yml`): on every PR update and `main` push, one Linux job runs the drift check, the docs check and `npm run check`. Changes only to `docs/`, README.md, package AGENTS.md files or system SPEC.md files skip it, so run the docs check locally for those.
- No deploys yet.

## Project rules

- Pathfinder is inspiration only: no Paizo names, text, stat blocks or trade dress. Original setting, classes and rules (legal: the ORC/OGL terms don't cover a commercial clone of its brand).
- Every design decision the owner approves goes into `docs/DECISIONS.md` the same session, so later sessions don't reopen it.
- Every session updates and republishes the roadmap page `docs/roadmap.html` (owner's rule, D-128; link in HANDOFF).
- Design docs describe what the player experiences and why before how it is built.
- Pull requests (owner's rule, D-133): first an independent adversarial review of the whole branch diff (D-093; `reviewer` agent, briefed per D-107), fix or report each finding, then show the owner the findings in chat and in a published artifact, and ask approval. Create the PR only after that approval; once CI is green and nothing is open, mark it ready and merge it without asking again. New commits after approval need a new review and approval.
- Reviewers are independent (owner's rule, D-107): a review agent's brief gives the goal, the files or diff, the lens and open questions, never the main session's findings, conclusions or preferred answer. The main session verifies the returned findings afterwards (DEL-05).

## Overrides

Master rules this project deliberately changes. Each line names the rule id and the reason; the same entry is in `.ai-master.json` "overrides".

- None.
