# Handoff

Updated: 2026-10-27 (sixth session). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted). Mobile first since D-150: phones lead, Windows after launch.

## Just done

- 2026-10-27 PR #20 merged (7b29e15): planning round D-159–D-161, repo audit fixes, phone R4 test, D-162–D-164; four reviews, 41 findings, 34 fixed, 7 kept (https://claude.ai/artifact/UTo26LBwZBfbtNh17GjYjb). Detail: `docs/archive/handoff-2026-10.md` and the PR.
- 2026-10-27 R4 passes (D-165): round 2 on the owner's phone, 5 of 5 under 10 s (8.9, 8.0, 9.8, 5.8, 6.1 s), via Find and the desk's Money page. Round 1 had failed (0 of 5). Test page: https://claude.ai/artifact/PkKz6nGhVqJ4Fr8Fz89MMX. Merged as PR #22.
- 2026-10-27 R5 passes (D-166): the owner read the 15 px text with lining figures comfortably on their phone. Merged as PR #23.
- 2026-10-27 Mobile-first tools review approved (D-167; detail in `docs/design/TOOLS-REVIEW.md` §6): phone checks in `tools/mockup-shot.mjs`, Vercel project `adventure-manager`. Merged as PR #24; Vercel production now builds from `main` (checked: production deployment of 5f6c5a6 is READY).
- 2026-10-27 Guild house and home town, the owner's wish, four questions answered (D-168–D-171): the house is built up like Fallout Shelter on stacked floors 3 cells wide, with merging rooms that have capacity and a staff head; the guild funds 5 home-town sites (smith, temple, inn, market, stables), with boosts that hold while standing holds; both at launch, replacing 5 facilities × 3 levels. PLAN §5c and §7d, CONCEPT §9 and the roadmap updated. Merged as PR #25.
- 2026-10-27 Guild house follow-ups, owner's answers (D-172–D-180), with a phone mock-up in two rounds (`docs/design/mockups/guild-house.html`, https://claude.ai/artifact/D57ueUj99aC7vVxZX9hMLU): 3 levels per kind, and cells cost more the higher or deeper they are (D-172); a few incidents a year as letters (D-173); no bed, no signing (D-174, not the recommendation); the town is a faction (D-175); the strongroom is below ground (D-176); weekly room upkeep (D-177). The owner added a compound around the hall, drawn side-on and reached by swiping, with the gate, training yard, works yard and forge compound-only (D-178, D-180), and a top-down, scrollable town map with plots where the guild founds sites by patronage (D-179). PLAN §5c and §7d, CONCEPT §9 and the roadmap updated. Merged as PR #26 (92ae1bf).

- 2026-10-27 The last guild house questions, owner's answers (D-181–D-184): the home town is one of the two city factions; members who lose their beds lodge at the inn for a fee; the compound is 3 plots a side and can grow; one hand-made town with 5 sites and 3 spare plots. Merged as PR #27.

- 2026-10-27 House v0 started (owner's scope: money and space first, room effects next): spec `packages/engine/src/house/SPEC.md`, types, content `packages/content/src/base/house.ts`. Middle-tier median surplus measured at about 75,000 copper a year (career-sim, 40 careers), far above PLAN §4b's 10–20%; the house is sized to the measured figure. Engine (`packages/engine/src/house/`, 24 tests) and the simulator's house mode (`node tools/career-sim.ts 40 26 default off 15 take on`) built. Measured at HOUSE_COST_PERCENT 175 with upkeep 8/17/34 (40 careers, 26 years): the full-house plan costs 706,000 copper, 9.9 years of the middle tier's median surplus before house money (target 8–12, D-172); first plan step started in week 32 (median; p90 week 200, held back by the policy's 12-week reserve); 70% of careers finish the plan, median year 14; room upkeep 20% of spending from year 10 (owner's target, D-185); height cost on extensions only (D-185). Merged as PR #28 (eb272a9).

- 2026-10-27 Room effects v1 built (D-186; `house/SPEC.md` "Room effects"; 30 house tests). Measured, 100 careers × 26 years, house on: dismissals 24% vs 10% house off; bad starts 57 vs 35. Split: room effects alone (no building, no upkeep) 26%, of which the growth half 29% and the sickbed half 9%; upkeep alone 14%; building alone 12%; every member with a place 10%. Recentring growth (placed 1.5×, unplaced 0.75×, 8–12 places a plot) gives 20%; a place as a pure bonus 21%. Waiting on the owner's direction before tuning; not yet reviewed.
- 2026-10-27 Owner's redirect after the room-effects measurements: a smaller start and training at home in the yard (D-187, replacing D-186's growth half); a founding draft of 3 starter parties and 2-3 extras paid from one purse (D-188). Implementer building D-187 (home training, sign-to-beds policy); content and spec updated, uncommitted until green.
## Next

1. Guild house, second simulator pass: room effects (D-186: no infirmary bed heals 2× slower, no training place halves growth; staff heads, D-170) wired into recovery and training; then incidents (D-173) with lost beds and inn lodging (D-182). First pass (money and space) is done; upkeep settled at ~20% of late spending (D-185). Settled since PR #26: the home town is one of the two city factions (D-181), members who lose beds lodge at the inn for a fee (D-182), the compound is 3 plots a side and can grow (D-183), one hand-made town with 5 sites and 3 spare plots (D-184). Still open: what the 3 spare plots show at launch (D-184). Add D-168's hours and art cost, plus the compound, town map and incident letters, into PLAN §12–§14 at the next re-plan.
2. Step 4, the two-year text prototype (R7) as a phone-first web page (D-160), with histories and memorial letters; standing parties (D-014, D-142) join here.
3. Engine test verdict (D-110, D-154, D-167): rebuild the engine test as a phone web page on the Vercel link, with an on-page frame-rate panel; the owner judges it on their phone (60 fps map with smooth pinch, 15 px text, screen reader). The map is free pan and zoom with tappable towns, places, parties and events opening a pop-up with details and a placeholder image (D-164).
4. Gear (D-143): workshop with the owner before the year simulator uses gear.
5. R1 notes (D-132): hidden items and branching paths wait for quest design. Tuning left: reckless doubles deaths only on perilous work; injuries per death ~2.5–5 on composed contracts (target ~5).

## Open questions

- Permissions (PR #3 review, D-096): tighten the allow list (`cat`/`grep`/`find` can read `.env`; `git branch:*` allows `-D`; `find:*` allows `-delete`) and widen the force-push ask rules? Owner to decide. (The dead `npm run lint` entry was swapped for `npm run format:check` and `npm run boundaries`, owner's approval 2026-10-27.)
- Network policy (measured, D-167): `api.vercel.com` and `dl.google.com` are blocked here, so no Vercel CLI deploys and no Android SDK in sessions; the owner's setting, not needed while Vercel builds from GitHub.
- Mobile first (D-150): the phone sources for the §1d measures, and the phone versions of the Steam store page, wishlists, playtest recruiting and Early Access (D-099, D-100, D-113). Open too: the tablet layout. The test laptop in the budget (PLAN §14) may no longer be needed before launch.
- Engine findings from R4, for the owner: two people can get the same full name (`packages/engine/src/guild/people.ts:68` draws given and family names independently; seed phone-2 has two Ash Thornes); at week 23 of seed phone-1, 23 of 30 members rest from wounds (maybe balance).
- Kingdom map art direction (D-097, D-144): Story-Generator layout as the base; geography review in the workshop.
- Later, tier not set: 20 class levels (D-074); intrigue (D-069); exploring the wilds (D-136); quest board flair (STYLE §4); bardic songs (D-056).

## Working style with the owner

- End the session after each merged PR or finished plan section; the next one starts here (D-095).
- PRs (D-133): independent adversarial review of the whole branch diff, its findings and fixes published as an artifact and linked, then the owner's approval, then create the PR; merge it yourself once CI is green. Commits after approval need a new review and approval.
- Every session updates and republishes `docs/roadmap.html` to https://claude.ai/artifact/FTio9mE7jLaK4Wrn189YAg (D-128); read the live artifact first, then publish with its `url`.
- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
