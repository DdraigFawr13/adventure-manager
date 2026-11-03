# Handoff

Updated: 2026-11-03 (fourteenth session: combat brainstorm D-207–D-210, PR #40 merged). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted). Mobile first since D-150: phones lead, Windows after launch.

## Just done

- 2026-11-03 Master PR #78 merged (8a63ad4): `--check` notes a newer master release (master D-059). Morgan tagged `v4.8.0`; the game bumped to it the same day.
- 2026-11-03 AI-Master-Instructions upgraded v4.3.0 → v4.7.0 (sync reported 14 changes): adds the `brainstorm`, `ui-style` and `ui-mockups` skills, wider guard hooks, CI-07 (schedule your own CI check after pushing). Older merged entries (PRs #35–#38) moved to `docs/archive/handoff-2026-10.md`.
- 2026-11-03 Combat and fun brainstorm: https://claude.ai/artifact/NiWZ2Tg3yYcgxym1GJ3tDA. Owner chose the direction (D-207): turn-based orders in the main fight, foe intents, delves room by room; per-adventurer turns or grid tactics only if playtests call for them. Of the eight non-combat ideas, the owner picked four to plan (D-208): nemeses, personal quests, growing map threats, storied gear; the rest stay Proposed. Round 2 (same page): two idea clusters and five more picks (D-209), clients who lie now and three later (D-210). Merged (PR #40).
- 2026-10-27 R7 round 1 (D-203): the owner played and gave notes, no report: letters stale and disjointed, people impersonal, jumping through time boring, nothing punchy. Not passed; the page isn't tuned now. Owner's choice: time runs in real time with pause at 2–3 speeds and still stops itself for what needs the player (D-204, amends D-009).

## Next

1. Plan D-207's fights and delve with the owner (planning-interview forms), then prototype one fight on the watched-quest page (D-127) and judge the punch before building the delve. Plan D-208/D-209's ideas alongside as two clusters, a living threat and a life on the road, plus clients who lie as a contract twist (D-210); mentors, the rival race and trouble in town later (D-210); storied gear in the gear workshop (D-143).
2. Engine test verdict (D-110, D-154, D-167): the owner opens `/map.html` on their phone and judges 60 fps pinch and pan, 15 px text and a screen reader; record the verdict. Known gaps: the atlas's own lettering (title, scale) isn't enlarged; map.js 710 KB.
3. Letters, people and real time (D-203, D-204): what would make letters and people vivid (owner: "we will flesh that out"), and the step 4 page on a real-time clock with the map; design with the owner before building. R7 reruns after.
4. Open from house work: the inn fee is one number until the town's inn is in the engine; town sites (D-171, D-179, D-184) designed but not in the engine; draft fees unconfirmed (purse confirmed, D-205).
5. Gear (D-143): workshop with the owner before the year simulator uses gear.
6. R1 notes (D-132): hidden items and branching paths wait for quest design. Tuning left: reckless doubles deaths only on perilous work; injuries per death ~2.5–5 on composed contracts (target ~5).
7. Master follow-up: before the first `ui-mockups` use, STYLE.md needs `Minimum text`, `Minimum tap` and `Where facts live` lines (15 px, D-166; 44 px, D-167), else the skill asks once; mock-ups stay in `docs/design/mockups/` with `tools/mockup-shot.mjs`.

## Open questions

- Permissions (PR #3 review, D-096): tighten the allow list and widen the force-push ask rules? Owner to decide. Since v4.6.0 the synced guards ask on reads of `.env` (`grep`, Read) and on `find … -delete`; `git branch:*` allowing `-D` is still open. (The dead `npm run lint` entry was swapped for `npm run format:check` and `npm run boundaries`, owner's approval 2026-10-27.)
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
