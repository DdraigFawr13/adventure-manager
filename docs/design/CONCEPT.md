# Concept

Phase 1 concept. Each section records what the owner decided, with their own notes. Status: complete, locked by the owner on 2026-10-25 (D-045). Changes now need a new DECISIONS entry.

## Pitch, pillars and core loop (Accepted 2026-10-25)

**Pitch:** Run an adventurers' guild across generations. Recruit, develop and manage a roster of flawed, ambitious people, send them into a living frontier region, and live with the consequences.

**Pillars** (every feature must serve at least one; features that serve none are cut):

1. **People are the game.** Every adventurer is a person with stats, ambitions, relationships and a story that the systems remember (§5, §6, §18).
2. **You plan, they bleed.** The player decides and intervenes at key moments; the risk falls on people the player cares about, and consequences are permanent (§2, §6, §11).
3. **A guild that outlives you.** The guild is a character with a charter, earned traits and history, passed between guildmasters (§1, §4, §17).
4. **A region that remembers.** Factions, rivals and the map react to what the guild does and doesn't do (§3, §16).
5. **Depth on your terms.** Every system is deep, and every system can be delegated (§19).

**Core loop:**

- **Daily (seconds, or minutes when it stops):** Continue the calendar → handle stops (key moments, offers, people issues, reports) → adjust.
- **Weekly (a few minutes; pace set by D-064, D-066):** pick contracts → form and brief parties → watch quests on the board → deal with results (loot, injuries, morale, reputation).
- **Seasonal (one in-game year, about 2–2.5 h; D-066):** recruitment windows, contract renewals, facility upgrades, ranking movement, patron review, tournaments.
- **Generational (the save):** heroes age, retire and die; guildmasters succeed one another; the guild's legend and the region change.

## 1. Player role

- **Decided (2026-10-25):** The player is a desk guildmaster: a pure manager who recruits, trains, assigns and negotiates but doesn't fight.
- The guildmaster has their own stats (e.g. judging talent, negotiation, motivation, tactics, contacts) that make them more or less effective at whatever they choose to focus on.
- The guild is itself a persistent character (reputation, traits, history). Control can pass to a successor guildmaster, so the guild outlives any one player character.
- Owner's note: "1 but I like the idea of guild as a character… pass control on to others and you yourself have some stats to influence how effective you are at whatever you choose to do."

## 2. Quest resolution

- **Decided (2026-10-25):** Quests simulate on their own with a readable highlights log and pause at key decisions (push on or retreat, spare a prisoner, spend a costly consumable).
- A setting turns on fully automatic resolution (orders set beforehand, report afterwards) for players who want speed.
- While a party is on a mission there is a visual: stylised, tabletop-style (tokens or minis on a map board), not full 3D models.
- Design note: the board view is driven by the same simulation events as the log (GAME-02), so what the player sees never disagrees with the result.
- **Decided (review, 2026-10-25):** With several parties out at once, each party leader resolves minor moments using the player's risk settings and the leader's own stats. Only major moments (a life at risk, a moral choice, a large reward) stop the calendar. The player watches one party live on the board; the others appear as summary cards.
- Owner's note: "Lets go with 1 but keep 2 as a possibility to turn on… some sort of visual when a team is in a dungeon or on a mission… stylized maybe like a sort of tabletop style."

## 3. Competition

- **Decided (2026-10-25):** AI-run rival guilds compete for the same contracts, can poach adventurers, and sit in an official tiered guild ranking (divisions; climbing unlocks bigger contracts).
- Tournaments exist only as occasional events (e.g. guild trials, monster-hunt cups, arena events), not as the backbone of the season. Results affect rewards, reputation and standing.
- Owner's note: "1 and 4 but only tournaments as an event that takes place and affects rewards and reputation and all that."

## 4. Long game

- **Decided (2026-10-25):** Open-ended sandbox. Seasons roll on; adventurers age, retire and die; new generations arrive; guildmasters succeed one another (see §1).
- Optional story arcs and world crises give medium-term goals without forcing an ending.
- **Decided (review, 2026-10-25):** Timescale makes generations playable: adventurers have short, intense careers (about 6–12 seasons; adventuring is brutal); guildmasters last about 20–30 seasons; quiet periods can be time-skipped.

## 5. Adventurer model

- **Decided (2026-10-25):** FM-style attributes rated 1–20 (roughly 25–35, including hidden ones such as potential, consistency and loyalty), plus skills, traits, class levels and talents.
- **Decided (review, 2026-10-25):** Skills are not a separate layer. Four layers, one job each: attributes (1–20) = aptitude and trained ability; traits = personality and quirks; class levels = role and abilities; talents = choices made at level-up.
- Owner's note: "1 but I like the idea of skills, traits, class levels and talents as well."

## 6. Injury and death

- **Decided (2026-10-25):** Adventurers can die permanently. Revival exists but is rare, expensive and leaves a price (e.g. lost levels or traits, a debt to a temple).
- Injuries, scars and trauma are common and long-lasting, like FM injuries, and feed into the adventurer's traits and story.

## 7. Time

- **Decided (2026-10-25):** An FM-style calendar that advances day by day on Continue and stops automatically for events, quest key moments, offers and reports.
- Several parties run in parallel on the same calendar.
- **Decided (review, 2026-10-25):** The year has an in-world rhythm. An annual Guild Assembly publishes the rankings, applies promotion and relegation, and opens the contract and recruitment season. Winter slows travel and quests.

## 8. Setting frame

- **Decided (2026-10-25):** One large region (a frontier kingdom and its neighbours) with several cities, wilds and dungeons. Deep rather than wide.
- Tone: grounded high fantasy, played fairly straight; grit and humour come from the people.

## 9. Guild systems

- **Decided (2026-10-25):** Four management systems beyond the roster, all real systems:
  1. **Staff and facilities:** trainers, scouts, healers, quartermaster, deputy; guildhall upgrades (training yard, infirmary, library, armoury, tavern).
  2. **Finances and patrons:** wages, contract fees, upkeep, loans; a patron with expectations that can dismiss the guildmaster (which ties into succession, §1). **Decided (review):** the patron is one of the region's factions (§16), a sponsor with its own agenda; changing patron is possible but costly. The ranking stays the public scoreboard and the charter the guild's own values (§17).
  3. **Contracts and negotiation:** quest contracts (fee, loot share, deadlines, clauses) and adventurer contracts (wages, loot cut, release clauses, poaching).
  4. **Gear, crafting and loot:** equipment, magic items, appraisal and sale, armoury.

### Gear depth

- **Decided (2026-10-25):** Guild-level kit. The guild owns an armoury; gear has tiers and a few properties. Notable magic items are named, unique and storied (they gather history as they're used).
- The quartermaster equips adventurers to a policy the player sets; the player hand-assigns special pieces.
- Crafting means commissioning items from contacts or the guild workshop; no crafting minigames. Commissioning moved to Early update (D-070).
- **Amended (2026-10-26, D-143):** gear is per adventurer in RPG-style slots, equipped by hand or by the quartermaster's policy (the two points above now apply per slot); basics are bought from a smith's shop, and buildings may later give discounts or rarer stock.

## 10. Recruitment

- **Decided (2026-10-25):** Four sources of adventurers:
  1. **Scouted free agents:** scouts report on prospects in towns and taverns through a fog of war (attributes shown as ranges until well known).
  2. **Poaching:** approach adventurers at rival guilds (negotiation, release fees); rivals do the same to the player.
  3. **Training academy:** apprentices raised over seasons; cheap, slow, loyal homegrown talent. Moved to Early update (D-070).
  4. **Story and quest recruits:** rescued prisoners, reformed enemies, quest-givers who join; rare and unusual, with built-in backstories.

## 11. Parties and tactics

- **Decided (2026-10-25):** Named standing parties build chemistry and reputation together; the player can reshuffle members for a given quest.
- Before each quest the player sets a plan: roles/formation, approach (stealth, assault, diplomacy), risk tolerance and retreat thresholds.
- Relationships matter: chemistry, friendships and rivalries affect performance.

## 12. Quest types

- **Decided (2026-10-25):** Launch has two families of work:
  1. **Delves and monster hunts:** dungeons, lairs, bounties on named beasts.
  2. **Defence:** hold a village against a raid, garrison a fort. **Decided (review):** multi-party war campaigns move to the first major update (§28).
- Not at launch (assumed candidates for later, not cut): escorts and expeditions; intrigue and investigation.

## 13. Platform

- **Decided (2026-10-25):** PC first (desktop, Steam-style): dense information screens, mouse and keyboard, long sessions. Other platforms only later, if at all.
- Note (2026-10-27, D-149): if a phone or tablet version is made later, it uses the guildhall as hub, a work desk and the living map.
- **Replaced (2026-10-27, D-150, D-151):** mobile first. Launch on iPhone and Android phones, held upright, with the guildhall as hub (D-149); Windows follows after launch.

## 14. Generated writing

- **Decided (2026-10-25):** The game ships with rich handwritten templates (quest reports, backstories, rumours, letters) and works fully offline.
- An optional setting adds AI-written flavour. AI text only describes outcomes the simulation already decided (GAME-03); every AI surface falls back to templates.

## 15. Classes and ancestries

- **Decided (2026-10-25):** About 8 original classes covering the classic roles (working list: warrior, guardian, rogue, ranger, cleric, wizard, druid, bard-like support) and about 5 ancestries at launch.
- Multiclassing or prestige paths open at higher levels.
- Note (plan review, 2026-10-26, D-109): launch has 6 classes and 4 ancestries; the rest, multiclassing and prestige paths follow in updates (PLAN §7a).
- Names and identities are original (D-002); the working list is placeholder.

## 16. World reactivity

- **Decided (2026-10-25):** A living region. Several factions (crown, cities, temples, merchant houses, outlaws) hold standing toward the guild.
- Contracts taken or refused change the region: cleared roads open trade, ignored threats spread, a backed faction can rise. Rival guilds align with factions too.

## 17. Guild identity

- **Decided (2026-10-25):** At founding the player writes a charter: values (honourable ↔ mercenary), a specialty and a few rules.
- The guild earns traits from what it actually does (e.g. "Dragonslayers", "Never Leave a Member Behind", "Bloodied Banner").
- Charter and traits shape who wants to join, which factions trust the guild, and morale. A successor guildmaster inherits them and can try to change course (§1).

## 18. Adventurers as people

- **Decided (2026-10-25):** Full FM-style personalities. Adventurers have morale, ambitions and opinions; they ask for better contracts, refuse quests that clash with their values, demand a place in the top party, form friendships and feuds, and can leave.
- The player manages them through conversations (praise, warn, promise, reassure). Success depends on the guildmaster's stats (§1).
- Promises are tracked; broken promises damage trust and morale.

## 19. Managing complexity

- **Decided (2026-10-25):** Any area (training, scouting, contracts, kit, minor quests and so on) can be delegated to a staff member, who runs it according to their stats. The player focuses where they want; the guildmaster's own stats make their chosen focus matter (§1).
- A gentle first season introduces systems one at a time.
- **Decided (review, 2026-10-25):** A few things are never delegated: choosing contracts, major key moments, and big conversations (contracts, departures, promises). Staff are competent but limited, so the player's own focus visibly beats theirs.

## 20. Business model

- **Decided (review, 2026-10-25; replaces free-to-play):** Premium one-off purchase with a free demo (for example, the first seasons free).
- No microtransactions and no gameplay advantage for sale. Paid expansions are not decided.
- Owner chose this after the review noted that cosmetics-only free-to-play earns little in an offline single-player game.

## 21. Multiplayer

- **Decided (2026-10-25):** Single-player only at launch. Social features may be considered later.

## 22. Failure

- **Decided (2026-10-25):** Failure continues the story rather than ending the save.
- Dismissal by the patron: the guildmaster can take over a struggling guild elsewhere (like FM job offers), or the player continues as the old guild's successor guildmaster (§1).
- Bankruptcy brings debt, seized assets and a reputation hit, not an instant end.
- The save ends only if both the guild and the guildmaster's career end and the player chooses not to continue.

## 23. Game start

- **Decided (2026-10-25):** The player either founds a new guild (writes the charter, tiny roster, bottom tier, low expectations) or takes over an existing guild from a list ranging from a struggling bottom-tier hall to an established top guild with high patron expectations.
- Difficulty comes from that choice.

## 24. Magic

- **Decided (2026-10-25):** At launch, magic is real and powerful but not everyday. Casters are valuable, expensive recruits; spells draw on limited daily power and can carry risks (fatigue, mishaps, corruption for dark arts). Magic items are prized and storied (§9).
- Later: distinct magic traditions (arcane, divine, primal, occult-like) with their own rules, factions and politics, each class drawing on one. Launch magic is designed so traditions can be added without reworking it.
- Owner's note: "1 and eventually 4."

## 25. Guildmaster progression

- **Decided (2026-10-25):** The player picks a background at creation (e.g. ex-adventurer, merchant, noble, scholar) that sets starting stats and contacts.
- Stats improve through use: negotiating raises Negotiation, personally running training raises Coaching, and so on.
- Age eventually brings decline and retirement, which triggers succession (§1).

## 26. Region map

- **Decided (2026-10-25):** At launch, one authored region (fixed cities, factions, landmarks and history), about 6–10 settlements and a handful of distinct biomes. Dungeons, lairs, monster spawns and many contracts are generated from seeded templates (GAME-01) for replayability.
- Later: a generated-region mode (new geography, cities and factions per save) with authored set pieces, key locations and story arcs placed into it. Region data is built so both modes share one format (GAME-04).
- Owner's note: "1 but eventually 4."

## 27. Guild size

- **Decided (2026-10-25):** A new guild starts with about 4–6 adventurers (one party). A top guild runs about 25–40 adventurers across 4–8 parties, plus apprentices and about 10–15 staff.
- Sized so squad depth and rotation matter while every adventurer stays a person (Pillar 1).

## 28. Scope tiers

- **Decided (review, 2026-10-25):** Every feature is tagged Launch, Early update or Later, and launch is a "minimum lovable" game.
- **Tiers (confirmed 2026-10-25):**
  - **Launch:** §1–§11, §12 delves/hunts and small-scale defence, §13, §14 templates, §15–§23, §24 launch magic, §25, §26 authored region, §27, §29 saves, §30 guild knowledge, §31 chronicle, §32 news and inbox; content stored as data (§33).
  - **Early update:** multi-party war campaigns; optional AI flavour (§14); escorts and expeditions; training academy (§10) and item commissioning (§9) (D-070).
  - **Later:** intrigue and investigation; magic traditions (§24); generated regions (§26); public mod tools (§33); social features (§21).

## 29. Saves and permadeath

- **Decided (review, 2026-10-25):** The default mode autosaves on every day tick and keeps one save per guild (Ironman-style), so permadeath can't be undone by reloading.
- An optional "Storyteller" mode allows manual saves.

## 30. Guild knowledge

- **Decided (review, 2026-10-25):** Knowledge is a resource, like FM's opposition scouting. The guild researches monsters, dungeons and rivals through the library, scouts and survivors' reports.
- Better knowledge gives better quest plans and reveals key-moment options (Pillars 2 and 5).

## 31. Chronicle and Hall of Heroes

- **Decided (review, 2026-10-25):** An automatically written guild history: memorials for the dead, legendary deeds, the histories of storied items, and records.
- Built from the simulation's own event log; it's the payoff for Pillar 3.

## 32. News and inbox

- **Decided (review, 2026-10-25):** FM's inbox, told in-world: letters, town criers, gossip. Rumours become contract leads.
- The main surface for the optional AI flavour (§14), always with template fallbacks.

## 33. Mod support

- **Decided (review, 2026-10-25):** Classes, monsters, regions and quests live in data files from the start (GAME-04), so mod support can be opened up later without reworking the engine.
