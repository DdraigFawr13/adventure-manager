# Handoff

Updated: 2026-10-27. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Build, milestone M1 (prototypes). Design phases done: concept (D-045), style (D-061), plan approved 2026-10-26 (M0, D-115) with the plan review's decisions (D-108..D-114). Plan: `docs/design/PLAN.md`; game code may now start (D-001 lifted). Mobile first since D-150: phones lead, Windows after launch.

## Just done

- 2026-10-27 PR #20 merged (7b29e15): planning round D-159–D-161, repo audit fixes, phone R4 test, D-162–D-164; four reviews, 41 findings, 34 fixed, 7 kept (https://claude.ai/artifact/UTo26LBwZBfbtNh17GjYjb). Detail: `docs/archive/handoff-2026-10.md` and the PR.
- 2026-10-27 R4 passes (D-165): round 2 on the owner's phone, 5 of 5 under 10 s (8.9, 8.0, 9.8, 5.8, 6.1 s), via Find and the desk's Money page. Round 1 had failed (0 of 5). Test page: https://claude.ai/artifact/PkKz6nGhVqJ4Fr8Fz89MMX. Merged as PR #22.
- 2026-10-27 R5 passes (D-166): the owner read the 15 px text with lining figures comfortably on their phone. This branch, restarted from `main` a40cd8f, records it; waits on review and the owner's approval (D-133).

## Next

1. Tools and skills reassessment for mobile first (D-161), before step 4: phone screenshots and touch checks, Vercel Hobby previews, the phone wrapper choice (needs SAFE-03 approval; D-117 approved only Electron).
2. Step 4, the two-year text prototype (R7) as a phone-first web page (D-160), with histories and memorial letters; standing parties (D-014, D-142) join here.
3. Engine test verdict (D-110, D-154): rebuild the engine test as a phone app; the owner judges it on their phone (60 fps map with smooth pinch, 15 px text, screen reader). The map is free pan and zoom with tappable towns, places, parties and events opening a pop-up with details and a placeholder image (D-164).
4. Gear (D-143): workshop with the owner before the year simulator uses gear.
5. R1 notes (D-132): hidden items and branching paths wait for quest design. Tuning left: reckless doubles deaths only on perilous work; injuries per death ~2.5–5 on composed contracts (target ~5).

## Open questions

- Permissions (PR #3 review, D-096): tighten the allow list (`cat`/`grep`/`find` can read `.env`; `git branch:*` allows `-D`; `find:*` allows `-delete`) and widen the force-push ask rules? Owner to decide. (The dead `npm run lint` entry was swapped for `npm run format:check` and `npm run boundaries`, owner's approval 2026-10-27.)
- Mobile first (D-150): the phone sources for the §1d measures, and the phone versions of the Steam store page, wishlists, playtest recruiting and Early Access (D-099, D-100, D-113). Open too: the tablet layout. The test laptop in the budget (PLAN §14) may no longer be needed before launch.
- Engine findings from R4, for the owner: two people can get the same full name (`packages/engine/src/guild/people.ts:68` draws given and family names independently; seed phone-2 has two Ash Thornes); at week 23 of seed phone-1, 23 of 30 members rest from wounds (maybe balance).
- Kingdom map art direction (D-097, D-144): Story-Generator layout as the base; geography review in the workshop.
- Later, tier not set: 20 class levels (D-074); facility compound (D-075); intrigue (D-069); exploring the wilds (D-136); quest board flair (STYLE §4); bardic songs (D-056).

## Working style with the owner

- End the session after each merged PR or finished plan section; the next one starts here (D-095).
- PRs (D-133): independent adversarial review of the whole branch diff, its findings and fixes published as an artifact and linked, then the owner's approval, then create the PR; merge it yourself once CI is green. Commits after approval need a new review and approval.
- Every session updates and republishes `docs/roadmap.html` to https://claude.ai/artifact/FTio9mE7jLaK4Wrn189YAg (D-128); read the live artifact first, then publish with its `url`.
- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
