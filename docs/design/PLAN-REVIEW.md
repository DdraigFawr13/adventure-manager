# Plan review: lean design, fun, codebase, standards

Owner's request (2026-10-26): review the whole plan for efficient lean design, the gameplay loop and fun, codebase set-up that avoids missteps, and standards and practices. Method: two independent reviewers (D-107) read the docs cold, one for fun and one for lean production; the main session reviewed codebase and standards. Every finding below was checked at the cited line; three reviewer claims were corrected or dropped (end of page). Nothing here is decided: each item is a **proposal** for the owner (SRC-04).

Impact: **High** changes what gets built or risks the project; **Medium** shapes it; **Low** is tidy-up.

## Verdict

The plan holds together well: event log as the spine, determinism, content as data, gated milestones, and art money waiting for proof are all sound and lean. Budget and schedule arithmetic reconcile. The weak spots are (1) the plan is sized for a small team but the owner chose solo, (2) the heart of the game, how a quest actually resolves, is not designed yet, (3) the mid and late game have no fresh goals and a cheap dominant strategy is possible, and (4) four engine foundations that are cheap now and very expensive later are not written down.

## Top 10 actions (proposed, in order)

1. **Re-plan for solo** (L1, L2): restate the timeline for a solo builder and adopt a smaller launch cut, keeping everything as data so it grows after.
2. **Write "resolution v0"** (F1): half a page on how party, plan, stats and site become events and odds; first M1 deliverable.
3. **Keep the simulation core** (L3): build it as the production engine package from day one; only prototype screens are throwaway.
4. **Settle the engine with less work** (L3): new evidence (Story-Generator is TypeScript and canvas) favours web; build Godot only if the web ledger or map test fails.
5. **Four engine foundations in §11** (C1–C4): values that carry their own breakdown and cause; named random streams kept in the state; a command log for replaying any bug; an event-log retention rule.
6. **Price every safe choice** (F2, F5): make caution, delegation and skipping winter cost something visible, and test it in the headless simulator.
7. **Give years 10–30 goals** (F3, F6): mid-career goals and a world-events and crises budget in §7.
8. **Kill and cut triggers, owner hours** (L4): write weekly hours down; set slip triggers that apply the cut list; define "stop".
9. **Marketing and tester plan** (L5): wishlist targets per gate; where the 30–50 and 200+ testers come from.
10. **A short standards file before the first line of code** (S1): conventions, boundaries enforced by lint, definition of done.

## 1. Lean scope and production

- **L1 · High · The schedule is for a small team; the owner chose solo.** `PLAN.md:769` "Durations are estimates (REP-01) for a small team"; `PLAN.md:819` code "written with AI help"; D-102 came after §13. The 18–28 months has no solo version. Proposal: restate per milestone for one person with AI help, and say what weekly hours it assumes.
- **L2 · High · No minimum-lovable cut, and the costliest items for their fun are all at launch.** For example `PLAN.md:443` "multiclassing between any two classes from level 5", `PLAN.md:466` "Rival guilds: 17 ... each authored", `PLAN.md:470` "Tournaments: 3", `PLAN.md:452` about 100 traits, `PLAN.md:451` "Attributes: about 28". §12c's "ways to bring it down" (`PLAN.md:741`) names mostly art. Proposal (reviewer's, endorsed): 5–6 classes, 4 ancestries, ~24 monster kinds, ~16 attributes, ~30 traits, ~6 authored rivals plus generated ones, 1 tournament, no multiclass or prestige at launch, 3 map layers. Keep the watched quest, key moments, permadeath and Chronicle, succession, delegation and the map base. All of it stays data, so the cut grows back after launch.
- **L3 · High · M1 builds the simulation twice and the engine test first.** `PLAN.md:528` "A prototype is throwaway code"; `PLAN.md:779` M2 builds "The production engine". Proposal: the simulation core is the first production package (tested, kept); only prototype screens are thrown away. The two-engine test (D-090) builds two pieces twice; the Story-Generator review found TypeScript and canvas code to reuse (`PLAN.md:753`, recorded then as "evidence for D-090, not a decision"). Proposal: build the web versions; build in Godot only if the web ledger or map misses its bar. Reopening D-090 is the owner's call (WS-07: new evidence).
- **L4 · High · No stop rule, no cut triggers, no hours.** `PLAN.md:773` "go, loop or stop" never defines stop; `PLAN.md:869` "The owner's time is available at the pace the milestones assume" is the only mention of time. Proposal: write weekly hours down; time-box each M1 step; triggers such as "M1 over 6 months or M2 over 9 applies the L2 cut"; stop if R1 fails twice.
- **L5 · Medium · Marketing and testers are unplanned, yet break-even rests on them.** `PLAN.md:867` "Wishlists ... carry the launch"; no wishlist number anywhere (searched "wishlist" in PLAN). Testers: `PLAN.md:580` "200+ testers" with no source. Proposal: wishlist targets at slice, demo and launch; a devlog; a tester list grown from the Steam page.
- **L6 · Medium · The headless year simulator is nearly the whole game.** `PLAN.md:554` needs economy, recruitment, ageing, rivals, ladder and delegation. Proposal: start with one guild, no rivals and three classes; widen in steps.
- **L7 · Medium · No writing tools.** Tools list (`PLAN.md:644`) has no template previewer for ~6,000 lines. Proposal: a previewer that generates N outputs and counts repeats; decide who writes at the slice gate.
- **L8 · Medium · The full map base is commissioned before the region settles.** `PLAN.md:843` spends "the whole kingdom-map base" before the hire gate; balance changes in M1–M3 can move places. Proposal: commission the slice's corner and a sketch of the rest; the full base after alpha balance.
- **L9 · Low · Break-even covers cash only.** `PLAN.md:849`: excludes the owner's time, tax and post-launch work (war campaigns "need the most new engine code", `PLAN.md:799`). Proposal: say so in one line; add a post-launch support line.

## 2. Gameplay loop and fun

- **F1 · High · How a quest resolves is not designed.** `CONCEPT.md:33` says quests "simulate on their own"; no section in CONCEPT or PLAN turns party, plan, stats and site into odds and events. R1 (`PLAN.md:536`) tests whether watching is fun before the thing watched exists. Proposal: "resolution v0" as the first M1 deliverable, with tunable numbers in data.
- **F2 · High · Caution's price is not weighed.** `PLAN.md:308` "cautious retreat thresholds and good knowledge roughly halve them [deaths]". The cost exists (abandoned contracts lose fee and renown, `PLAN.md:273`) but is never set against halved deaths. If it is small, "always cautious" is the solved game. Proposal: an R2 check that cautious and bold play both win sometimes.
- **F3 · High · Progression runs out around year 10.** Top tier in 8–12 years (`PLAN.md:331`), full facilities in "8–12 years" (`PLAN.md:377`), guildmaster careers 20–30 years. Late pressure exists (`PLAN.md:334`) but no new goals. Proposal: mid-career goals (legacy projects, a larger ladder or compound pulled earlier, a region-scale threat).
- **F4 · High · The routine week has almost no decision.** `PLAN.md:106` "take or decline contracts, send a party with its saved plan, continue". If R1 fails, the loop is "approve, continue, read". Proposal: one standing tension most weeks (a deadline clash, a promise due, a rival bidding on the same contract); state the "one more week" hook.
- **F5 · Medium · Delegation is likely nearly free.** R6 passes at "10–25% better ... delegation never ruinous" (`PLAN.md:541`); the true cost (the guildmaster stops growing) is slow and unseen. Proposal: show the cost when delegating; give staff visible mistakes.
- **F6 · Medium · No world events or story arcs at launch.** `CONCEPT.md:49` promises "story arcs and world crises"; the §7 content list has none (searched "story arc", "crisis", "world event": only `PLAN.md:180` "seeded world events"). Proposal: a small crisis category in §7 (plague, war, a great beast).
- **F7 · Medium · Repetition across a long save.** About 750 quests over 25 years on 20 quest templates, and ~625 key moments on 60 (from `PLAN.md:86`, `:468`, `:469`); R8 tests only report wording. Proposal: combine site × monster × complication × faction state, and test shape repetition too.
- **F8 · Medium · Bad starts can spiral, with rubber-banding ruled out.** `PLAN.md:287` "two in a row means a loan or a sale"; `PLAN.md:280` "no hidden bonuses or rubber-banding". Proposal: visible recovery levers (patron emergency grant with strings, charity contracts, debt for service); test a "bad two years" seed set.
- **F9 · Medium · Winter: a quarter of the year, about a tenth of the play.** `PLAN.md:94` weeks 37–48, "~15 min", time-skip by default; wages keep running. It also lists "academy", which is not at launch (D-070). Proposal: make winter the planning season (budget, building, training plans) with a cash model in R2; drop "academy" from the line.
- **F10 · Medium · Only the mid guild is budgeted.** Friction and deaths are set for 3 parties (`PLAN.md:266`); a top guild runs 4–8 (`CONCEPT.md:189`). Proposal: a top-guild row in §2f and in R3.
- **F11 · Low · Thin first hour for veterans and little self-expression.** No guaranteed season-one story beat beyond the prologue; expression is mostly the charter. Proposal: one seeded early beat (a rival's poaching try); party names and banners.

## 3. Codebase set-up

- **C1 · High · Values that explain themselves need an engine type from day one.** `PLAN.md:414` "Hovering or focusing any number shows how it was made"; `PLAN.md:508` "Every change records its cause". §11 does not say how. Proposal: every game number is a value with its parts and a cause id, built into the core types before any rule; retrofitting it later touches every system.
- **C2 · High · Random numbers: one seed is not enough.** `PLAN.md:663` "A seeded generator ... passed in"; `PLAN.md:640` `simulate(state, command, seed)`. Proposal: named streams per system, derived from (seed, name), kept in the state, as Story-Generator does (`PLAN.md:749`). Then adding one roll in recruitment does not reshuffle every quest, so balance runs and bug replays stay comparable.
- **C3 · High · Replays for bug reports.** Determinism makes this almost free: playtest saves keep the commands since the last daily snapshot, so any tester's bug replays exactly on the developer's machine. Not in §11 or §15 (searched "replay", "command log"). For a solo developer this is the biggest time-saver available.
- **C4 · Medium · The event log grows without limit.** The log feeds Trace, histories and Chronicle (`PLAN.md:646`); saves must load in under 1 s at 30 years (`PLAN.md:687`). No retention rule (searched "retention", "compact"). Proposal: full detail for recent years, summaries for older ones, Chronicle-worthy events kept forever.
- **C5 · Medium · Package boundaries are described, not enforced.** Proposal: a lint rule that the engine imports nothing from ui or shell and never touches the clock or `Math.random`; a short AGENTS.md per package for AI coding sessions.
- **C6 · Medium · Text templates have no grammar yet.** No rules for variables, pronouns, plurals or conditional lines (searched "pronoun", "plural": none). Proposal: pick the template format before R8 writes lines; one schema source generates both validation and types.
- **C7 · Low · Screen-reader check was deferred to §11 and never done.** `PLAN.md:430` "(assumption to check in §11)". Proposal: add it to the engine test's judging list; the two engines differ here.
- **C8 · Low · UI labels as well as world text in string files** from day one, so translation (D-104) stays cheap.

## 4. Standards and practices

- **S1 · Medium · No coding standard yet.** Proposal: one short file written at M1 start: strict types, no `any`, pure engine, a test for every rule, naming, small files, and a definition of done per feature (VER-07).
- **S2 · Medium · Invariant checks.** Proposal: engine assertions (money conserved, no negative health, every event has a cause) run in every balance sweep; plus golden-file tests for generated text.
- **S3 · Low · Pre-approve the stack's dependency list** when the engine is chosen, so SAFE-03 is one decision, not a stop per package.
- **S4 · Low · Rules specs written just in time:** a half-page spec per system just before it is coded, not all up front (lean).

## Checked and found sound

Budget sums and contingency (§14b); schedule sums (18–28 and 11–17 months); break-even maths; the death-rate arithmetic (`PLAN.md:299–306`); session and career times; friction table total; art spend gated on R1 and R2; event log as the spine; integer determinism; content packs; save safety.

## Reviewer claims corrected or dropped

- "Caution has no stated cost": it has one (abandoned contracts, `PLAN.md:273`); the finding became F2, "cost not weighed".
- "Story recruits cut at launch": wrong; the academy is the moved source (`CONCEPT.md:93`).
- "Save migrations from M2 are too early": dropped; M2 is the first build external testers receive, which is when GAME-05 must hold.
- "Release checklist and performance numbers over-specified": dropped; cheap, already accepted (D-105, D-091).
