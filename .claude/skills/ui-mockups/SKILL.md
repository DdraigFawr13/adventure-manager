---
name: ui-mockups
description: "Make and check a mock-up before a screen or system is built: drawn at the project's first target width from its UI style, every number, name and option checked against the project's files and DECISIONS, a check record on the page, one fresh check for screens, then Morgan's approve / change / rethink. Use in a project's design stage and before a slice that adds a screen, changes a screen's layout or controls, or changes a style token. Not for screenshots of finished work (VER-06)."
---

# UI mock-ups

A mock-up shows Morgan a screen, or a system's output, before it is built. It reaches Morgan only after its facts are checked and its check record is on the page: one mock-up showed silver for copper wages and an attribute that doesn't exist (adventure-manager LESSONS:15); another broke a locked decision and passed review (Vulcan LESSONS:25); Morgan chose from a mock with 30 px buttons and 8-10 px text because the link arrived before the check (Vulcan LESSONS:24).

Files in this skill's folder:
- `scripts/mockup-lint.mjs`: a warn-only lint for the Avoid items tagged `(lint)`. Node built-ins only.

Terms:
- A **mock-up** is a plain HTML page that shows a screen (**screen kind**) or a system's output (**engine kind**: a numbers table and sample log lines) before it is built. It is published as an Artifact unless the user says not to.
- The **style doc** is the project's `docs/UI_STYLE.md`, or the existing style doc the `ui-style` skill finds ("Before you start").
- A **screen change** is a slice that adds a screen, changes a screen's layout or controls, or changes a style token (D-050). A token change is screen kind.
- **Fact sources** are the files the style doc's `## Where facts live` lists, plus `docs/DECISIONS.md`.
- A **seed** is a fixed input to the project's generator or simulation (a random seed, a starting map). A project without one uses 3 sample inputs from its content files.

## When to use

- The design stage of a project with a UI: the key screens, after the `ui-style` taste board.
- Before a screen change (Terms): the slice starts with a mock-up Morgan approves before code (write-spec step 8).
- Engine kind: before building a system whose output Morgan will judge (a generator, a simulation, a log).

Not for screenshots of finished work: that is VER-06 and the style doc's new-screen checklist.

## Before you start

1. Screen kind: read the style doc. None: run the `ui-style` skill first. Engine kind needs no style doc.
2. Find in the style doc (wherever it holds them, under any heading):
   - the target widths and which is first;
   - the minimum text size (the template's `Minimum text: <n> px` line) and the minimum tap size (`Minimum tap: <n> px`);
   - the fact sources.
   If the style doc names neither the target sizes nor the fact sources, ask Morgan once (one question, WS-03). Engine kind with no style doc uses `--min-text 12` for the lint.
3. Read, both kinds: the fact-source files, `docs/DECISIONS.md`, `.claude/skills/ui-style/references/avoid.md` (in the master: `core/skills/ui-style/references/avoid.md`), the style doc's own `### Project` items, and the spec section for the slice.
4. An existing draft mock-up file is edited in place; don't start a second file, and keep its element ids. A new one goes in `mockups/<screen>.html` (engine kind: `mockups/<system>.html`) unless the project keeps mock-ups elsewhere.

## Make the mock-up

1. A plain HTML page (not the planning-interview form template), with its CSS inline. Use the style doc's tokens and faces; no literal colours outside the token list.
2. Screen kind:
   - Each screen sits in a frame exactly the first target width wide (`width: <px>px`), inside an `overflow-x: auto` wrapper, so a wide frame scrolls instead of shrinking. The other widths the style names follow as further frames.
   - Show the states: normal, empty and alert, and loading where the screen loads data (the new-screen checklist's list).
   - Text plus 2-3 images per page (Vulcan VR-60): screenshots of the normal state at each width the style names, up to 3. Take them last, after the fact check's and fresh check's fixes and before the check record, with the Playwright that cloud sessions have pre-installed (no new dependency; SAFE-01), and embed them as `data:` URIs. If Playwright isn't available or the user asked for no screenshots, skip them and say so in the record.
3. Engine kind:
   - A numbers table across 3 seeds (Terms; the project's own seed list when it has one).
   - 3 sample lines in the project's log format.
   - Every number labelled measured or estimated (REP-01). No screenshots.
4. Real content from the project's files, never from memory (WS-06): names, numbers, currencies, options and labels are copied from a fact source. No lorem ipsum, no invented example facts.

## Fact check

Do every step; a screenshot is not a fact check (adventure-manager LESSONS:15).

1. **Facts.** Find every number, name and option on the page in a fact source or DECISIONS, and note it with `path:line`. One you can't find is wrong until a source says otherwise: fix it, or ask Morgan.
2. **Decisions.** Check every option and control against DECISIONS for conflicts (adventure-manager LESSONS:16). A control that lets the user do what a decision forbids is wrong even when every fact is right (Vulcan LESSONS:25).
3. **Timeline.** Trace one timeline across all screens: the same character, item or record keeps its name, numbers and state from screen to screen.
4. **Avoid lists.** Check the page against every master and `### Project` Avoid item and every Pitfall that applies to a mock-up. `(look)` items are checked by eye.
5. **Lint.** Run `node .claude/skills/ui-mockups/scripts/mockup-lint.mjs <page> --min-text <the style's minimum text>` (in the master: `core/skills/ui-mockups/scripts/mockup-lint.mjs`). Fix each warning, or write in the record why it stays (an emoji or font the style picked: re-run with `--allow-emoji` or `--allow-font <name>`). Re-run until the last line is what the record will show.
6. Taps: check each control against the minimum tap size by eye or with the screenshot; the lint doesn't measure taps.

The lint's known limits: it checks `font-size` only in `px`, `rem` and `em` (not other units, `clamp()`, `var()`, custom properties or the `font:` shorthand); it reads no external CSS; it doesn't skip CSS `/* */` comments; it doesn't decode entities. Check those by eye.

## Fresh check

Screen kind only (a token change is screen kind). Engine kind gets the fact check and lint only (D-050).

1. Estimate first: about $0.30-1 per check (assumption; Vulcan VR-59 measured 70-105k tokens a pass). Ask Morgan if it would pass the project's limit (SAFE-01).
2. Start one fresh `reviewer` agent. Give it the page's path, the style doc and the fact-source files; never the conversation or your view of the page (DEL-04). Ask for wrong facts, broken decisions and Avoid items, each with `path:line`, under 400 words, results inline, no edits, no commits.
3. Verify each finding against the files before fixing it (DEL-05). Re-run the lint after the fixes.

## Check record

The page's last section, written after the fact check and fresh check:

```html
<section id="check-record"><h2>Check record</h2>
  ...
</section>
```

It holds:
- files checked (paths);
- facts checked (count);
- each fix made;
- the lint's last line (`mockup-lint: <n> warnings`) and any warning left, with why;
- the widths shown, and the screenshots taken or why none;
- screen kind: the fresh check's result and cost;
- the running agent cost for this mock-up.

## Publish and approve

1. Only now publish the page with the Artifact tool (no link to Morgan before the record exists; Vulcan LESSONS:24). If the user said not to publish, or the tool isn't available, don't.
2. Ask in chat, one question with the link: "Approve" / "Change (say what)" / "Rethink" (WS-03). Not published: ask the same question with the file's path.
3. A change:
   - re-run the fact check and lint;
   - re-run the fresh check when that round changed a screen's layout, controls or tokens (not for wording-only fixes);
   - write a new record and republish to the same link.
4. Rethink: go back to "Make the mock-up" with Morgan's reasons; if the look itself is wrong, go back to the `ui-style` taste board.

## After approval

- Put the approved page's link in HANDOFF and in the slice's spec.
- The build follows the style doc's new-screen checklist; its last item compares the built screen, screenshotted at the same width, with this mock-up and lists the differences for Morgan.

## Cost

The fresh check is the only agent. The check record keeps the running total; measure with `.claude/skills/audit/scripts/agent-usage.mjs` when the project has it, and label anything else an estimate (REP-01).
