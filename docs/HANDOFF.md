# Handoff

Updated: 2026-10-26. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

3 of 3: Full plan → `docs/design/PLAN.md`. Concept locked (D-045); style locked (D-061); plan outline approved (D-062). PLAN.md §1 written (D-063..D-065); §2..§15 to do.

## Just done

- 2026-10-26 PLAN.md §1 accepted: management-sim veterans first, tabletop fans second (D-063); one season ≈ 2–2.5 h (D-064); design goals and success targets as a starting set (D-065). Branch `claude/adventure-manager-continue-kmy9rj`, PR #2 to `main`.
- 2026-10-26 Plan outline approved (D-062); `docs/design/PLAN.md` holds the 15-section outline only.
- 2026-10-26 Style guide complete and locked: `docs/design/STYLE.md` §1–§9, D-046..D-061. War table look, candlelit oak palette, desk-home layout, inked-map quest board, old-press type, woodcut icons and portraits (painted later), soft early-music ambience, mixed naming on an English-fenland core, grounded voice with dry wit, no narrator. Mock-ups (HTML) in `docs/design/mockups/`.
- 2026-10-25 Concept complete: `docs/design/CONCEPT.md` §1–§33, pillars, scope tiers; D-003..D-045.
- 2026-10-25 Repo set up with AI-Master-Instructions v0.3.0. Merged to `main` via PR #1 on 2026-10-26.

## Next

1. Write PLAN.md §2 (core loop and pacing): set weeks per season so a season fits 2–2.5 h (D-064), then the friction budget; continue in order to §15. Draft each section, flag decisions inside it, ask the owner only at real choices (one popup at a time), record answers in PLAN.md and DECISIONS.md, commit.
2. Early in phase 3 (§9 risks and prototypes, §12 art production): check old-press ledger readability on a rendered screen (STYLE.md §5, fallback D-052) and cost the art (map art, ink renderer, face part library, two icon sizes, painted portraits later).

## Open questions

- Old-press ledger readability (STYLE.md §5): check minimum size on a rendered ledger; fallback is our own Goudy ledger cut (D-052).
- "More fantasy flair" for the quest board art (STYLE.md §4) needs defining when art direction starts.
- Bardic songs (after launch, D-056): sung or instrumental not decided.
- Stack and engine: decided in PLAN.md §11; add the matching `stacks/` layer then.

## Working style with the owner

- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
