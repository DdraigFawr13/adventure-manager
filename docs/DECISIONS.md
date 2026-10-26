# Decisions

Settled rules for this project. Not a changelog: an entry stays while the rule is in force. Change a rule here in the same change that changes the behaviour. Mark ideas Proposed until the owner approves them; mark retired entries SUPERSEDED with a pointer, never delete them.

## D-001 Design before code, in three phases

- **Status:** Accepted (2026-10-25)
- **Decision:** Concept until 100% fleshed out, then style design, then a full plan grounded in game-design best practices. No game code before the plan is approved.
- **Why:** Owner's direction at project start; cohesion of mechanics, theme and visuals depends on settling each before the next.

## D-002 Original IP, Pathfinder as inspiration only

- **Status:** Accepted (2026-10-25)
- **Decision:** The game is "Football Manager meets Pathfinder": an adventurers' guild management game. Setting, classes and rules are original; no Paizo names or content.
- **Why:** Avoids licensing exposure while keeping the tabletop-RPG feel.

## D-003 Player is a desk guildmaster; the guild persists

- **Status:** Accepted (2026-10-25)
- **Decision:** The player manages and never fights. The guildmaster has stats that affect how well they do what they focus on. The guild is a persistent character, and control can pass to a successor. Detail: `docs/design/CONCEPT.md` §1.
- **Why:** Owner's choice; keeps the adventurers as the stars and supports long, generational play.

## D-004 Quests: simulation with key moments, tabletop view

- **Status:** Accepted (2026-10-25)
- **Decision:** Quests simulate with decision pauses at key moments; full auto-resolve is an option. A stylised tabletop-style board shows parties on missions. Detail: `docs/design/CONCEPT.md` §2.
- **Why:** Owner's choice; matches FM's watch-and-intervene feel without building a second tactics game.

## D-005 Rival guilds and a tiered ranking; tournaments are events

- **Status:** Accepted (2026-10-25)
- **Decision:** AI rival guilds compete for contracts and adventurers within a tiered ranking. Tournaments are occasional events affecting rewards and reputation. Detail: `docs/design/CONCEPT.md` §3.
- **Why:** Owner's choice; gives FM's league and transfer pressure without turning the game into a sports calendar.

## D-006 Endless sandbox with optional arcs

- **Status:** Accepted (2026-10-25)
- **Decision:** No forced ending. Generational turnover of adventurers and guildmasters; optional story arcs and world crises provide goals. Detail: `docs/design/CONCEPT.md` §4.
- **Why:** Owner's choice; fits guild-as-character succession (D-003).

## D-007 Adventurers: 1–20 attributes plus skills, traits, class levels, talents

- **Status:** Accepted (2026-10-25)
- **Decision:** FM-style 1–20 visible and hidden attributes, with skills, traits, class levels and talents on top. Layer responsibilities still to be split. Detail: `docs/design/CONCEPT.md` §5.
- **Why:** Owner's choice; granular attributes drive scouting and development depth, the RPG layers keep the tabletop feel.

## D-008 Permadeath with rare, costly revival

- **Status:** Accepted (2026-10-25)
- **Decision:** Permanent death; revival is rare, expensive and has a lasting cost. Injuries, scars and trauma are common and long-lasting. Detail: `docs/design/CONCEPT.md` §6.
- **Why:** Owner's choice; real stakes on every key-moment decision without making one bad roll unrecoverable.

## D-009 FM-style day-tick calendar

- **Status:** Accepted (2026-10-25)
- **Decision:** Time advances day by day on Continue, auto-stopping for events, key moments, offers and reports; parties run in parallel. Detail: `docs/design/CONCEPT.md` §7.
- **Why:** Owner's choice; proven management-game pacing.

## D-010 One region, grounded high fantasy

- **Status:** Accepted (2026-10-25)
- **Decision:** The game is set in one large region; tone is grounded high fantasy. Detail: `docs/design/CONCEPT.md` §8.
- **Why:** Owner's choice; depth over breadth makes each place matter.

## D-011 Four guild systems

- **Status:** Accepted (2026-10-25)
- **Decision:** Staff and facilities; finances and patrons; contracts and negotiation; gear, crafting and loot. Detail: `docs/design/CONCEPT.md` §9.
- **Why:** Owner's choice; together they cover FM's backroom, board, transfers and kit.

## D-012 Guild-level kit, storied magic items

- **Status:** Accepted (2026-10-25)
- **Decision:** Armoury with tiered gear, auto-equipped by quartermaster policy; named magic items hand-assigned; crafting by commission. Detail: `docs/design/CONCEPT.md` §9.
- **Why:** Owner's choice; keeps gear meaningful without per-item micromanagement across a large roster.

## D-013 Four recruitment sources

- **Status:** Accepted (2026-10-25)
- **Decision:** Scouted free agents (fog of war), poaching from rivals, a training academy, and story/quest recruits. Detail: `docs/design/CONCEPT.md` §10.
- **Why:** Owner's choice; mirrors FM's scouting, transfers and youth, plus RPG-style story recruits.

## D-014 Standing parties with pre-quest plans

- **Status:** Accepted (2026-10-25)
- **Decision:** Named standing parties with chemistry; per-quest reshuffles allowed; pre-quest plan of roles, approach, risk tolerance and retreat thresholds. Detail: `docs/design/CONCEPT.md` §11.
- **Why:** Owner's choice; gives FM's team selection and tactics an RPG party shape.

## D-015 Launch quest types: delves/hunts and defence/warfare

- **Status:** Accepted (2026-10-25)
- **Decision:** Launch with delves and monster hunts, and defence and warfare. Escorts/expeditions and intrigue/investigation are later candidates. Detail: `docs/design/CONCEPT.md` §12.
- **Why:** Owner's choice; fewer quest families means each simulation is deeper.

## D-016 PC first

- **Status:** Accepted (2026-10-25)
- **Decision:** Desktop PC is the primary platform; UI is designed for mouse, keyboard and long sessions. Detail: `docs/design/CONCEPT.md` §13.
- **Why:** Owner's choice; data-dense management games play best on desktop.

## D-017 Templates first, optional AI flavour

- **Status:** Accepted (2026-10-25)
- **Decision:** Authored templates cover all text offline; AI-written flavour is an optional setting and never affects outcomes. Detail: `docs/design/CONCEPT.md` §14.
- **Why:** Owner's choice; no required service or running cost (SAFE-03), and GAME-03.

## D-018 About 8 classes and 5 ancestries at launch

- **Status:** Accepted (2026-10-25)
- **Decision:** ~8 original classes, ~5 ancestries, with multiclass or prestige paths at higher levels. Detail: `docs/design/CONCEPT.md` §15.
- **Why:** Owner's choice; enough variety for squad-building while each class is simulated in depth.

## D-019 Living region with factions

- **Status:** Accepted (2026-10-25)
- **Decision:** Factions track standing with the guild; the guild's choices change the region's state and faction power. Detail: `docs/design/CONCEPT.md` §16.
- **Why:** Owner's choice; makes contract choice strategic and the world feel responsive without full grand strategy.

## D-020 Guild identity: charter plus earned traits

- **Status:** Accepted (2026-10-25)
- **Decision:** A founding charter (values, specialty, rules) plus traits earned from the guild's record; both affect recruitment, faction trust and morale, and pass to successors. Detail: `docs/design/CONCEPT.md` §17.
- **Why:** Owner's choice; makes the guild a character (D-003) through both intent and history.

## D-021 Adventurers have full FM-style agency

- **Status:** Accepted (2026-10-25)
- **Decision:** Morale, ambitions, demands, refusals, relationships and departures; conversations driven by guildmaster stats; tracked promises. Detail: `docs/design/CONCEPT.md` §18.
- **Why:** Owner's choice; people-management drama is the heart of FM.

## D-022 Delegation to staff; gentle first season

- **Status:** Accepted (2026-10-25)
- **Decision:** Every area can be delegated to staff who act by their stats; the first season introduces systems gradually. Detail: `docs/design/CONCEPT.md` §19.
- **Why:** Owner's choice; FM's proven answer to depth without overload.

## D-023 Free-to-play, cosmetics and supporter pack only

- **Status:** Accepted (2026-10-25)
- **Decision:** Free full game; sells cosmetics and a supporter pack; never gameplay advantage. Detail: `docs/design/CONCEPT.md` §20.
- **Why:** Owner chose F2P; cosmetic-only keeps offline play, permadeath (D-008) and balance intact and avoids a required backend.

## D-024 Single-player only at launch

- **Status:** Accepted (2026-10-25)
- **Decision:** No multiplayer or online social features at launch. Detail: `docs/design/CONCEPT.md` §21.
- **Why:** Owner's choice; keeps the game offline and the effort on the core.

## D-025 Failure continues the story

- **Status:** Accepted (2026-10-25)
- **Decision:** Dismissal leads to a new guild or succession; bankruptcy brings debt and seizure; game over only by the player's choice once guild and career both end. Detail: `docs/design/CONCEPT.md` §22.
- **Why:** Owner's choice; a long sandbox (D-006) shouldn't end on one bad season.

## D-026 Found or take over at game start

- **Status:** Accepted (2026-10-25)
- **Decision:** New games either found a guild or take over an existing one, with difficulty set by that choice. Detail: `docs/design/CONCEPT.md` §23.
- **Why:** Owner's choice; FM-style club selection plus the ownership of founding.

## D-027 Pitch, five pillars and core loop

- **Status:** Accepted (2026-10-25)
- **Decision:** The pitch, pillars (people are the game; you plan, they bleed; a guild that outlives you; a region that remembers; depth on your terms) and four-layer core loop at the top of `docs/design/CONCEPT.md`. Every feature must serve at least one pillar.
- **Why:** Owner approved as written; gives every later design and planning decision a test.

## D-028 Magic: rare and costly now, traditions later

- **Status:** Accepted (2026-10-25)
- **Decision:** Launch magic is rare-ish, costly and respected, with limited daily power and risks. Distinct magic traditions come later; launch design must leave room for them. Detail: `docs/design/CONCEPT.md` §24.
- **Why:** Owner's choice; fits grounded high fantasy (D-010) and storied items (D-012).

## D-029 Guildmaster: background plus growth by doing

- **Status:** Accepted (2026-10-25)
- **Decision:** Background sets starting stats and contacts; stats grow through use; age brings decline and succession. Detail: `docs/design/CONCEPT.md` §25.
- **Why:** Owner's choice; rewards the focus the player actually plays (D-003, D-022).

## D-030 Authored region with procedural sites; generated regions later

- **Status:** Accepted (2026-10-25)
- **Decision:** Launch: hand-made region (6–10 settlements) with seeded procedural sites and contracts. Later: generated regions with authored set pieces, sharing one data format. Detail: `docs/design/CONCEPT.md` §26.
- **Why:** Owner's choice; identity at launch, replayability later.
