# Handoff

Updated: 2026-10-26. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted).

## Just done

- 2026-10-26 Owner approved the whole plan (M0, D-115); PR #5 merged.
- 2026-10-26 Plan review decided: 10–20 h a week, about 31–46 months to launch (D-108); lean launch cut (D-109); web-first engine test (D-110); stop and slip rules (D-111); 3–4 small crises at launch (D-112); all other recommendations adopted (D-113 design and production, D-114 engine foundations and standards). Applied across PLAN.md.
- 2026-10-26 Plan review before M0 (owner's request): `docs/design/PLAN-REVIEW.md`, page `docs/design/mockups/plan-review.html`. 9 lean, 11 fun, 8 codebase, 4 standards findings and a top-10 action list; all proposals, none decided. Owner's rule: reviewers are independent, briefed without the main session's findings (D-107).
- 2026-10-26 PLAN.md §15 accepted: checks per push vs before gates, path-filtered CI with release-only builds, bug severities, Steam branches, release checklist, hotfixes (D-105); launch on Windows only, Deck and Mac after launch (D-106). Plan complete; §14 and §15 on branch `ccr-a7e935d0-9dffpn`.
- 2026-10-26 PLAN.md §14 accepted: start solo with AI help and contractors, decide on paid help at the slice and alpha gates (D-102); budget about $57k–185k solo, $128k–358k with one developer, $10k–32k before the hire gate; self-funded through the slice, funding route chosen there (D-103); price $24.99, English at launch (D-104). All estimates.
- 2026-10-26 PLAN.md §13 accepted: milestones M0–M7 with owner gates, about 18–28 months to launch for a small team (estimate); vertical slice is one corner of the March at final quality; no bulk art before the prototypes pass R1 and R2 (D-099). Plan for 1.0; Early Access looked at again at the alpha gate (D-100). Post-launch: war campaigns first (D-101). Merged via PR #4.
- 2026-10-26 PLAN.md §12 accepted: kingdom map hand-drawn base now, procedural later, launch layers factions, guilds, action, threats (D-097; D-087 amended; mock-up `kingdom-map.html`); asset lists, rough costs (art $23k–74k, audio $9k–37k) and pipeline (D-098). Story-Generator reviewed: its seeded worldgen and ink atlas (TypeScript, canvas) can lay out the March and seed the procedural renderer; reuse favours the web engine option (PLAN §12d).
- 2026-10-26 Tools review accepted (D-094); fresh session per merged PR or plan section (D-095); deny secret reads and ask before force-push in `.claude/settings.json` (D-096).
- 2026-10-26 Tools and skills review drafted: `docs/design/TOOLS-REVIEW.md`, page https://claude.ai/artifact/UiwdssAjKy2dnZ73pzJfeB. Adopted: docs checker, mock-up script, one setup audit (D-092); adversarial review before every PR (D-093). Ripgrep: useful, already in use; caveman skill: not adopted.
- 2026-10-26 PLAN.md §11 accepted: engine chosen after a two-engine test, web tech (Electron, TypeScript) vs Godot 4 (C#), as prototype step 0 (D-090); engine-neutral architecture with the event log as spine, integer determinism, JSON packs, safe versioned saves (D-091).
- 2026-10-26 PR #2 (Part A, §1–§10) merged to `main`. Part B work on branch `claude/plan-part-b`.
- 2026-10-26 PLAN.md §10 accepted: playtest logs only, release sends nothing, opt-in telemetry a future option (D-088); playtest stages, measures and acting on results (D-089). Part A complete.
- 2026-10-26 Owner added a launch goal: an on-theme fantasy kingdom map showing areas, locations, guilds, action and deeds (D-087); to workshop in §12.
- 2026-10-26 PLAN.md §9 accepted: ledger minimum 15 px with lining figures (D-084; corrected the §6 mock-up and D-077 rationale, which had shown old-style figures by mistake); prototype order watched quest first (D-085; an earlier answer was a misclick); nine risks with tests and pass lines (D-086).
- 2026-10-26 Roadmap page for the owner: `docs/roadmap.html`, published at https://claude.ai/artifact/FTio9mE7jLaK4Wrn189YAg. A view of HANDOFF and PLAN (HANDOFF wins).
- 2026-10-26 PLAN.md §8 accepted: in-world letters with a Trace to the cause chain, plus numbered inspector histories (D-082, mock-up `consequences.html`); nine surfaces and seven consequence rules (D-083).
- 2026-10-26 PLAN.md §7 accepted: ancestries Marchfolk, Stonewrights, Lanthe, Reedfolk, Barrowborn (D-079, mock-up `ancestries.html`); standard content volume: 36 monster kinds, 20 sites, 20 quest templates, 60 key moments, ~6,000 lines (D-080); classes, talents, 4 prestige paths, attributes, traits, staff, backgrounds (D-081).
- 2026-10-26 PLAN.md §6 accepted: prologue + staff-opened ledgers + clerk's notes (D-076); size slider + clear print (D-077); seven screen rules and accessibility list (D-078). Mock-ups published: `onboarding.html`, `readability.html`.
- 2026-10-26 PLAN.md §5 accepted: 10 class levels at launch, 20 planned (D-074); retirees can become staff, 3-level facilities as data (compound-style building later), max 5 active guild traits, ~8 guildmaster stats grown by doing, succession inheritance (D-075).
- 2026-10-26 PLAN.md §4 accepted: ~2 deaths a year in a mid guild, death rates by danger rating, turnover ~25% (D-071; §2e updated); money tight early, steady later (D-072); sources/sinks, tournaments as shop window, 3×6 ladder with bigger ladders later (D-073).
- 2026-10-26 PLAN.md §3 accepted: ranking by renown earned this year, renown stored as sourced entries for a later intrigue layer (D-069); 14 launch systems, injury folded into Adventurers, scouting + knowledge merged, academy and commissioning moved to Early update (D-070; D-012, D-013 amended; CONCEPT §9, §10, §28 notes).
- 2026-10-26 PLAN.md §2 accepted: a season is one in-game year (D-066); 48-week year with Assembly, campaigning, midsummer fair, winter (D-067); ~80 stops/year, three stop classes, rate cap on Digest items only (D-068). CONCEPT core-loop timings updated to match.
- 2026-10-26 PLAN.md §1 accepted: management-sim veterans first, tabletop fans second (D-063); one season ≈ 2–2.5 h (D-064); design goals and success targets as a starting set (D-065). Merged via PR #2.

## Next

1. M1 step one: write `docs/STANDARDS.md` and a per-package `AGENTS.md` plan (D-114), then resolution v0: half a page plus engine code for how party, plan, stats, gear and site become odds and events (PLAN §9b, D-113). Then the web-first engine test (D-110): ledger and kingdom map in Electron + TypeScript, reusing Story-Generator map code (owner to confirm rights, §12d). Ask the owner before adding the stack's dependencies (approve the list once, D-114) and before any Godot tooling. Time-boxes and stop rules: PLAN §9b (D-111).

## Open questions

- Permissions (from the PR #3 review): tighten the allow list (`cat`/`grep`/`find` can read `.env`; `git branch:*` allows `-D`; `find:*` allows `-delete`) and widen the force-push ask rules (`-fu`, `origin +main`, `git -C`)? Owner to decide; see D-096 limits.
- Kingdom map art direction continues past §12 (D-097): Story-Generator layout as the artist's base.
- Later: 20 class levels (D-074) need a pacing decision; facility compound / city-building style guildhall (D-075) not scoped.
- Intrigue and underhanded dealings (owner's note, D-069): Later tier; content not decided.
- Old-press ledger readability: 15 px minimum (D-084), confirm on real monitors in R4; fallback is our own Goudy ledger cut (D-052). Use lining figures (`lining-nums`) for all numbers: the face's default figures are old-style and proportional (measured 13.6–20.8 px wide at 40 px; lining 21.1 px each). Clear print (D-077) is the player-side option. Minimum size asked in PLAN §9c.
- "More fantasy flair" for the quest board art (STYLE.md §4) needs defining when art direction starts.
- Bardic songs (after launch, D-056): sung or instrumental not decided.
- Stack and engine: chosen after the engine test (D-090); add the matching `stacks/` layer then.

## Working style with the owner

- End the session after each merged PR or finished plan section; the next one starts here (D-095).
- Before creating any PR, and before marking one ready, do an adversarial review of the whole branch diff (D-093).
- Keep `docs/roadmap.html` current: update and republish it (same file path, same URL) at every checkpoint where a section or phase changes.
- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
