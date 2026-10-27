# Handoff

Updated: 2026-10-27 (end of the thirteenth session; PR #38 merged, 51914d3). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted). Mobile first since D-150: phones lead, Windows after launch.

## Just done

- 2026-10-27 Step 4 page built and merged (PR #35), the Vercel root (D-200; Quest Watch at `/quest-watch.html`): `packages/ui/src/step4/` (`game.ts` save, default house player copied from `tools/year-sim-play.ts`, letters; `Step4.tsx` screens; `report.ts` Copy report), words `packages/content/data/step4.en.json`. Continue waits for memorial, incident and patron letters, not signing letters (D-201, owner). Tested: a two-year game and a save round trip (`packages/ui/test/step4.test.ts`); a scripted Playwright player tapped two years through the built page at iPhone size. Review: https://claude.ai/artifact/DDUycPaXb31Jg95UmVsWhi.
- 2026-10-27 Fresh-eyes review of the project for the owner (chat only), then PR #36: the step 4 page's fonts are separate WOFF2 files (app.css 703 kB to 6 kB; fonts 222 kB, cached across deploys) and `@adventure-manager/content` is `sideEffects: false` (app.js 435 to 402 kB); PLAN.md's 17 "Amended"/"Under review" notes folded into text that states the mobile-first plan, no decision changed. Review: https://claude.ai/artifact/4NuijA2Zswcgphok17GDLW. Still noticed: duplicate full names should be fixed before R7 (Open questions).

- 2026-10-27 Balance runner (D-202, owner's request after a review of the test and balance pipelines): `tools/balance/` with named scenarios, targets with 95% intervals over seeds, `--set`/`--sweep` content overrides in memory, and baselines stored as whole careers (`tools/balance/baselines/`) that `--compare` pairs seed by seed, so no worktree run of `main` is needed. Measured: a baseline check 43–51 s vs 72–88 s before; a 3-value sweep 29 s in one command vs ~46 s and 3 edits; pairing narrows intervals by up to a third. Found: the incidents' "12% dismissed (14% without)" is inside the noise (change −2 points, interval −8 to +4); their effect on bad starts is real (+9 points, +2 to +16). Merged (PR #37). Not built (proposed): CI balance smoke check, HTML report. Review (12 findings, all handled): https://claude.ai/artifact/MXjknbR9dTmk2ZXvExgi5M.
- 2026-10-27 R7 round 1 (D-203): the owner played and gave notes, no report: letters stale and disjointed, people impersonal, jumping through time boring, nothing punchy. Not passed; the page isn't tuned now. Owner's choice: time runs in real time with pause at 2–3 speeds and still stops itself for what needs the player (D-204, amends D-009).
- 2026-10-27 House follow-ups merged (PR #38): founding purse 50,000 and the simulated house reserve 24 weeks (D-205; grants 81 → 47 of 100 careers, owner asked for about half; step 4 page's copy also 24); sickness strikes a barracks 3/4 full at 110 bp (D-206; 0.26 a year, 1.47 incidents in all); growth with the house +20% over house off, kept (D-187 amended); green party now pays off (most growth, same chest at year 10, 7% dismissed). House baselines re-saved; classic identical.
- 2026-10-27 Phone map engine test merged (PR #38) at `/map.html` on the Vercel link (branch preview: https://adventure-manager-git-ccr-3c6ea6-golden-goose-engineering-group.vercel.app/map.html): `packages/ui/src/engine-test/phone/`, pinch and pan, tappable marks with a pop-up and placeholder picture, clock with Play/Pause and 1×/2×/4×, auto-stop letters with the camera on the party, frame-rate panel. Container fps 3–28 (software rendering, a floor). Review (13 findings, 11 fixed, 2 kept): https://claude.ai/artifact/N58z9eZ3wJnxNwLDT84Zp6.

## Next

1. Engine test verdict (D-110, D-154, D-167): the owner opens `/map.html` on their phone and judges 60 fps pinch and pan, 15 px text and a screen reader; record the verdict. Known gaps: the atlas's own lettering (title, scale) isn't enlarged; map.js 710 KB.
2. Letters, people and real time (D-203, D-204): what would make letters and people vivid (owner: "we will flesh that out"), and the step 4 page on a real-time clock with the map; design with the owner before building. R7 reruns after.
3. Open from house work: the inn fee is one number until the town's inn is in the engine; town sites (D-171, D-179, D-184) designed but not in the engine; draft fees unconfirmed (purse confirmed, D-205).
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
- PRs (D-133): independent adversarial review of the whole branch diff, its findings and fixes published as an artifact and linked, then the owner's approval, then create the PR; merge it yourself once CI is green. Commits after approval need a new review and approval. Handoff and roadmap-only commits go straight to `main` (D-194).
- Every session updates and republishes `docs/roadmap.html` to https://claude.ai/artifact/FTio9mE7jLaK4Wrn189YAg (D-128); read the live artifact first, then publish with its `url`.
- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
