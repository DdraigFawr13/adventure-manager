---
name: write-spec
description: Turn an agreed plan into a written spec (docs/specs/<slug>.md), check it with fresh agents that never saw the conversation, cut it into session-sized slices and hand each slice to a fresh build session. Use after a planning-interview is approved, or for one feature that will take more than one session or has a real design fork. Not for small, clear changes; plan those in chat and build.
---

# Write a spec

A spec is the written definition of done that a fresh session builds from. This skill writes one, checks it with fresh agents, gets Morgan's approval and hands it over slice by slice. Morgan approved this flow on 2026-11-01 (D-017). Its parts come from Google's Elephant-Goldfish Model, Matt Pocock's skills and Anthropic's Claude Code guidance; sources and evidence are in `decisions/research/2026-10-31-specification-methods.md` in AI-Master-Instructions.

## 1. Decide whether to write one

Write a spec when the work will take more than one session, or when it has a real design fork: data model, part boundaries, storage, platform, or an interface other code depends on. Otherwise plan in chat, build and stop. Tell Morgan which you chose and why, in one line.

The only head-to-head measurement found ran about 10 times slower with a full spec pipeline than with plain prompting, on one small feature. Skipping the spec for small work is part of the method.

## 2. Interview

Skip this step when `planning-interview` produced approved answers; they are the input.

1. **Open questions first.** Before any options, ask in Morgan's own words: what problem this solves, who has it, how it's handled today and why that fails, how we'll know it worked, the hard limits, and what is out of scope. Options asked first frame the problem for Morgan.
2. **Facts are your job.** Never ask Morgan something a file can answer. Send the `reader` agent for facts from the repo (DEL-03) and keep working on questions that don't depend on its answer.
3. **Decisions are Morgan's.** Give each one 2–5 short options with your recommendation marked and the reason (WS-03). On a design fork, every option also says when it would fail.
4. Ask in chat for one feature, or with the `planning-interview` form template for more than a handful of decisions. Every form question has its own notes box. Read each note with its answer.
5. **Stop** when every decision the spec needs is answered or listed as an open question. Then state the shared understanding in two or three sentences and wait for Morgan to confirm it. Don't write the spec before that.

## 3. Write the spec

Copy `assets/SPEC.md` (in this skill's folder) to `docs/specs/<slug>.md` and fill it in.

- **Problem:** use Morgan's words from the open questions.
- **Alternatives:** every rejected option gets its reason. A spec with a single path and no alternatives is not done.
- **Checks:** every journey check is observable, and it fails at the commit the build starts from.
- **Slices:** each slice is a thin end-to-end path that fits one fresh session, leaves the project working and gives Morgan something to try. A slice per layer (all the database, then all the UI) is not a slice. Ask "what can Morgan try when this lands?"
- **No implementation code.** Schemas and signatures are fine.
- **Label every assumption** (WS-06), and copy names from the source.

Keep it as short as the work allows. A builder needs decisions and checks, not essays.

## 4. Reconcile against the agreed answers

Re-read the approved answers (or the confirmed summary from step 2) and compare them with the spec.

- **Contradiction:** the answers settled something and the spec says otherwise. List every one, quoting both.
- **Addition:** the spec decides something the answers never raised. List it only if it changes the design, an interface or a dependency.

Morgan decides each one. Don't quietly change either side: the spec can be right, because writing it meant reading code the interview didn't.

## 5. Fresh-context checks

Run three checks in parallel as background agents (`reviewer`, or general-purpose). Give each one only the spec's path and the files the spec links, never the conversation or your opinions. A reviewer that saw your reasoning shares your blind spots.

If you can't start subagents, stop and tell Morgan. A review in the same context is not an independent review.

Each brief follows DEL-04: results inline, under 600 words, no edits, no commits. Ask for correctness and clarity, not style. A reviewer asked to find problems always finds something.

1. **Paraphrase.** "Write, in your own words, what this spec proposes and how the existing system works according to it (2–5 sentences each). Then list each term or step you could not follow, with the section." Compare the paraphrase with the intent. A wrong paraphrase is a finding.
2. **Critic.** "List the 10 most important problems: risks, missed edge cases, a simpler design that meets the goals, conflicts with `docs/DECISIONS.md`, and missing alternatives. Give severity (high, medium, low) and the section for each."
3. **Zero decisions.** "For each slice, list every choice a builder would still have to make (a name, schema, library, path or edge-case behaviour). Also list every check that would already pass at the starting commit or can't be observed. Then compare the slices with each other: list anything a slice needs that only a later slice adds."

## 6. Sort the findings

Check each finding against the files before acting on it (DEL-05, VER-05). Give each one exactly one outcome:

- **Fix:** it's valid. Edit the spec.
- **Contest:** it's wrong, and you can cite evidence the reviewer could read: a `path:line` or a DECISIONS entry. "This was intentional" is not evidence.
- **Escalate:** it's wrong, but the evidence is outside the files (a verbal decision, a preference). Give it to Morgan.
- **Decline:** it's a low-value nit. Record it and move on.

Never contest a paraphrase gap; it means the spec is missing context. After fixes, re-run only the checks that found high-severity problems, once.

After your last fix pass, run the zero-decision check once more on the sections that pass changed, before step 7 (VER-08). In the first trial, both questions the build session had to ask came from a final fix pass no check had read.

## 7. Approval

Show Morgan:

- the spec link
- a summary of the goals, non-goals and slices
- each escalated finding and reconcile item, with your take

Use the `planning-interview` form template for a project or phase, or chat for one feature. End with one question: "Approved, start building" / "Approved with the changes I wrote" / "Not yet".

After approval:

- set **Status: Approved**
- record each settled choice in DECISIONS as Status, Decision and Why (SRC-04)
- set HANDOFF's next step to slice S1, with the spec link

## 8. Build, slice by slice

- **Fresh session per slice.** Build each slice in a fresh session, or give it to the `implementer` agent with a DEL-04 brief made from the slice: goal, files, checks, commands. Never build it in the session that wrote the spec.
- **Re-check before each slice.** If the spec or the merged code changed since the last check, run the zero-decision check (with its cross-slice part) on the sections the slice touches, against what earlier slices actually merged. Ask Morgan any gap before building.
- **Checks fail first.** Before writing code, run the slice's checks and confirm they fail.
- **Done with evidence.** Done means the checks pass, with evidence: the command and its output, or a screenshot (VER-06, VER-07). "Tests pass" on its own is not evidence.
- **Review against the spec.** After each slice, a fresh `reviewer` compares the diff with the spec and reports correctness gaps only, not style.
- **Changed decisions.** When building changes a decision, update DECISIONS and the spec's Decisions line together.

## 9. After shipping

Set **Status: Shipped <date>**. The spec is now a snapshot: don't keep it in sync with the code. Lasting knowledge goes into DECISIONS and LESSONS.

## 10. Measure

For each spec, add one LESSONS line in the project:

- what each check caught
- how many findings were fixed, contested and escalated
- whether any slice needed a design decision during the build

The monthly harvest collects these lines into the master's benchmarks (DEL-07).
