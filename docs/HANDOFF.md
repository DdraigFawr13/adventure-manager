# Handoff

Updated: 2026-11-05 (seventeenth session: gate 0 gear and budget design approved, D-221–D-223, on branch `ccr-758acb64-phgf36`, PR pending). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Replanned on 2026-11-05: the owner approved a plan of fun gates in place of milestones M1–M7 (final page https://claude.ai/artifact/2cm2Vq1AVd8tUNBDEHSnLX). Its decisions are D-213 (gates), D-214 (gate contents), D-215 (fights), D-216 (managing) and D-217 (art sharing), merged as PR #43. The game is for the owner to love first; launch is decided at gate 4. About 30–40 h a week.

## Plan map

- ✔ Concept, style, first plan (D-045, D-061, D-115)
- ✔ M1 prototypes so far: engine, year simulator, balance runner, phone map, text prototype (kept)
- ✔ Art style: hand-painted stylised, first prototype art (D-211, D-212, PR #42)
- ✔ Replan approved and recorded (D-213–D-217, PR #43)
- ▶ Gate 0, design: ✔ fight (D-218–D-220); ✔ gear and budget (D-221–D-223); next mock-ups, gate 1 spec
- ○ Gate 1, one delve: recruit, equip, budget, map trip, delve, fights the owner plays, letter home. Passes when after 3 delves the owner wants a 4th
- ○ Gate 2, one season · ○ Gate 3, one year · ○ Gate 4, launch decision

## Just done

- 2026-11-05 Gate 0 gear and budget design with `planning-interview`: round 1 https://claude.ai/artifact/Y4NMUNQ1HjGweJwRqGPW9d, review (independent reviewer plus mine, 16 findings, all agreed) https://claude.ai/artifact/VPo1C9L6oJNiyhs2VviDNE, final https://claude.ai/artifact/LoL5etsdMnPxiiGV98SJSJ ("Approved, record it"). Recorded as D-221 (6 rarities, gate 1 has 3; flat-point steps; armour limits; smith, loot, monster parts), D-222 (patron stipend, small chest, 3 pots that keep, party pack) and D-223 (drills in the refit week, quartermaster and gear wear in gate 2).
- 2026-11-05 Gate 0 fight design with `planning-interview`: round 1 https://claude.ai/artifact/Ue2py2SaEcL55hMvSvwKb6, review (independent reviewer plus mine, 13 findings, all agreed) https://claude.ai/artifact/RVbyTb6kSVEpvq8baBBTwe, final https://claude.ai/artifact/7gRt8zLurycatygdqtviLn ("Approved, record it"). Recorded as D-218 (board, health pool, rows, foes flee, no round limit), D-219 (plain attack plus 2 class skills at 3 uses a delve, kits, wizard, 2 item kinds) and D-220 (Auto, Tactics, gate 2 list incl. the owner's costly revive). Review: 8 minor findings, all fixed (https://claude.ai/artifact/NSKgytzWyKxhD5GqHca8vj). Merged as PR #44.
- 2026-11-05 Art pass merged as PR #42 (owner approved; docs-only, CI skipped by design): hand-painted stylised illustrations (D-211), keep/redo verdict (D-212), 9 prototype images and their ledger in `docs/design/art/`. Two reviews: https://claude.ai/artifact/1nPhE5RQiuSggAGzoHXMvU. OpenArt spend 1,524 credits in all (balance 3,345 → 1,821); detail in `docs/archive/handoff-2026-11.md`.

## Next

1. PR for D-221–D-223: the owner approves after the review is shown (D-133); then merge when CI is green (docs-only, CI skips).
2. Mock-ups (`ui-mockups`) of the fight, party-and-gear (cards, compare), smith and budget (3 pots, money line) screens; before the first use, STYLE.md needs `Minimum text`, `Minimum tap` and `Where facts live` lines (15 px, D-166; 44 px, D-167). Fight screen: 4 adventurers and up to 5 foes in portrait, turn strip, intents, odds (D-218).
3. The gate 1 spec (`write-spec`), the fight first: it rewrites today's fight engine (`packages/engine/src/resolution/SPEC.md`) to per-actor turns, a health pool, single foes and per-delve uses; the rogue's and wizard's plain attacks and Tactics' bonus size are set there; the balance runner measures Auto against led play (D-220). The gear and money starting numbers (rarity steps, prices, stipend, starting chest, weekly sum, drill bonus; D-221–D-223) are set there too, measured by the balance runner. Also settle there: what "most of the band" means for fleeing with single tokens and the boss, and whether the breather helps Dying allies (D-218).
4. Map: subtle painted detail on `/map.html` in code (D-212), mock-up first. The engine test verdict (60 fps, 15 px, screen reader; D-154) is still the owner's to record.
5. Art: the kept pieces go into the prototype pages in gate 1. Any more OpenArt spend needs a new approval with an exact quote, references included (LESSONS). The repo is public; OpenArt Starter images are non-commercial only.

## Open questions

- Permissions (PR #3 review, D-096): tighten the allow list and widen the force-push ask rules? Owner to decide. Since v4.6.0 the synced guards ask on reads of `.env` (`grep`, Read) and on `find … -delete`; `git branch:*` allowing `-D` is still open. (The dead `npm run lint` entry was swapped for `npm run format:check` and `npm run boundaries`, owner's approval 2026-10-27.)
- Network policy (measured, D-167): `api.vercel.com` and `dl.google.com` are blocked here, so no Vercel CLI deploys and no Android SDK in sessions; the owner's setting, not needed while Vercel builds from GitHub.
- Mobile first (D-150): the phone sources for the §1d measures, and the phone versions of the Steam store page, wishlists, playtest recruiting and Early Access (D-099, D-100, D-113). Open too: the tablet layout. The test laptop in the budget (PLAN §14) may no longer be needed before launch.
- Engine findings from R4, for the owner: two people can get the same full name (`packages/engine/src/guild/people.ts:68` draws given and family names independently; seed phone-2 has two Ash Thornes); at week 23 of seed phone-1, 23 of 30 members rest from wounds (maybe balance).
- Kingdom map art direction (D-097, D-144): the game's own map keeps its look with detail in code (D-212); geography review in the workshop.
- Later, tier not set: 20 class levels (D-074); intrigue (D-069); exploring the wilds (D-136); bardic songs (D-056).

## Working style with the owner

- The owner is in Pacific time (America/Los_Angeles). Base every date, time, "today" and "tomorrow" on Pacific time, never on the container's UTC clock: check with `TZ=America/Los_Angeles date` before scheduling or naming a day (got wrong twice; 2026-11-05 a task was set a day late).
- End the session after each merged PR or finished plan section; the next one starts here (D-095).
- PRs (D-133): independent adversarial review of the whole branch diff, its findings and fixes published as an artifact and linked, then the owner's approval, then create the PR; merge it yourself once CI is green. Commits after approval need a new review and approval. Handoff and roadmap-only commits go straight to `main` (D-194).
- Every session updates and republishes `docs/roadmap.html` to https://claude.ai/artifact/FTio9mE7jLaK4Wrn189YAg (D-128); read the live artifact first, then publish with its `url`.
- Ask one question at a time as a popup (AskUserQuestion) with a recommendation and room for notes; record each answer in the design doc and DECISIONS.md immediately. "[No preference]" means skipped, not approved; show long content in chat, not only in option previews.
- The owner often combines or extends options in the notes ("B but with more fantasy flair"); record their words as an owner's note and treat unselected extras as Proposed until approved.
- Show visual choices as HTML mock-ups (published as artifacts, source in `docs/design/mockups/`); screenshot with Playwright and check before publishing.
- Engage critically (WS-04); verify claims (e.g. measured tabular digits) rather than assume.
