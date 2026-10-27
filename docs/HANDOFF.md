# Handoff

Updated: 2026-10-27. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted). Mobile first since D-150: phones lead, Windows after launch.

## Just done

- 2026-10-27 Re-plan for mobile first merged as PR #19 (D-150–D-158). Earlier entries, PRs #14–#18: `docs/archive/handoff-2026-10.md`.
- 2026-10-27 This branch `ccr-d8e1d3d0-i0dgfz` (from `main` 963838d): planning round D-159 (phone R4 on the owner's Pixel 10 Pro XL, blind facts, page-timed), D-160 (step 4 is a phone-first web page), D-161 (Vercel Hobby while a hobby; tools and skills reassessed for mobile first).
- 2026-10-27 Repo audit (two independent agents, docs and tooling), findings verified before fixing: amendment pointers for mobile first (D-016, D-064, D-078, D-084–D-086, D-098, CONCEPT §20, PLAN §1c, §6b–c, §9b–c, §11), stale lines in AGENTS.md, README, STANDARDS, engine and shell AGENTS, two SPECs; CI path filter narrowed (Markdown in `.claude/` and stray Markdown in `packages/*/src` now run CI); `.nvmrc` pins Node 22.22.0; the boundary check now scans `tools/*.ts` (3 casts fixed); Vite deduplicated at 8.3.5; `.gitignore` covers `.env*`. Rejected: "Prettier `--cache` does nothing" (measured 3.0 s, then 0.8 s).

## Next

1. Phone R4 (D-154, D-159, D-162): the Guildhall Fact Test, https://claude.ai/artifact/PkKz6nGhVqJ4Fr8Fz89MMX (`docs/design/mockups/phone-r4.html`, data `node tools/make-desk-data.ts <seed> docs/design/mockups/phone-r4.html`). Round 1 (seed phone-1, 443 × 790 px): 5 of 5 right, 0 under 10 s (12.5, 21.1, 46.1, 11.6, 10.6 s); fact 3 had only one option (bug, fixed), so its 'right' counts for nothing. Round 2 (seed phone-2) published with D-162's fixes; waits on the owner's run. Results: ArtifactData `list` of `r4runs`. Notes for the owner: at week 23, 23 of 30 members rest from wounds (phone-1); the engine can give two people the same full name (`packages/engine/src/guild/people.ts:68`; phone-2 has two Ash Thornes).
2. Tools and skills reassessment for mobile first (D-161), before step 4: phone screenshots and touch checks, Vercel Hobby previews, the phone wrapper choice (needs SAFE-03 approval; D-117 approved only Electron).
3. Step 4, the two-year text prototype (R7) as a phone-first web page (D-160), with histories and memorial letters; standing parties (D-014, D-142) join here.
4. Engine test verdict (D-110, D-154): rebuild the engine test as a phone app; the owner judges it on their phone (60 fps map with smooth pinch, 15 px text, screen reader).
5. Gear (D-143): workshop with the owner before the year simulator uses gear.
6. R1 notes (D-132): hidden items and branching paths wait for quest design. Tuning left: reckless doubles deaths only on perilous work; injuries per death ~2.5–5 on composed contracts (target ~5).

## Open questions

- Godot fallback (D-090, D-110): D-151 says one web-tech codebase for both stores. Does the Godot fallback still stand? Owner to confirm.
- Permissions (PR #3 review, D-096): tighten the allow list (`cat`/`grep`/`find` can read `.env`; `git branch:*` allows `-D`; `find:*` allows `-delete`), widen the force-push ask rules, and swap the dead `npm run lint` entry for `npm run format:check` and `npm run boundaries`? Owner to decide.
- Mobile first (D-150): the phone sources for the §1d measures, and the phone versions of the Steam store page, wishlists, playtest recruiting and Early Access (D-099, D-100, D-113). Open too: the tablet layout. The test laptop in the budget (PLAN §14) may no longer be needed before launch.
- Kingdom map art direction (D-097, D-144): Story-Generator layout as the base; geography review in the workshop.
- Old-press ledger readability: confirm 15 px with lining figures on the owner's phone in the phone R4 (D-084, D-154); fallbacks D-052, D-077.
- Later, tier not set: 20 class levels (D-074); facility compound (D-075); intrigue (D-069); exploring the wilds (D-136); quest board flair (STYLE §4); bardic songs (D-056).

## Working style with the owner

- End the session after each merged PR or finished plan section; the next one starts here (D-095).
- PRs (D-133): independent adversarial review of the whole branch diff, its findings and fixes published as an artifact and linked, then the owner's approval, then create the PR; merge it yourself once CI is green. Commits after approval need a new review and approval.
- Every session updates and republishes `docs/roadmap.html` to https://claude.ai/artifact/FTio9mE7jLaK4Wrn189YAg (D-128); read the live artifact first, then publish with its `url`.
- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
