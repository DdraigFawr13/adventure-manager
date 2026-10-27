# Handoff

Updated: 2026-10-27. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted).

## Just done

- 2026-10-26 Step 3 on branch `ccr-7c31ebb2-c4nfh9` (from `main` after PR #13): writing test, contracts from parts, desk mock-ups. Reviewed three times (D-093): 12, 11 and 9 findings, all fixed or answered (the hidden twist leaked through the offer id; deaths were never traced to the foe); findings page linked in the approval ask.
  - Grammar (D-114): pronouns, verb and number agreement, nested families, conditional variants, masking (`packages/engine/src/core/text.ts`). Variant picks now pass FNV-1a through a finaliser (keys sharing a suffix had picked the same variants).
  - Quest report (`packages/engine/src/report/`, SPEC.md): a letter home from one quest's events; words in `packages/content/data/reports.en.json`. Drawn people get names and pronouns on their own stream (naming.json; pronoun weights she 45 / he 45 / they 10 are an assumption).
  - Contracts (D-139, owner's choice "one twist rule"): site × monster kind × one twist; 8 sites, 10 kinds, 6 twists in `packages/content/data/contracts.json`; the board leaves out its last 60 shapes of each danger; offers carry a shown id without the hidden twist. `node tools/contract-sweep.ts 60`, reference party, default plan, weighted as the board draws: deaths 0.22 / 0.73 / 1.96 / 5.85% for routine to deadly (targets 0.2 / 0.8 / 2.5 / 7%; perilous −22%, deadly −16%, inside ±25%).
  - R8 (`node tools/template-preview.ts 200`): at most 2 uses of any masked sentence (names, numbers and pronouns masked) per 50 letters (pass; also at 1,000 letters); 100 quests show 87 shapes, at most 3 repeats (pass). Formula lines (salutation, sign-off) are excluded and counted apart: the session's reading of the pass line, to confirm with the owner.
  - R4 mock-up (`docs/design/mockups/desk-density.html`, data from `node tools/make-desk-data.ts`): a 30-strong guild at week 23; 27 roster rows fully visible at 1366 px with the Line column (pass line 25+). Published: https://claude.ai/artifact/9yyFQxGYtRiNFixjfq4j4t. Owner's fact test, round 1 at 1366 px: 0 of 5 under 10 s, all 5 right (18.1, 12.5, 16.6, 12.7, 10.2 s); R4 loops. Round 3 published (Find box, roster by name, column highlight, sortable board, R/F/C keys, timer after reading; new seed desk-2; owner's notes D-142: person card, group by party, Line column, contract art panel, View on map; D-143 equipment cards as placeholders). The owner's round-3 fact test is next.
- 2026-10-26 Engine test (1.8, D-110) merged as PR #12; the owner approved the look from the preview. Real fps on the owner's Windows machine is still to do.
  - Shell: `packages/shell` (Electron 44.9.3; 44.7.0 had a high advisory) opens 1366×768 on the `packages/ui` engine-test page, local OFL fonts (`packages/ui/fonts/SOURCES.md`).
  - Ledger: 30 generated rows (`tools/make-engine-test-roster.ts`), sorting, engine `Value` breakdowns on hover and keyboard focus, size slider, clear print, wages in gold, silver and copper (D-135).
  - Map (D-134): the March as one 300 × 200 km sheet cut from a generated world (Story-Generator stages in `tools/worldgen`, bake `node tools/bake-map.ts`, seed march-7), 8 settlements, 18 villages, roads, one vellum corner the party charts; a test checks the committed base equals a fresh bake.
  - Measured (`xvfb-run -a node tools/engine-test-measure.mjs`, needs the container's global Playwright 1.64.1; software rendering, so fps is a floor): build 1.0 s, map drawn 1.6 s after launch, map 48 fps idle and 44 under pan and zoom, 30 ledger rows at 15 px, no unlabelled controls, ~550–650 MB across Electron's processes. 150% text scrolls the ledger sideways at 1366 px. Real fps needs the owner's Windows machine.
  - Preview: https://claude.ai/artifact/CyavGB8AYH7WfLR2PFDqYR. Two review rounds (D-093): findings and fixes in the review page linked from the approval ask.
- 2026-10-26 Year simulator first slice (1.9) merged as PR #13: `packages/engine/src/guild/` (SPEC.md), deadly quest `quest.gallows-spire`, `node tools/year-sim.ts [years] [policy]`. One guild of 15, no rivals, three classes; numbers are labelled assumptions in `packages/content/src/base/guild.ts`; fees tuned (scale 135). Owner settled: death targets are for a well-built reference party (D-137); deaths and signings cost the guild (D-138). 1,000 years, default plan: deaths 4 a year (drawn guild), injuries 2.5 per death (~5), quests 12.7 per party (8–12), surplus +13.6% (tuned), wages 59% of spending, lowest winter chest 19,000 copper, recruits 2 (~4), stops 72 (≤100), 0.08 s a year. Bold plan: most money in 87% of years, most renown in 22% (§9d still missed on money). 
- Older entries (plan phase, to M0): `docs/archive/handoff-2026-10.md`.

## Next

1. Step 3 (this branch): independent review (D-093), findings artifact, owner approval (D-133), then PR. The owner also runs the R4 fact test in the published mock-up at 1366 px and pastes the result.
2. Step 2, wider year simulator, on a fresh branch from `main` after the step-3 merge. Settled: abstract rivals (D-140), the patron's yearly target and confidence (D-141); draft spec in this session's notes is not saved, so re-derive from D-140/D-141 and PLAN §4e, §5. Also add standing parties (D-014, D-142). Still to ask, one at a time: several years with ageing, retirement and careers (R9), rivals and the ladder (R2), delegation (R6), the §9d checks (bad starts, top-guild load, late goals). Bold still wins money (D-138); a multi-year run may change that.
3. Step 4: the two-year text prototype (R7), with histories and memorial letters built on the report grammar.
4. Engine test verdict (D-110): the owner runs `npm start -w @adventure-manager/shell` on Windows for real fps (60 fps bar at 1366×768; container software rendering gave 48 idle, 44 panning).
5. Gear (D-143, amends D-012): RPG-style slots per adventurer, hand-equipped or by the quartermaster's policy; a smith's shop for basics; buildings for discounts or rarer stock later. Slot list, item tiers and prices not designed: workshop with the owner before the year simulator uses gear.
6. R1 notes (D-132): twists now give traps a home (D-139); hidden items and branching paths still wait for quest design. Tuning left: reckless doubles deaths only on perilous work; injuries per death ~2.5–5 on composed contracts (target ~5).

## Open questions

- Reference party for PLAN §4c targets: settled, a well-built party with the sample party as reference (D-137).
- Permissions (from the PR #3 review): tighten the allow list (`cat`/`grep`/`find` can read `.env`; `git branch:*` allows `-D`; `find:*` allows `-delete`) and widen the force-push ask rules (`-fu`, `origin +main`, `git -C`)? Owner to decide; see D-096 limits.
- Kingdom map art direction continues past §12 (D-097): Story-Generator layout as the artist's base; the workshop now includes a geography review (D-144: sensible rivers and roads, towns placed for a reason with specialties, another major city, wild-country outposts).
- Mobile (owner's exploration, 2026-10-27, not decided; D-106 stands): four concepts with hour estimates in `docs/design/mockups/mobile-concepts.html`, published https://claude.ai/artifact/KxXfHZgDhsJTcTnq3kxW7k. Round two, seven wilder ideas (letters-first satchel, ask-the-clerk questions, pull-to-continue scroll, guildhall cutaway, living map, card war table, real-time away mode): `mobile-concepts-2.html`, https://claude.ai/artifact/6in94czL2ZTYgis85bHo9z. Owner's note (2026-10-27): likes the recommended mix (satchel, clerk, pull to continue) with the guildhall and the living map added; round three `mobile-hall-and-road.html`, https://claude.ai/artifact/YRv2tQgoAtvK2vz1aZ8fU6 (the mix plus four variations: one long zoom, upstairs/downstairs split, open book landscape, morning briefing). Proposed, not approved. Round four, owner's direction: Satchel becomes a work desk (notices, contracts, overview stats, full roster); the hall is the hub and each room has its own job (barracks for members, infirmary, armoury, strongroom…): `mobile-hall-desk.html`, https://claude.ai/artifact/5HsQ7krT9epLXSWZmEA6mA. Session's recommendation: tablet desk after launch, portrait phone only on sales; two cheap habits now (tap for every hover breakdown, no fixed 1366 px layouts) await the owner.
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
