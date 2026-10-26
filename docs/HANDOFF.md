# Handoff

Updated: 2026-10-26. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

3 of 3: Full plan → `docs/design/PLAN.md`. Concept locked (D-045); style locked (D-061); plan outline approved (D-062). PLAN.md §1–§8 written (D-063..D-083); §9..§15 to do.

## Just done

- 2026-10-26 PLAN.md §8 accepted: in-world letters with a Trace to the cause chain, plus numbered inspector histories (D-082, mock-up `consequences.html`); nine surfaces and seven consequence rules (D-083).
- 2026-10-26 PLAN.md §7 accepted: ancestries Marchfolk, Stonewrights, Lanthe, Reedfolk, Barrowborn (D-079, mock-up `ancestries.html`); standard content volume: 36 monster kinds, 20 sites, 20 quest templates, 60 key moments, ~6,000 lines (D-080); classes, talents, 4 prestige paths, attributes, traits, staff, backgrounds (D-081).
- 2026-10-26 PLAN.md §6 accepted: prologue + staff-opened ledgers + clerk's notes (D-076); size slider + clear print (D-077); seven screen rules and accessibility list (D-078). Mock-ups published: `onboarding.html`, `readability.html`.
- 2026-10-26 PLAN.md §5 accepted: 10 class levels at launch, 20 planned (D-074); retirees can become staff, 3-level facilities as data (compound-style building later), max 5 active guild traits, ~8 guildmaster stats grown by doing, succession inheritance (D-075).
- 2026-10-26 PLAN.md §4 accepted: ~2 deaths a year in a mid guild, death rates by danger rating, turnover ~25% (D-071; §2e updated); money tight early, steady later (D-072); sources/sinks, tournaments as shop window, 3×6 ladder with bigger ladders later (D-073).
- 2026-10-26 PLAN.md §3 accepted: ranking by renown earned this year, renown stored as sourced entries for a later intrigue layer (D-069); 14 launch systems, injury folded into Adventurers, scouting + knowledge merged, academy and commissioning moved to Early update (D-070; D-012, D-013 amended; CONCEPT §9, §10, §28 notes).
- 2026-10-26 PLAN.md §2 accepted: a season is one in-game year (D-066); 48-week year with Assembly, campaigning, midsummer fair, winter (D-067); ~80 stops/year, three stop classes, rate cap on Digest items only (D-068). CONCEPT core-loop timings updated to match.
- 2026-10-26 PLAN.md §1 accepted: management-sim veterans first, tabletop fans second (D-063); one season ≈ 2–2.5 h (D-064); design goals and success targets as a starting set (D-065). Branch `claude/adventure-manager-continue-kmy9rj`, PR #2 to `main`.
- 2026-10-26 Plan outline approved (D-062); `docs/design/PLAN.md` holds the 15-section outline only.
- 2026-10-26 Style guide complete and locked: `docs/design/STYLE.md` §1–§9, D-046..D-061. War table look, candlelit oak palette, desk-home layout, inked-map quest board, old-press type, woodcut icons and portraits (painted later), soft early-music ambience, mixed naming on an English-fenland core, grounded voice with dry wit, no narrator. Mock-ups (HTML) in `docs/design/mockups/`.
- 2026-10-25 Concept complete: `docs/design/CONCEPT.md` §1–§33, pillars, scope tiers; D-003..D-045.
- 2026-10-25 Repo set up with AI-Master-Instructions v0.3.0. Merged to `main` via PR #1 on 2026-10-26.

## Next

1. Write PLAN.md §9 (risks and prototypes): riskiest assumptions and the cheapest test for each (quest sim fun to watch? desk holds FM density? old-press ledgers readable?). Include the art costing noted in Next 2. Continue in order to §15. Owner wants visual examples where they help. Draft each section, flag decisions inside it, ask the owner only at real choices (one popup at a time), record answers in PLAN.md and DECISIONS.md, commit.
2. Early in phase 3 (§9 risks and prototypes, §12 art production): check old-press ledger readability on a rendered screen (STYLE.md §5, fallback D-052) and cost the art (map art, ink renderer, face part library, two icon sizes, painted portraits later).

## Open questions

- Later: 20 class levels (D-074) need a pacing decision; facility compound / city-building style guildhall (D-075) not scoped.
- Intrigue and underhanded dealings (owner's note, D-069): Later tier; content not decided.
- Old-press ledger readability (STYLE.md §5): check minimum size on a rendered ledger; fallback is our own Goudy ledger cut (D-052). Mock-up showed its old-style figures scan worse than a book serif; clear print (D-077) is the player-side fix.
- "More fantasy flair" for the quest board art (STYLE.md §4) needs defining when art direction starts.
- Bardic songs (after launch, D-056): sung or instrumental not decided.
- Stack and engine: decided in PLAN.md §11; add the matching `stacks/` layer then.

## Working style with the owner

- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
