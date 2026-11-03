---
name: audit
description: "Audit a project or part of one to a fixed standard: design or spec, test suite, whole repo, or UX at three widths. Produces a dated report in docs/audit/ and a reply page for the owner, and changes no code. Use at the end of a plan phase or milestone, or when asked to audit, review the whole repo, or check a design before building. Not for reviewing one diff or PR (use the reviewer agent)."
---

# Audit

Every audit ends in one report shape, so audits compare across projects and over time. Readers find, the main session checks, the owner decides. An audit is advice, not a gate, and it changes no code.

Files in this skill's folder: `assets/report.md` (the template), `scripts/audit-shape.mjs` (the shape check), `scripts/check-quotes.mjs` (the quote check) and `scripts/agent-usage.mjs` (agent cost). Run them from the project root as `node .claude/skills/audit/scripts/<name>.mjs`.

## When to audit

- At the end of a plan phase or milestone, or when the owner asks.
- Pick the kind from "Kinds" below. Tell the owner which kind and why in one line, then start.

## Before you start

- Read DECISIONS, the project's canon if it has one (the files it names as the source of truth for story or world facts), and the last report in `docs/audit/`, for its open items. Only you read earlier audits.
- List the areas (one folder or file group per reader) and the protected paths: the folders or files the project's AGENTS.md says agents must not read or quote, such as `secrets/` (SAFE-02).
- Estimate the cost as the number of areas × $0.76, the routing skill's measured delegated `reviewer` run. Label it an estimate. If it is over $10, ask the owner before starting.

## Reading the areas

- Start one `reviewer` agent per area, in parallel. Each gets a DEL-04 brief holding:
  - the kind's checklist (`references/<kind>.md`)
  - the area, as files or folders
  - the protected paths, with "name protected files by path and frontmatter key only; never quote them"
  - the finding block from `assets/report.md`, with the rework and effort definitions below
  - "at most 12 findings; if you found more, end with `More found: <n>`"
  - "give every Evidence path relative to the project root"
- Rework if left:
  - **high**: left alone, it loses data, leaks a secret, breaks a never-override rule, or forces rework across several parts or a later phase.
  - **medium**: rework within one part.
  - **low**: a local fix that can wait.
- Effort is S, M or L. The brief's finding format overrides `reviewer.md`'s blocker, major and minor line format.
- Evidence takes exactly one of three forms per finding:
  - `` `<path>:<line>` "<verbatim quote of 4 or more characters>" `` for something present
  - `` `<path>` absent: searched <terms> in <paths> `` for something missing (REP-03)
  - `` `<path>` protected `` for a finding on a protected path, which is never quoted
- Readers have only Read, Grep and Glob. Commands the checklist needs (for example `node .claude/master/sync.mjs --check`, the suite's time, or coverage) are yours to run. Put their output in the brief, or straight into a finding.
- Readers can't write files. Save each returned report to the scratchpad as `audit-<area>.md`.
- If a reader used `reviewer.md`'s line format instead of Evidence lines, re-ask it once in the report's format.
- Never give a reader an earlier audit.
- An area that ends with `More found: <n>` is split and re-run. Note the split in Scope.

## Checking findings

- Run `scripts/check-quotes.mjs audit-<area>.md . --expect <n>` on each reader's report, where n counts its quote-form Evidence lines. Drop every finding it can't verify, and count the drops for Scope.
- Open each surviving finding's cited line yourself (DEL-03). Check it against DECISIONS and canon (VER-05): a finding checked against docs but not canon has been wrong before.
- A finding that conflicts with a settled decision stays in, as rework `low`, with `DELIBERATE (<D-id>)` in its title.
- Merge findings that cite the same path within 10 lines and describe the same problem. Keep the clearest Evidence line and name the other places in Case.

## Writing the report

- Copy `assets/report.md` to `docs/audit/<YYYY-MM-DD>-<kind>.md` and fill every part. A second audit of the same kind on the same day adds `-2`.
- High findings go under "Fix strongly recommended", first; the rest under "Other findings". Number findings F1 upward through the whole report.
- Scope lists the areas, one per line, with what was read and run, the quote-check drops and any assumptions. Not checked lists each area or file left out, and why.
- Run both checks:
  - `node .claude/skills/audit/scripts/audit-shape.mjs docs/audit/<file>.md`
  - `node .claude/skills/audit/scripts/check-quotes.mjs docs/audit/<file>.md . --expect <n>`, where n counts the quote-form Evidence lines; it can be 0. The script counts every `path:line "quote"` in the file, so keep that form out of Case, Fix and Scope text.
- A report that fails either check isn't done.

## The reply page

- Copy `.claude/skills/planning-interview/assets/form.html` and build it as that skill's "Building a form" says.
- `%%TITLE%%` is `Audit <YYYY-MM-DD>`. Config:
  - round `audit-<YYYY-MM-DD>`, with the report's `-2` suffix if it has one, so two pages never share answers; heading `Audit <YYYY-MM-DD>`
  - intro `["Reply to each finding, then say \"audit replies done\" in chat."]`
  - section `strong`, titled `Fix strongly recommended`, then section `other`, titled `Other findings`, each with `notes: false`. A findings section with no findings gets no section on the page.
  - one `reply` card per finding: `id` the finding id, `title` the finding title, `body` the Case, `take` the Fix, `sev` the rework value. Leave `src` unset.
  - last, a section `else`, titled `Anything else`, holding one `text` item, id `anything`, with `q` "Anything else?".
- Report text goes inside a `<script>`: write each `<` in it as `\u003c` so a quoted `</script>` can't end it.
- Publish as the planning-interview skill says, then send the owner the link.

## After the owner replies

- Fill Outcome: one plain line per finding (no bullet; replace `Pending`), `F<n> accepted`, `F<n> rejected: <reason>`, `F<n> fixed in <sha>` or `F<n> deliberate (<D-id>)`. Log rejections with the owner's reason.
- Put the measured cost on the Cost line: run `scripts/agent-usage.mjs` on each reader's transcript (the output file its completion notice names) and add them up. Check each output's `model=`: the script prices an unknown model as Opus. The figure covers agents only, at list price, as the Cost line says.
- Add the accepted items to HANDOFF's Next list.
- Commit the report on its own branch, with no other changes, and open a draft PR. Fixes come in a later PR on a new branch.

## Closing findings

- A code finding closes only with a test that fails before the fix and passes after. Name the fix commit in Outcome.
- A doc, design or wording finding closes when its fix commit is named in Outcome.

## Kinds

- **design**: a design or spec, before building. Checklist: [references/design.md](references/design.md).
- **tests**: a test suite. Checklist: [references/tests.md](references/tests.md).
- **repo**: the whole repo. Checklist: [references/repo.md](references/repo.md).
- **ux**: the UI at 1440, 1100 and 412 px wide, plus wording. Checklist: [references/ux.md](references/ux.md).
