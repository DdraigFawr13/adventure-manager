# Handoff

Updated: 2026-10-27 (end of the eighth session; PR #32 merged, 3393c0f). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted). Mobile first since D-150: phones lead, Windows after launch.

## Just done

- 2026-10-27 Guild house and home town designed with the owner (D-168–D-185): stacked floors 3 cells wide plus a side-on compound (gate, training yard, works yard, forge outdoors), rooms with 3 levels, capacity and upkeep, incidents as letters, no bed no signing, a top-down home town of 5 patronage sites. Mock-up: https://claude.ai/artifact/D57ueUj99aC7vVxZX9hMLU. PRs #25–#27.
- 2026-10-27 House in the engine and simulator (PRs #28–#30): `packages/engine/src/house/` (build, upgrade, extend, upkeep, beds, sickbeds, training at home), patron grace years in `career/year.ts` (D-189), founding draft in `guild/founding.ts` (D-188). Specs: `house/SPEC.md`, `career/SPEC.md`, `guild/SPEC.md` "Founding draft". Content: `packages/content/src/base/{house,founding}.ts`; every number there is an assumption labelled with what was measured.
- Owner's redirects on the way: a small start of one party and backups, training at home in the yard at 1.5× / 0.75× (D-187); a founding draft of 3 parties (seasoned, balanced, green) and 2–3 extras paid from one purse (D-188); two grace years with growth goals (D-189).
- Measured (100 careers × 26 years): with the house and the draft, 13% / 14% / 15% of guildmasters dismissed (seasoned / balanced / green party; house off 10%); full house 8.8 years of a mid guild's surplus (target 8–12, D-172); room upkeep 18% of late spending (target ~20%, D-185); training at home 2 points a year vs 7 from quests. Detail and the steps that led here: `docs/archive/handoff-2026-10.md`.
- Commands: house off `node tools/career-sim.ts 100 26`; house on `node tools/career-sim.ts 100 26 default off 7 take on`; compare the starter parties `... take on compare`. House-off output must stay identical to `main` (check in a worktree with its own `node_modules/@adventure-manager` links, AGENTS.md).
- Reviews: https://claude.ai/artifact/Gm2WTumUpttUiRtBEbahTj (house v0), https://claude.ai/artifact/473b8znpxVrmx7uzGk9DVa (pass 2), https://claude.ai/artifact/BL72riXfqVmzUkobsdH6BZ (founding draft).

- 2026-10-27 Incidents (D-190–D-193): an unpaid inn fee is debt; neglect = low level + debt (+ full rooms); fire, break-in, sickness as letters with a paid answer and a free default; repairs after a fire cost half and may go into debt (the simulator showed burnt barracks trapping indebted guilds: 24% dismissed, now 12–16%). Engine: `house/house.ts` (rolls, letters, lodgers' inn fee, `house.repair`); content `baseIncidentRules`; measured 1.24 incidents a year, 12% dismissed (14% without), full house year 13 (12 without). Run: `node tools/career-sim.ts 100 26 default off 7 take on balanced on`.

## Next

1. House incidents follow-ups (D-173, merged in PR #32): the owner hasn't confirmed the incident numbers; sickness is rare (0.07 a year) because the barracks is seldom full after year 1; the inn fee is one number until the town's inn is in the engine. Review: https://claude.ai/artifact/RGLFzTRbGgAbMmFmZJ6wZ9.
   Also open from this work: compare D-187's total growth with house off (its aim is "near today's"); measure the green party's long-run payoff (D-188); the owner hasn't confirmed the draft's purse and fee numbers; the town sites (D-171, D-179, D-184) are designed but not in the engine.
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
