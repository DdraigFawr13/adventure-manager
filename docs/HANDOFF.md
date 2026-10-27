# Handoff

Updated: 2026-10-27. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted).

## Just done

- 2026-10-27 Step 2 widened on branch `ccr-7c31ebb2-c4nfh9` (not yet reviewed or PR'd). `node tools/career-sim.ts [careers] [years] [policy|compare] [staff=off|compare] [size] [grants=take|refuse]`; specs in `packages/engine/src/{career,staff,crisis}/SPEC.md`; every number is a labelled assumption in `packages/content/src/base/{career,staff,crises}.ts`.
  - Careers v0 (D-140, D-141): many years, 17 abstract rivals on a 3×6 ladder, the patron's yearly target and confidence, guildmaster retirement on health, adventurers' ageing, growth by doing, injuries, retirement.
  - Staff v0 (D-145): training and recovery run by the guildmaster (skills grow by doing) or hired staff. Emergency grant (D-146). One crisis chain, the Wendle troll (D-147).
  - 100 careers, default plan, guild of 15 (measured): R9 median 25 years (retired 81%, dismissed 19%); R2 first promotion median year 4, runaway rival 0 of 100; stops 71–76 a year by tier; deaths 1–2 a year. R6: see the final run in the review artifact. §9d: bad starts recover (10+ years) 18 of 26 with grants refused; with grants 18 of 35 (the grant counts as a bad start, and it shows no measurable effect on survival); late goals: a crisis woke in years 5–15 in 94% of careers reaching year 10; guild of 18: top-tier stops 77 (≤130). Cautious vs bold: each ahead in some seeds (bold richer in 72%, cautious more renown in 53%).
  - Found and fixed: bad starts were dismissed by the patron after 2 years, not ruined by money; the patron's miss and debt steps were softened (D-141 numbers) and the grant's confidence cost cut from 15 to 5 (D-146).
  - Not fixed, for the owner: chests grow to millions of copper over long careers (no money sinks yet; gear and buildings, D-143, are the planned sinks).
- 2026-10-26 Step 3 merged as PR #14 (writing test R8 passed, contracts from parts D-139, desk mock-ups; R4 round 3 awaits the owner's fact test). Engine test (PR #12) and year simulator first slice (PR #13) merged. Detail in the archive.
- Older entries (plan phase, to M0): `docs/archive/handoff-2026-10.md`.

## Next

1. R4: the owner runs the round-3 fact test in the published desk mock-up at 1366 px and pastes the result (round 1 missed the 10 s line).
2. Step 2: finish the D-133 flow for this branch (adversarial review, findings artifact, owner approval, PR, merge). Standing parties (D-014, D-142) move to step 4, where the text prototype needs them.
3. Step 4: the two-year text prototype (R7), with histories and memorial letters built on the report grammar.
4. Engine test verdict (D-110): the owner runs `npm start -w @adventure-manager/shell` on Windows for real fps (60 fps bar at 1366×768; container software rendering gave 48 idle, 44 panning).
5. Gear (D-143, amends D-012): RPG-style slots per adventurer, hand-equipped or by the quartermaster's policy; a smith's shop for basics; buildings for discounts or rarer stock later. Slot list, item tiers and prices not designed: workshop with the owner before the year simulator uses gear.
6. R1 notes (D-132): twists now give traps a home (D-139); hidden items and branching paths still wait for quest design. Tuning left: reckless doubles deaths only on perilous work; injuries per death ~2.5–5 on composed contracts (target ~5).

## Open questions

- Reference party for PLAN §4c targets: settled, a well-built party with the sample party as reference (D-137).
- Permissions (from the PR #3 review): tighten the allow list (`cat`/`grep`/`find` can read `.env`; `git branch:*` allows `-D`; `find:*` allows `-delete`) and widen the force-push ask rules (`-fu`, `origin +main`, `git -C`)? Owner to decide; see D-096 limits.
- Kingdom map art direction continues past §12 (D-097): Story-Generator layout as the artist's base; the workshop now includes a geography review (D-144: sensible rivers and roads, towns placed for a reason with specialties, another major city, wild-country outposts).
- Later: 20 class levels (D-074) need a pacing decision; facility compound / city-building style guildhall (D-075) not scoped.
- Intrigue and underhanded dealings (owner's note, D-069): Later tier; content not decided.
- Exploring the wilds (owner's wish, D-136): explorers uncover hidden places and items; design with expeditions, the map's charting and the R1 hidden-items note; tier not set.
- Old-press ledger readability: 15 px minimum (D-084), confirm on real monitors in R4; fallback is our own Goudy ledger cut (D-052). Use lining figures (`lining-nums`) for all numbers: the face's default figures are old-style and proportional (measured 13.6–20.8 px wide at 40 px; lining 21.1 px each). Clear print (D-077) is the player-side option. Minimum size asked in PLAN §9c.
- "More fantasy flair" for the quest board art (STYLE.md §4) needs defining when art direction starts.
- Bardic songs (after launch, D-056): sung or instrumental not decided.
- Stack and engine: chosen after the engine test (D-090); add the matching `stacks/` layer then. Engine code is TypeScript already; a Godot outcome would change only ui and shell (STANDARDS.md).

## Working style with the owner

- End the session after each merged PR or finished plan section; the next one starts here (D-095).
- PRs (D-133): independent adversarial review of the whole branch diff, its findings and fixes published as an artifact and linked, then the owner's approval, then create the PR; merge it yourself once CI is green. Commits after approval need a new review and approval.
- Every session updates and republishes `docs/roadmap.html` to https://claude.ai/artifact/FTio9mE7jLaK4Wrn189YAg (D-128); read the live artifact first, then publish with its `url`.
- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
