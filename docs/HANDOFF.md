# Handoff

Updated: 2026-11-05 (twenty-first session: S2 delve mock-up approved, D-232). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Replanned on 2026-11-05: the owner approved a plan of fun gates in place of milestones M1–M7 (final page https://claude.ai/artifact/2cm2Vq1AVd8tUNBDEHSnLX). Its decisions are D-213 (gates), D-214 (gate contents), D-215 (fights), D-216 (managing) and D-217 (art sharing), merged as PR #43. The game is for the owner to love first; launch is decided at gate 4. About 30–40 h a week.

## Plan map

- ✔ Concept, style, first plan (D-045, D-061, D-115)
- ✔ M1 prototypes so far: engine, year simulator, balance runner, phone map, text prototype (kept)
- ✔ Art style: hand-painted stylised, first prototype art (D-211, D-212, PR #42)
- ✔ Replan approved and recorded (D-213–D-217, PR #43)
- ▶ Gate 0, design: ✔ fight (D-218–D-220); ✔ gear and budget (D-221–D-223); ✔ mock-ups (D-224, D-225, PR #46); ✔ gate 1 spec (D-226–D-230, PR #47)
- ▶ Gate 1: ✔ S1 one fight (D-231, PR #48); ▶ S2 one delve: ✔ mock-up (D-232); ▶ the build (engine, balance, page done; branch review running), then the owner's playtest
- ○ Gate 1, the rest: recruit, equip, budget, map trip, delve, fights the owner plays, letter home. Passes when after 3 delves the owner wants a 4th
- ○ Gate 2, one season · ○ Gate 3, one year · ○ Gate 4, launch decision

## Just done

- 2026-11-05 S2 page built (commit 9c88571): start card with approach, choice rooms, room card, breather, scout and rows, Auto every 600 ms, Retreat card, delve end; `play-shot delve` plays a whole delve on Auto (ok, no console errors). Baselines `delve-careful` and `delve-auto` saved (ec4b2ae); career baselines unchanged (classic 20 of 20 identical). Known: 5-foe rooms overlap intent marks (D-225 crowding).
- 2026-11-05 S2 engine on `s2-delve-mockup` (commit 22460dc): rooms, choices, scout and rows, breather, Auto, retreat, loot; tests `delve-rooms`, `delve-auto`; balance runner delve mode (`delve-careful`, `delve-auto`, `--compare-policy`). Tuned: bleed 3,000 → 1,095 bp, warden health 40 → 34; careful loses a life in 9.9% [8.1–11.8] of 1,000 delves (spec band 8–12, ok). Auto vs careful (paired): win rate +17.1 points [14.1–20.0] NOT MET (Auto never retreats), less health −8.6 ok, more skill uses left +4.1 (reported); the owner's call.
- 2026-11-05 S2 mock-up approved (D-232, all Proposed items included) on branch `s2-delve-mockup`: `docs/design/mockups/delve-screens.html`, published https://claude.ai/artifact/2Gu4qWixkZLkPfU2oN1Jn3 (12 frames: start card, choice room, room card, breather, scout seen and heard, Auto, Retreat, won, retreated, routed, 443 px). Fresh check 1 major, 5 minor, all fixed (109,037 tokens). Proposed, for the owner: an approach picker on the start card, the room count on the track, off guard on either entry way, the Retreat confirm, the barrow room words.
- 2026-11-05 S1 merged as PR #48: the barrow fight plays to the end at `/play.html`, saves after every command, reload repeats the fight. Branch review 2 major, 10 minor, all fixed (https://claude.ai/artifact/HsxCeJogF6iDDYV19z4ogP). Random legal play won 300 of 300 sample fights in 4.1 rounds on average (one room; balance is S2).
- 2026-11-05 S1 fit check approved (D-231): layout C fits 375 × 667 (stage 327 px); fresh check 3 major, 7 minor, fixed.
- 2026-11-05 Gate 1 spec approved (D-230, https://claude.ai/artifact/7V4yjafsYVxhL7YhXyv26A): `docs/specs/gate1-one-delve.md`, 6 slices (fight, delve, loop, gear, money, art), a playtest stop after slice 2, D-218 amended (stored streams). Answers D-226–D-229 from the spec questions https://claude.ai/artifact/GSbKtp9CWP54BN3pAQfUtQ. Fresh checks: about 100 findings fixed, 1 contested, 2 escalated (LESSONS). Branch review 3 major, 6 minor, 8 fixed (https://claude.ai/artifact/NLtErQLHKdHDQ7ggC2M7b6). Merged as PR #47.
- 2026-11-05 Owner approved the mock-ups (D-224), asked for battle art (334 OpenArt credits approved and spent; 6 standees and a backdrop in `docs/design/art/`; OpenArt spend 1,858 in all), then for a side-on fight on the place's own ground: three layouts https://claude.ai/artifact/7nLcwmrQfciWm5pAfNF3W7, chose C (D-225; open notes: scene feel, crowding). Branch review: 2 major, 3 minor, all fixed (https://claude.ai/artifact/MVin2uAh7QVxTHpNznWju9). Merged as PR #46.

## Next

1. Slice S2 (one delve): fix the independent branch review's findings, publish the review page, ask the owner's approval, then the PR (D-133) on branch `s2-delve-mockup`; built to D-232's page per the spec (rooms, Auto, retreat, loot, balance scenarios `delve-careful` and `delve-auto`). After S2, stop for the owner's playtest (D-230). Watch: S1's single fight is easy (random play won 300/300); balance is S2's job.
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
