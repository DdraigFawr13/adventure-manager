# Gate 1: one delve

- **Status:** Draft
- **Planned in:** fight forms (D-218), gear and money forms (D-221), mock-ups (D-224, D-225), spec questions https://claude.ai/artifact/GSbKtp9CWP54BN3pAQfUtQ (owner, 2026-11-05: "go with all recommended"). **Decisions:** D-213–D-225, D-226–D-229 (this spec's answers).

## Problem

The owner, on the replan (D-213): "I just didn't feel like this game was becoming something fun but the concept does sound really fun to me but I think I need some more involvement in this to become invested." On the first prototype (D-203): "Nothing felt very punchy or impactful", "just jumping through time is boring", and "I want to be able to run continuous real time actually with pause … look at the map and see them moving". Today a quest resolves on its own on arrival (`packages/engine/src/guild/parties.ts:33`); the player watches letters, never a fight.

## Goals

- The owner recruits a party, equips it, splits the weekly budget, watches it travel the map in real time, plays a delve room by room with fights they lead, and reads a letter home that retells what happened. **Pass line (D-213):** after 3 delves the owner wants to start a 4th; recorded in DECISIONS in the owner's words.
- A led fight takes about 3–5 minutes on a phone held upright (D-218), measured by the owner.
- Played well (the balance runner's `careful` player), about 1 delve in 10 costs a life; Auto wins within 5 points of `careful` but ends delves with less health and fewer skill uses (D-220); after 3 delves the chest is up, by less than one Rare price (spec questions).
- Same seed and same commands give the same delve, and a reload mid-fight that repeats the same choices gives the same result (D-218, GAME-01).

## Non-goals

- Several parties, threats, towns with needs, scars, gear wear, craftsmen and upgrades with parts, the quartermaster, status effects, critical-hit flash, disobedience, the temple revive (gate 2, D-220, D-223).
- The guild house, ageing, careers and rivals in the gate 1 game (gate 3). Guildmaster growth.
- AI-written letters (later; GAME-03 template now).
- Porting the year, career and resolution simulators to the new fight: they keep resolution v0 until gate 2 (spec questions).
- Store apps, Windows, sound.
- Epic, Legendary and Divine gear; materials (D-221).

## Journeys and checks

### J1 Lead a fight

- **Given** a party of 4 (warrior, rogue, cleric, wizard) in a barrow fight room with 3–5 foes, at least one of which reaches the back row
- **When** the player taps an adventurer's skill, sees a foe's hit % and damage on the first tap, and strikes on the second
- **Then** turns follow the speed strip, each foe shows its intent at the round's start, bars drop and show Hurt / Badly hurt / Down, and the band flees when more than half of it is Down. **Check:** `packages/engine/test/delve-fight.test.ts` (one test per rule below); `tools/play-shot.mjs fight` screenshots at 375 × 667 and 443 × 900, no vertical scroll in the fight frame at 375 × 667.

### J2 Reload mid-fight

- **Given** a fight saved after round 2
- **When** the page reloads and the player repeats the same choices
- **Then** every roll and the end state match. Showing intents and odds draws no roll. **Check:** `delve-determinism.test.ts` (the one determinism test, GAME-06); `delve-preview.test.ts` (calling the view functions leaves `state.rng` and every keyed result unchanged).

### J3 Play a whole delve

- **Given** a party at a site
- **When** the player goes through 5–6 rooms (choice rooms, 3–4 fights, then the boss with 1–2 minions), uses Scout ahead, a draught and a firebomb, and taps Auto in one fight
- **Then** wounds carry between rooms, the breather raises Down allies a little and leaves Dying ones Down, skills don't refill, the boss never flees and its minions flee when it falls, and the delve ends won, retreated or routed with parts (and from S4 the boss's gear piece). **Check:** `delve-rooms.test.ts`, `delve-auto.test.ts`; Playwright `tools/play-shot.mjs delve` plays one delve on Auto start to end without an error.

### J4 The loop

- **Given** a new game
- **When** the player signs 4 of the shortlist, takes a site from the board, presses Play, meets a road event, plays the delve, travels home and reads the letter
- **Then** the clock stops itself for each of those, the party moves on the map, and the letter names who did what. Export, then import into a fresh browser, gives the same game. **Check:** `packages/ui/test/play.test.ts` (save round trip, unreadable save kept, export–import equality); `tools/play-shot.mjs loop`.

### J5 Equip and budget

- **Given** a party home from a delve
- **When** the player buys an Uncommon blade for the warrior at the smith, compares a looted piece, sets the sliders to "train hard" and books a drill
- **Then** the fight's hit % and damage on that warrior change by the item's step, the pots and the chest move as the money line shows, and the next delve starts with the drill's bonus. **Check:** `gear.test.ts`, `budget.test.ts`, `drill.test.ts`; screenshots of the D-224 screens.

### J6 Balance

- **When** `node tools/balance/run.ts delve-careful` and `delve-auto` run
- **Then** they report deaths per delve, win rate, health and skill uses left, and chest after 3 delves against the targets above. **Check:** both scenarios exist and print `ok` or `near` for each target with a stored baseline.

## Decisions

Settled before this spec: D-213–D-225. This spec's answers (all the owner's recommended options, 2026-11-05), recorded in DECISIONS:

- **D-226 Fight rule gaps:** party melee hits the foes' front row while any foe stands there; ranged attacks and spells reach any foe. Rogue's plain attack throws a knife (small hit, any row). Wizard's plain attack is Spark (small hit on any foe; allies +10% hit on it this round). A band flees when more than half its foes are Down; the boss never flees, and its minions flee when it falls. At the breather a Dying ally stops bleeding but stays Down for the next room unless Mend or a draught raises them. Tactics gives +1% hit per point above 10 to everyone in a fight; gate 1 has one fixed guildmaster with a Tactics score set at the start.
- **D-227 The delve:** rooms without a fight are choice rooms (two ways through, each testing an attribute; the player picks the way and who tries; failure costs the tester health or warns the next room). Only the plan's approach stays: it sets what the entry room tests, and success there catches the first fight's foes off guard. Gate 1 has 3 sites: the Hollow Barrow (hazardous), the mill cellar (routine), the drowned chapel (perilous), rooms drawn from each site's pool.
- **D-228 Time and the trip:** real time with pause and 1×/2×; the clock stops itself for a road event, arrival, a letter and the weekly budget; 10 seconds a day at 1×. 1–2 road events a trip, as choice cards with costs or gains. The letter home is built from templates out of what really happened; AI text later.
- **D-229 Targets and build:** played well, about 1 delve in 10 costs a life; after 3 delves the chest is a little up (a Rare offer affordable around delve 4). The new fight is a new `delve` system beside resolution v0, which stays only for the simulators until gate 2.

## Alternatives rejected

- **Rewrite resolution v0 and port the simulators now:** rejected by the owner (spec questions); it would delay the first playable fight by an estimated 2–3 sessions of re-tuning 26-year careers gate 1 doesn't use. Fails when gate 2's unled parties need the new fight: that is when v0 retires.
- **Anyone may hit any foe:** rejected; it makes the rogue's and wizard's reach worthless and breaks Cleave's "front-row" wording (D-219).
- **Flee at half Down; flee on a health share:** half ends 4-foe fights at 2 down; health share is hard to read on the bar.
- **A boss that flees with its drop:** contradicts the guaranteed boss drop (D-221).
- **Breather gets Dying allies up / Dying keeps rolling:** the first makes Dying and Down the same; the second kills often when the cleric is the one Down.
- **Rooms without fights as plain rolls or rest rooms:** a roll the player only watches; rest rooms undo D-218's carried wounds.
- **One site / four sites:** one site risks staleness before delve 4 (the pass line); the deadly spire adds a fourth boss for little gain at slice size.
- **A next-day button; real time on the trip only:** the owner asked for continuous time with pause (D-203).
- **AI letters in gate 1:** needs a key and running cost (SAFE-01), and GAME-03 needs the template anyway.
- **Rolls from the stored stream state (`streamFor`):** a reload that repeats choices would still match, but a preview that drew a roll would shift every later roll; keyed streams make "keyed to the fight, round and actor" (D-218) literal and make previews safe by construction.
- **Extend the step 4 page:** its screens are a letters desk; gate 1's screens are new (D-224). It stays as it is.

## Risks

- **The fight is long or crowded on a 375 × 667 phone** (D-224 measured 809 px; D-225's open notes) → S1 starts with a fit check of layout C at 375 × 667 (mock-up, owner approves), and J1's check measures it.
- **Two fight rule sets drift** → v0 is frozen; no gate 1 code imports `resolution/`'s fight; the boundary check gains a rule that `delve/` imports nothing from `resolution/quest.ts`, `turn.ts`, `actions.ts`, `harm.ts`, `encounters.ts`.
- **Auto too good or too bad**, so leading feels pointless or Auto feels punishing → the balance runner's two policies (J6) are run at S2 and every slice after.
- **The pass line fails on content, not rules** (staleness by delve 3) → 3 sites with room pools; road events and letters vary by template; the owner's playtest notes after S3 decide whether S4/S5 come before more content.
- **Save shape changes across slices** → the save carries a version; S4 bumps it with an upgrade (GAME-05), tested.

## Design

### Engine: `packages/engine/src/delve/` (new; its `SPEC.md` is written from this section in S1)

- **State:** `GameState.delve: DelveRun | null` (new optional field; v0's `quest` untouched). `DelveRun`: `id`, `partyId`, `siteId`, `rooms: RoomPlan[]` (drawn at start), `roomIndex`, `phase: 'choice' | 'fight' | 'breather' | 'ended'`, `fighters: Fighter[]` (party, health carried), `fight: FightState | null`, `pack: string[]` (item kind ids, max 4), `skillUses: Record<adventurerId, Record<skillId, number>>`, `auto: { on: boolean; saveSkillsForBoss: boolean }`, `bonuses` (drill, off guard, warned), `loot: { parts: PartDrop[]; gear: ItemInstance[] }`, `outcome: 'won' | 'retreated' | 'routed' | null`.
- **Fighter:** `id`, `side: 'party' | 'foe'`, `kindId` (class or foe kind), `row: 'front' | 'back'`, `health`, `maxHealth`, `speed`, `status: 'up' | 'down' | 'dying' | 'dead' | 'fled'`, round marks (`hitThisRound`, `guardedBy`, `sparked`, `warded`). Health bands: Hurt below ⅔, Badly hurt below ⅓, Down at 0 (D-218).
- **FightState:** `round`, `order: string[]` (fighter ids, by speed, ties by id, D-129), `turn` (index), `intents: Record<foeId, Intent>` (`{ actionId, targetId }`, picked at round start), `isBoss`.
- **Rolls (D-218):** a new `keyedRoll(state, key)` in `core/rng.ts` returns an `RngStream` derived from `(state.seed, key)` without writing `state.rng`. Keys: `delve:<id>:layout`, `delve:<id>:room:<n>:choice`, `fight:<delveId>:<room>:<round>:<actorId>`, `delve:<id>:loot:<room>`, `road:<partyId>:<day>`, `smith:<week>`. Each actor's turn draws only from its own key, so a preview never moves anything. Engine AGENTS.md and STANDARDS gain this second source, keyed, beside `streamFor`.
- **Hit and damage (one function each, used by preview and commit, GAME-02):** `hitChance(state, actorId, actionId, targetId): Value` = base 50% + 5% × (attacker's attribute − target's defence) + weapon rarity step + Tactics (+1%/point above 10) + marks (Spark +10%, Ward −) + bonuses, clamped 5–95% (v0's check numbers, content). `damageRange(…): { min: Value; max: Value }` = action's range + weapon kind and rarity (+1/step) − target's armour, at least 1. Adventurers' defence = 10 + (Agility − 10) / 2, rounded down, + armour (assumption, content number).
- **Reach:** melee needs the target in the foes' front row while any foe stands there; ranged and spells reach any. Foes: melee targets the party's front while anyone stands there (D-218). Each foe kind has `reach: 'melee' | 'ranged'`.
- **Actions** (content `delve.actions`, each one rule kind, GAME-04): plain attacks `knockback` (warrior: target moves one place later in the order), `heal-one` (cleric: a hit, and the most hurt standing ally heals 1; ties by order), `throw` (rogue: small hit, any row), `spark` (wizard). Skills: `guard`, `cleave`, `shadow-strike`, `hamstring`, `mend` (heal a standing ally or raise a Down or Dying one), `ward`, `firebolt`, `haste`. Items: `draught` (heal or raise), `firebomb` (small hit on every foe in one row). `swap` (change row, costs the turn). Retreat (D-126's beats: each beat the standing foes strike once and the fallen bleed).
- **Round:** start: foes pick intents by their kind's target rule (`front-most`, `most-hurt`, `back-row-first`; re-pick by the same rule if the target falls). Turns run down the order; an adventurer's turn waits for `fight.act` (or Auto picks); a foe acts on its intent. End: each untended Down adventurer rolls to bleed to Dying; each Dying one rolls for death (D-124 numbers); a band with more than half its foes Down flees (non-boss); a boss fight ends when the boss is Down (minions flee). Rout: no adventurer standing.
- **Auto (D-220):** content rules per class, in order, each `{ when, do }` (e.g. `ally-down → mend`, `foe-most-hurt-in-reach → attack`). Each Auto decision rolls a good-choice chance from the leader's Wits and Tactics (content); on a miss it takes the plain attack on the first reachable foe by order. With `saveSkillsForBoss`, skill rules are skipped outside the boss room.
- **Rooms:** a site (content) has `danger`, `entry` (choice room testing the approach's attribute), `fightRooms` pool, `choiceRooms` pool, `boss` room. Layout: entry choice, 3–4 fights drawn from the pool, 0–1 extra choice room, boss: 5–6 rooms. A choice room has two options `{ attribute, difficulty, onFailure: 'hurt' | 'warn' }`; `warn` gives the next fight's foes +1 speed rank for round 1 (they act first); entry success sets `offGuard` (the first fight's foes skip round 1's actions, shown as "caught off guard" intents). Scout ahead: between rooms, needs a standing rogue, a Stealth check against the site's danger: success shows the next room's foes; failure warns it.
- **Breather:** after a won fight: Down allies rise to a content amount of health; Dying allies stop rolling and stay Down; skills don't refill; the pack doesn't refill.
- **Loot:** Down foes drop parts by their kind's table (rolled at the room's end, keyed); the boss drops one gear piece, rarity rolled by danger (S4).
- **End:** won (boss Down), retreated, routed. Each survivor's band maps to a wound step for the guild's existing recovery (`restDaysPerWoundStep`, `guild/parties.ts`) and the existing injury roll; the dead follow the guild's death rules (D-138).
- **Commands** (all through `simulate`): `delve.start` (partyId, siteId; issued by the guild on arrival), `delve.choose` (optionIndex, testerId), `delve.scout`, `delve.next` (leave the breather), `fight.act` (actorId, actionId, targetId?, itemId?), `fight.auto` (on, saveSkillsForBoss?), `fight.retreat`. A `delve.ready` must-stop is raised on arrival instead of v0's quest when the rules say `guild.delves: true`.
- **Events:** `delve.started`, `room.entered`, `choice.rolled`, `round.started` (intents), `fight.acted` (actor, action, target, hit `Value`, roll, damage), `health.changed`, `fighter.down`, `fighter.dying`, `fighter.died`, `band.fled`, `fight.ended`, `breather`, `scout.rolled`, `loot.dropped`, `delve.ended`. Each with a cause id.
- **Views (pure, no state change):** `fightView(state)`: order strip, intents, each fighter's band; `previewAction(state, actorId, actionId, targetId)`: `{ hit: Value, damage }`. Both call the same functions as `fight.act`.

### Content: `packages/content/src/gate1/` (new pack)

- `classes.ts`: the 4 classes with health base (warrior 24, rogue 18, cleric 18, wizard 14: starting ideas; rogue's and cleric's are assumptions), speed attribute (Agility), attack attribute, plain attack, 2 skills, Auto rules, armour limit; the wizard leads Lore and Wits, wage base 50 (assumption).
- `foes.ts`: about 8 kinds over 3 sites (barrow hounds, the restless warden as the barrow boss, a barrow archer that reaches the back, cellar rats, a rat-king boss, drowned dead, a chapel keeper boss, a reed-lurker that reaches the back): health, defence, speed, damage, reach, target rule, part table. Names English in `data/gate1.en.json`.
- `sites.ts`: the 3 sites and their room pools; `rooms.en.json` for choice room words.
- `items.ts` (S4): about 25 items (D-221); `money.ts` (S5): stipend, chest, weekly sum, presets, pack price, drill.
- `road.ts` (S3): about 6 road event cards.
- `letters.en.json` (S3): templates for the letter.
- `guild.ts`: `baseGuildRules` with gate 1 changes: `delves: true`, party size 3–4, shortlist every week (3 prospects), the starting shortlist of 8 (2 per class) signed free, sign-on fee after that (D-138), a guildmaster `{ tactics: 12 }` (assumption), the 3 sites on the board each week (fee by danger with spread).

### UI: `packages/ui/play.html` (new page, `vite.play.config.ts`, added to `npm run build -w @adventure-manager/ui`)

- `src/play/`: `Play.tsx` (screens), `save.ts` (localStorage key `play.save`, versioned; unreadable saves kept under `play.save.unreadable.<time>` like step 4; export as copyable text and a file, import from paste or a file), `clock.ts` (1×/2×, 10 s a day at 1×; issues `day.advance`; stops on must-stops), `fight/` (layout C: stage, standees, turn strip, command panel, intents), `delve/` (room card, choice, breather, loot), `map/` (reuses `engine-test/phone/` drawing with the party's position from the engine's party days, interpolated in the view), `guild/` (D-224's party, sheet, smith, budget screens), `letter/`.
- Words from `packages/content/data/play.en.json`; no game rule in the UI (GAME-02): every number shown comes from `fightView`, `previewAction` or engine state.
- `tools/play-shot.mjs <fight|delve|loop>`: Playwright on the built page at 375 × 667 and 443 × 900; screenshots to the scratchpad; fails on a console error or on vertical overflow of the fight frame.

### Balance: `tools/balance/`

- A delve mode beside careers: scenarios `delve-careful` and `delve-auto` play 200 seeded delves per site with the starting party (and 100 three-delve runs for the chest target). `careful` is a scripted player in `tools/balance/delve-player.ts` (best reachable target, skills when they swing a fight, raise Down allies, retreat when two are Down before the boss); `auto` uses the content's Auto rules. Metrics: deaths per delve, win rate, health share and skill uses left at the end, fight rounds, chest after 3 delves. Targets as in Goals.

## Slices

### S1 One fight

- **First:** fit check of layout C at 375 × 667 with `ui-mockups` (D-225's open notes: tags only on the picked target and the acting adventurer, intents as a mark above each foe); the owner approves before code.
- **The owner tries:** `/play.html` opens straight into a barrow fight room: the 4-person sample party (Odric, Wenna, Amis and a wizard from `prototype-party.json` plus one new entry) against hounds and a barrow archer; plays it to the end on the phone; reloads mid-fight and sees the same state.
- **Checks that fail now:** J1, J2; `delve-fight.test.ts` (turn order, reach, intents, hit and damage, each action, bands, bleed and death, flee, rout), `delve-determinism.test.ts`, `delve-preview.test.ts`, `tools/play-shot.mjs fight`.
- **Files:** `packages/engine/src/delve/{SPEC.md,types.ts,fight.ts,actions.ts,view.ts}` and `core/rng.ts` (`keyedRoll`), `simulate.ts` (fight commands); `packages/engine/test/delve-*.test.ts`; `packages/content/src/gate1/{classes,foes}.ts`, `data/gate1.en.json`, `prototype-party.json` (wizard); `packages/ui/play.html`, `vite.play.config.ts`, `package.json` build script, `src/play/{main.tsx,Play.tsx,save.ts,fight/}`; `tools/play-shot.mjs`; `tools/check-boundaries.mjs` (delve may not import v0's fight files); `packages/engine/src/resolution/SPEC.md` first line (points to delve/SPEC.md).
- **Waits on:** none.

### S2 One delve

- **First:** mock-up of the room card, choice room, breather and loot screens (`ui-mockups`), owner approves.
- **The owner tries:** a whole barrow delve from the entry room to the warden: choices, Scout ahead, the pack (2 draughts, 2 firebombs, fixed until S5), Auto with save-for-boss, Retreat, the parts at the end; a new delve from a button.
- **Checks that fail now:** J3; `delve-rooms.test.ts` (layout 5–6 rooms, choice outcomes, off guard, warn, scout, breather and Dying, boss and minions, retreat beats, end mapping to wound steps), `delve-auto.test.ts`; J6 scenarios exist and report (targets tuned here, numbers moved in content only); `tools/play-shot.mjs delve`.
- **Files:** `delve/{rooms.ts,auto.ts,loot.ts}`, `simulate.ts`; `content/src/gate1/sites.ts` (barrow only), `rooms.en.json`; `ui/src/play/delve/`; `tools/balance/{delve-player.ts,scenarios.ts,metrics.ts,run.ts}` and baselines.
- **Waits on:** S1.

### S3 The loop

- **First:** mock-ups of the guild home (shortlist and board), the map trip with the clock and a road event card, and the letter (`ui-mockups`), owner approves.
- **The owner tries:** a new game: sign 4 of 8, pick a site and approach, Play, a road event, arrival into the delve, the trip home, the letter; then a second and third delve at the other two sites; export the save and import it on another browser.
- **Checks that fail now:** J4; `guild-delve.test.ts` (arrival raises `delve.ready`, the delve's end sets wounds, deaths, pay and recovery), `road.test.ts`, `letter.test.ts` (each template fills from a delve's events, no empty slot), `play.test.ts`; `tools/play-shot.mjs loop`.
- **Files:** `engine/src/guild/{parties.ts,day.ts,types.ts}` (delve on arrival behind `delves: true`; `road-event` stop and `road.choose`), `engine/src/report/delve-letter.ts`; `content/src/gate1/{guild,sites,road}.ts`, `letters.en.json` (mill cellar and chapel rooms and bosses); `ui/src/play/{clock.ts,map/,guild/,letter/,save.ts}`.
- **Waits on:** S2.

### S4 Gear

- **The owner tries:** the party list and sheet (D-224), the smith (stock, Uncommon pieces, the weekly rare offer, too-heavy armour greyed, sell-back), the boss's gear drop and the loot compare; the fight's odds change with gear.
- **Checks that fail now:** J5's gear part; `gear.test.ts` (rarity steps, armour limits, two-handed vs shield, stock keyed to the week, sell-back half, boss drop by danger), save upgrade v1 → v2 test.
- **Files:** `engine/src/delve/gear.ts` (or `guild/gear.ts`), `simulate.ts` (`gear.buy`, `gear.sell`, `gear.equip`), save version 2 with upgrade; `content/src/gate1/items.ts`, `items.en.json`; `ui/src/play/guild/{Party,Sheet,Smith,Compare}.tsx`.
- **Waits on:** S3.

### S5 Money and drills

- **The owner tries:** the weekly budget (4 presets, 3 sliders, the money line), the stipend arriving, the pack refilling from the gear pot (with the short-pot warning), the healing pot shortening recovery, a drill booked in the refit week and its bonus in the next delve.
- **Checks that fail now:** J5's money part; `budget.test.ts` (sum moves to pots, pots keep, the money line adds up), `drill.test.ts` (Tactics makes it stronger); J6's chest target.
- **Files:** `engine/src/guild/budget.ts`, `day.ts` (weekly sum, stipend, budget stop), `simulate.ts` (`budget.set`, `drill.book`, `pack.set`); `content/src/gate1/money.ts`; `ui/src/play/guild/Budget.tsx`.
- **Waits on:** S4.

### S6 Art and the map

- **First:** mock-up of the map's painted detail (D-212), owner approves.
- **The owner tries:** the kept standees and backdrops in the fight and delve screens (S1 uses them already where they exist), the painted detail on the trip map.
- **Checks that fail now:** `tools/play-shot.mjs loop` screenshots show the art; 60 fps target measured on a production build (D-154; the owner's device number).
- **Files:** `ui/src/play/map/`, `engine-test/phone/` drawing, `docs/design/art/README.md` ledger.
- **Waits on:** S3.

## Verification

- Every push: `node .claude/master/sync.mjs --check && node tools/docs-check.mjs && npm run check`.
- Each slice: its checks above, then `npm run build -w @adventure-manager/ui && node tools/play-shot.mjs <fight|delve|loop>`; screenshots looked at (VER-06).
- Balance from S2: `node tools/balance/run.ts delve-careful --compare` and `delve-auto --compare`.
- The pass line: the owner plays 3 delves on the phone after S5 (or earlier if they choose) and records the verdict.

## Open questions

- The scene feel (D-225 "it still doesn't feel like they exist in the scene"): side-on ground art and lit standees are Proposed; decided at S1's fit check or S6.
- Whether gate 1 should start at S3's loop before gear and money if the owner's S2 playtest says the fight is fun but repetitive.
