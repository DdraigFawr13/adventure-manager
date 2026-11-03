# Whole-repo audit

Covers the repo as a whole: ignore rules, process docs, CI, synced files, secrets, dependencies and the status files.
Use it at the end of a plan phase or milestone, or when asked to review the whole repo.

Sources in brackets: rule ids are the shared rules; "Pantheon repo audit" is Pantheon's `docs/audit/2026-10-30-repo-audit.md`.

1. Flag ignore rules (`.gitignore` and tool ignore files) that hide files the project needs in git. Show the hidden file by path, or with the absent form and the search you ran (REP-03). [Pantheon repo audit item 1]
2. Flag process docs that are stale or say the same thing as another doc, and name the one to keep. [Pantheon repo audit item 6; SRC-01]
3. Check each CI workflow's triggers, draft skip, `timeout-minutes`, `permissions` and concurrency, and flag steps that run more often than the work needs. [CI-02, CI-06]
4. If `.claude/master/` exists, run `node .claude/master/sync.mjs --check` yourself and put its output in the brief. Flag every file it reports, and any hand edit to a file listed in `.ai-master.lock`. [SRC-06]
5. Flag secrets, `.env` files or credentials in git, and any file that quotes a protected path. Name protected files by path only. [SAFE-02]
6. List runtime dependencies and assets that have no recorded reason, source or licence. [SAFE-01, SAFE-05]
7. Compare HANDOFF and DECISIONS with the repo: flag a phase, file or decision they name that the repo contradicts. [SRC-02]
