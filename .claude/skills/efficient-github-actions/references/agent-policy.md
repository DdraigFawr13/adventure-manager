# AGENTS.md section template

Paste these sections into the repository's `AGENTS.md`. Replace each `<...>` with the repository's real commands and workflows, and keep it short. The budget rules are not repeated here: every synced project gets them as CI-01 to CI-06 in `.claude/master/RULES.md`.

```markdown
## Local checks (run before pushing)

- Every push: `<format/lint/typecheck/unit/build command>`
- <area> changes: also `<targeted integration command>`
- Before a milestone merge: `<full local suite>` if time allows; the CI full regression is the binding gate.

## What GitHub runs automatically

<one line per workflow: trigger -> what it runs>

## When to run more

Add the PR label `full-regression` (or run Actions > Full regression) before merging:
- <rule or simulation changes, save-format changes, dependency/toolchain updates (automatic), milestone merges>
```
