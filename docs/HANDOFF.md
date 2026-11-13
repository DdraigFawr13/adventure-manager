# Handoff

Updated: 2026-11-05 (twenty-first session: S2 one delve merged as PR #49; the owner's playtest is next). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Replanned on 2026-11-05: the owner approved a plan of fun gates in place of milestones M1–M7 (final page https://claude.ai/artifact/2cm2Vq1AVd8tUNBDEHSnLX). Its decisions are D-213 (gates), D-214 (gate contents), D-215 (fights), D-216 (managing) and D-217 (art sharing), merged as PR #43. The game is for the owner to love first; launch is decided at gate 4. About 30–40 h a week.

## Plan map

- ✔ Concept, style, first plan (D-045, D-061, D-115)
- ✔ M1 prototypes so far: engine, year simulator, balance runner, phone map, text prototype (kept)
- ✔ Art style: hand-painted stylised, first prototype art (D-211, D-212, PR #42)
- ✔ Replan approved and recorded (D-213–D-217, PR #43)
- ▶ Gate 0, design: ✔ fight (D-218–D-220); ✔ gear and budget (D-221–D-223); ✔ mock-ups (D-224, D-225, PR #46); ✔ gate 1 spec (D-226–D-230, PR #47)
- ▶ Gate 1: ✔ S1 one fight (D-231, PR #48); ✔ S2 one delve (D-232, D-233, PR #49); ▶ the owner's barrow playtest (D-230)
- ○ Gate 1, the rest: recruit, equip, budget, map trip, delve, fights the owner plays, letter home. Passes when after 3 delves the owner wants a 4th
- ○ Gate 2, one season · ○ Gate 3, one year · ○ Gate 4, launch decision

## Just done

- 2026-11-05 S2 merged as PR #49 (CI green): a whole Hollow Barrow delve at `/play.html`. Owner approved with D-233: Auto's win-rate gap (93.2% vs careful 76.1%, Auto never retreats) is judged in the playtest.
- Earlier: [November archive](archive/handoff-2026-11.md).

## Next

1. The owner's playtest (D-230): the owner plays a few barrow delves at `/play.html` on the phone and says whether the fights are fun and how Auto feels (D-233); record the verdict in DECISIONS in their words. Then slice S3 (the loop) in a fresh session from `main`, starting with its mock-ups if it changes screens. Open from S2: the "rose with 3 health" note is lost on reload; 5-foe rooms crowd the intent marks (S6).
2. Art: any more OpenArt spend needs a new approval with an exact quote, references included (LESSONS). The repo is public; OpenArt Starter images are non-commercial only. The engine test verdict (60 fps, 15 px, screen reader; D-154) is still the owner's to record.

## Open questions

- Permissions (PR #3 review, D-096): tighten the allow list and widen the force-push ask rules? Owner to decide. Since v4.6.0 the synced guards ask on reads of `.env` (`grep`, Read) and on `find … -delete`; `git branch:*` allowing `-D` is still open. (The dead `npm run lint` entry was swapped for `npm run format:check` and `npm run boundaries`, owner's approval 2026-10-27.)
- Network policy (measured, D-167): `api.vercel.com` and `dl.google.com` are blocked here, so no Vercel CLI deploys and no Android SDK in sessions; the owner's setting, not needed while Vercel builds from GitHub.
- Mobile first (D-150): the phone sources for the §1d measures, and the phone versions of the Steam store page, wishlists, playtest recruiting and Early Access (D-099, D-100, D-113). Open too: the tablet layout. The test laptop in the budget (PLAN §14) may no longer be needed before launch.
- Engine findings from R4, for the owner: two people can get the same full name (`packages/engine/src/guild/people.ts:68` draws given and family names independently; seed phone-2 has two Ash Thornes); at week 23 of seed phone-1, 23 of 30 members rest from wounds (maybe balance).
- Kingdom map art direction (D-097, D-144): the game's own map keeps its look with detail in code (D-212); geography review in the workshop.
- Fight scene feel (D-225: "it still doesn't feel like they exist in the scene"): side-on ground art and lit standees are Proposed, for S6 (crowding settled by D-231).
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
