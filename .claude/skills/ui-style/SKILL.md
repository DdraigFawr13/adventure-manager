---
name: ui-style
description: "Set up or update a project's UI style doc (docs/UI_STYLE.md): a taste board on a phone form, target devices and minimum sizes, tokens, an Avoid list of AI-isms, pitfalls from past lessons, where facts live, and the new-screen checklist. Use when a project with a UI has no style doc, when its look is being chosen or changed, or before a first mock-up when the style doc is missing. Not for one CSS fix."
---

# UI style

One style doc per project with a UI, so every screen follows one look, avoids the same AI-isms and doesn't repeat past UI mistakes. Mock-ups are the `ui-mockups` skill's job; it reads the style doc this skill writes.

Files in this skill's folder:
- `assets/UI_STYLE.md`: the style doc template (headings and prompt comments, no project values; SRC-03).
- `references/avoid.md`: the master Avoid and Pitfalls lists, one copy for every project (SRC-01).

Terms:
- The **style doc** is the project's `docs/UI_STYLE.md`, or the existing style doc found in "Before you start".
- A **screen change** is a slice that adds a screen, changes a screen's layout or controls, or changes a style token (D-050).

## When to use

- A project with a UI has no style doc.
- The look is being chosen or changed.
- Before a first mock-up when no style doc exists (`ui-mockups` sends you here).

Not for one CSS fix: fix it and follow the existing style doc.

## Before you start

1. Find the style doc, in this order:
   - a file the project's AGENTS.md names as the style doc;
   - else `docs/UI_STYLE.md`;
   - else any `.md` under `docs/` and its subfolders, except `docs/archive/`, whose file name contains `style` (any case).
2. Several matches: ask Morgan which one is the style doc (one question).
3. If one exists, keep it. Don't reshape it or move it. For each template heading in `assets/UI_STYLE.md`, find where the doc already covers that topic. Add only the topics it lacks, under the template's heading names, in a PR. The new `## Avoid` and `## Pitfalls` sections link the master lists as the template does, with the link path made relative to the doc's own folder.
4. Read DECISIONS and LESSONS `ui` entries when they exist (CTX-01). Facts are your job, decisions are Morgan's.
5. With an existing doc that already names its look, skip the taste board unless the look is being changed.

## Taste board

Morgan picks a look before any style is written: one project took four mock-up rounds before a taste board came first (Vulcan VR-56).

1. Build a form page with the `planning-interview` skill's template, as its "Building a form" says (in a synced project `.claude/skills/planning-interview/assets/form.html`; in the master `core/skills/planning-interview/assets/form.html`). Use collection `taste`.
2. Show 3-4 looks that differ in feel, not in one colour. For each look:
   - an `info` card holding its sample: a small canvas (`onRender`) or CSS sample with the look's colours, faces and one control, plus a name and one line on the feel;
   - followed by one `keep` item for it: Keep / After / Cut, as brainstorm's concept reactions (D-049).
3. Samples are your own drawing. No copied product: no names, logos or screenshots of real products (SAFE-05). Use the project's real words in the samples, not lorem ipsum.
4. None of the looks may be an Avoid-list stock look (`references/avoid.md`).
5. Say on the page that a phone screen is not the target device when the project targets something else.
6. Read the answers with one `ArtifactData` `list`. If several looks get Keep, ask Morgan in chat which leads (one question). Notes can combine looks ("this colour with that type"); follow them. If none gets Keep, make one new board from the notes, with collection `taste2` and so on; after 3 boards, ask Morgan in chat.

## Write the style

1. Copy `assets/UI_STYLE.md` to `docs/UI_STYLE.md` (when the project has no style doc) and fill each section from the picks and the project's files. Keep the prompt comments.
2. Target devices come from the project's docs (README, AGENTS.md, a spec). If none say, ask Morgan (one question, WS-03). Never guess a width or a minimum size.
3. Tokens and Type come from the picked sample's values, copied from the sample's code, not retyped from memory (WS-06).
4. Where facts live lists the files that hold the names, numbers and options the screens show, plus `docs/DECISIONS.md`. Find them with a search; don't list a file you haven't opened.
5. Link the style doc from AGENTS.md if nothing points to it yet, so later sessions find it first.
6. Record the picked look in DECISIONS (SRC-04) and commit the doc in a PR.

## Avoid and Pitfalls

- The master lists live in `references/avoid.md`, synced with this skill to `.claude/skills/ui-style/references/avoid.md`. Read them before any screen work.
- The project's style doc adds its own items under `### Project` in its `## Avoid` and `## Pitfalls`, each ending with its source in brackets. Avoid items are tagged `(lint)` or `(look)`.
- A LESSONS `ui` entry at count 2 becomes a project Pitfall (SRC-05).
- Items marked `(lint)` are checked by the `ui-mockups` skill's `mockup-lint.mjs`. `(look)` items are checked by eye.
- A master item that looks wrong for every project: propose the change in the master, don't edit the synced copy (SRC-06).

## New-screen checklist

Run the style doc's `## New-screen checklist` before calling a screen done (VER-06, VER-07). The template holds the list; projects add their own items at the end. Report each item as passed, failed or not applicable, with the screenshot or command that shows it.

## Keeping it current

- A style change is a screen change, so it gets a mock-up with `ui-mockups` before code.
- Update the style doc in the same PR as the code that changes the look.
- When a screen breaks a style rule on purpose, change the rule in the doc and record why in DECISIONS; don't leave the doc and the code disagreeing.

## Cost

No agents needed. If you start one (a `reader` for fact sources in a large repo), estimate the cost first and ask Morgan above the project's limit (SAFE-01).
