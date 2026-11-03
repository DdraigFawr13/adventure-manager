---
name: brainstorm
description: "Start a new project, or a big change of direction, by comparing concepts before design: open questions in Morgan's words, optional research, 3-5 distinct concepts on a phone form, a fresh critique, combine-and-kill rounds, then docs/CONCEPT.md as the brief planning-interview starts from. Use when starting a new project, when Morgan has an idea but not a clear concept, or before bootstrapping a new repo. Not for a phase or feature of an existing concept; use planning-interview. On trial (D-048)."
---

# Brainstorm

Morgan often starts with something they want, not a clear concept. This skill compares 3-5 concepts before any design work, so the project commits to one on purpose. The flow is brainstorm → design (`planning-interview`) → plan (`write-spec`) → build (slice sessions).

Files in this skill's folder: `assets/CONCEPT.md` (the brief template). Forms use the `planning-interview` skill's template, as its "Building a form" says. Read it from the master as `core/skills/planning-interview/assets/form.html`: a new repo has nothing synced until bootstrap. Read answers back the same way: one `ArtifactData` `list` on the page's collection.

Terms:
- A **concept** is one distinct answer to "what is this project": a pitch, a core loop or idea, and its main risk.
- The **brief** is the project's `docs/CONCEPT.md`.
- A **round** is one combine-and-kill page. The open-questions page and the concepts page are not rounds. At most 3 rounds.
- The **trial measures** (D-048): (1) the brief has 3+ concepts, with a reason for each dropped one, and kill criteria; (2) `planning-interview` round 1 on that project asks nothing the brief answered; (3) after design, Morgan says the concept survived unchanged.

## When to use

This skill is on trial until the pilot meets D-048's three measures.

- New projects and big direction changes only. Not for a feature or a phase of an existing concept; use `planning-interview` for those.
- **Skip test:** if Morgan states the pitch, who it's for, the core loop and what it isn't in chat, skip the pages. Write a short brief from that (Concepts dropped says `None: skipped`) and go to "The brief". A skipped brainstorm doesn't count toward the trial.
- The trial ends when the pilot, the first full (not skipped) brainstorm on Morgan's next new idea, meets all three measures. A combined concept counts as the chosen one; the concepts merged into it are listed under Concepts dropped as "merged into the chosen concept".

## Before you start

Two sessions start a new project, because the new repo is empty and has no rules of its own:

1. **Session A** (AI-Master-Instructions attached; Morgan says "brainstorm: <idea>"):
   - Ask Morgan for a short repo name.
   - Get `<owner>` from the owner part of the master's `git remote get-url origin` (for example `https://github.com/<owner>/AI-Master-Instructions`). Don't write an account name from memory.
   - Give Morgan the link `https://github.com/new?owner=<owner>&name=<name>&visibility=private` to create the empty repo.
   - End by giving Morgan, ready to paste, the first message for session B: `brainstorm: <idea>`.
2. **Session B**: Morgan starts it with the new repo and AI-Master-Instructions attached, and its first message names the skill. Read this skill from the master (`core/skills/brainstorm/SKILL.md`), then run everything from "Open questions" on.
3. Until the pick, the concepts and answers live in the session's scratchpad and on the published pages. The brief is the new repo's first commit, on its default branch: the repo is empty, so there is nothing to review.

**Parked idea:** still write and commit the brief, with `Parked: <reason>` as the first line of its Pitch section. Morgan may delete the repo later.

**Direction change on an existing repo:** skip session A. The session still needs the master attached.
1. Work on a branch with a draft PR (GIT-01). Follow the project's own PR rules in its AGENTS.md; some need a review or the owner's approval before the PR opens.
2. Find the old concept docs: every file under `docs/` whose name starts with `concept`, ignoring case (for example `docs/concept.md` or `docs/design/CONCEPT.md`).
3. If one sits at `docs/CONCEPT.md` under any case, `git mv` it to `docs/archive/CONCEPT-<YYYY-MM-DD>.md` before writing the new brief, so no two names differ only by case. Others stay where they are and the brief links them.
4. List every matched file's concept under Concepts dropped, the archived one first. With no match, nothing moves.

In either case:
- Read what exists: any notes Morgan gives, and in an existing repo its README, HANDOFF and DECISIONS. Never ask what a file already answers.
- Facts are your job, decisions are Morgan's (as `planning-interview` "Before round 1" item 2 says).

## Open questions

The first page is a form with only `text` questions, answered in Morgan's own words. No options on this page: options asked first frame the idea too early.

Ask, one card each:
- the problem or itch
- who it's for
- what excites Morgan about it
- how it's done today
- what Morgan would hate it to become
- the hard limits (time, money, platform, device)
- how we'll know it worked

Each `text` card is its own answer box (the template gives `text` items no separate notes box). Keep the section's notes box, and end the page with a free-text "anything else" section. Use collection `open`. Tell Morgan the phrase to say when done (`open done`).

## Research

Optional. Ask Morgan first, with a cost estimate that fits inside the cap (see "Cost").

If Morgan agrees, start a `general-purpose` agent with web search. It lists 3-8 similar works, what each does well, and how this idea differs. Results inline, under 600 words, no edits (DEL-04). It names works and never copies one's name, characters, art, levels or text (SAFE-05). Use what it finds to make the concepts differ from those works and from each other.

## Concepts

Make 3-5 concepts that differ in their core, not in polish. A concept that is another one with a feature added is not distinct.

1. Write them first to the scratchpad as `<name>-concepts.md`, where `<name>` is the repo name. This is the file the critique reads.
2. Build a form page (collection `concepts`). Each concept is an `info` card with:
   - name and one-line pitch
   - the core loop or idea, in 3-5 lines
   - who it's for
   - the main risk
   - the closest similar work
3. Each concept also gets a `keep` item: Keep = pursue, After = park, Cut = drop. Its notes box is for "combine with".
4. Make no recommendation on this page (D-048). The pick comes later, in "Combine and kill".

## Critique

Start one fresh agent (`general-purpose`, background) while Morgan reacts to the concepts. Give it only the concepts file and the lens table row for the project's kind, never the session's preference or the conversation. It rates each concept against each lens in a few words and names the top risk. Results inline, under 700 words, no edits (DEL-04). Verify its claims before you use them (DEL-05).

The kind comes from Morgan's open answers; if it's unclear, ask. For a kind not in the table, ask Morgan which row is closest, use it, and say so in the brief's Open questions.

| Kind | Lenses |
| --- | --- |
| Game | the core loop is fun on its own; depth without rules bloat; scope against Morgan's time; originality against similar works; mechanics reinforce each other (GAME-07) |
| Tool | the problem is real and frequent; a simpler existing option; who uses it and on what device; scope against Morgan's time |
| Fiction | the premise hooks; a conflict that drives many scenes; scope (length, cast); originality against similar works |

## Combine and kill

Each round is one form page (collections `round1`, `round2`, `round3`):

1. An `info` recap of the critique's ratings, and of the concepts' Keep/After/Cut answers and "combine with" notes read back.
2. One `reply` card per critique finding, with your take.
3. A `single` question listing the remaining concepts and any combination Morgan's notes suggest, with your recommended one marked `rec: 1` and the reason in `why`. Here the session recommends; the concepts page did not.

Each later round only narrows: drop what Morgan cut, and offer nothing new unless Morgan asked for it. After round 3, ask one `single` question: pick one concept, or park the idea (D-048).

## The brief

1. Copy `assets/CONCEPT.md` to `docs/CONCEPT.md` and fill it from the answers. Keep it to 1-2 pages. Remove the template's comments.
2. Concepts dropped lists each dropped concept with the reason it was dropped. Merged concepts say "merged into the chosen concept". A skipped brainstorm says `None: skipped`.
3. Kill criteria are observable signs that the concept is failing and the project should stop or change course.
4. The Design brief section is written as the prompt `planning-interview` starts from: the settled facts, the open questions for design, and what design must not reopen.

## Cost

- The cap is $5 per brainstorm, for all agents together.
- Estimate before each agent and keep a running total. When the running total plus the next agent's estimate is over $5, stop and ask Morgan (SAFE-01).
- After each agent, measure it: pass its transcript (the agent's output file) to the master's `core/skills/audit/scripts/agent-usage.mjs` (in a synced project also `.claude/skills/audit/scripts/agent-usage.mjs`), and add it to the total.
- If neither script exists (a project that excludes `audit`), estimate from token counts and label it an estimate (REP-01).
- The final total goes on the brief's date line as `Agent cost`.

## Handover

1. Commit the brief as the repo's first commit (or on the direction-change branch).
2. Run `bootstrap-project` on a branch, as that skill says, choosing layers from the brief.
3. Once bootstrap creates DECISIONS, record "Concept chosen" there, linking the brief, not copying it (SRC-01).
4. HANDOFF gets the links to every brainstorm page.
5. Then run `planning-interview`; it reads the brief first.

## Measure

During the trial, write one dated list entry (CTX-04) per brainstorm in the brief's Open questions, under `Brainstorm trial`. Each entry holds:
- concepts made
- dropped with reasons (yes/no)
- kill criteria (yes/no)
- rounds
- measured agent cost
- later, trial measures 2 and 3

A skipped brainstorm records `skipped` and doesn't count toward the trial.

The bootstrap session moves the entry to the project's HANDOFF. The design session adds measures 2 and 3 when design is approved. A master session copies the finished entry into `decisions/benchmarks/brainstorm-trial.md` in AI-Master-Instructions (the master's HANDOFF names the pilot as a Next item). The brainstorm session does not commit to the master.
