# Gate 1: one delve

- **Status:** Draft
- **Planned in:** fight forms (D-218), gear and money forms (D-221), mock-ups (D-224, D-225), spec questions https://claude.ai/artifact/GSbKtp9CWP54BN3pAQfUtQ (owner, 2026-11-05: "go with all recommended"). **Decisions:** D-213–D-225, D-226–D-229 (this spec's answers).

## Problem

The owner, on the replan (D-213): "I just didn't feel like this game was becoming something fun but the concept does sound really fun to me but I think I need some more involvement in this to become invested." On the first prototype (D-203): "Nothing felt very punchy or impactful", "just jumping through time is boring", and "I want to be able to run continuous real time actually with pause … look at the map and see them moving". Today a quest resolves on its own on arrival (`packages/engine/src/guild/parties.ts:33`); the player watches letters, never a fight.

## Goals

- The owner recruits a party, equips it, splits the weekly budget, watches it travel the map in real time, plays a delve room by room with fights they lead, and reads a letter home that retells what happened. **Pass line (D-213):** after 3 delves the owner wants to start a 4th; recorded in DECISIONS in the owner's words.
- A led fight takes about 3–5 minutes on a phone held upright (D-218), timed by the owner.
- Balance (D-229, measured by the balance runner, J6, 1,000 seeded delves per policy, the two policies paired seed by seed): played well (the `careful` player), 8–12% of delves cost at least one life; Auto's win rate (share of delves where the boss falls) is within 5 percentage points of `careful`'s, and it ends delves with less health left (skill uses left are reported, no target, since Auto saves skills for the boss by default); no fight stalls; a verdict is `ok` only when the 95% interval lies inside the band; after 3 delves the median chest is above the starting chest by less than one Rare price (1,375 copper).
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
- **Rolls from streams derived per key (D-218's wording) (seed, fight, round, actor) without stored state:** considered to make D-218's "keyed" literal, but it adds a second source of randomness beside `streamFor` (`packages/engine/AGENTS.md`), repeats numbers when one actor rolls twice under one key (hit then damage, or Haste), and gains nothing: D-218's purpose (a reload that repeats choices repeats results; previews never roll) is met by named streams in `state.rng` plus a save after every turn plus pure views (J2). Fails if previews ever draw: J2's test catches that.
- **Extend the step 4 page:** its screens are a letters desk; gate 1's screens are new (D-224). It stays as it is.

## Risks

- **The fight is long or crowded on a 375 × 667 phone** (D-224 measured 809 px; D-225's open notes) → S1's first step, before any engine code, is a fit check of D-225's option C at 375 × 667 with `ui-mockups`; the owner approves the layout or picks D-225's proposed fallback (a stage that scrolls a little sideways). J1's check measures the build.
- **Two fight rule sets drift** → v0 is frozen; `tools/check-boundaries.mjs` gains a rule that files in `packages/engine/src/delve/` import nothing from `resolution/quest.ts`, `turn.ts`, `actions.ts`, `harm.ts`, `encounters.ts` (shared types and `check.ts`'s clamp may be imported).
- **Auto too good or too bad** → J6 from S2.
- **The pass line fails on content, not rules** → 3 sites with room pools; road events and letters vary. See Open questions on an early playtest.
- **Save shape changes across slices** → the save carries a version from S1; every slice that changes the state's shape bumps it with an upgrade and a stored fixture of the old version (GAME-05).

## Design

### Engine: `packages/engine/src/delve/` (new; `SPEC.md` written from this section in S1)

**Randomness.** Named streams via `streamFor` only (engine AGENTS.md): `delve.fight` (hits, damage, bleed, death, injury, retreat), `delve.auto` (Auto's good-choice roll), `delve.rooms` (layout, choice checks, scout), `delve.loot`, `guild.road` (S3), `guild.smith` (S4). The page saves after every command, so a reload restores the stream positions. Views never call `streamFor`. This meets D-218's "keyed to the fight, round and actor" by its stated purpose rather than its letter; recorded as an amendment of D-218 on approval. Bleed, death and injury rolls are written in `delve/` from the content numbers (v0's `harm.ts` is not imported).

**State.** `GameState.delve: DelveRun | null` (new optional field; v0's `quest` untouched).

- `DelveRun`: `id`, `siteId`, `danger`, `approach`, `memberIds`, `tactics` (number, from the start command), `rooms: RoomPlan[]`, `roomIndex`, `phase: 'choice' | 'fight' | 'breather' | 'ended'`, `fighters: Fighter[]` (party only; health carried between rooms), `fight: FightState | null`, `pack: PackItem[]` (max 4), `skillUses: Record<adventurerId, Record<actionId, number>>`, `auto: { on: boolean; saveSkillsForBoss: boolean }` (default `false`, `true`; D-220), `bonuses: { offGuard: boolean; alerted: boolean; drillBp: number }` (off guard and alerted cancel each other), `scouted: boolean` (this gap), `loot: { parts: PartDrop[]; gear: string[] }` (gear item instance ids, S4), `outcome: 'won' | 'retreated' | 'routed' | null`.
- `RoomPlan`: `{ kind: 'choice'; roomId } | { kind: 'fight'; roomId; boss: boolean }`.
- `PackItem`: `{ kindId: 'item.draught' | 'item.firebomb' }`. `PartDrop`: `{ partId, rarity, foeKindId }`.
- `Loadout` (per member, from the start command): `{ weapon: { kindId; rarity }; armour: { weight: 'light' | 'medium' | 'heavy'; rarity }; trinket: { kindId; rarity } | null }`; rarity 0 = Common, 1 = Uncommon, 2 = Rare. S1–S3 pass each member's Common class kit (warrior blade and heavy, rogue dagger and light, cleric mace and medium, wizard staff and light); from S4 the guild builds it from equipped items.
- `Fighter`: `id`, `side: 'party' | 'foe'`, `kindId` (class or foe kind), `row: 'front' | 'back'`, `health`, `maxHealth`, `speed`, `armour`, `loadout` (party), `status: 'up' | 'down' | 'dying' | 'dead' | 'fled'` (foes use only `up`, `down`, `fled`), round marks `guardedBy?: id` (on the guarded ally), `sparked: boolean` (on the foe), `hitThisRound: boolean`.
- `FightState`: `round`, `order: string[]` (fighter ids, kept across rounds), `turn` (index into `order`), `intents: Record<foeId, { actionId; targetId } | 'off-guard'>`, `boss: boolean`, `warded: boolean`, `foes: Fighter[]`.
- Bands (D-218): Hurt below ⅔ of max health, Badly hurt below ⅓, Down at 0.

**Fight.**

- **Order (D-218):** set once at the fight's start: all fighters by speed (Agility for adventurers plus gear; the foe kind's speed), descending, ties by id (D-129). It stays the same each round except where a skill moves someone, and a move lasts: knockback moves the target one place later; Hamstring moves it to last; Haste moves an ally to right after the wizard (so an ally who already acted this round acts there from the next round). Fighters who are Down, Dying, dead or fled are skipped and keep their place; a raised ally acts again from that place. Alerted foes go before every adventurer in round 1 only.
- **Intents:** at the round's start each standing foe picks `{ actionId, targetId }` by its kind's target rule (`front-most`: the first standing adventurer in the front row by order, else back; `most-hurt`: lowest health share among reachable, ties by order; `back-row-first`: the back row's lowest health, else front). If its target falls before it acts, it re-picks by the same rule at its turn. Off-guard foes show `off-guard` and skip round 1.
- **Reach:** melee needs the target in the front row while anyone stands there (both sides); ranged and spells reach any. A melee actor with no reachable target can't pick that action.
- **Hit:** `hitChance(state, actorId, actionId, targetId): Value` in basis points = 5,000 + 500 × (actor's attack − target's defence) + parts, clamped 500–9,500 (v0's numbers, content). Parts: weapon rarity step (500 bp a step, S4), Tactics (party only: 100 bp × (tactics − 10), floored at 0), Spark mark (+1,000 bp), Ward (foes −1,500 bp), drill (first round only, S5). Attack: warrior Might, rogue Agility, cleric Lore, wizard Lore; a foe's attack is its kind's `attack`. Adventurer defence = 10 + `Math.floor((Agility − 10) / 2)` + armour (light 0, medium 1, heavy 2). Heals, Guard, Haste and items never miss.
- **Damage:** `damageRange(state, actorId, actionId, targetId): { min: Value; max: Value }` = the action's range + weapon rarity (+1 a step; for the wizard the staff's step counts for every spell) − the target's armour (adventurers: weight plus armour rarity; foes: their kind's `armour`), at least 1. Rolled uniformly in the range on a hit.
- **Starting numbers (content, `packages/content/src/gate1/`; tuned only by the balance runner):**
  - Health: warrior 24, rogue 18, cleric 18, wizard 14, each + (Toughness − 10).
  - Plain attacks: warrior 3–6 + knockback; rogue throw 2–4, any row; cleric 2–4 + the most hurt standing ally (lowest health share, ties by order) heals 1; wizard Spark 1–3, any foe, marks it (+1,000 bp for allies this round).
  - Skills (3 uses each a delve, D-219): Guard (the warrior takes every hit aimed at one chosen ally this round, melee, ranged or spell, while the warrior is up; if the warrior falls, the guard ends); Cleave (3–5 to two front-row foes, the target and the next in order); Strike from shadow (3–6, doubled if the target was hit this round); Hamstring (2–4, target to last); Mend (heal 6, or raise a Down or Dying ally to 4); Ward (foes −1,500 bp this round); Firebolt (6–10, any foe); Haste (as above).
  - Pack items: draught (heal 8, or raise to 6), firebomb (3–5 to every standing foe in the row of the foe tapped, never misses). Using one takes the turn.
  - Swap row: takes the turn. Retreat: see Retreat.
  - Barrow foes (health, attack, defence, armour, speed, reach and damage, target rule, part): hound (10, 12, 9, 0, 14, melee 2–4, `front-most`, `part.hound-fang` common); barrow archer (8, 12, 8, 0, 11, ranged 2–4, `back-row-first`, `part.grave-fletching` common); restless warden, boss (40, 14, 11, 1, 8, melee 4–7, `most-hurt`, `part.warden-shroud` uncommon). Every fight room, the boss room included, has at least one foe that reaches the back (D-218): the warden's room is the warden, a hound and an archer. Each room lists its foes with their row (melee front, ranged back). Other sites' foes (S3) use this scale: routine health × 0.8, perilous × 1.3, rounded; damage and attack ±1.
- **Round end:** in order (Down, Dying and dead adventurers are never targets): each Down adventurer rolls to bleed to Dying (v0's `bleed`: 3,000 bp − 200 bp per Toughness point above 10); each adventurer Dying since before this roll rolls for death (v0's `deathRoll`: 3,500 bp − 150 bp per Toughness and Resolve point above 10); marks clear; then the flee check: a non-boss band whose Down foes are more than half its foes flees (the rest become `fled`); a boss fight ends when the boss is Down (minions become `fled`). Rout: no adventurer `up`. Foes at 0 health are Down for good (no bleeding, never raised).
- **Retreat (D-126, v0's numbers):** `fight.retreat` on an adventurer's turn. One Wits check by the standing adventurer with the best Wits against the danger (6/9/12 for routine/hazardous/perilous); beats = 1, +1 while carrying anyone Down or Dying, +1 if the check fails. Each beat each standing foe strikes once by its target rule, then the round-end rolls. If anyone stands at the end, the delve ends `retreated`; else `routed`.

**Auto (D-220).** Content rules per class, tried in order, each `{ when, do }` with `when` from a fixed vocabulary: `ally-dying`, `ally-down`, `ally-below-third`, `foe-marked`, `boss-room`, `always`; `do` names an action and a target rule (`most-hurt-ally`, `most-hurt-foe-in-reach`, `first-foe-in-reach`). Each Auto decision rolls a good-choice chance from `delve.auto`: 6,000 bp + 300 bp × (leader's Wits − 10) + 200 bp × (tactics − 10), clamped 3,000–9,500; the leader is the standing member with the best Wits, ties by id. A miss takes the plain attack on the first reachable foe by order. With `saveSkillsForBoss`, rules using a skill are skipped outside the boss room. Pack items: Auto uses a draught only on `ally-dying`.

**Rooms.**

- A site (content, `sites.ts`): `id`, `danger`, `entry` (a choice room whose first option tests the approach's attribute: stealth → Stealth, assault → Might, talk → Presence; its second option is the room's own), `fightRooms` (pool of 5 per site, each 3–5 foes with rows, each with a foe that reaches the back), `choiceRooms` (pool of 3), `boss` (the boss room). Room schema: fight `{ id, foes: { kindId, row }[] }`; choice `{ id, options: [{ attribute, onFailure }, { attribute, onFailure }] }`; words by id in `gate1.en.json`.
- Layout (`delve.rooms`, at `delve.start`): entry, fight, fight, fight, boss (5 rooms); with 5,000 bp one more room after the second fight, a choice room or a fourth fight at equal odds (6 rooms). Fights and choice rooms are drawn without repeats.
- A choice room's check is v0's (5,000 + 500 × (attribute − difficulty), clamped 500–9,500); difficulty by danger 9/11/13 (routine/hazardous/perilous). The player picks the option and a standing tester. `onFailure: 'hurt'`: the tester loses 4 health (not below 1). `onFailure: 'alert'`: the next fight's foes are alerted (they go first in round 1; on the boss room too; a following choice room passes it on). Entry success sets `offGuard` for the first fight; entry failure applies the option's failure.
- Scout ahead (`delve.scout`): once per gap between rooms, only with a standing rogue (the button is hidden otherwise); Stealth check against the danger's difficulty. Success shows the next room (kind, foe kinds, rows and count) and lets the player set the party's rows for that fight before entering, free (`delve.rows`); failure alerts the next room.
- Breather (after a won fight): Down and Dying adventurers stop rolling; Down ones rise to 3 health; Dying ones become Down at 0 and stay out of the next fight (they can be raised by Mend or a draught during it). Skills and the pack don't refill. `delve.next` enters the next room; if no one would stand, the delve ends `routed`.
- Loot: when a fight room is won, each Down foe drops its part with 5,000 bp (the boss 10,000 bp), rolled on `delve.loot`. Fled foes drop nothing. Parts from won rooms are kept on a retreat or rout. The boss's gear piece (S4) only on a win.

**End.** The delve ends when the boss falls (no breather after it: the Down and Dying stop rolling and go home in that state), on a retreat or on a rout. `delve.ended` carries the outcome and, per member: `woundStep` (from the end state: up and above ⅔ → 0, Hurt → 1, Badly hurt → 2, Down → 3, Dying → 4; same numbers as v0's `WOUND`), `injury` (v0's `injuryBp` by end state: Badly hurt 750, Down 2,250, Dying 4,100; rolled on `delve.fight`), `died`. From S3 the guild applies these with its existing recovery (`restDaysPerWoundStep`, injury weeks) and death costs (D-138, minus the reckless-plan renown, which has no meaning without a risk setting). Pay: the offer's fee on a win; 0 on a retreat or rout (`baseGuildRules.payBp`; no partial in gate 1).

**Commands** (all through `simulate`):

- S1: `delve.start` (`siteId`, `approach`, `tactics`, `members: { adventurerId, loadout, row }[]`, `pack: PackItem[]`, `drillBp`); `fight.act` (`actorId`, `actionId`, `targetId?`, `packIndex?`). Foe turns run inside the command that ends the adventurer turn before them, so each command returns at the next adventurer's turn or the fight's end. S1's site is `site.sample-fight` (in `sites.ts`): one fight room, 3 hounds front and an archer back, and no entry or boss; the delve ends with the fight (`delve.ended` with the outcome only; wound steps from S2).
- S2: `delve.choose` (`optionIndex`, `testerId`), `delve.scout`, `delve.rows` (`rows: Record<adventurerId, row>`, only after a successful scout), `delve.next`, `fight.auto` (`on`, `saveSkillsForBoss?`), `fight.step` (one adventurer turn chosen by Auto, with the foe turns after it; emits `fight.acted` with `auto: true`), `fight.retreat`. With Auto on, the page issues `fight.step` every 600 ms so the player sees each turn.
- S1–S2: the page builds the start state with `sampleDelveState(content, seed)` (`delve/sample.ts`: a `GameState` with the sample party as its roster and no guild) and issues `delve.start` with the sample loadouts, `tactics: 12`, `drillBp: 0` and a pack of 2 draughts and 2 firebombs. The seed is a string the page makes from the date and a counter (the UI may read the clock; the engine never does, GAME-01).
- From S3 the page issues `delve.start` after the guild's `delve-ready` stop, with the arriving party, the guildmaster's Tactics, the pack (fixed 2 + 2 until S5) and the booked drill (0 until S5).

**Events:** `delve.started`, `room.entered`, `choice.rolled`, `scout.rolled`, `rows.set`, `round.started` (order, intents), `fight.acted` (actor, action, target, hit `Value`, roll, damage), `health.changed`, `fighter.down`, `fighter.dying`, `fighter.died`, `band.fled`, `fight.ended`, `breather`, `loot.dropped`, `retreat.beat`, `delve.ended`. Each with a cause id (engine AGENTS.md).

**Views (pure):** `fightView(state)`: order strip, intents, each fighter's health and band, reachable targets per action, skill uses left. `previewAction(state, actorId, actionId, targetId)`: `{ hit: Value; damage: { min: Value; max: Value } }`. Both call `hitChance` and `damageRange`, the same functions `fight.act` uses.

### Guild (S3–S5): changes in `packages/engine/src/guild/`

- `GuildRules.delves?: boolean`: when true, `arrive` raises a `delve-ready` stop (class `must`) and leaves the party at the site; `delve.ended` sets the party's outcome, pay, recovery and deaths, and the party starts home that day (`homeDay` = that day + travel days).
- One party at a time in gate 1: `contract.take` is refused while a party is out or a delve is running.
- Guildmaster: `GuildState.guildmaster: { tactics: number }`, set at `guild.found` from content (12).
- Start: a shortlist of 8 (2 per class, `guild.recruit` stream), the first 4 signed free; after that 3 prospects every week and D-138's sign-on fee.
- Board: one offer per site each week (fees by danger from `baseGuildRules`, ±20%).
- Pay, wages and running costs in S3–S4: the existing guild money (`money.changed` events) with the gate 1 starting chest of 4,500; no stipend before S5.
- Recruits: the existing prospect generator (`guild.recruit`, names from `naming.json`), with the 4 gate 1 classes in `gate1/guild.ts`; the founding shortlist draws 2 per class.
- Road events (S3): on each travel day, after arrivals, 4,000 bp on `guild.road`, at most one on the way out and one on the way home; raises a `road-event` stop (`must`) with a card id; `road.choose` (`optionIndex`) applies its effects. Card schema `{ id, options: { effects: ({ kind: 'days'; amount } | { kind: 'health'; amount } | { kind: 'coin'; amount })[] }[] }`: days ±1 to arrival or home, health −3 to one member (drawn on `guild.road`) applied at the delve's start, coin ±50–150. 6 cards in content.
- Money and drills (S5): see S5.

### Content: `packages/content/src/gate1/` (new pack, built like `base`)

`classes.ts`, `foes.ts`, `sites.ts`, `pack.ts` (draught, firebomb), `rarity.ts` (Common, Uncommon, Rare), `guild.ts` (rules above), `road.ts` (S3), `items.ts` (S4), `money.ts` (S5); words in `packages/content/data/gate1.en.json` (names, intents, room and road text, letters). The S1–S2 sample party is `packages/content/data/gate1-sample-party.json`: Odric Hale (warrior, front), Wenna Cray (rogue, front), Brother Amis (cleric, back) with their attributes from `prototype-party.json`, and Maud Fenwick (wizard, back; might 7, agility 11, toughness 8, stealth 9, wits 13, presence 10, resolve 12, lore 16), each with Common gear for their class. The wizard class leads Lore and Wits, wage base 50 (assumption, content).

### UI: `packages/ui/play.html` (new page)

- Built by `packages/ui/vite.play.config.ts` (copy of `vite.map.config.ts` with `play.html`, `play.js`, `play.css`), added to the `build` script so the Vercel build serves `/play.html`.
- `src/play/`: `main.tsx`, `Play.tsx` (screen switch), `save.ts` (localStorage key `play.save`, `{ version, rulesVersion, savedAt, state }`: `version` is the save format, 1 from S1, bumped with an upgrade whenever `GameState`'s shape changes; `rulesVersion` is `GATE1_RULES_VERSION` from `content/src/gate1/index.ts`, bumped whenever a gate 1 number changes, so a run's seed and rules version replay it (GAME-01); a save with an older `rulesVersion` loads with a note on screen; written after every command; an unreadable save is kept under `play.save.unreadable.<time>` and never overwritten, as `step4/Step4.tsx` does; export as copyable text of the same JSON and a file through a download link; import from paste or a file, refused with a message if the version is unknown), `fight/` (D-225's option C as fitted in S1), `delve/`, `clock.ts` (S3: `requestAnimationFrame`, 10 s a day at 1×, 5 s at 2×, paused while the page is hidden; issues `day.advance`; stops on every `must` stop), `map/` (S3: the drawing code of `packages/ui/src/engine-test/phone/` and `src/engine-test/map/`, with the party's position interpolated in the view between its departure, arrival and home days), `guild/` (S3–S5: D-224's screens), `letter/`.
- No game rule in the UI (GAME-02): every number shown comes from `fightView`, `previewAction` or engine state.
- J1's sideways rule is about the page: the fight's stage may scroll sideways inside its own container if S1's fit check chooses that fallback.
- `tools/play-shot.mjs <fight|delve|loop>`: builds nothing; serves `packages/ui/dist` with a static server, drives `/play.html` with Playwright (pre-installed), screenshots to the scratchpad, fails on a console error; `delve` and `loop` turn on Auto and tap through.

### Letter: `packages/engine/src/report/delve-letter.ts` (S3)

A `Letter` (same shape as `quest-report.ts`'s) built from the trip's events: the road event chosen, each room in one line, and up to 3 moments picked by rule in this order: a death, the boss's fall (who struck), an adventurer raised from Dying (who raised them), the most damage dealt in one hit, the most Downs taken. Templates and slot names in `gate1.en.json`; every slot has a fallback phrase, so no slot is ever empty.

### Balance: `tools/balance/`

- A delve mode beside careers in `run.ts`: scenarios `delve-careful` and `delve-auto` play 1,000 seeded delves on the sample party with the same seeds (S2: the barrow; from S3: each site; from S5 also 100 seeded 3-delve games through the guild with the default budget, for the chest target). `delve-auto --compare-policy careful` reports the paired difference.
- `tools/balance/delve-player.ts` (`careful`): raise a Dying ally first (Mend, else a draught), then Mend an ally below ⅓, Ward when two or more foes intend to hit, Guard the most hurt back-row ally when a foe intends to hit them, Firebolt or Strike from shadow on a foe that would then fall, Cleave when two front foes stand, else the plain attack on the most hurt reachable foe; retreat when two members are Down or worse before the boss room; scout whenever it can; choice rooms: the option and tester with the best chance, ties by option order then tester id.
- Stalls: the runner (not the game) stops a fight after 30 rounds and counts it as stalled; target 0.
- Metrics: deaths per delve, win rate, health share and skill uses left at the end, rounds per fight, stalled fights, chest after 3 delves.

## Slices

### S1 One fight

- **First:** fit check of D-225's option C at 375 × 667 with `ui-mockups` (tags only on the picked target and the acting adventurer, intents as a mark above each foe; D-225's proposals); the owner approves before any code.
- **The owner tries:** `/play.html` opens straight into a barrow fight: the sample party against 3 hounds and an archer; they play it to the end on the phone, reload mid-fight and see the same fight; a button starts a new fight.
- **Checks that fail now:** J1, J2; `delve-fight.test.ts`, `delve-determinism.test.ts`, `delve-preview.test.ts`, `tools/play-shot.mjs fight`; `play-save.test.ts` (save written after each command, version 1, unreadable save kept).
- **Files:** `packages/engine/src/delve/{SPEC.md,types.ts,fight.ts,actions.ts,view.ts,sample.ts,index.ts}`, `engine/src/simulate.ts` and `resolution/types.ts` (`GameState.delve`, commands, events), `engine/src/index.ts` exports; `engine/test/delve-*.test.ts`; `content/src/gate1/{classes,foes,pack,rarity,sites,index}.ts` (`sites.ts` holds `site.sample-fight` only), `content/data/gate1.en.json`, `content/data/gate1-sample-party.json`; `ui/play.html`, `ui/vite.play.config.ts`, `ui/package.json` build script, `ui/src/play/{main.tsx,Play.tsx,save.ts,fight/}`, `ui/test/play-save.test.ts`; `tools/play-shot.mjs`; `tools/check-boundaries.mjs` (the delve rule) and a test in `tools/test/` that the rule fires on a fixture import; `engine/AGENTS.md` (delve uses only `streamFor`, a line); `engine/src/resolution/SPEC.md` first line (points to `delve/SPEC.md`). Art: the standees and the burial hall backdrop in `docs/design/art/` (listed in its `README.md`) are copied into `ui/public/play/`; a test in `tools/test/` checks every image there has a ledger line (SAFE-05).
- **Waits on:** none.

### S2 One delve

- **First:** mock-up of the room card, choice room, scout result, breather, retreat and end screens (`ui-mockups`); the owner approves.
- **The owner tries:** a whole barrow delve from the entry room to the warden with the sample party and a pack of 2 draughts and 2 firebombs (fixed until S5): choices, Scout ahead, Auto with save-for-boss, Retreat, the parts at the end; a button starts a new delve.
- **Checks that fail now:** J3; `delve-rooms.test.ts` (layout, choice outcomes, off guard, alerted, off guard and alerted together, scout and rows, breather and Dying, boss and minions, retreat beats, `delve.ended` wound steps, injuries and deaths), `delve-auto.test.ts` (each `when`, the good-choice roll, save-for-boss); J6's S2 targets with stored baselines; `tools/play-shot.mjs delve`.
- **Files:** `delve/{rooms.ts,auto.ts,loot.ts,retreat.ts}`, `simulate.ts`; `content/src/gate1/sites.ts` (the barrow only), words in `gate1.en.json`; `ui/src/play/delve/`; `tools/balance/{delve-player.ts,scenarios.ts,metrics.ts,run.ts}` and `baselines/delve-*.jsonl.gz`; save version unchanged unless the state's shape changes (then 2, with an upgrade and fixture).
- **Waits on:** S1.
- **Then:** the owner plays a few barrow delves and says whether the fights are fun before S3 starts (recommended; see Open questions).

### S3 The loop

- **First:** mock-ups of the guild home (shortlist and board), the map trip with the clock and a road event card, and the letter (`ui-mockups`); the owner approves.
- **The owner tries:** a new game: sign 4 of 8, pick a site and approach, Play, a road event, arrival into the delve, the trip home, the letter; then delves at the other two sites; export the save and import it on another browser.
- **Checks that fail now:** J4; `guild-delve.test.ts` (arrival raises `delve-ready`; the delve's end sets wounds, injuries, deaths, pay, recovery and the trip home; one party at a time), `road.test.ts`, `delve-letter.test.ts` (each template fills from a delve's events with no empty slot, for won, retreated and routed), `play.test.ts`; `tools/play-shot.mjs loop`; J6 across the 3 sites.
- **Files:** `engine/src/guild/{parties.ts,day.ts,types.ts,founding.ts,board.ts}`, `simulate.ts` (`road.choose`), `engine/src/report/delve-letter.ts`; `content/src/gate1/{guild,road}.ts`, `sites.ts` (mill cellar and chapel with their foes: cellar rats, rat king boss, drowned dead, reed-lurker that reaches the back, chapel keeper boss), `gate1.en.json`; `ui/src/play/{clock.ts,map/,guild/,letter/}`, `save.ts` (version bump with upgrade and fixture).
- **Waits on:** S2.

### S4 Gear

- **The owner tries:** the party list and sheet (D-224), the smith (Common stock, 3 Uncommon pieces and 1 Rare offer each week, too-heavy armour greyed, sell-back at half), the boss's gear drop and the loot compare; the fight's odds change with gear.
- **Numbers:** armour limits (D-221): warrior heavy, cleric medium, rogue and wizard light, each may wear lighter; weapon kinds: warrior blade or two-handed axe, rogue dagger, cleric mace, wizard staff or two-handed greatstaff; a two-handed weapon adds +2 damage over the one-handed kind of the same rarity and can't be used with a shield; a shield is a trinket for warriors and clerics, +1 armour; daggers +1 speed; maces ignore 1 foe armour. Trinkets: speed +1; one extra use of the wearer's first skill (applied at `delve.start`); resistance −1 damage from foes with a tag (`beast` or `undead`; foe kinds gain a `tag`). Smith stock (on `guild.smith` at week start, stored in state): every Common item, unlimited; 3 Uncommon items drawn without repeats; 1 Rare offer. Item instances have ids `item.<n>` (a `nextItemNo` counter). About 25 items: a Common, Uncommon and Rare of each class's weapon kinds (blade, dagger, mace, staff) and armour weights, two two-handed weapons, two shields, and trinkets (speed +1, one extra skill use, a resistance: −1 damage from one foe kind); rarity step +500 bp hit and +1 damage (armour: +1 armour); prices Common 110, Uncommon 440, Rare 1,375 copper (2, 8 and 25 weeks of a 55-copper wage, D-221); boss drop by danger: routine Common 50% / Uncommon 50%, hazardous Uncommon 70% / Rare 30%, perilous Uncommon 40% / Rare 60%. Names and flavour lines are writing in `gate1.en.json`. Equipping only while home; `delve.start` reads the equipped items into each `Loadout`.
- **Checks that fail now:** J5's gear part; `gear.test.ts` (rarity steps in `previewAction`, armour limits, two-handed vs shield, smith stock fixed for the week, sell-back half, boss drop by danger); save upgrade test from the S3 fixture.
- **Files:** `engine/src/guild/gear.ts`, `simulate.ts` (`gear.buy`, `gear.sell`, `gear.equip`), `delve/fight.ts` (gear parts in hit and damage), `delve/loot.ts` (boss drop); `content/src/gate1/items.ts`; `ui/src/play/guild/{Party,Sheet,Smith,Compare}.tsx`; `save.ts` bump.
- **Waits on:** S3.

### S5 Money and drills

- **The owner tries:** the weekly budget (4 presets, 3 sliders, the money line), the stipend arriving, the pack refilling from the gear pot (with the short-pot warning), the healing pot shortening recovery, a drill booked in the refit week and its bonus in the next delve.
- **Numbers (starting ideas, D-222; the stipend is tuned to J6's chest target):** starting chest 4,500; stipend 600 a week; weekly sum 250 a week; presets balanced 34/33/33, train hard 60/20/20, patch up 20/20/60, save for gear 20/60/20 (training/gear/healing %; sliders are whole percents summing to 100; amounts are rounded down and the remainder goes to healing); the weekly budget stop is `must`, with a "Keep as is" button; pack items 55 copper each, refilled from the gear pot when a party leaves (as many as the pot pays for, warning if short); healing pot: at homecoming 50 copper per member-day of recovery, spent until the pot or the days run out; drill: 150 copper from the training pot, booked during the refit week for the whole party; its `drillBp` = 500 + 100 × (Tactics − 10), passed to `delve.start` and added as its own `drill` part to the party's hit in the first round of each fight (separate from Tactics' own fight part). Healing pot days come off the rest days the guild computes from the wound step. Weekly order: stipend in, wages and running costs out, then the sum moves from the chest to the pots (only what the chest holds; never below 0).
- **Checks that fail now:** J5's money part; `budget.test.ts` (sum to pots, pots keep, the order above, a chest short of the sum, each `money.changed` carries the running chest and the last equals the state), `drill.test.ts`; J6's chest target.
- **Files:** `engine/src/guild/budget.ts`, `day.ts` (weekly order, the `budget` stop), `simulate.ts` (`budget.set`, `drill.book`, `pack.set`); `content/src/gate1/money.ts`; `ui/src/play/guild/Budget.tsx`; `save.ts` bump.
- **Waits on:** S4.

### S6 Art and the map

- **First:** mock-up of the map's painted detail (D-212); the owner approves.
- **The owner tries:** the kept art in every gate 1 screen where a piece exists (guild home and smith get the portraits; S1 already placed the standees), and the painted detail on the trip map.
- **Checks that fail now:** `tools/play-shot.mjs loop` asserts the map draws the new detail layer (a `data-detail` attribute on the map canvas) and each art image on the guild screens loads. Frame rate: the owner's device reading on a production build (D-154). No new generated art without a quote and approval (LESSONS).
- **Files:** `ui/src/play/map/`, `ui/public/play/`, `docs/design/art/README.md`.
- **Waits on:** S5.

## Verification

- Every push: `node .claude/master/sync.mjs --check && node tools/docs-check.mjs && npm run check`.
- Each slice: its checks, then `npm run build -w @adventure-manager/ui && node tools/play-shot.mjs <fight|delve|loop>`; the screenshots are looked at (VER-06).
- Balance from S2: `node tools/balance/run.ts delve-careful --compare` and `delve-auto --compare`.
- The pass line: the owner plays 3 delves on the phone and records the verdict.

## Open questions

- The scene feel (D-225: "it still doesn't feel like they exist in the scene"): side-on ground art and lit standees are Proposed; decided at S1's fit check or in S6.
- An early playtest after S2: the owner plays a few barrow delves with the sample party and says whether the fights are fun before the loop, gear and money are built (the fresh critic's finding: the fun risk is in the fight, D-203). Recommended; the gate's verdict still comes after S5.
