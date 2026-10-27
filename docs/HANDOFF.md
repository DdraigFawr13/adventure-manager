# Handoff

Updated: 2026-10-27. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted).

## Just done

- 2026-10-27 Step 4 (R7) started on branch `ccr-7c31ebb2-c4nfh9` (restarted from `main` after PR #18): owner chose a web page like the Quest Watch (D-150).
- 2026-10-27 Faster runs, parts 2–3 (D-148), merged as PR #18 (owner approved; findings https://claude.ai/artifact/NANMBYsvKL25b1cXpxMBfm), first on branch `ccr-7c31ebb2-c4nfh9` (restarted from `main` after PR #16), owner chose it before step 4: `apply(state, command)` changes state in place and `simulate` is a copy plus `apply`; `tools/year-sim-play.ts` uses `apply`; `tools/career-sim.ts` plays careers on worker threads (`tools/career-play.ts`, `tools/career-worker.ts`; `CAREER_SIM_THREADS` overrides). Measured against a baseline worktree of `main` (b00d65c): outputs identical (6 careers in 4 modes, `year-sim 100`, 4 careers at size 18, and 100 careers against the pre-merge run); 100 careers 36 s (was about 10 min); `year-sim 100` 8 s (was 21 s). Events never hold state objects (engine AGENTS.md rule): `test/apply.test.ts` runs every command type both ways, from before the founding, and walks the state after each one; injecting an alias by hand made it fail. Reviewed three times (D-093).
- 2026-10-27 Step 2 widened, merged as PR #16 (owner approved). `node tools/career-sim.ts [careers] [years] [policy|compare] [staff=off|compare] [size] [grants=take|refuse]`; specs in `packages/engine/src/{career,staff,crisis}/SPEC.md`; every number is a labelled assumption in `packages/content/src/base/{career,staff,crises}.ts`.
  - Careers v0 (D-140, D-141): many years, 17 abstract rivals on a 3×6 ladder, the patron's yearly target and confidence, guildmaster retirement on health, adventurers' ageing, growth by doing, injuries, retirement.
  - Staff v0 (D-145): training and recovery run by the guildmaster (skills grow by doing) or hired staff. Emergency grant (D-146). One crisis chain, the Wendle troll (D-147).
  - 100 careers, default plan, guild of 15 (measured; review page linked below): R9 median 26 years (90% retire); R2 first promotion year 4, runaway rival 0 of 100; stops 71–80 a year by tier; deaths 1–2 a year. R6: hands-on training +13.5% growth, recovery 21.8% fewer injury days, delegated careers 24 vs 26 years. §9d: cautious vs bold each ahead in some seeds; bad starts 28 of 35 last 10+ years; a crisis woke in years 5–15 in 93% of careers reaching year 10; guild of 18: top-tier stops 77 (≤130).
  - Found and fixed: the patron dismissed bad starts after 2 years (D-141 numbers softened); the grant's harder-target string sank the guilds it was meant to save (owner amended D-146: confidence only; cost tuned to 5, since at 10 refusing did better).
  - Reviews (D-093): 3 rounds, 12 + 8 + 3 findings, no blockers; all fixed or kept with reasons. Findings page: https://claude.ai/artifact/CjcdmX55Nk5uaNmuzMQ6fE
  - Not fixed, for the owner: chests grow to millions of copper over long careers (no money sinks yet; gear and buildings, D-143, are the planned sinks).
- 2026-10-26 Step 3 merged as PR #14 (writing test R8 passed, contracts from parts D-139, desk mock-ups; R4 round 3 awaits the owner's fact test). Engine test (PR #12) and year simulator first slice (PR #13) merged. Detail in the archive.
- 2026-10-27 Faster headless runs, part 1 (D-148; branch `ccr-c510692c-px9h9x`): `simulate()` shares the read-only `content` instead of cloning it each command; engine and content tests freeze content (a write throws) and check it is shared. Measured `node tools/year-sim.ts 100`: 48.2 s to 19.1 s, output identical; sweep outputs identical. Parts 2–3: see the entry above.
- Older entries (plan phase, to M0): `docs/archive/handoff-2026-10.md`.

## Next

1. R4: the owner runs the round-3 fact test in the published desk mock-up at 1366 px and pastes the result (round 1 missed the 10 s line).
2. Step 4 (this branch): design the prototype's screens and the memorial letter with the owner, then build, review and PR (D-133).
3. Owner plays two in-game years in the step 4 page and names three adventurers (R7); also the timed year for R3.
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
