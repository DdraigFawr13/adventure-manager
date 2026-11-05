# Gate 1: one delve

- **Status:** Draft
- **Planned in:** fight forms (D-218), gear and money forms (D-221), mock-ups (D-224, D-225), spec questions https://claude.ai/artifact/GSbKtp9CWP54BN3pAQfUtQ (owner, 2026-11-05: "go with all recommended"). **Decisions:** D-213–D-225, D-226–D-229 (this spec's answers).

## Problem

The owner, on the replan (D-213): "I just didn't feel like this game was becoming something fun but the concept does sound really fun to me but I think I need some more involvement in this to become invested." On the first prototype (D-203): "Nothing felt very punchy or impactful", "just jumping through time is boring", and "I want to be able to run continuous real time actually with pause … look at the map and see them moving". Today a quest resolves on its own on arrival (`packages/engine/src/guild/parties.ts:33`); the player watches letters, never a fight.

## Goals

- The owner recruits a party, equips it, splits the weekly budget, watches it travel the map in real time, plays a delve room by room with fights they lead, and reads a letter home that retells what happened. **Pass line (D-213):** after 3 delves the owner wants to start a 4th; recorded in DECISIONS in the owner's words.
- A led fight takes about 3–5 minutes on a phone held upright (D-218), timed by the owner.
- Balance (D-229, measured by the balance runner, J6): played well (the `careful` player), 8–12% of delves cost at least one life; Auto's win rate is within 5 percentage points of `careful`'s and it ends delves with less health and fewer skill uses left; no fight stalls; after 3 delves the median chest is above the starting chest by less than one Rare price (1,375 copper).
- Same seed and same commands give the same delve, and a reload mid-fight that repeats the same choices gives the same result (D-218, GAME-01).

## Non-goals

- Several parties, threats, towns with needs, scars, gear wear, craftsmen and upgrades with parts, the quartermaster, status effects (stun, slow, bleed as a foe effect), critical-hit flash, disobedience, the temple revive (gate 2, D-220, D-223). Gate 1's one-round marks (Guard, Ward, Spark, Haste) are skill effects that end with the round, not status effects.
- The guild house, ageing, careers and rivals in the gate 1 game (gate 3). Guildmaster growth.
- AI-written letters (later; GAME-03 template now).
- Porting the year, career and resolution simulators to the new fight: they keep resolution v0 until gate 2 (D-229).
- Store apps, Windows, sound. Epic, Legendary and Divine gear; materials (D-221).

## Journeys and checks

### J1 Lead a fight

- **Given** the sample party (warrior, rogue, cleric, wizard) in a barrow fight room with 3 hounds and a barrow archer that reaches the back row
- **When** the player taps an adventurer's action, taps a foe (the hit % and damage show), and taps it again to strike
- **Then** turns follow the speed strip, each foe shows its intent at the round's start, bars drop and show Hurt / Badly hurt / Down, and the band flees when more than half of it is Down. **Check:** `packages/engine/test/delve-fight.test.ts` (one test per rule in Design, Fight); `node tools/play-shot.mjs fight` takes screenshots at 375 × 667 and 443 × 900 and fails if `#fight` is taller than the viewport at 375 × 667 or the page scrolls sideways.

### J2 Reload mid-fight

- **Given** a fight saved after round 2
- **When** the page reloads and the player repeats the same choices
- **Then** every roll and the end state match. Showing intents and odds draws no roll. **Check:** `delve-determinism.test.ts` (the one determinism test, GAME-06: save the state as JSON after round 2, reload it, replay the same commands, deep-equal end state and events); `delve-preview.test.ts` (calls `fightView` and `previewAction` for every actor, action and target, then asserts `state.rng` is deep-equal to before; a control in the same test calls `fight.act` and asserts `state.rng` changed).

### J3 Play a whole delve

- **Given** the sample party at the Hollow Barrow
- **When** the player goes through 5–6 rooms, uses Scout ahead, a draught and a firebomb, and taps Auto in one fight
- **Then** wounds carry between rooms, the breather raises Down allies to 3 health and leaves Dying ones Down, skills don't refill, the boss never flees and its minions flee when it falls, and the delve ends won, retreated or routed with parts (from S4 also the boss's gear piece). **Check:** `delve-rooms.test.ts`, `delve-auto.test.ts`; `node tools/play-shot.mjs delve` plays one delve on Auto start to end with no console error and asserts the end screen shows an outcome.

### J4 The loop

- **Given** a new game
- **When** the player signs 4 of the shortlist, takes a site from the board, presses Play, meets a road event, plays the delve, travels home and reads the letter
- **Then** the clock stops itself for each of those, the party moves on the map, and the letter names who did what. Export, then import into a fresh browser, gives the same game. **Check:** `packages/ui/test/play.test.ts` (clock stops on each stop reason with a fake timer; save round trip; unreadable save kept; export–import deep-equal); `node tools/play-shot.mjs loop`.

### J5 Equip and budget

- **Given** a party home from a delve
- **When** the player buys an Uncommon blade for the warrior, compares a looted piece, sets the sliders to "train hard" and books a drill
- **Then** the warrior's previewed hit % rises by 500 bp and damage by 1, the pots and the chest move as the money line shows, and the next delve's first round has the drill's bonus. **Check:** `gear.test.ts`, `budget.test.ts`, `drill.test.ts`; screenshots of the D-224 screens.

### J6 Balance

- **When** `node tools/balance/run.ts delve-careful` and `delve-auto` run
- **Then** each prints its metrics with an interval and a verdict against the Goals' targets: from S2 deaths per delve, win rate, health share and skill uses left, stalled fights; from S5 the chest after 3 delves. **Check:** both scenarios are listed by `--list`, have stored baselines, and print `ok` for each target active in that slice (`near` is reported to the owner, not accepted silently).

## Decisions

Settled before this spec: D-213–D-225. This spec's answers (all the owner's recommended options, 2026-11-05), recorded in DECISIONS:

- **D-226 Fight rule gaps:** party melee hits the foes' front row while any foe stands there; ranged attacks and spells reach any foe. Rogue: throw a knife. Wizard: Spark. A band flees when more than half its foes are Down; the boss never flees, and its minions flee when it falls. At the breather a Dying ally stops bleeding but stays Down for the next room unless Mend or a draught raises them. Tactics: +1% hit per point above 10 for the party; one fixed guildmaster.
- **D-227 The delve:** choice rooms; only the approach stays; 3 sites with room pools.
- **D-228 Time and the trip:** real time with pause and 1×/2×, 10 s a day; 1–2 road event cards a trip; template letters.
- **D-229 Targets and build:** 1 delve in 10 costs a life; chest a little up after 3; a new `delve` system beside v0.

## Alternatives rejected

- **Rewrite resolution v0 and port the simulators now:** rejected by the owner (D-229); it would delay the first playable fight by an estimated 2–3 sessions of re-tuning 26-year careers gate 1 doesn't use. Fails when gate 2's unled parties need the new fight: that is when v0 retires.
- **Anyone may hit any foe:** makes the rogue's and wizard's reach worthless and breaks Cleave's "front-row" wording (D-219).
- **Flee at half Down; flee on a health share:** half ends 4-foe fights at 2 down; health share is hard to read on the bar.
- **A boss that flees with its drop:** contradicts the guaranteed boss drop (D-221).
- **Breather gets Dying allies up / Dying keeps rolling:** the first makes Dying and Down the same; the second kills often when the cleric is the one Down.
- **Rooms without fights as plain rolls or rest rooms:** a roll the player only watches; rest rooms undo D-218's carried wounds.
- **One site / four sites:** one site risks staleness before delve 4; the deadly spire adds a fourth boss for little gain at slice size.
- **A next-day button; real time on the trip only:** the owner asked for continuous time with pause (D-203).
- **AI letters in gate 1:** needs a key and running cost (SAFE-01), and GAME-03 needs the template anyway.
- **Rolls from streams derived per key (seed, fight, round, actor) without stored state:** considered to make D-218's "keyed" literal, but it adds a second source of randomness beside `streamFor` (`packages/engine/AGENTS.md`), repeats numbers when one actor rolls twice under one key (hit then damage, or Haste), and gains nothing: D-218's purpose (a reload that repeats choices repeats results; previews never roll) is met by named streams in `state.rng` plus a save after every turn plus pure views (J2). Fails if previews ever draw: J2's test catches that.
- **Extend the step 4 page:** its screens are a letters desk; gate 1's screens are new (D-224). It stays as it is.

## Risks

- **The fight is long or crowded on a 375 × 667 phone** (D-224 measured 809 px; D-225's open notes) → S1's first step, before any engine code, is a fit check of D-225's option C at 375 × 667 with `ui-mockups`; the owner approves the layout or picks D-225's proposed fallback (a stage that scrolls a little sideways). J1's check measures the build.
- **Two fight rule sets drift** → v0 is frozen; `tools/check-boundaries.mjs` gains a rule that files in `packages/engine/src/delve/` import nothing from `resolution/quest.ts`, `turn.ts`, `actions.ts`, `harm.ts`, `encounters.ts` (shared types and `check.ts`'s clamp may be imported).
- **Auto too good or too bad** → J6 from S2.
- **The pass line fails on content, not rules** → 3 sites with room pools; road events and letters vary. See Open questions on an early playtest.
- **Save shape changes across slices** → the save carries a version from S1; every slice that changes the state's shape bumps it with an upgrade and a stored fixture of the old version (GAME-05).

## Design

### Engine: `packages/engine/src/delve/` (new; `SPEC.md` written from this section in S1)

**Randomness.** Named streams via `streamFor` only (engine AGENTS.md): `delve.fight` (hits, damage, bleed, death, retreat), `delve.auto` (Auto's good-choice roll), `delve.rooms` (layout, choice checks, scout), `delve.loot`, `guild.road` (S3), `guild.smith` (S4). The page saves after every command, so a reload restores the stream positions. Views never call `streamFor`.

**State.** `GameState.delve: DelveRun | null` (new optional field; v0's `quest` untouched).

- `DelveRun`: `id`, `siteId`, `danger`, `approach`, `memberIds`, `tactics` (number, copied at start), `rooms: RoomPlan[]`, `roomIndex`, `phase: 'choice' | 'fight' | 'breather' | 'ended'`, `fighters: Fighter[]` (party only; health carried between rooms), `fight: FightState | null`, `pack: PackItem[]` (max 4), `skillUses: Record<adventurerId, Record<actionId, number>>`, `auto: { on: boolean; saveSkillsForBoss: boolean }` (default `false`, `true`; D-220), `bonuses: { offGuard: boolean; warned: boolean; drillBp: number }`, `scouted: boolean` (this gap), `loot: { parts: PartDrop[]; gear: string[] }` (gear item instance ids, S4), `outcome: 'won' | 'retreated' | 'routed' | null`.
- `RoomPlan`: `{ kind: 'choice'; roomId } | { kind: 'fight'; roomId; boss: boolean }`.
- `PackItem`: `{ kindId: 'item.draught' | 'item.firebomb' }`. `PartDrop`: `{ partId, rarity, foeKindId }`.
- `Fighter`: `id`, `side: 'party' | 'foe'`, `kindId` (class or foe kind), `row: 'front' | 'back'`, `health`, `maxHealth`, `speed`, `status: 'up' | 'down' | 'dying' | 'dead' | 'fled'` (foes use only `up`, `down`, `fled`), round marks `guardedBy?: id`, `sparked: boolean`, `hitThisRound: boolean`.
- `FightState`: `round`, `order: string[]` (fighter ids), `turn` (index into `order`), `intents: Record<foeId, { actionId; targetId } | 'off-guard'>`, `boss: boolean`, `warded: boolean`, `foes: Fighter[]`.
- Bands (D-218): Hurt below ⅔ of max health, Badly hurt below ⅓, Down at 0.

**Fight.**

- **Order:** at each round's start, standing fighters by speed (Agility for adventurers plus gear; foe kind's speed), descending, ties by id (D-129). Changes inside a round: knockback moves the target one place later; Hamstring moves it to last; Haste moves an ally who hasn't acted to right after the wizard (if the ally already acted, it goes first next round). Warned foes go before every adventurer in round 1.
- **Intents:** at the round's start each standing foe picks `{ actionId, targetId }` by its kind's target rule (`front-most`: the first standing adventurer in the front row by order, else back; `most-hurt`: lowest health share among reachable, ties by order; `back-row-first`: the back row's lowest health, else front). If its target falls before it acts, it re-picks by the same rule at its turn. Off-guard foes show `off-guard` and skip round 1.
- **Reach:** melee needs the target in the front row while anyone stands there (both sides); ranged and spells reach any. A melee actor with no reachable target can't pick that action.
- **Hit:** `hitChance(state, actorId, actionId, targetId): Value` in basis points = 5,000 + 500 × (actor's attack attribute − target's defence) + parts, clamped 500–9,500 (v0's numbers, content). Parts: weapon rarity step (500 bp a step, S4), Tactics (party only: 100 bp × (tactics − 10), floored at 0), Spark mark (+1,000 bp), Ward (foes −1,500 bp), drill (first round only, S5). Attack attributes: warrior Might, rogue Agility, cleric Lore, wizard Lore. Adventurer defence = 10 + `Math.floor((Agility − 10) / 2)` + armour (light 0, medium 1, heavy 2). Heals, Guard, Haste and items never miss.
- **Damage:** `damageRange(state, actorId, actionId, targetId): { min: Value; max: Value }` = the action's range + weapon rarity step (+1 a step, S4) − the target's armour (as above), at least 1. Rolled uniformly in the range on a hit.
- **Starting numbers (content, `packages/content/src/gate1/`; tuned only by the balance runner):**
  - Health: warrior 24, rogue 18, cleric 18, wizard 14, each + (Toughness − 10).
  - Plain attacks: warrior 3–6 + knockback; rogue throw 2–4, any row; cleric 2–4 + the most hurt standing ally (lowest health share, ties by order) heals 1; wizard Spark 1–3, any foe, marks it (+1,000 bp for allies this round).
  - Skills (3 uses each a delve, D-219): Guard (the warrior takes every hit aimed at one chosen ally this round); Cleave (3–5 to two front-row foes, the target and the next in order); Strike from shadow (3–6, doubled if the target was hit this round); Hamstring (2–4, target to last); Mend (heal 6, or raise a Down or Dying ally to 4); Ward (foes −1,500 bp this round); Firebolt (6–10, any foe); Haste (as above).
  - Pack items: draught (heal 8, or raise to 6), firebomb (3–5 to every standing foe in one row, never misses). Using one takes the turn.
  - Swap row: takes the turn. Retreat: see Retreat.
  - Barrow foes: hound (health 10, defence 9, speed 14, melee 2–4, `front-most`, part `part.hound-fang` common); barrow archer (8, 8, 11, ranged 2–4, `back-row-first`, `part.grave-fletching` common); restless warden, boss (40, 11, 8, melee 4–7, `most-hurt`, `part.warden-shroud` uncommon); boss minions are hounds. Other sites' foes (S3) use this scale: routine health × 0.8, perilous × 1.3, rounded; damage ±1.
- **Round end:** in order: each Down adventurer rolls to bleed to Dying (v0's `bleed`: 3,000 bp − 200 bp per Toughness point above 10); each adventurer Dying since before this roll rolls for death (v0's `deathRoll`: 3,500 bp − 150 bp per Toughness and Resolve point above 10); marks clear; then the flee check: a non-boss band whose Down foes are more than half its foes flees (the rest become `fled`); a boss fight ends when the boss is Down (minions become `fled`). Rout: no adventurer `up`. Foes at 0 health are Down for good (no bleeding, never raised).
- **Retreat (D-126, v0's numbers):** `fight.retreat` on an adventurer's turn. One Wits check by the standing adventurer with the best Wits against the danger (6/9/12 for routine/hazardous/perilous); beats = 1, +1 while carrying anyone Down or Dying, +1 if the check fails. Each beat each standing foe strikes once by its target rule, then the round-end rolls. If anyone stands at the end, the delve ends `retreated`; else `routed`.

**Auto (D-220).** Content rules per class, tried in order, each `{ when, do }` with `when` from a fixed vocabulary: `ally-dying`, `ally-down`, `ally-below-third`, `foe-marked`, `boss-room`, `always`; `do` names an action and a target rule (`most-hurt-ally`, `most-hurt-foe-in-reach`, `first-foe-in-reach`). Each Auto decision rolls a good-choice chance from `delve.auto`: 6,000 bp + 300 bp × (leader's Wits − 10) + 200 bp × (tactics − 10), clamped 3,000–9,500; the leader is the standing member with the best Wits, ties by id. A miss takes the plain attack on the first reachable foe by order. With `saveSkillsForBoss`, rules using a skill are skipped outside the boss room. Pack items: Auto uses a draught only on `ally-dying`.

**Rooms.**

- A site (content): `danger`, `entry` (choice room testing the approach's attribute: stealth → Stealth, assault → Might, talk → Presence), `fightRooms` (pool of 5–6 per site, each 3–5 foes, at least one fight room per site with a foe that reaches the back), `choiceRooms` (pool of 3), `boss` (the boss and 1–2 minions).
- Layout (`delve.rooms`, at `delve.start`): entry, then 3–4 fight rooms drawn from the pool without repeats, with 0–1 choice room inserted after the first fight, then the boss: 5–6 rooms.
- A choice room has two options `{ attribute, onFailure: 'hurt' | 'warn' }`; difficulty by danger 9/11/13; the check is v0's (5,000 + 500 × (attribute − difficulty), clamped). The player picks the option and a standing tester. `hurt`: the tester loses 4 health (not below 1). `warn`: the next fight room's foes go first in round 1 (no effect on a choice room; on the boss room it applies). Entry success sets `offGuard` for the first fight; entry failure applies its option's failure.
- Scout ahead (`delve.scout`): once per gap between rooms, only with a standing rogue (the button is hidden otherwise); Stealth check against the danger's difficulty. Success shows the next room (kind, foe kinds and count); failure warns it.
- Breather (after a won fight): Down and Dying adventurers stop rolling; Down ones rise to 3 health; Dying ones become Down at 0 and stay out of the next fight (they can be raised by Mend or a draught during it). Skills and the pack don't refill. `delve.next` enters the next room; if no one would stand, the delve ends `routed`.
- Loot: when a fight room ends, each Down foe drops its part with 5,000 bp (the boss 10,000 bp), rolled on `delve.loot`. Fled foes drop nothing. The boss's gear piece arrives in S4.

**End.** `delve.ended` carries the outcome and, per member: `woundStep` (from the end state: up and above ⅔ → 0, Hurt → 1, Badly hurt → 2, Down → 3, Dying → 4; same numbers as v0's `WOUND`), `injury` (v0's `injuryBp` by end state: Badly hurt 750, Down 2,250, Dying 4,100; rolled on `delve.fight`), `died`. From S3 the guild applies these with its existing recovery (`restDaysPerWoundStep`, injury weeks) and death costs (D-138, minus the reckless-plan renown, which has no meaning without a risk setting). Pay: won 100%, retreated and routed 0 (no partial in gate 1).

**Commands** (all through `simulate`): `delve.start` (`memberIds`, `siteId`, `approach`, `tactics`; S1–S2 the page issues it with the sample party; from S3 the page issues it after the guild's `delve-ready` stop with the arriving party), `delve.choose` (`optionIndex`, `testerId`), `delve.scout`, `delve.next`, `fight.act` (`actorId`, `actionId`, `targetId?`, `packIndex?`), `fight.auto` (`on`, `saveSkillsForBoss?`), `fight.retreat`. S1 has `delve.start` with a single fight room (`siteId: 'site.sample-fight'`). With Auto on, `fight.act` is not needed: the page issues `fight.auto` once and then `fight.step` (one adventurer turn chosen by Auto) on a 600 ms timer, so the player sees each turn.

**Events:** `delve.started`, `room.entered`, `choice.rolled`, `scout.rolled`, `round.started` (order, intents), `fight.acted` (actor, action, target, hit `Value`, roll, damage), `health.changed`, `fighter.down`, `fighter.dying`, `fighter.died`, `band.fled`, `fight.ended`, `breather`, `loot.dropped`, `retreat.beat`, `delve.ended`. Each with a cause id (engine AGENTS.md).

**Views (pure):** `fightView(state)`: order strip, intents, each fighter's health and band, reachable targets per action, skill uses left. `previewAction(state, actorId, actionId, targetId)`: `{ hit: Value; damage: { min: Value; max: Value } }`. Both call `hitChance` and `damageRange`, the same functions `fight.act` uses.

### Guild (S3–S5): changes in `packages/engine/src/guild/`

- `GuildRules.delves?: boolean`: when true, `arrive` raises a `delve-ready` stop (class `must`) and leaves the party at the site; `delve.ended` sets the party's outcome, pay, recovery and deaths, and the party starts home that day (`homeDay` = that day + travel days).
- One party at a time in gate 1: `contract.take` is refused while a party is out or a delve is running.
- Guildmaster: `GuildState.guildmaster: { tactics: number }`, set at `guild.found` from content (12).
- Start: a shortlist of 8 (2 per class, `guild.recruit` stream), the first 4 signed free; after that 3 prospects every week and D-138's sign-on fee.
- Board: one offer per site each week (fees by danger from `baseGuildRules`, ±20%).
- Road events (S3): on each travel day, 4,000 bp on `guild.road`, at most one each way; raises a `road-event` stop (`must`) with a card id; `road.choose` (`optionIndex`) applies its effects: days ±1 to arrival or home, −3 health to one named member at the delve's start, or coin ±50–150. About 6 cards in content.
- Money and drills (S5): see S5.

### Content: `packages/content/src/gate1/` (new pack, built like `base`)

`classes.ts`, `foes.ts`, `sites.ts`, `pack.ts` (draught, firebomb), `rarity.ts` (Common, Uncommon, Rare), `guild.ts` (rules above), `road.ts` (S3), `items.ts` (S4), `money.ts` (S5); words in `packages/content/data/gate1.en.json` (names, intents, room and road text, letters). The S1–S2 sample party is `packages/content/data/gate1-sample-party.json`: Odric Hale (warrior, front), Wenna Cray (rogue, front), Brother Amis (cleric, back) with their attributes from `prototype-party.json`, and Maud Fenwick (wizard, back; might 7, agility 11, toughness 8, stealth 9, wits 13, presence 10, resolve 12, lore 16), each with Common gear for their class. The wizard class leads Lore and Wits, wage base 50 (assumption, content).

### UI: `packages/ui/play.html` (new page)

- Built by `packages/ui/vite.play.config.ts` (copy of `vite.map.config.ts` with `play.html`, `play.js`, `play.css`), added to the `build` script so the Vercel build serves `/play.html`.
- `src/play/`: `main.tsx`, `Play.tsx` (screen switch), `save.ts` (localStorage key `play.save`, `{ version, savedAt, state }`, version 1 from S1; written after every command; an unreadable save is kept under `play.save.unreadable.<time>` and never overwritten, as `step4/Step4.tsx` does; export as copyable text of the same JSON and a file through a download link; import from paste or a file, refused with a message if the version is unknown), `fight/` (D-225's option C as fitted in S1), `delve/`, `clock.ts` (S3: `requestAnimationFrame`, 10 s a day at 1×, 5 s at 2×, paused while the page is hidden; issues `day.advance`; stops on every `must` stop), `map/` (S3: the drawing code of `packages/ui/src/engine-test/phone/` and `src/engine-test/map/`, with the party's position interpolated in the view between its departure, arrival and home days), `guild/` (S3–S5: D-224's screens), `letter/`.
- No game rule in the UI (GAME-02): every number shown comes from `fightView`, `previewAction` or engine state.
- `tools/play-shot.mjs <fight|delve|loop>`: builds nothing; serves `packages/ui/dist` with a static server, drives `/play.html` with Playwright (pre-installed), screenshots to the scratchpad, fails on a console error; `delve` and `loop` turn on Auto and tap through.

### Letter: `packages/engine/src/report/delve-letter.ts` (S3)

A `Letter` (same shape as `quest-report.ts`'s) built from the trip's events: the road event chosen, each room in one line, and up to 3 moments picked by rule in this order: a death, the boss's fall (who struck), an adventurer raised from Dying (who raised them), the most damage dealt in one hit, the most Downs taken. Templates and slot names in `gate1.en.json`; every slot has a fallback phrase, so no slot is ever empty.

### Balance: `tools/balance/`

- A delve mode beside careers in `run.ts`: scenarios `delve-careful` and `delve-auto` play 400 seeded delves on the sample party (S2: the barrow; from S3: each site, and from S3 also 100 seeded 3-delve games through the guild with the default budget for the chest target, active from S5).
- `tools/balance/delve-player.ts` (`careful`): raise a Dying ally first (Mend, else a draught), then Mend an ally below ⅓, Ward when two or more foes intend to hit, Guard the most hurt back-row ally when a foe intends to hit them, Firebolt or Strike from shadow on a foe that would then fall, Cleave when two front foes stand, else the plain attack on the most hurt reachable foe; retreat when two members are Down or worse before the boss room; choice rooms: the option and tester with the best chance.
- Stalls: the runner (not the game) stops a fight after 30 rounds and counts it as stalled; target 0.
- Metrics: deaths per delve, win rate, health share and skill uses left at the end, rounds per fight, stalled fights, chest after 3 delves.

## Slices

### S1 One fight

- **First:** fit check of D-225's option C at 375 × 667 with `ui-mockups` (tags only on the picked target and the acting adventurer, intents as a mark above each foe; D-225's proposals); the owner approves before any code.
- **The owner tries:** `/play.html` opens straight into a barrow fight: the sample party against 3 hounds and an archer; they play it to the end on the phone, reload mid-fight and see the same fight; a button starts a new fight.
- **Checks that fail now:** J1, J2; `delve-fight.test.ts`, `delve-determinism.test.ts`, `delve-preview.test.ts`, `tools/play-shot.mjs fight`; `play-save.test.ts` (save written after each command, version 1, unreadable save kept).
- **Files:** `packages/engine/src/delve/{SPEC.md,types.ts,fight.ts,actions.ts,view.ts,index.ts}`, `engine/src/simulate.ts` and `resolution/types.ts` (`GameState.delve`, commands, events), `engine/src/index.ts` exports; `engine/test/delve-*.test.ts`; `content/src/gate1/{classes,foes,pack,rarity,index}.ts`, `content/data/gate1.en.json`, `content/data/gate1-sample-party.json`; `ui/play.html`, `ui/vite.play.config.ts`, `ui/package.json` build script, `ui/src/play/{main.tsx,Play.tsx,save.ts,fight/}`, `ui/test/play-save.test.ts`; `tools/play-shot.mjs`; `tools/check-boundaries.mjs` (the delve rule); `engine/AGENTS.md` (delve uses only `streamFor`, a line); `engine/src/resolution/SPEC.md` first line (points to `delve/SPEC.md`). Art: the standees and backdrop in `docs/design/art/` (listed in its `README.md`) are copied into `ui/public/play/` with their ledger lines.
- **Waits on:** none.

### S2 One delve

- **First:** mock-up of the room card, choice room, scout result, breather, retreat and end screens (`ui-mockups`); the owner approves.
- **The owner tries:** a whole barrow delve from the entry room to the warden with the sample party and a pack of 2 draughts and 2 firebombs (fixed until S5): choices, Scout ahead, Auto with save-for-boss, Retreat, the parts at the end; a button starts a new delve.
- **Checks that fail now:** J3; `delve-rooms.test.ts` (layout, choice outcomes, off guard, warn, scout, breather and Dying, boss and minions, retreat beats, `delve.ended` wound steps, injuries and deaths), `delve-auto.test.ts` (each `when`, the good-choice roll, save-for-boss); J6's S2 targets with stored baselines; `tools/play-shot.mjs delve`.
- **Files:** `delve/{rooms.ts,auto.ts,loot.ts,retreat.ts}`, `simulate.ts`; `content/src/gate1/sites.ts` (the barrow only), words in `gate1.en.json`; `ui/src/play/delve/`; `tools/balance/{delve-player.ts,scenarios.ts,metrics.ts,run.ts}` and `baselines/delve-*.jsonl.gz`; save version unchanged unless the state's shape changes (then 2, with an upgrade and fixture).
- **Waits on:** S1.

### S3 The loop

- **First:** mock-ups of the guild home (shortlist and board), the map trip with the clock and a road event card, and the letter (`ui-mockups`); the owner approves.
- **The owner tries:** a new game: sign 4 of 8, pick a site and approach, Play, a road event, arrival into the delve, the trip home, the letter; then delves at the other two sites; export the save and import it on another browser.
- **Checks that fail now:** J4; `guild-delve.test.ts` (arrival raises `delve-ready`; the delve's end sets wounds, injuries, deaths, pay, recovery and the trip home; one party at a time), `road.test.ts`, `delve-letter.test.ts` (each template fills from a delve's events with no empty slot, for won, retreated and routed), `play.test.ts`; `tools/play-shot.mjs loop`; J6 across the 3 sites.
- **Files:** `engine/src/guild/{parties.ts,day.ts,types.ts,founding.ts,board.ts}`, `simulate.ts` (`road.choose`), `engine/src/report/delve-letter.ts`; `content/src/gate1/{guild,road}.ts`, `sites.ts` (mill cellar and chapel with their foes: cellar rats, rat king boss, drowned dead, reed-lurker that reaches the back, chapel keeper boss), `gate1.en.json`; `ui/src/play/{clock.ts,map/,guild/,letter/}`, `save.ts` (version bump with upgrade and fixture).
- **Waits on:** S2.

### S4 Gear

- **The owner tries:** the party list and sheet (D-224), the smith (Common stock, 3 Uncommon pieces and 1 Rare offer each week, too-heavy armour greyed, sell-back at half), the boss's gear drop and the loot compare; the fight's odds change with gear.
- **Numbers:** about 25 items: a Common, Uncommon and Rare of each class's weapon kinds (blade, dagger, mace, staff) and armour weights, two two-handed weapons, two shields, and trinkets (speed +1, one extra skill use, a resistance: −1 damage from one foe kind); rarity step +500 bp hit and +1 damage (armour: +1 armour); prices Common 110, Uncommon 440, Rare 1,375 copper (2, 8 and 25 weeks of a 55-copper wage, D-221); boss drop by danger: routine Common 50% / Uncommon 50%, hazardous Uncommon 70% / Rare 30%, perilous Uncommon 40% / Rare 60%. Names and flavour lines are writing in `gate1.en.json`. Equipping only while home.
- **Checks that fail now:** J5's gear part; `gear.test.ts` (rarity steps in `previewAction`, armour limits, two-handed vs shield, smith stock fixed for the week, sell-back half, boss drop by danger); save upgrade test from the S3 fixture.
- **Files:** `engine/src/guild/gear.ts`, `simulate.ts` (`gear.buy`, `gear.sell`, `gear.equip`), `delve/fight.ts` (gear parts in hit and damage), `delve/loot.ts` (boss drop); `content/src/gate1/items.ts`; `ui/src/play/guild/{Party,Sheet,Smith,Compare}.tsx`; `save.ts` bump.
- **Waits on:** S3.

### S5 Money and drills

- **The owner tries:** the weekly budget (4 presets, 3 sliders, the money line), the stipend arriving, the pack refilling from the gear pot (with the short-pot warning), the healing pot shortening recovery, a drill booked in the refit week and its bonus in the next delve.
- **Numbers (starting ideas, D-222; the stipend is tuned to J6's chest target):** starting chest 4,500; stipend 600 a week; weekly sum 250 a week; presets balanced 34/33/33, train hard 60/20/20, patch up 20/20/60, save for gear 20/60/20 (training/gear/healing %); pack items 55 copper each, refilled from the gear pot when a party leaves (as many as the pot pays for, warning if short); healing pot: at homecoming 50 copper per member-day of recovery, spent until the pot or the days run out; drill: 150 copper from the training pot, booked during the refit week for the whole party, +500 bp hit in the first round of each fight next delve, +100 bp per Tactics point above 10. Weekly order: stipend in, wages and running costs out, then the sum moves from the chest to the pots (only what the chest holds; never below 0).
- **Checks that fail now:** J5's money part; `budget.test.ts` (sum to pots, pots keep, the order above, a chest short of the sum, each `money.changed` carries the running chest and the last equals the state), `drill.test.ts`; J6's chest target.
- **Files:** `engine/src/guild/budget.ts`, `day.ts` (weekly order, the `budget` stop), `simulate.ts` (`budget.set`, `drill.book`, `pack.set`); `content/src/gate1/money.ts`; `ui/src/play/guild/Budget.tsx`; `save.ts` bump.
- **Waits on:** S4.

### S6 Art and the map

- **First:** mock-up of the map's painted detail (D-212); the owner approves.
- **The owner tries:** the kept art in every gate 1 screen where a piece exists, and the painted detail on the trip map.
- **Checks that fail now:** `tools/play-shot.mjs loop` asserts each art image in `ui/public/play/` loads (no 404); every image has a ledger line in `docs/design/art/README.md` (SAFE-05, a test in `tools/test/`). Frame rate: the owner's device reading on a production build (D-154).
- **Files:** `ui/src/play/map/`, `ui/public/play/`, `docs/design/art/README.md`.
- **Waits on:** S3.

## Verification

- Every push: `node .claude/master/sync.mjs --check && node tools/docs-check.mjs && npm run check`.
- Each slice: its checks, then `npm run build -w @adventure-manager/ui && node tools/play-shot.mjs <fight|delve|loop>`; the screenshots are looked at (VER-06).
- Balance from S2: `node tools/balance/run.ts delve-careful --compare` and `delve-auto --compare`.
- The pass line: the owner plays 3 delves on the phone and records the verdict.

## Open questions

- The scene feel (D-225: "it still doesn't feel like they exist in the scene"): side-on ground art and lit standees are Proposed; decided at S1's fit check or in S6.
- An early playtest: the owner could play 3 delves after S3 (starting gear, fixed pack, no budget) and say whether the core is fun before S4 and S5 are built. Recommended; the verdict for the gate still comes after S5.
