# Decisions

Settled rules for this project. Not a changelog: an entry stays while the rule is in force. Change a rule here in the same change that changes the behaviour. Mark ideas Proposed until the owner approves them; mark retired entries SUPERSEDED with a pointer, never delete them.

## D-001 Design before code, in three phases

- **Status:** Accepted (2026-10-25)
- **Decision:** Concept until 100% fleshed out, then style design, then a full plan grounded in game-design best practices. No game code before the plan is approved.
- **Why:** Owner's direction at project start; cohesion of mechanics, theme and visuals depends on settling each before the next.
- **Amended (2026-10-26, D-115):** the plan is approved; game code may start, beginning with M1.

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

## D-012 Guild-level kit, storied magic items (amended by D-143: per-adventurer slots)

- **Status:** Accepted (2026-10-25)
- **Decision:** Armoury with tiered gear, auto-equipped by quartermaster policy; named magic items hand-assigned; crafting by commission. Detail: `docs/design/CONCEPT.md` §9.
- **Amended (2026-10-26, D-143):** gear is per adventurer in RPG-style slots, equipped by hand or by the quartermaster's policy; basics are bought from a smith's shop.
- **Amended:** Commissioning items moves to Early update (D-070).
- **Why:** Owner's choice; keeps gear meaningful without per-item micromanagement across a large roster.

## D-013 Four recruitment sources

- **Status:** Accepted (2026-10-25)
- **Decision:** Scouted free agents (fog of war), poaching from rivals, a training academy, and story/quest recruits. Detail: `docs/design/CONCEPT.md` §10.
- **Amended:** The training academy moves to Early update; launch has three sources (D-070).
- **Why:** Owner's choice; mirrors FM's scouting, transfers and youth, plus RPG-style story recruits.

## D-014 Standing parties with pre-quest plans

- **Status:** Accepted (2026-10-25)
- **Decision:** Named standing parties with chemistry; per-quest reshuffles allowed; pre-quest plan of roles, approach, risk tolerance and retreat thresholds. Detail: `docs/design/CONCEPT.md` §11.
- **Why:** Owner's choice; gives FM's team selection and tactics an RPG party shape.

## D-015 Launch quest types: delves/hunts and defence/warfare

- **Status:** Accepted (2026-10-25); war campaigns moved to the first major update by D-035
- **Decision:** Launch with delves and monster hunts, and defence and warfare. Escorts/expeditions and intrigue/investigation are later candidates. Detail: `docs/design/CONCEPT.md` §12.
- **Why:** Owner's choice; fewer quest families means each simulation is deeper.

## D-016 PC first

- **Status:** Accepted (2026-10-25)
- **Decision:** Desktop PC is the primary platform; UI is designed for mouse, keyboard and long sessions. Detail: `docs/design/CONCEPT.md` §13.
- **Why:** Owner's choice; data-dense management games play best on desktop.
- **Replaced (2026-10-27, D-151, D-155):** mobile first. The phone leads, held upright, with the guildhall hub as home; the depth stays (D-153). Windows follows after launch.

## D-017 Templates first, optional AI flavour

- **Status:** Accepted (2026-10-25)
- **Decision:** Authored templates cover all text offline; AI-written flavour is an optional setting and never affects outcomes. Detail: `docs/design/CONCEPT.md` §14.
- **Why:** Owner's choice; no required service or running cost (SAFE-03), and GAME-03.

## D-018 About 8 classes and 5 ancestries at launch

- **Status:** Accepted (2026-10-25)
- **Decision:** ~8 original classes, ~5 ancestries, with multiclass or prestige paths at higher levels. Detail: `docs/design/CONCEPT.md` §15.
- **Amended (2026-10-26, D-109):** launch has 6 classes and 4 ancestries, without multiclassing or prestige paths; the rest follow in updates.
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

- **Status:** SUPERSEDED by D-040 (2026-10-25)
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
- **Amended (2026-10-26, D-144):** outposts in the wild are counted apart from the 6–10 settlements; the extra major city counts within them.
- **Why:** Owner's choice; identity at launch, replayability later.

## D-031 Guild size: small to mid

- **Status:** Accepted (2026-10-25)
- **Decision:** Start ~4–6 adventurers; top guilds ~25–40 across 4–8 parties, plus apprentices and ~10–15 staff. Detail: `docs/design/CONCEPT.md` §27.
- **Why:** Owner's choice; keeps Pillar 1 (people are the game) with real squad depth.

## D-032 Party leaders handle minor key moments

- **Status:** Accepted (2026-10-25)
- **Decision:** Leaders resolve minor moments by the player's risk settings and their own stats; only major moments stop the calendar; one party is watched live, the rest as summary cards. Detail: `docs/design/CONCEPT.md` §2.
- **Why:** Concept review: several parallel parties would otherwise interrupt constantly.

## D-033 Ironman saves by default, Storyteller optional

- **Status:** Accepted (2026-10-25)
- **Decision:** Autosave every day tick, one save per guild; optional manual-save Storyteller mode. Detail: `docs/design/CONCEPT.md` §29.
- **Why:** Concept review: reloading would undo permadeath (D-008) and Pillar 2.

## D-034 Short adventurer careers, longer guildmaster careers

- **Status:** Accepted (2026-10-25)
- **Decision:** Adventurers ~6–12 seasons, guildmasters ~20–30 seasons; quiet periods can be time-skipped. Detail: `docs/design/CONCEPT.md` §4.
- **Why:** Concept review: generational play (D-006) must fit in a playable save.

## D-035 Scope tiers; war campaigns after launch

- **Status:** Accepted (2026-10-25)
- **Decision:** Every feature is tagged Launch, Early update or Later; launch is a minimum lovable game with delves/hunts and small-scale defence. Tier list confirmed by the owner: `docs/design/CONCEPT.md` §28.
- **Why:** Concept review: the full scope is too large for one launch.

## D-036 The patron is a faction

- **Status:** Accepted (2026-10-25)
- **Decision:** The patron is one of the region's factions with its own agenda; changing patron is possible but costly. Detail: `docs/design/CONCEPT.md` §9.
- **Why:** Concept review: one connected system instead of four overlapping judges (WS-05).

## D-037 Four adventurer layers, no separate skills

- **Status:** Accepted (2026-10-25)
- **Decision:** Attributes, traits, class levels and talents, one job each. Detail: `docs/design/CONCEPT.md` §5. Refines D-007.
- **Why:** Concept review: a skills layer overlapped attributes.

## D-038 A non-delegable core

- **Status:** Accepted (2026-10-25)
- **Decision:** Contract choice, major key moments and big conversations are never delegated; staff are competent but limited. Detail: `docs/design/CONCEPT.md` §19. Refines D-022.
- **Why:** Concept review: full delegation would make watching the optimal play.

## D-039 Guild Assembly and seasonal rhythm

- **Status:** Accepted (2026-10-25)
- **Decision:** An annual Guild Assembly sets rankings and promotion/relegation and opens the contract and recruitment season; winter slows travel and quests. Detail: `docs/design/CONCEPT.md` §7.
- **Why:** Concept review: seasons and windows need an in-world reason (WS-05).

## D-040 Premium with a free demo

- **Status:** Accepted (2026-10-25)
- **Decision:** One-off purchase with a free demo; no microtransactions or paid advantage; paid expansions undecided. Detail: `docs/design/CONCEPT.md` §20. Supersedes D-023.
- **Why:** Owner's choice after the review noted cosmetics-only F2P earns little offline.

## D-041 Guild knowledge as a resource

- **Status:** Accepted (2026-10-25)
- **Decision:** Research on monsters, dungeons and rivals improves plans and reveals options. Detail: `docs/design/CONCEPT.md` §30.
- **Why:** Concept review; FM's opposition scouting, serves Pillars 2 and 5.

## D-042 Chronicle and Hall of Heroes

- **Status:** Accepted (2026-10-25)
- **Decision:** Auto-written guild history from the simulation event log. Detail: `docs/design/CONCEPT.md` §31.
- **Why:** Concept review; payoff for Pillar 3.

## D-043 In-world news and inbox

- **Status:** Accepted (2026-10-25)
- **Decision:** Letters, criers and gossip as the inbox; rumours become leads. Detail: `docs/design/CONCEPT.md` §32.
- **Why:** Concept review; FM's inbox, told in-world.

## D-044 Content as moddable data

- **Status:** Accepted (2026-10-25)
- **Decision:** Classes, monsters, regions and quests are data files from the start; mod tools later. Detail: `docs/design/CONCEPT.md` §33.
- **Why:** Concept review; GAME-04 makes it nearly free and extends the game's life.

## D-045 Concept complete

- **Status:** Accepted (2026-10-25)
- **Decision:** `docs/design/CONCEPT.md` (33 sections, pillars, scope tiers) is the locked phase-1 concept. Phase 2 (style design) begins.
- **Why:** Owner declared the concept 100% fleshed out after the review pass.

## D-046 Visual metaphor: the guildmaster's war table

- **Status:** Accepted (2026-10-26)
- **Decision:** The UI is the guildmaster's desk (ledgers, seals, letters, painted map with miniatures). In-world styling carries the frame and set pieces; dense data screens use a clean, legible layer with no texture behind numbers. Detail: `docs/design/STYLE.md` §1.
- **Why:** Owner's choice (Style Q1); ties to D-004 and D-043 while keeping D-016 density readable.

## D-047 Palette mood: candlelit oak

- **Status:** Accepted (2026-10-26)
- **Decision:** Warm lamp-lit palette: walnut desk, vellum paper, iron-gall ink, oxblood wax, brass. Detail: `docs/design/STYLE.md` §2.
- **Why:** Owner's choice (Style Q2) from the swatch board; the most "guild hall" mood.

## D-048 Status and faction colours are separate from the mood

- **Status:** Accepted (2026-10-26)
- **Decision:** Status colours (good, warning, bad) are a fixed colour-blind-safe set; factions get their own heraldic set. The palette mood (D-047) governs desk, paper, ink and accents only. Detail: `docs/design/STYLE.md` §2.
- **Why:** Owner approved the proposal; status must read at a glance in every mood and for colour-blind players.

## D-049 Screen layout: desk home with ledger tabs

- **Status:** Accepted (2026-10-26)
- **Decision:** Fixed top bar (date, stop reason, Continue); grouped ledger tabs on the left; the home screen is the region map with parties as miniatures, a weekly strip and the letter tray; ledgers open as full paper sheets. Detail: `docs/design/STYLE.md` §3.
- **Why:** Owner's choice (Style Q3); keeps FM navigation speed while putting the region at the centre (pillar 4).
- **Replaced (2026-10-27, D-155):** the guildhall hub is home on every platform; see D-149 and D-155.

## D-050 Quest board: cartographer's map with standees

- **Status:** Accepted (2026-10-26)
- **Decision:** The board is an ink map that draws itself as the party explores, with the scout's margin notes, portrait standees on loose positions and wax-seal key moments. Add more fantasy flair in art direction; standee animations and effects come in a later update. Detail: `docs/design/STYLE.md` §4.
- **Why:** Owner's choice (Style Q4); fits the ledger desk, is cheap per class and biome, suits generated dungeons, and doesn't imply a tactics game.

## D-051 Typography: old press, flair in every font

- **Status:** Accepted (2026-10-26)
- **Decision:** IM Fell English SC for titles, IM Fell DW Pica for letters, Sorts Mill Goudy for ledgers and numbers (equal-width digits); a large oxblood initial opens every in-world letter. Ledger readability is checked on a rendered screen during UI work. Detail: `docs/design/STYLE.md` §5.
- **Why:** Owner's choice (Style Q5, third pass) after asking for medieval and fantasy flair in all fonts, not titles only.

## D-052 Type fallback: our own ledger cut before switching fonts

- **Status:** Accepted (2026-10-26)
- **Decision:** If the old-press ledger fails readability, make a renamed OFL derivative of Sorts Mill Goudy tuned for small sizes before choosing another face. Custom illuminated initials and a symbol font are art work; a commissioned display face is a later paid option. No full typeface from scratch. Detail: `docs/design/STYLE.md` §5.
- **Why:** Owner asked whether we could make our own typeface; modifying an OFL font is realistic and keeps the chosen look, a from-scratch face is not.

## D-053 Icons: woodcut blocks in two levels

- **Status:** Accepted (2026-10-26)
- **Decision:** Icons are black-ink woodcuts: hatched detail at card size, clean silhouettes at 16–24 px; one ink colour; status icons never stand alone. Detail: `docs/design/STYLE.md` §6.
- **Why:** Owner's choice (Style Q6); matches the old-press type and the inked map, and survives ledger size.

## D-054 Portraits: woodcut now, painted later, faces stored as data

- **Status:** Accepted (2026-10-26)
- **Decision:** Launch with woodcut portraits assembled from parts, with age and scars as layers and a mourning corner on death. Painted portraits come later; faces are stored as art-independent data so a painted set can redraw the same people. Detail: `docs/design/STYLE.md` §7.
- **Why:** Owner's choice (Style Q7); woodcut is cheap per face and matches the desk, and the owner wants painted portraits eventually.

## D-055 Audio: period chamber music, desk ambience, an occasional bard

- **Status:** Accepted (2026-10-26)
- **Decision:** Sparse early-music ensemble with long silences; rich desk and guildhall ambience; a bard plays now and then as if from the hall; a drum for key moments and a tolling bell for deaths. Detail: `docs/design/STYLE.md` §8.
- **Why:** Owner's choice (Style Q8) with the bard added; low fatigue over long sessions and fits the woodcut/old-press look.

## D-056 Soft ambient music; bardic songs and bard tie-ins after launch

- **Status:** Accepted (2026-10-26)
- **Decision:** Music is soft ambient early-music playing generally (replaces "long silences" in D-055). After launch, bardic songs occasionally interrupt it; the bard plays more with a tavern or a Cantor, and pieces are titled after great deeds and deaths and named in the news and Chronicle. Detail: `docs/design/STYLE.md` §8.
- **Why:** Owner approved the bard proposal as a later item and set the music direction.

## D-057 Hand-tinted card icons; seals for factions and contracts

- **Status:** Accepted (2026-10-26)
- **Decision:** Large card-size icons get a hand-tinted watercolour wash; ledger icons stay plain ink. Wax seals are reserved for factions, contracts and set pieces. Detail: `docs/design/STYLE.md` §6.
- **Why:** Owner approved the §6 proposal; adds colour and flair where icons are large without hurting small-size readability.

## D-058 Naming: mixed cultures on an English-fenland core

- **Status:** Accepted (2026-10-26)
- **Decision:** Human names and places use an English-fenland base; each ancestry and major faction has its own naming rules as data. No Pathfinder names, no culture copied from one real nation. Detail: `docs/design/STYLE.md` §9a.
- **Why:** Owner's choice (Style Q9a); origin readable at a glance, grounded core, extensible by mods.

## D-059 Writing voice: grounded, with dry wit

- **Status:** Accepted (2026-10-26)
- **Decision:** In-world text is plain, lightly period-flavoured English with understated humour; speakers sound like their station; deaths are always written sincerely; generated lines need many variants. Detail: `docs/design/STYLE.md` §9b.
- **Why:** Owner's choice (Style Q9b); serves both the whimsy asked for and permadeath.

## D-060 Spoken voice: text plus vocal sounds, no narrator

- **Status:** Accepted (2026-10-26)
- **Decision:** No narration or voiced dialogue; only short name-free vocal sounds (crier calls, cheers, grunts, funeral murmurs); no synthesised voices. Detail: `docs/design/STYLE.md` §9c.
- **Why:** Owner's choice (Style Q9c); generated names can't be recorded, sounds never repeat a sentence, and translation stays cheap.

## D-061 Style guide complete

- **Status:** Accepted (2026-10-26)
- **Decision:** `docs/design/STYLE.md` (§1–§9, D-046..D-060) is the locked phase-2 style guide. Phase 3 (full plan) begins.
- **Why:** Owner locked it after reviewing the summary and the three noted risks (ledger readability, art cost, mixing painted portraits later).

## D-062 Plan outline

- **Status:** Accepted (2026-10-26)
- **Decision:** `docs/design/PLAN.md` follows the approved 15-section outline: Part A game design (§1–§10), then Part B production (§11–§15), written in order, section by section.
- **Why:** Owner approved the outline as proposed.

## D-063 Target player: management-sim veterans first

- **Status:** Accepted (2026-10-26)
- **Decision:** The primary player is a management-sim veteran (FM, Battle Brothers, Darkest Dungeon, RimWorld, Crusader Kings) with a taste for fantasy. Tabletop RPG fans are secondary, carried by the gentle first season and delegation. Players who want direct combat control or short roguelite sessions are not targeted. Detail: `docs/design/PLAN.md` §1b.
- **Why:** Owner's choice (Plan Q1b); the concept's depth, Ironman saves and desk-only guildmaster are built for this group, and onboarding the secondary group costs less than diluting depth.
- **Amended (2026-10-27, D-153):** the same player, on a phone, in sittings of about 10–30 minutes.

## D-064 Pace: one season takes about 2–2.5 hours

- **Status:** Accepted (2026-10-26)
- **Decision:** A typical player takes about 2–2.5 h per in-game season. Derived targets: adventurer career about 12–30 h, guildmaster career about 40–75 h, first season about 3–4 h with onboarding. Weeks per season are set in PLAN §2. Detail: `docs/design/PLAN.md` §1c.
- **Why:** Owner's choice (Plan Q1c), between the proposed 3 h (FM-like) and 1.5 h (faster generations); keeps succession within reach of committed players.
- **Amended (2026-10-27, D-153):** a sitting on the phone is about 10–30 minutes; a season is spread over several sittings.

## D-065 Design goals and success criteria (starting set)

- **Status:** Accepted (2026-10-26)
- **Decision:** Five design goals, one per pillar (PLAN §1a), and six success targets (PLAN §1d): demo conversion ≥ 15%, first-season completion ≥ 70%, median playtime > 20 h, ≥ 25% of 40 h+ players reach a second guildmaster, Steam reviews ≥ 80% positive, no dense screen needing more than one explanation in playtests. Numbers are estimates, revisited in PLAN §10 and §14.
- **Why:** Owner accepted the proposed starting set (Plan Q1a/d); gives later sections and playtests something measurable to aim at.
- **Under review (2026-10-27, D-150):** the Steam-review and Steam-data targets need phone equivalents. The owner decides them with the D-088 question.

## D-066 A season is one in-game year

- **Status:** Accepted (2026-10-26)
- **Decision:** "Season" means one in-game year, opened by the Guild Assembly (D-039), as in FM. With D-064 a year plays in about 2–2.5 h, so a week averages a few minutes, not a session. The core loop's "weekly = a session" is replaced by a stop budget per year (PLAN §2); CONCEPT core loop updated to match. Career ages (D-034) stand.
- **Why:** Owner's choice (Plan Q2a). Keeps the annual Assembly and in-world ages consistent; resolves the conflict between D-064 and the concept's core-loop line.

## D-067 Shape of the year

- **Status:** Accepted (2026-10-26)
- **Decision:** A 48-week year (12 months of 4 weeks): 4-week Assembly and muster (rankings, patron review, recruitment window, renewals); 32-week campaigning season with a midsummer fair (second, shorter recruitment window and the main tournament); 12-week light winter (slow travel, few contracts, healing, training, building, the odd raid); a year's-end review. Target about 145 min per year. Detail: `docs/design/PLAN.md` §2.
- **Why:** Owner accepted the proposal (Plan Q2b). Two windows give poaching an FM-like rhythm; heavy decisions cluster in spring; winter is the natural time-skip.

## D-068 Day, week and generation loops; friction budget

- **Status:** Accepted (2026-10-26)
- **Decision:** About 80 stops per year (~145 min). Stops on one day are bundled; every stop has a default (1–3 clicks); a routine week takes 10 clicks or fewer. Three stop classes (Must stop, Digest, Never stop), tunable per category except the non-delegable core (D-038). A rate cap (one event stop a day, about 3 a week) moves only Digest-class items; Must-stop items always stop. Time-skip offered when nothing is out or due. Succession is a year's-end set piece (~10 min); the heir inherits charter, traits and debts. Detail: `docs/design/PLAN.md` §2c–§2f.
- **Why:** Owner accepted the proposal (Plan Q2c); fits a year into D-064's 2–2.5 h without losing the moments that matter.

## D-069 Ranking by renown earned this year; intrigue later

- **Status:** Accepted (2026-10-26)
- **Decision:** Renown is one public number earned by deeds. Each ranking tier is ordered by renown earned in the past year; the Assembly promotes the top and relegates the bottom. Total renown, slowly fading, shapes recruitment and offers. Every renown change is stored as a dated entry with its source so a later intrigue layer can add, contest or strip entries. Detail: `docs/design/PLAN.md` §3d.
- **Why:** Owner's choice (Plan Q3a): clear, and every deed visibly counts. Owner's note asks for intrigue and underhanded dealings later (Later tier, D-035); its content is not decided.

## D-070 Systems map: 14 launch systems

- **Status:** Accepted (2026-10-26)
- **Decision:** Guild resources are money, renown, faction standing and knowledge; adventurers carry morale, fatigue, health, trust and experience. Launch has 14 systems in four groups (People, Quests, Guild, World) with contract → party → quest → results as the spine. Injury, death and recovery fold into Adventurers; knowledge and scouting merge into one Scouting and research department and ledger; the training academy and item commissioning move to Early update. Delegation per PLAN §3e. Detail: `docs/design/PLAN.md` §3.
- **Why:** Owner accepted the map and asked for merges and deferrals (Plan Q3b); chose merges B and C and deferral D, kept tournaments as their own part of the Rivals system. Fewer concepts and ledgers for the player at launch.

## D-071 Death rate: about 2 a year in a mid-sized guild

- **Status:** Accepted (2026-10-26)
- **Decision:** A mid-sized guild (~15 adventurers, 3 parties) on tier-appropriate work at default risk loses about 2 adventurers a year; about half of careers end in death; turnover about 25% a year. Four danger ratings with starting death rates per adventurer per quest: Routine 0.2%, Hazardous 0.8%, Perilous 2.5%, Deadly 7%; about 5 lasting injuries per death. D-034 career lengths now describe survivors. Updates PLAN §2e turnover. Detail: `docs/design/PLAN.md` §4c.
- **Why:** Owner's choice (Plan Q4a): brutal enough for Pillar 2 and D-034, while enough adventurers live long enough to become stories (Pillar 1).

## D-072 Money: tight early, steady later

- **Status:** Accepted (2026-10-26)
- **Decision:** Wages are about 55–65% of spending. A founded guild starts with about 3 months of running costs plus a small patron grant; a well-run mid-tier guild runs a 10–20% surplus; top-tier star wages and patron demands bring pressure back. Detail: `docs/design/PLAN.md` §4b.
- **Why:** Owner's choice (Plan Q4b): FM-like pressure that matters without letting coin crowd out the people.

## D-073 Sources and sinks, tournaments, difficulty ladder

- **Status:** Accepted (2026-10-26)
- **Decision:** Every source has a sink; total renown fades about 10% a year; failure pays in knowledge; rival guilds play by the same rules with no hidden bonuses. Tournaments are the guild's shop window (renown burst, recruitment draw, rival scouting both ways, low lethality, storied prizes, at the cost of a party for 1–2 weeks). Difficulty comes from the start choice (no slider). Launch ladder: 3 tiers of 6 guilds, 1 up and 1 down per tier each Assembly; ladder size is region data, and bigger ladders come after launch. Detail: `docs/design/PLAN.md` §4a, §4d–§4f.
- **Why:** Owner accepted (Plan Q4c) and asked for bigger ladders later; gives tournaments the reason §3c asked for.

## D-074 Ten class levels at launch, twenty planned

- **Status:** Accepted (2026-10-26)
- **Decision:** Adventurers have 10 class levels at launch: about 1 a year early, slowing; most survivors retire around level 7–9; level 10 is legendary; multiclassing or prestige opens at level 5. 20 levels are planned for later, so level count, experience curve and per-level abilities are class data and level-gated rules use bands. Moving to 20 needs its own pacing decision. Detail: `docs/design/PLAN.md` §5a.
- **Amended (2026-10-26, D-109):** multiclassing and prestige paths are not at launch; they come in an update, still opening at level 5.
- **Why:** Owner's choice (Plan Q5a): "Start with 10. Plan for 20 eventually." Ten levels fit 6–12 year careers with each level meaningful.

## D-075 Progression of adventurers, guild and guildmaster

- **Status:** Accepted (2026-10-26)
- **Decision:** Attributes grow toward hidden potential and decline with age (ancestry sets the ages, as data); traits change through events. Retirement is a conversation; retirees can become staff, limited by attributes and wages; revival leaves a changed veteran. Facilities (5 at launch) have 3 levels each and are building entries in data; more levels or a compound of separate buildings (city-building style) come later. At most 5 earned guild traits are active at once. The guildmaster has about 8 stats (1–20) that grow only when the player does that work personally, and decline in the last 3–5 years. At succession the guild, charter, traits, roster, debts, rivalries, standing, Chronicle and the old guildmaster's promises pass on; the old guildmaster's stats and contacts do not. Detail: `docs/design/PLAN.md` §5.
- **Why:** Owner accepted the draft (Plan Q5b) and asked for bigger facility progression or a guild compound later.
- **Amended (2026-10-27, D-168–D-170):** the 5 fixed facilities × 3 levels at launch become a buildable guild house of stacked floors and merging rooms with capacity and staff heads.

## D-076 First season: prologue, staff-opened ledgers, clerk's notes

- **Status:** Accepted (2026-10-26)
- **Decision:** A skippable prologue of about 10–15 min (the guild's first contract, run on the real systems with a fixed seed); then ledgers open through the first season when they first matter, each introduced by a letter from the staff member who runs it, with fallback dates and a checklist; the clerk's pencilled notes appear on relevant documents and can be put away. Veteran start skips the prologue and opens every ledger. Detail: `docs/design/PLAN.md` §6a; mock-up `docs/design/mockups/onboarding.html`.
- **Why:** Owner's choice (Plan Q6a) combining options A, B and C; teaches through the staff the player later delegates to, while veterans skip it with one setting.

## D-077 Text size slider and clear print

- **Status:** Accepted (2026-10-26)
- **Decision:** Dense screens get a 100–150% size slider and a clear-print setting that switches ledgers and letters to a modern book serif (open font licence, chosen in UI work); titles, seals and decorated initials stay old-press. Clear print is also the ready fallback if the ledger face fails the readability check (D-052). Detail: `docs/design/PLAN.md` §6c; mock-up `docs/design/mockups/readability.html`.
- **Why:** Owner's choice (Plan Q6b): an accessibility option that keeps the old-press look as the default.
- **Corrected (2026-10-26):** the original Why said the old-press ledger's old-style figures scan worse; that came from a mock-up that left the face's lining figures off. All game numbers use lining figures (`lining-nums`); see PLAN §9c.

## D-078 Screen rules and accessibility

- **Status:** Accepted (2026-10-26)
- **Decision:** Seven screen rules: every number shows its breakdown (from the engine); one sheet, one job; fixed top bar; every stop shows its default; confirm only the irreversible (signing, releasing, dismissing staff, revival, Deadly contracts); uncertainty shown as ranges and worded odds; never colour alone. Accessibility: colour-blind-safe statuses and heraldic charges, full remappable keyboard play, no timers, reducible motion, visible counterparts and captions for meaningful sounds; screen readers not promised at launch but the UI is built from labelled controls. Detail: `docs/design/PLAN.md` §6b–§6c.
- **Why:** Owner accepted the draft (Plan Q6c).
- **Amended (2026-10-27, D-149, D-154, D-155):** on phones the pull handle is Continue, in place of the fixed top bar's button, and play is by touch; the keyboard rules apply when Windows follows. The phone engine test includes a screen-reader check; launch support is still not promised.

## D-079 Launch ancestries: two familiar, two from the March

- **Status:** Accepted (2026-10-26)
- **Decision:** Five launch ancestries: Marchfolk (humans), Stonewrights (stout hill miners), Lanthe (long-lived wood folk), Reedfolk (fen stilt-dwellers) and Barrowborn (born near the barrows, distrusted by the temple). Names, ages and hooks are first drafts. Hearthlings, Grael, Mossbacks and Ashlings are candidates for later, as data. Detail: `docs/design/PLAN.md` §7a; mock-up `docs/design/mockups/ancestries.html`.
- **Amended (2026-10-26, D-109):** launch has 4 ancestries (Marchfolk, Stonewrights, Lanthe, Barrowborn); Reedfolk follow in an update.
- **Why:** Owner's choice (Plan Q7a, option C): a readable roster plus a setting signature tied to the launch quest types.

## D-080 Launch content volume: standard

- **Status:** Accepted (2026-10-26)
- **Decision:** 36 monster kinds in 7 families, 20 site templates, 20 quest templates, 60 key-moment templates with text variants, about 6,000 written template lines; plus 6 factions, 17 authored rival guilds, 8 settlements, 5 biomes, 3 tournament kinds, 5 facilities, 4 gear tiers, about 30 magic-item templates and 10 legendary items, about 25 guild traits. All data; can grow after launch. Detail: `docs/design/PLAN.md` §7b–§7e.
- **Amended (2026-10-26, D-144):** 8 settlements is a floor: at least one more major city, and outposts in the wild counted apart (D-030).
- **Amended (2026-10-26, D-109):** lean launch cut: about 24 monster kinds, about 40 key moments, about 4,500 template lines, 1 tournament, about 6 authored rival guilds with the rest generated; region crises added (D-112).
- **Amended (2026-10-27, D-168):** the 5 facilities become the guild house's 11 room kinds and 5 home-town sites × 3 levels.
- **Why:** Owner's choice (Plan Q7b): repeats stay rare within a guildmaster's career at about half the writing and art cost of the rich option.

## D-081 Launch people content

- **Status:** Accepted (2026-10-26)
- **Decision:** 8 classes with about 15 talents each plus about 30 shared talents; 4 prestige paths and multiclassing from level 5; caster classes carry an empty magic-tradition slot; about 28 attributes; about 40 personality and 60 earned traits; 6 staff roles; 5 guildmaster backgrounds. Detail: `docs/design/PLAN.md` §7a.
- **Amended (2026-10-26, D-109):** 6 classes (guardian and druid later), no prestige or multiclass at launch, about 16 attributes, about 30 traits.
- **Why:** Owner accepted the draft (Plan Q7c).

## D-082 Consequences: in-world first, trace, and numbered histories

- **Status:** Accepted (2026-10-26)
- **Decision:** Letters and news tell consequences in the world's voice; a Trace mark on letters and changed values opens the dated cause chain (the player's decisions, what the guild knew, what can be done now). Every value's inspector also shows the signed change prominently and a dated history with a "because" line per entry, linked to its trace. Trace and history text is templated from recorded causes. Detail: `docs/design/PLAN.md` §8c; mock-up `docs/design/mockups/consequences.html`.
- **Why:** Owner's choice (Plan Q8a): option C with option A's numbered inspector histories; keeps the fiction while teaching the system.

## D-083 Consequence surfaces and rules

- **Status:** Accepted (2026-10-26)
- **Decision:** Nine surfaces (quest log and board, party cards, week report, letters, criers and gossip, region map, inspector fields, Chronicle and Hall of Heroes, year in review). Rules: no silent change; every change records its cause, reachable within 2 clicks; delayed consequences name their cause; importance follows the stop classes (D-068); forewarning follows knowledge (D-041); deaths are never quiet; AI flavour rewords but never changes causes or numbers. Detail: `docs/design/PLAN.md` §8a–§8b.
- **Why:** Owner accepted the draft (Plan Q8b); Pillars 2 and 4 depend on the player seeing what their choices caused.

## D-084 Ledger minimum 15 px with lining figures

- **Status:** Accepted (2026-10-26)
- **Decision:** Ledger text is at least 15 px at 100% scale; all numbers use the face's lining figures (`lining-nums`), which are equal width and sit on the line. To be confirmed on real monitors in the desk-density prototype (PLAN §9a R4); fallbacks are D-052 and D-077. Detail: `docs/design/PLAN.md` §9c.
- **Why:** Owner's choice (Plan Q9b) after real-size specimens at 13–16 px; the measurement showed the default figures are proportional old-style, so lining figures are required for columns.
- **Amended (2026-10-27, D-154):** confirmed on the owner's phone in the phone R4, not on monitors.
- **Confirmed (2026-10-27, D-166):** the owner read the 15 px text with lining figures comfortably on their phone in R4.

## D-085 Prototype order: watched quest first

- **Status:** Accepted (2026-10-26)
- **Decision:** After plan approval, prototypes run in this order: 1 one watched quest (is watching fun?); 2 headless year simulator on the same simulation core (balance, pacing, delegation, careers); 3 desk-density mock-ups and the template-writing test, alongside 1 or 2; 4 a two-year attachment playtest. Detail: `docs/design/PLAN.md` §9b.
- **Why:** Owner's choice (Plan Q9a): test the assumption the whole game rests on first.
- **Amended (2026-10-26, D-090):** step 0, the engine test, comes before step 1.
- **Amended (2026-10-26, D-110, D-113):** the engine test is web-first; resolution v0 comes before step 1; the simulation core is kept as the production engine; each step is time-boxed.
- **Amended (2026-10-27, D-154):** step 3's mock-ups are phone screens, not 1366 and 1920 px desks.
- **Note:** first recorded as "headless simulator first"; the owner reported that answer as a misclick the same day and chose quest first.

## D-086 Riskiest assumptions and their tests

- **Status:** Accepted (2026-10-26)
- **Decision:** Nine risks, each with its cheapest test and pass line: R1 watching quests is fun; R2 the simulation hits the §4 targets (±25%); R3 a year fits the friction budget (≤ 100 stops, ≤ 3 h); R4 the desk holds FM density (25+ rows at 1366 px); R5 ledgers readable (D-084); R6 the player's focus beats delegation by 10–25%; R7 attachment despite deaths; R8 template writing stays fresh; R9 guildmaster careers of 20–30 years. Fun and feel pass only on the owner's recorded playtest notes (GAME-06). Detail: `docs/design/PLAN.md` §9a.
- **Why:** Owner accepted the draft (Plan Q9c).
- **Amended (2026-10-27, D-154):** R4 is a phone test: 5 set facts in under 10 s each, using the hub, the work desk and Ask the clerk; the 25-row rule is dropped.
- **Amended (2026-10-27, D-165):** R4 passes (round 2 on the owner's phone).

## D-087 Kingdom map at launch

- **Status:** Accepted (2026-10-26) as a launch goal; design to workshop.
- **Decision:** Launch includes a kingdom map of the March in a striking, on-theme fantasy style showing areas and locations, the player's and rival guilds, current action, and the deeds done across the region. It builds on the home-screen region map (D-049) and is a consequence surface (PLAN §8a). Style, layers and interactions are workshopped with the art plan (PLAN §12). Detail: `docs/design/PLAN.md` §1a.
- **Amended (2026-10-26, D-097):** launch layers are factions, guilds, action and threats; deeds and rumours on the map come later.
- **Why:** Owner's request: the region should be a place the player wants to look at, where the guild's history is visible (Pillars 3 and 4).

## D-088 Data collection: playtest logs, nothing sent from release

- **Status:** Accepted (2026-10-26)
- **Decision:** Playtest builds write a local log of the PLAN §10b measures that testers choose to send. The release sends nothing; §1d targets come from Steam data and achievement unlock rates. Opt-in anonymous telemetry stays open as a future option, decided by the owner as a cost (SAFE-03); the log format allows it. Detail: `docs/design/PLAN.md` §10c.
- **Why:** Owner's choice (Plan Q10a): no backend or personal data for an offline single-player game, while keeping a path to richer data.
- **Under review (2026-10-27, D-150):** on phones the release still sends nothing, but the §1d measures named here (Steam data, achievement rates) have no phone source yet. The owner decides where they come from.

## D-089 Playtest stages, measures and follow-up

- **Status:** Accepted (2026-10-26)
- **Decision:** Playtests run owner-only for prototypes, then 6–10 invited vertical-slice players (about two thirds management-sim veterans), a 30–50 closed alpha, the public demo and a 200+ beta. Measures cover pacing, danger and economy, engagement (watched vs auto-resolved, delegation, Trace use), onboarding drop-off, attachment, readability tasks and stability. Each measure has a target; misses become dated findings; the same miss in two rounds goes to the owner as a design problem. Detail: `docs/design/PLAN.md` §10a, §10b, §10d.
- **Why:** Owner accepted the draft (Plan Q10b).

## D-090 Engine chosen after a two-engine test

- **Status:** Accepted (2026-10-26)
- **Decision:** The engine is chosen between web tech in Electron (TypeScript) and Godot 4 (C#) after prototype step 0: the same roster ledger and kingdom-map view built in both, judged on the owner's look-and-feel notes plus measured build time, frame rate and memory at 1366×768, download size and the find-the-fact task. Unity is out. The architecture in PLAN §11b–§11g is engine-neutral. Detail: `docs/design/PLAN.md` §11a; adds step 0 to D-085.
- **Amended (2026-10-26, D-110):** web-first: build the test pieces in web tech; Godot only if web misses its bar.
- **Superseded (2026-10-27, D-163):** web tech is the engine; there is no Godot fallback.
- **Why:** Owner's choice (Plan Q11a) after the trade-off: web tech favours dense ledgers and speed of building; Godot favours the animated map and board.

## D-091 Engine-neutral architecture

- **Status:** Accepted (2026-10-26)
- **Decision:** Five packages (engine, content, ui, shell, tools); the engine is pure rules with seeded randomness and injected time, one simulate function, and every change an event with a cause id. The event log feeds the Trace, histories, Chronicle, reports, letters and playtest logs. Game values are integers. Content is JSON with schemas, loaded as packs (mods later). Ironman saves are written safely each day, versioned with migrations, never overwritten when unreadable, synced by Steam Cloud. Optional AI flavour is off by default, player-keyed and never blocks templates. Performance: 1366×768 minimum, 60 fps map, day tick under 50 ms, simulated year under 1 s, save/load under 1 s. Detail: `docs/design/PLAN.md` §11b–§11g.
- **Why:** Owner accepted the draft (Plan Q11b); holds for either engine in D-090.
- **Amended (2026-10-27, D-154):** the screen minimum is a phone 375 points wide, held upright; the PC minimum returns with the Windows version.
- **Amended (2026-10-27, D-158):** on phones, cloud saves use the stores' own services in place of Steam Cloud. D-158 sets out the limits.

## D-092 Tools adopted now: docs checker, mock-up script, one setup audit

- **Status:** Accepted (2026-10-26)
- **Decision:** `tools/docs-check.mjs` runs before every push with the drift check (cited decision ids exist; no draft markers in accepted PLAN sections). `tools/mockup-shot.mjs` renders every HTML mock-up or page at desktop and phone width before publishing (fonts, no sideways scroll, screenshots). The `setup-audit` skill runs once on this repo; its proposals come to the owner before any change. Detail: `docs/design/TOOLS-REVIEW.md` §3.
- **Why:** Owner's choice from the tools review. Measured: the docs checker runs in 0.06 s and caught both planted mistakes on a copy of the docs; of the day's four lessons it would have caught one. The mock-up script turns the VER-06 check used for every mock-up into one command.

## D-093 Adversarial review before every pull request

- **Status:** Accepted (2026-10-26)
- **Decision:** Before creating any pull request, and again before marking one ready, review the whole branch diff adversarially: what is wrong, inconsistent with DECISIONS, unverified or missing. Fix or report each finding before the PR goes up. Use the `reviewer` agent or `code-review` skill for large diffs. Recorded in AGENTS.md project rules. Amended by D-133: the owner approves before the PR is created.
- **Why:** Owner's rule (2026-10-26).

## D-094 Tools review accepted

- **Status:** Accepted (2026-10-26)
- **Decision:** The rest of the tools review stands as the plan: build-start tooling (engine tools in cloud sessions, per-stack checks, review skills on PRs, the `run` skill, CI checks that stay free for docs-only pushes); art connectors for exploration only (OpenArt with licence, disclosure and cost checks first; Figma if an artist joins; tldraw optional; Canva later); the not-needed list; ripgrep kept as is; the caveman skill not adopted. Detail: `docs/design/TOOLS-REVIEW.md`.
- **Why:** Owner accepted the list after reviewing the page.

## D-095 A fresh session per merged PR or plan section

- **Status:** Accepted (2026-10-26)
- **Decision:** End a working session after each merged PR or finished plan section; the next session starts from `docs/HANDOFF.md` (CTX-02). If a session must go on, compact at a section boundary, not mid-task.
- **Why:** Setup audit finding (owner approved): one long session re-read 58.2 million cached tokens, while a fresh session starts near 84,000.

## D-096 Deny secret reads; ask before any force-push

- **Status:** Accepted (2026-10-26)
- **Decision:** `.claude/settings.json` denies reading `.env`, `.env.*` and `secrets/**` in the project root through the file tools, and asks before a `git push` whose command contains `--force` (including `--force-with-lease`) or a separate `-f` flag. Also allows `node tools/docs-check.mjs` without a prompt.
- **Limits (found in the pre-merge review, 2026-10-26):** the allow list lets `cat`, `head`, `tail`, `grep`, `rg` and `find` run without a prompt, so a shell read of `.env` is not blocked; force pushes written as combined flags (`-fu`), refspecs (`origin +main`) or `git -C dir push` are not matched; `git branch:*` also allows `git branch -D` and `find:*` allows `-delete`. Tightening these is the owner's decision (HANDOFF open questions).
- **Why:** Setup audit finding (owner approved): there were 19 allow rules and no deny or ask rules; SAFE-02 and GIT-03 were instructions only.

## D-097 Kingdom map: hand-drawn base, four launch layers

- **Status:** Accepted (2026-10-26)
- **Decision:** The launch March has a hand-illustrated base map in layers; live marks and later generated regions use the procedural ink renderer built for the quest board. Launch layers: areas and places, factions, guilds (with tier), action (moving parties, key-moment seals) and threats (spreading stains, closed roads), each linked to its Trace. Deeds and rumours on the map come later (meanwhile Chronicle and inbox). The map is to look better over time; the owner's Story-Generator repository is a lead for its art direction. Detail: `docs/design/PLAN.md` §12d; mock-up `docs/design/mockups/kingdom-map.html`.
- **Amended (2026-10-26, D-109, D-113):** launch layers are places, guilds and action; factions and threats layers follow in an update. The slice's corner is drawn at M2 and the full base after alpha balance.
- **Why:** Owner's choice (Plan Q12a): the best-looking launch map with a path to generated regions; a smaller launch layer set.
- **Amended (2026-10-27, D-164):** the map pans and zooms freely, and every mark opens a pop-up with details and an image.

## D-098 Art and audio production lists and rough costs

- **Status:** Accepted (2026-10-26)
- **Decision:** An artist draws parts and set pieces; code assembles them (portraits ~200 parts, crests, site maps from ~60 stamps per biome); monsters 72 pieces, icons ~240 drawings, 26 initials, ~10 legendary items, a few textures; a ledger font cut only if D-084's real-monitor check fails. Audio: 60–90 min of commissioned early-music ambience, ~150 desk sounds, 5 biome beds, ~10 stingers, ~40 name-free vocal sounds. Rough estimates: art $23,000–74,000, audio $9,000–37,000, refined in PLAN §14 and replaced by quotes. Pipeline: layered sources exported by script, an asset licence ledger, OFL fonts, contracts that transfer the needed rights. AI-generated images for exploration only (D-094). Detail: `docs/design/PLAN.md` §12a–§12c, §12e.
- **Amended (2026-10-26, D-109):** about 48 monster pieces and about 160 portrait parts; art about $20,000–66,000.
- **Amended (2026-10-27, D-156):** mobile first adds hall-room and town-view art (amount in D-157).
- **Why:** Owner accepted the draft (Plan Q12b) and asked for a review of the Story-Generator repository's map code for art direction.

## D-099 Milestones M0–M7 with gates

- **Status:** Accepted (2026-10-26)
- **Decision:** Build in seven milestones after plan approval, each ending at an owner gate (go, loop or stop): M1 prototypes (§9b, engine chosen), M2 vertical slice (production packages; prologue and first season in one corner of the March: 2 biomes, 3 settlements, 4 classes, ~10 monster kinds, ~6 quest templates, final art for that corner), M3 alpha (all 14 launch systems, about half the content, 30–50 testers), M4 free demo (the first season, alongside the beta), M5 beta (all content, final art and audio, 200+ testers), M6 launch, M7 free updates. Estimate: about 18–28 months to launch for a small team, scheduled in §14. Rules: no bulk art or music before M1 passes R1 and R2; old saves keep loading from M2; content after M2 is data only; Steam page live from M2. Detail: `docs/design/PLAN.md` §13a, §13b.
- **Amended (2026-10-26, D-108, D-111, D-113):** estimates restated for solo at 10–20 h a week: about 31–46 months to launch. The simulation core from M1 is kept. Map base waits for alpha balance. Slip and stop rules in D-111.
- **Why:** Owner accepted the draft (Plan Q13c); proving fun and balance before paying for bulk art protects the art budget (D-098).
- **Amended (2026-10-27, D-156):** mobile first; the phone engine test joins M1, phone builds from M2, launch about 39–68 months from plan approval (estimate), with extra art and phone costs listed in D-156.
- **Under review (2026-10-27, D-150):** the Steam page from M2 and Steam-based tester recruiting have no phone replacement yet; the owner decides it (HANDOFF open questions).

## D-100 Launch model decided at the alpha gate

- **Status:** Accepted (2026-10-26)
- **Decision:** The plan assumes a full 1.0 release after the beta. At the M3 (alpha) exit the owner decides again between that and Steam Early Access, with the budget and alpha results in hand. Detail: `docs/design/PLAN.md` §13b.
- **Why:** Owner's choice (Plan Q13a): Early Access brings money sooner and real long saves, but early reviews of a rough build count; the budget that tips it is not known yet.
- **Under review (2026-10-27, D-150):** Early Access is a Steam model; whether phones get an equivalent (for example a public test track) is for the owner.

## D-101 Post-launch order: war campaigns first

- **Status:** Accepted (2026-10-26)
- **Decision:** Free updates after launch, in order: war campaigns; map deeds and rumours; training academy and item commissioning; escorts and expeditions; look and sound upgrades (painted portraits, standee animations, bardic songs); optional AI flavour. Later-tier items each need their own decision. Paid expansions stay undecided (D-040). Detail: `docs/design/PLAN.md` §13c.
- **Why:** Owner's choice (Plan Q13b): war campaigns are the biggest new play and already an Early update item.

## D-102 Team: start solo, hire later

- **Status:** Accepted (2026-10-26)
- **Decision:** The owner directs and designs, code is written with AI help, and contractors are paid per job for art, audio and optionally writing. At the M2 (slice) and M3 (alpha) gates the owner decides whether to add paid help; the likely first hire is one developer for 12–18 months. Detail: `docs/design/PLAN.md` §14a.
- **Why:** Owner's choice (Plan Q14a): cheapest start; paid help is decided when the slice shows the pace and the funding is known.

## D-103 Budget and funding route

- **Status:** Accepted (2026-10-26)
- **Decision:** Budget estimates with 20% contingency: about $57,000–185,000 solo, about $128,000–358,000 with one developer hired; about $10,000–32,000 is spent before the hire gate (M1–M2). Self-funded through the slice; at the slice gate the owner chooses between self-funding, a publisher, crowdfunding and Early Access at the alpha gate (D-100); no talks before that decision. Five budget assumptions are checked at each gate. Detail: `docs/design/PLAN.md` §14b, §14d, §14e.
- **Amended (2026-10-26, D-108, D-109):** about $52,000–174,000 solo and $124,000–347,000 with a hire; about $8,000–27,000 before the hire gate.
- **Why:** Owner accepted the draft (Plan Q14c); the slice is the pitch, so funding is chosen when there is something to show.
- **Restated (2026-10-27, D-156, D-157):** the budget for mobile first is in D-157.

## D-104 Price $24.99; English at launch

- **Status:** Accepted (2026-10-26)
- **Decision:** Launch price $24.99, with about $12.50–15 net per copy (estimate) and break-even at about 4,000–15,000 copies solo. English only at launch; translation decided after launch on regional sales. Paid expansions decided after launch (D-040). Detail: `docs/design/PLAN.md` §14c.
- **Amended (2026-10-26, D-109):** break-even about 3,500–14,000 copies solo, cash costs only.
- **Replaced for the phone launch (2026-10-27, D-152, D-157):** a free download with a $14.99 unlock; break-even is about 5,500–22,000 unlocks. English only at launch stands.
- **Why:** Owner's choice (Plan Q14b): in line with comparable deep management games and an easy buy after the free demo.

## D-105 Quality, CI and release process

- **Status:** Accepted (2026-10-26)
- **Decision:** Every push runs format, lint, strict types, engine unit tests, the determinism test, the content validator, save fixtures (from M2) and the docs and drift checks; screen tests when ui changes. The 1,000-guild-year balance run and performance checks run before each gate and release, not per push. CI uses path filters so docs-only changes stay free; game builds and Steam uploads run on release tags only, with Steam credentials as secrets set up by the owner. Bugs are GitHub issues in three severities; a save-losing or common-path crash blocks a release, and every fixed blocker or major bug gets a test. Steam branches `playtest`, `beta` and `default`; rollback to the previous build. An 8-step release checklist for the demo, launch and every patch, ending in the owner's sign-off. Detail: `docs/design/PLAN.md` §15.
- **Why:** Owner accepted the draft (Plan Q15b); adopts the tools review (D-092..D-094) and keeps CI minutes low (CI-01..CI-06).
- **Amended (2026-10-27, D-158):** the phone stores' test tracks, staged rollouts, fix-forward releases and cloud saves replace the Steam steps for the phone launch.

## D-106 Launch platform: Windows

- **Status:** Accepted (2026-10-26)
- **Decision:** Launch on Windows only. Linux and Steam Deck players can run it through Proton, not promised on the store page. Steam Deck support (1280×800 layout, controller) and a Mac build are decided after launch. Detail: `docs/design/PLAN.md` §15d.
- **Why:** Owner's choice (Plan Q15a): one build to make and test for a solo developer (D-102); the Deck's screen is below the 1366×768 minimum (D-091).
- **Replaced (2026-10-27, D-151):** launch is on iPhone and Android phones; Windows follows after launch (mobile first, D-150).

## D-107 Reviewers are independent

- **Status:** Accepted (2026-10-26)
- **Decision:** Every review agent gets an unbiased brief: the goal, the files or diff, the lens and open questions, never the main session's findings, conclusions, hypotheses or preferred answer. The main session forms its own view separately and verifies every returned finding before using it (DEL-05, VER-05). Recorded in AGENTS.md project rules.
- **Why:** Owner's rule (2026-10-26): a reviewer handed the main thread's view tends to confirm it.

## D-108 Solo timeline at 10–20 hours a week

- **Status:** Accepted (2026-10-26)
- **Decision:** The owner builds at about 10–20 hours a week. With the lean cut (D-109) the estimate is about 31–46 months to launch: M1 5–8, M2 7–10, M3 10–15, M4 2–3 alongside M5 7–10, M6 2–3 months. A lasting change in hours re-plans at the next gate. Detail: `docs/design/PLAN.md` §13a, §14e.
- **Why:** Owner's answer (plan review Q1); the first estimate (18–28 months) assumed a small team, but the owner chose solo (D-102).
- **Amended (2026-10-27, D-156):** mobile first; the phone engine test joins M1, phone builds from M2, launch about 39–68 months from plan approval (estimate), with extra art and phone costs listed in D-156.

## D-109 Lean launch cut

- **Status:** Accepted (2026-10-26)
- **Decision:** Launch has 6 classes (warrior, rogue, ranger, cleric, wizard, bard-like support), 4 ancestries, about 24 monster kinds, about 16 attributes, about 30 traits, about 40 key moments, about 4,500 template lines, 1 tournament, about 6 authored rival guilds (the rest generated), no multiclassing or prestige, and 3 kingdom-map layers (places, guilds, action). Everything stays data; the cut content returns in free updates (PLAN §13c). Detail: `docs/design/PLAN.md` §7, §12.
- **Why:** Owner's choice (plan review Q2): at 10–20 h a week the full scope was an estimated 4–6 years; this keeps the core (watched quests, key moments, permadeath, Chronicle, succession, delegation, the map) and cuts the items with the most cost for their fun.
- **Amended (2026-10-27, D-168):** the buildable guild house and about 5 home-town sites join the launch cut.

## D-110 Engine test is web-first

- **Status:** Accepted (2026-10-26)
- **Decision:** The engine-test pieces (ledger and kingdom map) are built in web tech (Electron, TypeScript), reusing the Story-Generator map code. Godot 4 (C#) is built only if web misses its bar: 60 fps map at 1366×768, readable 15 px ledger, the find-the-fact task. A screen-reader check joins the judging list. Amends D-090. Detail: `docs/design/PLAN.md` §11a.
- **Why:** Owner's choice (plan review Q3) on new evidence: Story-Generator is TypeScript and canvas, and building both engines costs weeks a solo builder does not have.
- **Amended (2026-10-27, D-154):** the engine test is rebuilt as a phone app and judged on the owner's phone.
- **Amended (2026-10-27, D-163):** no Godot fallback; the engine test's bars stay, and a miss goes to the owner.

## D-111 Stop and slip rules

- **Status:** Accepted (2026-10-26)
- **Decision:** If R1 (watching a quest is fun) fails twice, building stops and the core loop is redesigned before anything else. A milestone running 50% over its estimate triggers a cut review at that gate (content dropped or deferred, quality checks never). A prototype step over its time-box by half goes to the owner at once. Ending the project is the owner's call, not a rule. Detail: `docs/design/PLAN.md` §9b.
- **Why:** Owner's choice (plan review Q4).

## D-112 Small region crises at launch

- **Status:** Accepted (2026-10-26)
- **Decision:** Launch has 3–4 small, local region crises: data-driven chains of contracts and consequences that can start from about year 5 and give the middle years goals. Larger region-wide crises and guild legacy projects come after launch. Detail: `docs/design/PLAN.md` §7c, §13c.
- **Why:** Owner's choice (plan review Q5): "Small crisis at launch. Legacy goals and larger crises after launch." Answers the review's finding that years 10–30 had no fresh goals.

## D-113 Plan review: design and production recommendations

- **Status:** Accepted (2026-10-26)
- **Decision:** Adopted on the owner's instruction to go with the recommendations: the simulation core is kept from M1 (only prototype screens are throwaway); resolution v0 first; time-boxed prototype steps; a standing tension most weeks; winter as the planning season; every safe choice (caution, delegation, skipping winter) has a visible price; visible recovery levers without rubber-banding; extra simulator checks (no dominant safe play, winter cash, bad starts, top-guild load, late goals) and a shape-repetition writing check with a template previewer; the map base drawn after alpha balance; break-even stated as cash only; wishlist targets, a monthly devlog and tester sign-up. Detail: `docs/design/PLAN.md` §2b, §2d, §4g, §9b, §9d, §12d, §13, §14c, §14f; review `docs/design/PLAN-REVIEW.md`.
- **Why:** Plan review findings, checked at their cited lines; owner: "just go with your recommendations for the rest."
- **Under review (2026-10-27, D-150):** wishlist targets and Steam playtest recruiting are Steam-only; phone equivalents are open. The marketing budget line in D-157 is unchanged pending that.

## D-114 Engine foundations and code standards

- **Status:** Accepted (2026-10-26)
- **Decision:** Before any rule is coded: values carry their own breakdown and cause; named random streams per system kept in the state (`simulate(state, command)`); playtest saves keep commands since the last snapshot so bugs replay exactly; an event-log retention rule tested against the 30-year save. Package boundaries enforced by lint; one schema source for content types and validation; a text-template grammar before R8; interface labels in string files. `docs/STANDARDS.md` and a per-package `AGENTS.md` written at M1 start; engine invariant checks in every balance run; golden-file tests for text; half-page rules specs written just in time; the stack's dependency list approved once. Detail: `docs/design/PLAN.md` §11h, §11i, §15.
- **Why:** Plan review codebase and standards findings (C1–C8, S1–S4); owner: "just go with your recommendations for the rest."

## D-115 Plan approved (M0)

- **Status:** Accepted (2026-10-26)
- **Decision:** The owner approves the whole plan, `docs/design/PLAN.md` §1–§15 with the plan review's decisions (D-108..D-114). This passes the M0 gate (D-099) and lifts D-001's no-code rule. The build starts at M1: `docs/STANDARDS.md` and resolution v0 first, then the web-first engine test (D-110, D-113, D-114). The plan stays the reference; changes to it go through DECISIONS (SRC-04).
- **Why:** Owner: "merge it and approve the plan" (2026-10-26).


## D-116 Story-Generator code may be reused

- **Status:** Accepted (2026-10-26)
- **Decision:** The owner holds the rights to `DdraigFawr13/Story-Generator` (licence field `UNLICENSED`), so its code (seeded worldgen, ink atlas, named random streams, boundary check) may be copied into this project. Copied files name their source path and commit in a first-line comment; licences of any of its dependencies that come along are checked first (SAFE-05). Answers the open point in `docs/design/PLAN.md` §12d. Code rules: `docs/STANDARDS.md`.
- **Why:** Owner: "I own story generator rights" (2026-10-26).

## D-117 Approved dependency list

- **Status:** Accepted (2026-10-26)
- **Decision:** One approved list (D-114, SAFE-03), all free and open source, versions pinned exactly with the lockfile committed. Dev tools: TypeScript, Vitest, Prettier, `@babel/parser` (package-boundary check), `@types/node`. Game stack for the engine test and after: Electron, Vite with `@vitejs/plugin-react`, React and React DOM, Playwright. Start from Story-Generator's versions where it has the package. Anything else is asked for first. Code rules: `docs/STANDARDS.md`.
- **Why:** Owner chose "approve plus game stack now" (2026-10-26) so the engine test (D-110) needs no second ask.
- **Amended (2026-10-26):** owner approved `@types/react` and `@types/react-dom` (dev-only types for the approved React packages).

## D-118 Resolution v0: quest shape is a hybrid

- **Status:** Accepted (2026-10-26)
- **Decision:** A quest simulates as a chain of scenes (travel, approach, encounters, lair), each settled by a few rolls from the party members who matter against the scene's difficulty, with key moments between scenes. Only the main fight (the lair or the named beast) runs as short rounds of about 3–6 exchanges. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's choice (resolution v0 fork 1, 2026-10-26): tension where it matters at a moderate cost; the price is two systems to tune (scenes and the main fight).

## D-119 Resolution v0: checks are percent chances

- **Status:** Accepted (2026-10-26)
- **Decision:** Every scene check and fight exchange is one roll against a chance in basis points: a base for the difficulty, plus a step per attribute point above or below it, plus gear, plan and site modifiers, clamped to 5–95%. The chance is a `Value`, so its parts show on hover. Every number is content data. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's choice (resolution v0 fork 2, 2026-10-26): easiest to read, show and tune against the death targets (PLAN §4c); the price is swinginess.

## D-120 Resolution v0: harm is tracked in wound steps

- **Status:** Accepted (2026-10-26)
- **Decision:** Each adventurer on a quest moves down five steps: Fit, Hurt, Badly hurt, Down, Dying. A failed exchange or a bad scene moves one step, a bad failure two. Down means being carried; Dying means a death roll unless a healer or a retreat saves them. A lasting injury is rolled at Badly hurt or worse. The step sizes and roll chances are content data, tuned to PLAN §4c. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's choice (resolution v0 fork 3, 2026-10-26): readable on the board, personal harm for attachment (R7), maps to injuries, and death targets tune through a few numbers.

## D-121 Resolution v0: the plan's three levers

- **Status:** Accepted (2026-10-26)
- **Decision:** The pre-quest plan feeds the rolls through three levers. Approach (stealth, assault, diplomacy) picks the attribute each scene tests and shifts difficulty by the site's tags. Risk tolerance (cautious, steady, bold) trades a bonus to chances against how often a failure is a bad one. Retreat threshold (first Badly hurt, first Down, first Dying, never) sets when the leader pulls out; reaching it on a major moment stops the calendar for the player (D-032). No morale track in v0. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's choice (resolution v0 fork 4, 2026-10-26): R1's pass line needs retreat choices to feel real in the watch test.

## D-122 Resolution v0: eight working attributes

- **Status:** Accepted (2026-10-26)
- **Decision:** Resolution v0 uses eight attributes on the 1–20 scale (D-007), working names: Might, Agility, Toughness, Stealth, Wits, Presence, Resolve, Lore. Hidden attributes (consistency, potential, loyalty) wait for the year simulator; the rest of the ~16 (D-109) are added when a system needs them. Final names per STYLE §9. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's choice (resolution v0 fork 5, 2026-10-26): enough to make the three approaches differ, few enough to tune.

## D-123 Resolution v0: foes fight in groups

- **Status:** Accepted (2026-10-26)
- **Decision:** In the main fight, enemies come in foe groups (a named beast, or a band such as goblins), each with its own wound steps and a few attributes from content data, shown as one standee or cluster on the board. Each exchange, every standing adventurer acts against a group and every group acts against someone. Owner's note: "1 for launch but eventually 2": every enemy as its own token is a later goal, not scoped (Proposed until planned). Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's choice (resolution v0 fork 6, 2026-10-26): keeps fights to 3–6 exchanges and named beasts individual; per-enemy tokens add tabletop feel later.

## D-124 Resolution v0: the fallen bleed out

- **Status:** Accepted (2026-10-26)
- **Decision:** A Down member who is not tended rolls at the end of each scene or exchange to slip to Dying; the chance falls with Toughness and is content data. A standing cleric tends one Down or Dying member per beat (Dying first). Death becomes a race against time, so retreat thresholds and healers matter. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's choice (tuning fork, 2026-10-26): measured with `tools/resolution-sweep.ts`, Down members were safe, so deaths stayed near 0.2% per adventurer against PLAN §4c's 0.8% whatever the death roll.

## D-125 Resolution v0: the leader's call is the default retreat

- **Status:** Accepted (2026-10-26)
- **Decision:** The default retreat setting sits between first Down and first Dying, by the situation. Each time a member falls, the leader reads the fight with a Wits check (easier when the situation is clear): a good read holds on to first Dying while winning and pulls out while losing; a failed read makes the wrong call. First Dying is the hard line. Owner's note: "1 and 2 where 2 is influenced by 1 but I want bad leaders to not always make good choices." PLAN §4c's death targets are measured at this default. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's choice (tuning, 2026-10-26): "somewhere between first dying and first downed depending on the situation".

## D-126 Resolution v0: retreat takes time and has its own risks

- **Status:** Accepted (2026-10-26)
- **Decision:** A retreat lasts beats: 1, plus 1 while carrying the fallen, plus 1 on a failed retreat check (all content data). On each beat foes strike if the party fled a fight, and the fallen bleed and roll for death; a party with no one standing is routed. Replaces the old rule that a failed check costs one wound step and the Dying are carried home safe. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner (tuning, 2026-10-26): "retreat should take time and have its own risks associated with it." Without it, retreating at a threshold ended the quest before bleeding (D-124) could matter.

## D-127 Watched-quest prototype is a published web page

- **Status:** Accepted (2026-10-26)
- **Decision:** The R1 prototype (PLAN §9b step 1) is a private web page published as a claude.ai link: party sheet, a plain board with standees moving scene to scene, the scrolling log, and push-on or pull-out buttons at moments. Built in `packages/ui` with Vite + React (D-117) on the real engine and content; the screens are throwaway (D-113), the engine is kept. The owner watches 10 quests and records notes for the R1 pass line (PLAN §9a).
- **Why:** Owner's choice (2026-10-26): nothing to install, works on phone or PC.


## D-128 The roadmap page is updated every session

- **Status:** Accepted (2026-10-26)
- **Decision:** Every working session on this project updates `docs/roadmap.html` and republishes it to the same link (https://claude.ai/artifact/FTio9mE7jLaK4Wrn189YAg), so the owner can follow progress. It stays a view of HANDOFF and PLAN; HANDOFF wins if they disagree.
- **Why:** Owner (2026-10-26): "I want that updated in every chat for this project so I can see the progress."

## D-129 Resolution v0: speed order and sturdier foes

- **Status:** Accepted (2026-10-26)
- **Decision:** In each fight exchange everyone acts in order of speed: Agility for adventurers, a speed number for each foe group (content data). Each foe group also has its own number of hits to beat before it is down (a swarm about 3, a pack about 5, a warden or keeper about 7), so fights last the planned 3–6 exchanges (D-118) and foes strike throughout. Death numbers are retuned after. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Amended:** D-131 gave the mill cellar's rats 8 hits, above the pack's "about 5", so a routine fight can still hurt; the sizes are guides, not limits.
- **Why:** Owner's R1 note (2026-10-26): "I don't see any enemies ever really doing anything at all." Measured over 300 quests per contract: foes got 0–2 attacks per fight and fights lasted 1–2 exchanges, because the whole party acted first and a group fell after 3 wound steps.

## D-130 Resolution v0: classes have signature actions

- **Status:** Accepted (2026-10-26)
- **Decision:** Each class has 2–3 signature actions it uses on its own when the situation fits, shown in the log. Starting set: warrior Guard (takes a blow meant for a comrade) and Cleave (a strong hit also strikes the next group); rogue Scout ahead (helps the party's approach scenes) and Strike from shadow (a better hit on a foe already engaged this exchange); cleric Mend (a hurt member steps back up) and Ward (foes hit less often that exchange). Which class has which action, and every number, is content data; each action kind is one engine rule. Owner's note: "1 but room for 2 as well and room for more actions": roles set in the plan (guard, scout, striker, healer) that change which action a member prefers stay open as a later addition, and more actions (and abilities by level, D-074) are added as data. Detail: `packages/engine/src/resolution/SPEC.md`.
- **Why:** Owner's R1 note (2026-10-26): "there will need to be distinct actions for different classes."

## D-131 Resolution v0: bold overreaches, and risk only touches pressing on

- **Status:** Accepted (2026-10-26)
- **Decision:** An attack that fails badly is an overreach: the foe group attacked strikes the attacker at once, and no guard steps in. The plan's risk (chance shift and bad-failure share, D-121) applies only to the checks content lists as pressing on: scene tests and attacks. Tending, mending, the leader's read and the retreat check ignore it. For tuning, a "cautious" plan means cautious risk with retreat at first Down, and a "reckless" plan means bold risk with no retreat (PLAN §4c: about half and about double the default's deaths).
- **Why:** Owner's choice ("Overreach", tuning pass 2, 2026-10-26). Measured with the sample party, 2,000 quests each, leader's call: hazardous deaths were cautious 0.91%, steady 0.69%, bold 0.50%, because a bad failure on an attack cost nothing and cautious's −5% also weakened tending and retreat. After the change the order is right on all three contracts (cautious lowest, bold highest at each retreat setting, within sampling noise). The half/double ratios are met only on the perilous chapel: reckless/default measured 1.0× routine, 1.35× hazardous, 2.15× perilous; cautious/default 0.78×, 0.74×, 0.52× (`tools/resolution-sweep.ts 4000`; other seed sets gave barrow reckless 0.88–1.18%, so hazardous reckless is 1.35–1.8×). The mill cellar's rats now take 8 hits, above D-129's "pack about 5", so a routine fight can still hurt. The cautious and reckless definitions are the session's default reading of §4c, not an owner ruling.

## D-132 R1 passes, with notes

- **Status:** Accepted (2026-10-26)
- **Decision:** The watched-quest test (R1, PLAN §9a) passes after the owner's 10-quest watch. Owner's notes become work, not blockers: (1) skill and spell names show in the log when used (done the same day: each action line starts with its name); (2) the quest log must feel more meaningful, and the UI will change a lot; (3) it feels "a little hollow"; (4) hidden items, traps and multiple pathways through a quest, later. Notes 2–4 are open for the slice (M2) and the quest template design; how is not decided.
- **Why:** Owner (2026-10-26): "it feels a little hollow but otherwise it is fine for now"; chose "Pass, with notes".

## D-133 Review, then owner approval, then the pull request

- **Status:** Accepted (2026-10-26)
- **Decision:** No pull request is created until (1) an independent adversarial review of the whole branch diff has run (D-093, D-107) and its findings are fixed or reported, and (2) the owner has seen the findings and approved. After approval, Claude creates the PR and, once CI is green with no open review thread or conflict, marks it ready and merges it without asking again. Commits added after approval need a fresh review and approval before merging. This overrides the session default of opening a draft PR right after pushing. Amends D-093.
- **Why:** Owner's rule (2026-10-26), after PR #11 was opened with its second commit reviewed only by the main session: "don't create the PR until after the adversarial review and my approval. Then you can create prs and merge when they are ready."
- **Amended (2026-10-26):** the review's findings, and what was done about each, are also published as an artifact (a private page) and linked when asking for approval. Owner: "in future I would like to see the results of the adversarial review in an artifact as well".


## D-134 Engine-test map: one region, about 300 × 200 km, drawn finer

- **Status:** Accepted (2026-10-26) for the engine test; the size is Claude's default from the owner's request, to confirm when the March is authored (PLAN §7c).
- **Decision:** The kingdom map shows the March as one land region, not a continent: about 300 × 200 km (3:2), so the farthest sites are about 9–10 days' walk from a central guild hall, which fits quests of 2–4 weeks including travel (PLAN §2a) at about 20–25 km a day on foot. Baked at 1 km a cell (300 × 200 cells) and 8 px a cell (a 2,400 × 1,600 px sheet); it opens fitted at 1366×768 and zooms in about 2.6× from there (to a little past 1:1, where the 8 px a cell atlas stays crisp). Sea along one edge, as in the chosen mock-up (`docs/design/mockups/kingdom-map.html`). Finer old-map detail: vector coast, tapered rivers, small regular terrain symbols, drawn towns joined by roads, a neat line, cartouche and scale bar in days on foot, charted ground revealed from blank vellum.
- **Why:** Owner (2026-10-26), on the engine-test preview: "I like what we have and the animations but the map feels a bit disjointed. Double check the ideal map size for this game and then clean up some of the visuals. I like the generated style but I want more precise detail so it feels like an old drawn map."
- **Amended (2026-10-26):** villages between the settlements: 18 hamlets on dry land by a road, river or shore, spread evenly by the bake (`tools/worldgen/layout-villages.ts`), drawn as two or three cottages with a smaller italic name. The 8 settlements stay the launch number and the places contracts come from (PLAN §7c, D-080); villages are scenery until a design gives them a role. Unexplored vellum covers only the far corner the party is bound for. Owner: "I like it but add more towns around the areas."

## D-135 Money is copper, silver and gold

- **Status:** Accepted (2026-10-26)
- **Decision:** No pennies. Game state keeps money as whole copper coins (integers, PLAN §11c); players read it as gold, silver and copper at 10 copper to the silver and 10 silver to the gold (rates in content, `packages/content/src/base/money.ts`; the engine's `splitCoins` does the split, the ui only adds the words). Names in code use `Copper` (`wageCopper`, `feeCopper`).
- **Why:** Owner (2026-10-26): "Let's not use pennies as currency let's just use copper silver and gold"; chose 10 and 10 over 12 and 20 or 100 and 100.

## D-136 Exploring the wilds (owner's wish, after launch)

- **Status:** Accepted as a goal (2026-10-26); design, tier and timing not decided.
- **Decision:** Eventually the guild can send explorers into wild, uncharted areas of the March to uncover hidden places, items and other finds. It joins three things already planned and should be designed with them, not bolted on (WS-05): expeditions (Early update, CONCEPT §28), the map's charted and uncharted ground (the engine-test fog revealed in ink, D-134), and the owner's R1 notes on hidden items and multiple pathways (D-132). Finds are content data (GAME-04). Not built now.
- **Why:** Owner (2026-10-26): "another thing I want eventually is like wild areas to send explorers to and maybe uncover hidden places or items or stuff like that".

## D-137 Death targets are for a well-built party

- **Status:** Accepted (2026-10-26)
- **Decision:** The per-danger death targets in PLAN §4c (0.2 / 0.8 / 2.5 / 7% per adventurer per quest, about 2 deaths a year) describe a strong, well-kitted party, with the sample party (`packages/content/data/prototype-party.json`) as the reference until the game has a fitter definition. An ordinary, randomly drawn guild loses more (the first year-simulator slice: about 4 deaths a year); a careful player earns the target by building and kitting parties well. Tuning checks the targets on the reference party; the year simulator reports the drawn guild alongside. Answers the HANDOFF open question on the reference party.
- **Why:** Owner's choice (2026-10-26), over "a typical guild" and "the year total only".

## D-138 Deaths and signings cost the guild

- **Status:** Accepted (2026-10-26); amounts are starting assumptions for tuning.
- **Decision:** A death costs the guild a funeral (200 copper), a share to the family (26 weeks of the dead member's wage) and, when the plan was reckless (bold risk or never retreating), 5 renown. Signing a recruit in a window costs a sign-on fee of 8 weeks of their wage. Numbers live in content (`packages/content/src/base/guild.ts`); rules in `packages/engine/src/guild/SPEC.md`. Measured (1,000 years, fees retuned to scale 135): bold plans now have the most renown in 22% of years (was 55%) but still the most money in 87% (was 92%), because bold wins more contracts; PLAN §9d's "no dominant safe play" is still missed on money.
- **Why:** Owner's choice (2026-10-26) on the dominant bold plan, over "bold hurts more" and "wait for later slices": every choice needs a visible price (PLAN §4g), and a death had cost nothing and saved a wage.

## D-139 Contracts are a site, a monster kind and one twist

- **Status:** Accepted (2026-10-26); the twist list and every number are starting content, to be tuned.
- **Decision:** A contract on the board is put together from a site template, a monster kind that lives there (with foe groups per danger rating) and at most one twist from a data list (PLAN §9d's combined modifiers). Each twist kind is one engine rule that changes one rule, scene or clause: foul weather (harder travel scenes), bad information (foes stronger than posted), a trap (an extra scene), cursed ground (the fallen bleed faster), a hostage (a raised alarm caps the contract at half done), a deadline (fewer exchanges before the foes slip away). The board names the twist and its fee change, except bad information, which only the report reveals; the report says what each twist did. The board avoids reposting a shape it posted recently, so shapes repeat rarely (R8 shape check). The fixed quest templates stay for the watched-quest prototype and sweeps. Detail: `packages/engine/src/contract/SPEC.md`.
- **Why:** Owner's choice (2026-10-26), "One twist rule", over a twist plus an extra scene, no complications yet, or faction state as the third axis. It gives the R1 notes on traps and multiple pathways a home (D-132).

## D-140 Rival guilds are abstract in the simulator

- **Status:** Accepted (2026-10-26)
- **Decision:** In the headless year simulator the 17 rival guilds are abstract: each has a strength (roster quality, money, staff) that drifts year to year with its results, and its contracts are drawn from the same board tables and resolved as quick odds rather than full quests. The player's guild plays real quests. Deaths, poaching and named stars can be layered on later. This is what R2's ladder check ("no runaway rival in 30 simulated years") runs on.
- **Why:** Owner's choice (2026-10-26), "Abstract rivals", over full simulation (estimated about 18× slower, one real guild per rival, so 30-year balance runs would shrink to a few dozen seeds) and a hybrid (real quests for the player's tier only).

## D-141 The patron sets a yearly target and keeps a confidence score

- **Status:** Accepted (2026-10-26); the targets, confidence steps and retirement ages are starting assumptions for tuning (R9).
- **Decision:** At each Assembly the patron sets one target from the guild's standing (for example win promotion, finish in the top half of the tier, avoid relegation, stay out of debt). At the next Assembly confidence rises when the target was met and falls when it was missed, by how badly. The guildmaster is dismissed when confidence runs out, so one bad year is survivable and about three are not. The guildmaster also ages and retires on health in their 60s or 70s. These two endings are what the R9 proxy (median career 20–30 simulated years, PLAN §9a) measures.
- **Why:** Owner's choice (2026-10-26), "Yearly target", over a running weekly satisfaction score and fixed contract terms with renewal reviews. It mirrors FM's board expectations and gives the player one clear goal a year.

## D-142 Desk notes: contract art and map, person card, parties in the roster

- **Status:** Accepted as direction (2026-10-26); shown in the R4 mock-up, built for real with the UI (M2).
- **Decision:** (1) The contracts screen has an art section: selecting a contract shows a panel with the site's picture over its details (a painted vignette per site, commissioned with the art, PLAN §12). (2) Clicking an adventurer's name opens their card: portrait (woodcut first, STYLE §7), all attributes, kit and abilities, record and recent contracts; equipment, traits and levels join it as those systems arrive. (3) The roster can be grouped by party with a toggle. The mock-up groups people by the party they last went out with, because the simulator does not keep standing parties yet (D-014); the year simulator should add them. (4) A "View on map" button on a selected contract shows the March with the site marked and the way out from the guild hall (owner, 2026-10-26: "I want a view on map button for the contracts just to have an idea of where they are"); sites have no map positions yet, so the mock-up places them at about their travel distance as placeholders. (5) The roster shows a Line column (front or back) instead of "(back)" after the class: clerics start in the back line, where each member is half as likely as each front-line member to be picked as a foe's target, before any guard steps in (target weights front 2 : back 1, resolution SPEC).
- **Why:** Owner (2026-10-26), after the R4 round-2 mock-up: "for the quests I will want to have a section on that screen that is for art", "when selecting a person ... I want a popup showing more details about them like equipment, other stats, art", "I want parties to be shown in roster. Like group by party as a toggle", and "why do all the clerics say back next to them?"

## D-143 RPG-style equipment with a quartermaster, and a smith's shop

- **Status:** Accepted (2026-10-26) as direction; amends D-012. Slot list, item tiers and prices are not designed yet (to workshop with the gear content, PLAN §7d); the mock-up's slots are placeholders.
- **Decision:** Each adventurer has RPG equipment slots, and any item can go in any fitting slot by hand. A quartermaster can fill empty or outgrown slots by a policy the player sets (for example best available, save the good gear for parties bound for deadly work, never touch hand-picked items), so a roster of 15–30 stays kitted without a chore (delegation as in D-012; gear is not among D-038's never-delegated choices, except storied items, which stay hand-assigned). Items are RPG-style: tiers and properties, with named storied items still hand-assigned (D-012). Basic gear can be bought from a smith in a shop area of the guild; later, buildings may give discounts or rarer stock (with the guildhall and compound plans, D-075). The character sheet shows equipment as small cards, one per slot, so an unwanted item is easy to spot; until items exist the cards are placeholders.
- **Why:** Owner (2026-10-26): "I will want to show equipment as little cards on the character sheet. So like I can quickly see if someone has something I don't want them to have"; "I actually want to change things up so that I can add equipment to party members rpg style and have rpg style items. Or I can buy basics from a smith and have a shop area for equipment (maybe I can build buildings for discounts or rarer items in the future". Chose "Slots + quartermaster" over fully hands-on equipping and over keeping guild kit with item slots only. D-012's reason (no per-item micromanagement across a large roster) is kept by the quartermaster policy.

## D-144 A geography review in the map workshop: towns with reasons, sensible roads and rivers, a second city, outposts

- **Status:** Accepted (2026-10-26) as a workshop step; counts and names are set in the workshop. Amends PLAN §7c and D-080's 8 settlements, which becomes a floor; the extra major city counts within D-030's 6–10 settlements and the outposts are counted apart from them.
- **Decision:** The kingdom map workshop (PLAN §12d) gains a geography review before the March's base map is drawn: (1) rivers run believably from high ground to the sea or lakes, and roads follow sensible lines between places (valleys, fords, passes, bridges); (2) every town sits where it would grow for a reason (a crossroads, a ford or bridge, a harbour, a resource such as ore, timber, salt, fish, wool or peat) and has a specialty that the economy and contracts can use; (3) at least one more major city than the current set; (4) outposts in the wild and harsh areas (moor, mountains, deep fen, forest edges). The engine-test map stays a test until then.
- **Why:** Owner (2026-10-26): "add a step in the review process ... where we handle roads on the map and rivers on the map and making sure towns are in sensible locations where they would maybe specialize in a resource or at a crossroads type thing. Also at least one more major city and outposts in the more wild or harsh areas"; chose the §12 map workshop over a new M1 step before the gate and over splitting the work.

## D-145 R6 in M1: a guildmaster's skills and two delegable areas

- **Status:** Accepted (2026-10-26); skills, staff quality, wages and every number are starting assumptions for tuning.
- **Decision:** M1 builds just enough to test R6 honestly: a guildmaster with a few skills that grow when the player does that work personally (D-029, PLAN §5d), and two delegable areas, **training** (how fast adventurers grow) and **recovery** (how fast the injured heal). Each area is run either by the guildmaster or by a hired staff member whose quality and wage vary. The year simulator plays a hands-on policy and a delegated one on the same seeds and reports the difference against R6's pass line (player focus 10–25% better on the chosen area; delegation never ruinous). The other staff roles (deputy, scout, librarian, quartermaster) come with M2.
- **Why:** Owner's choice (2026-10-26), "Two areas, minimal", over all six staff roles in M1 and over deferring R6 to M2.

## D-146 Bad starts in M1: the patron's emergency grant

- **Status:** Accepted (2026-10-27); the amount, interval and costs are starting assumptions for tuning.
- **Decision:** The one recovery lever M1 builds (PLAN §4g) is the patron's emergency grant: when the guild is in debt at a week start, the patron offers a grant of about 8 weeks of the guild's wages, at most once every 3 years. Taking it is the player's confirmed decision; it costs patron confidence (15 offered; 5 after the amendment below) and nothing else. The simulator always takes it. Abstract rivals (D-140) have no chest, so the lever is theirs only once rivals keep accounts. Charity contracts and debt paid in service wait for factions and the finance system.
- **Why:** Owner's choice (2026-10-27), "Emergency grant", over the grant plus debt in service and over all three levers: in 100 simulated careers, 34 guilds ended year 2 below half their starting chest and only 15 of those lasted 10+ years (§9d bad starts).
- **Amended (2026-10-27):** The grant no longer makes next year's target harder; it costs patron confidence only. The owner's option named 10; at 10, 23 of 35 bad starts lasted 10+ years, fewer than with the grant refused, so the tuned cost is 5 (28 of 35). Same 100 simulated seeds, 35 bad starts, share lasting 10+ years: grant with the harder target 18 (51%), grant refused 27 (77%), grant without the harder target 28 (80%). A struggling guild could not meet the harder target, missed it by more places and was dismissed. Owner's choice, "Confidence only", over a loan repaid from fees and over keeping the harder target.

## D-147 Late goals in M1: one minimal crisis

- **Status:** Accepted (2026-10-27); the chain, chances, rewards and pressure are starting assumptions for tuning.
- **Decision:** M1 builds the crisis engine with one data-driven chain (D-112): from year 5, a yearly chance at the Assembly starts it; it posts linked contracts of rising danger one after another; ending it brings renown and patron confidence; while it stands unanswered it raises the guild's weekly costs and lowers the patron's confidence at each review. Chains are content entries, so later crises add data, not engine code. The simulator reports when crises start and how they end (§9d late goals).
- **Why:** Owner's choice (2026-10-27), "One crisis, minimal", over two crises and over deferring the late-goals check to M2.

## D-148 Faster headless simulation: shared content now; in-place apply for tools and careers across cores after step 2

- **Status:** Accepted (2026-10-27). Part 1 merged as PR #15 (branch `ccr-c510692c-px9h9x`). Parts 2 and 3 built 2026-10-27 on branch `ccr-7c31ebb2-c4nfh9`, restarted from `main` after the step-2 merge (PR #16), merged as PR #18 after review and approval (D-133).
- **Decision:** (1) `simulate()` no longer clones `state.content`. The new state shares the given state's content object, so no engine code may write to content (tests freeze it). (2) The engine gets an in-place `apply(state, command)` on the same rule path. `simulate()` becomes a copy plus `apply`, so preview and commit still share one function (GAME-02). Headless tools that own their state call `apply` directly. (3) The career simulator spreads careers across CPU cores. For the same seeds, tool output must match the output before the change.
- **Why:** Owner (2026-10-27): "This last round of testing took a crazy long time." Measured on the step-2 branch: `tools/career-sim.ts` took a median 7.5 s per career, so about 12 min per 100 careers. A CPU profile put 77% of the time in `simulate`'s per-command `structuredClone`. Over 6 careers: a full copy took 36.5 s, a copy without content 20.9 s, and no copy 5.7 s. The output was identical in all three modes. The tool used 1 of 4 cores. The owner chose "all three, after merge" over a content-only fix, habits only, or fixing it on the step-2 branch; then asked for the content fix at once. Part 1 measured on `main`: `node tools/year-sim.ts 100` went from 48.2 s to 19.1 s with identical output; `contract-sweep.ts 10` and `resolution-sweep.ts 300` outputs also identical. Working habits: tune with about 20 careers, run the full set once before review, and run long simulations in the background.

## D-149 Mobile direction: the guildhall as hub, a work desk, the living map

- **Status:** Accepted (2026-10-27) as the direction for any later phone version, except the parts marked Proposed below. Windows-only launch stands (D-106); no mobile work is scheduled.
- **Decision:** A phone version, if built, follows "Hall and Road" with the owner's change. Accepted: the guildhall cutaway is the hub, with one system per room; a work desk, reachable as a tab and as the study in the hall, holds what spans the whole guild (notices, the contract board, the year's numbers and the patron's target, the full roster ledger); the living map is the outside; Ask the clerk answers plain questions; Continue is a pull-down handle; four tabs (Hall, March, Desk, Ask). Proposed, for the owner's review: which system sits in which of the eleven rooms (barracks for members, infirmary, training yard, armoury, smith, library, tavern, gate, strongroom, Hall of Heroes, works), and each room showing who runs it with the never-delegated choices (D-038) marked. Not settled: the tablet layout (the open-book spread was the session's suggestion, not chosen). Phone only: STYLE §3 stays the PC rule; on the phone the pull handle replaces the top bar's fixed Continue. Rough estimate: 1,200–2,420 hours and about $9,000–30,000 more art, less if the hall and map are built for Windows first. Detail: `docs/design/mockups/mobile-hall-desk.html`; earlier rounds `mobile-concepts.html`, `mobile-concepts-2.html`, `mobile-hall-and-road.html`.
- **Why:** Owner (2026-10-27), after four rounds of mock-ups: liked the recommended phone mix with the guildhall and living map added, then "I want satchel to be changed to something like work desk where you can go through notifications and deeper into rosters some of the overall stats that the individual rooms don't provide… the guild house is the hub and the work desk is for overall stuff and notifications and contracts."
- **Amended (2026-10-27):** the room-by-room split (barracks, infirmary, training yard, armoury, smith, library, tavern, gate, strongroom, Hall of Heroes, works) and the staff display in each room are Accepted. The owner said "Do what you recommend", and the session had recommended the split as proposed. The tablet layout stays not settled.
- **Superseded in part (2026-10-27, D-150, D-151, D-155):** mobile first. The phone is now the launch platform, and the hub is home on every platform, so the "no mobile work is scheduled", "Windows-only launch stands" and "Phone only" lines above no longer apply.
- **Amended (2026-10-27, D-169, D-178, D-180):** the 11 rooms are no longer fixed in place: the player builds 7 of them on stacked floors and 4 (gate, training yard, works yard, forge) in the compound.

## D-150 Mobile first: the phone becomes the lead platform

- **Status:** Accepted (2026-10-27) as the direction. Re-plan done 2026-10-27: D-151–D-158 replace or amend each rule listed below. Still open for the owner: the phone sources for the success measures (D-065, D-088), and the phone equivalents of the Steam store page, wishlists, playtest recruiting and Early Access (D-099, D-100, D-113).
- **Decision:** The phone version from D-149 (the guildhall as hub, a work desk, the living map, Ask the clerk, pull to continue) becomes the lead platform; the PC version follows it rather than the other way round. This reopens: the launch platform (D-106), the platform line in CONCEPT §13, the desk layout as the home screen (STYLE §3), the 1366×768 minimum and engine-test bars (D-091, D-110), the R4 desk-density test (PLAN §9a), the target player (D-063), price and store terms (D-104), milestones and timeline (D-099, D-108), and budget (D-103). The engine, content, saves and writing are unaffected: the engine has no screen or input in it (GAME-01, GAME-02).
- **Why:** Owner (2026-10-27), asked when mobile should be planned (options: after launch, alongside launch, mobile first, hub on Windows too), chose "Mobile first" after the D-149 mock-ups: "I love this idea and think it is a really great concept. I like all the details and things and depth. I want this planned."

## D-151 Launch on iPhone and Android phones

- **Status:** Accepted (2026-10-27). Replaces D-106 (re-plan under D-150).
- **Decision:** The game launches on iPhone and Android phones at the same time, held upright, as one web-tech codebase wrapped for both stores. Tablets run the phone layout scaled up; a tablet layout of its own is decided later (D-149 leaves it open). Windows follows after launch, and the order of later platforms (Windows, Mac, Steam Deck) is decided then. iPhone builds need a Mac, bought or rented; that cost is set in the budget re-plan.
- **Why:** Owner's choice (re-plan question 1, 2026-10-27), the recommended option: "iPhone + Android". The option as offered read: "Both phone stores at launch, portrait; tablets run the phone layout scaled up; Windows follows after launch." One build serves both stores, and premium games usually sell best on iPhone (the session's judgement, not measured).

## D-152 Free download, first season free, one $14.99 unlock

- **Status:** Accepted (2026-10-27). Replaces D-104's $24.99 price for the phone launch (re-plan under D-150); D-040's model holds: one purchase, a free demo, no microtransactions.
- **Decision:** On both phone stores the game is a free download. The first season is the demo (D-040, PLAN M4). A single in-app purchase of $14.99 unlocks the full game, for good, with no other purchases. Net per sale is about $10–12 after the store's cut and sales taxes (estimate; the small-developer cut of about 15% is to be rechecked at sign-up). Break-even and the budget are redone in the budget re-plan. English only at launch stays (D-104).
- **Why:** Owner's choice (re-plan question 2, 2026-10-27), the recommended option: "Free + $14.99 unlock". It keeps the free demo from D-040 and a premium price for a deep game, near what phone players will pay (the session's judgement, not measured).

## D-153 Same veteran player, playing in short sittings

- **Status:** Accepted (2026-10-27). Amends D-063 for the phone launch (re-plan under D-150).
- **Decision:** The primary player stays the management-sim veteran from D-063, now on a phone, in the style of a Football Manager Mobile player. A sitting is about 10–30 minutes. The daily Ironman autosave (D-033) lets them stop at any point and resume exactly there. A season still takes about 2–2.5 hours in total (D-064), spread over several sittings. The depth is not cut for the phone. Tabletop fans stay secondary, carried by the gentle first season and delegation.
- **Why:** Owner's choice (re-plan question 3, 2026-10-27), the recommended option: "Same veterans, short sittings". The owner wants the depth shown in the D-149 mock-ups kept.

## D-154 Phones 375 points wide and up; phone versions of the engine test and R4

- **Status:** Accepted (2026-10-27). Amends D-091's screen minimum, D-110's bars and PLAN §9a R4 for the phone launch (re-plan under D-150).
- **Decision:** (1) The game supports phones 375 points wide and wider, held upright: the iPhone SE and most Android phones from about 2019 on. It must also lay out correctly on larger phones. (2) The engine test is rebuilt as a phone app from the same web code. It is judged on the owner's own phone: a 60 fps map with smooth pinch and pan, text no smaller than 15 px (D-084), and a screen-reader check. Measurements in the container count only as a floor; the verdict needs the owner's device evidence (VER-07). (3) R4 becomes a phone test. The owner finds 5 set facts in under 10 seconds each, using the hall hub, the work desk and Ask the clerk (D-149). The 25-row roster rule is dropped.
- **Why:** Owner's choice (re-plan question 4, 2026-10-27), the recommended option: "375-pt phones, new phone tests". Testing phones now, not at the slice, finds layout or speed problems while they are cheap.

## D-155 The guildhall hub is the home screen on every platform

- **Status:** Accepted (2026-10-27). Replaces D-049 and STYLE §3 (re-plan under D-150).
- **Decision:** On every platform, home is the guildhall hub with its rooms (D-149). The work desk holds the whole-guild views, and the living map is the outside. Pull to continue is the phone's Continue. When Windows follows, its wide screen shows the hub and the work desk side by side, with the same rooms, desk views and map. The PC gets no separate desk interface. Two parts of STYLE §1 still hold on every platform: the in-world look frames set pieces, and data screens sit on a clean paper layer.
- **Why:** Owner's choice (re-plan question 5, 2026-10-27), the recommended option: "Hall hub everywhere". The option as offered read: "The guildhall hub with its rooms becomes the home on every platform; the PC version shows the hub and work desk side by side on a wide screen. One design to build and test; STYLE §3 is replaced." One design to build and test serves a solo builder (D-102), and it lets the PC version follow the phone, as D-150 intends.

## D-156 Mobile first takes longer: about 39–68 months to launch, accepted

- **Status:** Accepted (2026-10-27). Amends D-099, D-103 and D-108 for the phone launch (re-plan under D-150).
- **Decision:** The milestone ladder (D-099) and the lean content cut (D-109) stay. M1 gains the phone engine test (D-154). The phone app is built from the vertical slice (M2) on, and every later milestone ships to both phone stores. Estimated extra work is about 500–1,400 hours. D-149's 1,200–2,420 hours was a phone version added on top of the Windows game. As the only launch interface, it replaces the PC desk (about 500–1,000 hours) and the Windows shell and release work that is no longer needed before launch (about 0–200 hours). At about 15 hours a week that is about 8–22 months more, so launch moves to about 39–68 months from plan approval (estimate). Estimated extra money: about $9,000–30,000 of art for the hall rooms and town views; a Mac or Mac rental for iPhone builds; two or three test phones; Apple's developer fee of about $99 a year and Google's of about $25 once. Prices are to be rechecked when spent. The hire stays an option at the slice gate (D-102, D-103). The stop and slip rules (D-111) apply as before.
- **Why:** Owner's choice (re-plan question 6, 2026-10-27), the recommended option: "Accept the longer timeline", rather than trimming the hall or bringing the hire forward.

## D-157 Budget and break-even for mobile first

- **Status:** Accepted (2026-10-27). Restates D-103's budget and D-104's break-even for the phone launch (D-152, D-156). All figures are estimates in US dollars; store prices and fees are to be rechecked when spent.
- **Decision:** The solo budget becomes about $66,000–219,000, including 20% contingency (it was about $52,000–174,000). This is the D-103 subtotal of $43,600–145,100 with these changes:
  - Hall-room and town-view art: +$9,000–30,000 (D-156).
  - A Mac or Mac rental for iPhone builds: +$600–1,500.
  - Two or three test phones: +$300–1,000.
  - Store fees: +$425–625 (Apple about $99 a year over 4–6 years, Google about $25 once).
  - Longer AI and tool subscriptions at $100–200 a month for 39–68 months: +$900–4,600.
  - The Steam fee is no longer needed at launch: −$100.
  - The subtotal becomes $54,725–182,725.
  
  At about $10–12 net per $14.99 unlock (D-152), break-even on cash costs is about 5,500–22,000 unlocks. With a developer hire at the slice gate (about $60,000–144,000, D-103), the total becomes about $138,000–392,000 with contingency (it was about $124,000–347,000). Break-even is then about 11,500–39,000 unlocks. Spend before the hire gate (M1–M2) becomes about $9,000–30,000, adding the Mac, the test phones and the first store fees to D-103's $8,000–27,000. The marketing line stays as it was, pending the phone store-page question (D-113).
- **Why:** The owner said "Do what you recommend" (2026-10-27) to the re-plan's remaining items. Mobile first changes the art, the hardware, the fees, the timeline and the price, so the earlier figures no longer held.

## D-158 Releases through the two phone stores

- **Status:** Accepted (2026-10-27). Adapts D-105's release process and PLAN §15 for the phone launch (D-151); store terms are to be rechecked at sign-up.
- **Decision:**
  - **Test builds:** Apple's TestFlight and Google Play's testing tracks replace the Steam `playtest` and `beta` branches. Slice and alpha testers (M2, M3) use the closed tracks; the beta (M5) uses the open ones.
  - **Releases:** the demo and the full game are one app with the in-app unlock (D-152), so there is no separate demo app. Updates go out as staged rollouts on both stores, and a bad rollout is paused. Apple's phased release covers updates only, not the first version (to recheck).
  - **Rollback:** neither store can set an earlier build live again (to recheck). A bad release is fixed forward with a higher version number, and saves made by the bad build must load in the fixed one (GAME-05).
  - **Cloud saves:** the phone's own backup (iCloud, Google backup) restores saves on a new phone. This is a step down from Steam Cloud: it is not live sync, and Google's backup has a per-app size cap (about 25 MB, to recheck). Live sync across devices would need Game Center or Play Games saved games; that is decided when builds start (D-091).
  - **Achievements:** the Steam achievements become optional Game Center and Google Play Games achievements.
  - **Screen tests:** screens are tested upright at 375 and 430 points wide, with 15 px minimum text and no clipping at 150% text size (D-077, D-084, D-154).
  - **Builds:** iPhone builds run on the owner's Mac or a rented one, on release tags only. CI keeps running on Linux, because macOS runners cost many times more minutes (CI-01).
  - **Crashes:** the game itself still sends nothing (D-088). The stores' own crash reports, sent by the phone with the player's consent, are read alongside testers' attached logs.
  - **Release checklist:** item 4 (fresh and upgrade installs) becomes "on a small phone and a large phone on each system". Item 5 becomes "cloud saves and achievements work on the store build".
- **Why:** The owner said "Do what you recommend" (2026-10-27) to the re-plan's remaining items. Steam-specific steps no longer apply to a phone launch.

## D-159 Phone R4: the owner's Pixel, blind facts, timed by the page

- **Status:** Accepted (2026-10-27). Sets how the phone R4 test (D-154) runs.
- **Decision:** The owner takes R4 on their own Android phone, a Pixel 10 Pro XL (about 412 dp wide at the default display size, an estimate; the test page shows the measured width). Screens are built for 375 points and checked at 375, 412 and 430. The session picks 5 facts from a simulated guild and keeps them hidden until the owner taps Start. The page times each answer, checks it, and saves the results to the published artifact, so the owner pastes nothing.
- **Why:** Owner's answers (planning round, 2026-10-27): "Android phone", then "Pixel 10 xl I think?", then "Blind, page-timed", the recommended option. A blind test measures finding a fact, not remembering a question the owner wrote.
- **Corrected (2026-10-27):** measured on the owner's phone in the Claude app, the page is 443 × 790 px at 2.4375× (round 1), not about 412; screenshots now also check 443.

## D-160 The step 4 text prototype is a phone-first web page

- **Status:** Accepted (2026-10-27). Applies D-150 to PLAN §9b step 4 (R7).
- **Decision:** The two-year text prototype plays in a phone browser in short sittings (D-153), with the hub's four tabs in plain text. It should also work in a PC browser (from the recommended option's wording, not the owner's reply). Its screens are throwaway (D-113); the simulation core is kept.
- **Why:** Owner (planning round, 2026-10-27): "Maybe phone first web page or we can start a project in vercel? We will want to reassess tools and skills for this shift I think".

## D-161 Vercel Hobby for phone builds while the game is a hobby; tools reassessed for mobile first

- **Status:** Accepted (2026-10-27) for hosting. The tools and skills review is to be done; its choices are Proposed until the owner approves them.
- **Decision:** Phone-playable builds (the step 4 prototype, the phone engine test) are hosted on Vercel's free Hobby plan while the game is a hobby project. Before any sale, the account moves to Pro (about $20 a month, to recheck), since Hobby is for non-commercial use. The R4 test stays a published artifact, because it saves the timings. Before step 4, the session reassesses the project's tools, skills and agents for mobile first (phone screenshots, touch checks, Vercel previews, a store wrapper later), as an update to `docs/design/TOOLS-REVIEW.md`.
- **Why:** Owner (planning round, 2026-10-27): "right now this is a hobby game and if I choose to move on to actually put this into sale o would change to the pro plan", and "We will want to reassess tools and skills for this shift". D-152's price and D-157's break-even stay the plan for a commercial launch.
- **Done (2026-10-27):** the tools review is D-167.

## D-162 Phone R4 round 2: names A–Z with a filter, money on the desk, a Find field

- **Status:** Accepted (2026-10-27). Changes the phone R4 page (D-154, D-159) after round 1.
- **Decision:** (1) Lists of people (Barracks, Infirmary, the desk roster) run A–Z by name with a filter box at the top. (2) The work desk gets a Money page with the week-by-week ledger and the year's figures, in place of Overview; the Strongroom keeps its ledger. (3) A Find field on the hall and the work desk answers as the owner types a name, a week, a site or a topic, with the clerk's answer shown in place. Round 2 runs on a new seed.
- **Why:** Round 1 (2026-10-27, seed phone-1): 5 of 5 right, 0 under 10 s (12.5, 21.1, 46.1, 11.6, 10.6 s). The paths showed names hunted in party-grouped or date-sorted lists, the weekly wages sought on 7 desk screens before the Strongroom, and Ask the clerk never used. Owner's choice: "All three fixes", the recommended option.

## D-163 Web tech is the engine; no Godot fallback

- **Status:** Accepted (2026-10-27). Supersedes D-090's two-engine choice and D-110's Godot fallback.
- **Decision:** The game is built in web tech (TypeScript), one codebase wrapped for both phone stores (D-151). Godot is not built as a fallback. The phone engine test (D-154) keeps its bars; if the web build misses one, the owner decides what follows (the session's wording of the consequence, not the owner's).
- **Why:** Owner (2026-10-27), asked whether the fallback still stands after D-151: "Godot fallback does not stand".

## D-164 The March is a free pan-and-zoom map where everything shown can be tapped

- **Status:** Accepted (2026-10-27) as the direction for the March tab (D-149) and the kingdom map (D-087, D-097). The images' scope and cost are to be set in the map workshop (D-144).
- **Decision:** The March is one canvas the player moves and zooms freely, with pinch and drag on phones, rather than fixed zoom steps. Towns, places, parties, events and the other marks of the launch layers (places, guilds, action; D-097) show on it, and tapping any of them opens a pop-up with its details and an image. The phone engine test (D-154) builds this first: free pan and zoom at 60 fps, tappable marks and a pop-up with a placeholder image. The R4 fact test keeps its still map, so round 2 stays comparable with round 1 (the session's choice, told to the owner).
- **Why:** Owner (2026-10-27): "for the march by the way I want it to be like a free move zoom canvas map and I want towns and places and events and whatnot to show on the map and be clickable to show a pop-up screen with details and images". It replaces the stepped March, Shire and town zoom of the D-149 mock-up.

## D-165 R4 passes on the phone

- **Status:** Accepted (2026-10-27)
- **Decision:** The find-the-fact test (R4, PLAN §9a, as a phone test under D-154) passes. In round 2 (seed phone-2, the owner's phone at 443 × 790 px), the owner found all 5 facts, each right, in under 10 seconds: 8.9, 8.0, 9.8, 5.8 and 6.1 s. For the three facts about people they typed in Find, then opened the adventurer's card; the money and the contract facts went through the work desk. Round 1 (seed phone-1) failed at 0 of 5 under 10 s; round 2 followed D-162's changes, on a different guild. R5 (readability, D-084) is not decided here.
- **Why:** The owner's timed run, pasted by the owner and saved by the test page (`r4runs`, round 2, attempt 1, no answer flagged as a guess). That it meets R4's pass line is the session's reading of PLAN §9a.

## D-166 R5 passes: 15 px with lining figures reads well on the phone

- **Status:** Accepted (2026-10-27)
- **Decision:** The readability check (R5, PLAN §9a) passes on the owner's phone, the one used for R4 (D-165): the 15 px minimum with lining figures (D-084) stays. The fallbacks, our own ledger cut (D-052) and clear print as the default (D-077), are not needed now; clear print stays a player option. The test was short sittings; reading over long sittings is checked again in the step 4 prototype.
- **Why:** Owner (2026-10-27), asked whether the 15 px text read comfortably in the fact test: "Yes, readable". That the fallbacks are not needed, and the long-sitting recheck, are the session's reading of that answer.

## D-167 Mobile-first tools: phone checks, Vercel previews, Capacitor later

- **Status:** Accepted (2026-10-27). Completes D-161's tools review (`docs/design/TOOLS-REVIEW.md` §6).
- **Decision:** (1) `tools/mockup-shot.mjs` gains phone checks at D-159's widths, 375, 412, 430 and 443 px (443 is the owner's phone, measured in D-165), with touch emulation; it flags tap targets under 44 × 44 px (Apple's figure; Android's Material asks 48 dp), text under 15 px, unlabelled controls and sideways scroll, and saves the accessibility snapshot. (2) This repo is linked to a new Vercel Hobby project, so every PR gets a preview link and `main` a stable link for the owner's phone, built by Vercel rather than Actions. (3) The phone engine test is first a web page on that link, with an on-page frame-rate panel; the owner's phone gives the verdict. (4) The store wrapper is Capacitor, adopted at the vertical slice with its own SAFE-03 approval then. (5) A real iPhone check is needed before release. (6) No new agents; new screens get the `design:accessibility-review` skill.
- **Why:** Owner's choice (2026-10-27), the recommended option "All 1–6". The container measurements behind it are in TOOLS-REVIEW §6.

## D-168 A buildable guild house and a small home town at launch

- **Status:** Accepted (2026-10-27). Amends D-075, D-080 and D-109 (the 5 fixed facilities × 3 levels at launch) and D-149 (fixed rooms). Detail: D-169–D-171, `docs/design/PLAN.md` §5c.
- **Decision:** At launch the guild house is built up room by room (D-169, D-170) in place of the 5 fixed facilities × 3 levels, and the guild can fund places in its home town (D-171). The home town is the only one with sites at launch, with about 5 sites; more towns and sites come in free updates. Taken from Fallout Shelter: a hall that starts small and grows, rooms that merge, upgrades, people in rooms, and specialising because space and coin are short. Left out: tapping rooms to collect resources and a power, food and water loop, which are chores for a player in short sittings (D-153). Estimates, not measured: the hall builder adds about 150–300 h and $2,000–6,000 of room art; the town sites add about 80–160 h and $1,000–3,000 of art; together about 230–460 h and $3,000–9,000. These are not yet in PLAN §12–§14's totals and are added at the next re-plan.
- **Why:** Owner (2026-10-27): "I want the ability to have the guild house be a little like fallout shelter in that you have to build up the house itself and I also want the ability to build up locations in the surrounding town for benefits and boosts." They chose the recommended option, "Hall at launch, small town", over a hall at launch with the town later and over both after launch. The hub is already a cutaway with one system per room (D-149), so building it up extends the planned hub and doesn't replace it.

## D-169 The guild house grows as stacked floors

- **Status:** Accepted (2026-10-27).
- **Decision:** The hub (D-149, D-155) is a side-on cutaway of floors 3 cells wide, which fits an upright phone. A room takes 1–3 cells, and rooms of the same kind side by side merge into one bigger room. The house grows up (upper storeys, a tower) and down (cellars dug out at cost). A new guild starts with the common room (a small tavern), the gate and a small barracks, around the study, which holds the work desk (D-149) and is always there rather than built. Each room kind is a building entry in data with its sizes, levels and effects (GAME-04); the 11 room kinds of D-149 are the launch list. Builds take weeks and are best done in winter (D-067).
- **Why:** Owner's choice (2026-10-27), the recommended option "Stacked floors", over rooms unlocking in fixed places and over a top-down compound. Layout becomes a real choice, and the cutaway hub stays.
- **Amended (2026-10-27, D-178, D-180):** the gate is no longer part of the starting hall; it stands in the compound wall. Of the 11 kinds, 7 are hall rooms on stacked floors and 4 (gate, training yard, works yard, forge) are compound buildings.
- **Amended (2026-10-27, D-187):** a new guild starts smaller: a 1-cell barracks of 8 beds, a small training yard of 3-4 places, and no infirmary or a rudimentary one.

## D-170 Rooms have capacity and a staff head

- **Status:** Accepted (2026-10-27).
- **Decision:** A room's size and level set its capacity: barracks beds cap the roster, infirmary beds cap how many heal at the fast rate, and training-yard and library places cap how many train or study. Each room has one staff head whose skill sets its strength (shown in the room, D-149). Members go to rooms by state (the wounded to the infirmary); training and study places are filled by hand or by the head's policy (delegation, D-022; the option text cited D-012's quartermaster policy as the model). Hand-placing is never required.
- **Why:** Owner's choice (2026-10-27), the recommended option "Capacity + staff", over flat guild-wide bonuses and over hand-placing every member. Capacity makes room size matter, and the heads' policies keep a roster of 15–30 from becoming a chore on the phone.

## D-171 Town sites are patronage

- **Status:** Accepted (2026-10-27).
- **Decision:** The guild funds places in its home town that the townsfolk own: at launch the smith, temple, inn, market and stables, each with 3 levels. Their boosts: cheaper and rarer gear (the town smith supplies the guild's own smith room and shop, D-143, D-149, which still sells basic gear), cheaper healing and revival (the temple), a better recruit pool (the inn), better loot prices (the market) and faster travel (the stables). Funding raises the guild's standing with the town, and the boosts hold only while that standing holds: a scandal or a rival guild's bigger purse can cost the guild a site. Each site is a data entry (GAME-04), and the boosts show where they apply (a price line, a log line).
- **Why:** Owner's choice (2026-10-27), the recommended option "Patronage", over guild-owned buildings and over a mix of the two. Tying the boosts to standing and rivals makes them part of the guild's politics, so they don't sit on top of the game as a separate city-builder, and they give late-game money a sink (PLAN §4).

## D-172 Rooms have 3 levels, and height and depth cost more

- **Status:** Accepted (2026-10-27).
- **Decision:** Every room kind has 3 levels, like the town sites (D-171). A cell costs more the higher or deeper it is, so the first upper storey and the first cellar are cheap and the tenth is not. Pacing targets for the year simulator, from the option the owner chose: the first extra room is affordable in the first season, and a full house costs about 8–12 years of a mid guild's surplus, the old facilities' target (PLAN §5c). Kinds may differ in width (some 1 cell only, some up to 3); the exact costs, widths and capacities are set in the simulator. Mock-up: `docs/design/mockups/guild-house.html` (https://claude.ai/artifact/D57ueUj99aC7vVxZX9hMLU).
- **Why:** Owner's choice (2026-10-27), the recommended option "3 levels, height costs", over a flat cell cost and over 5 levels. It keeps the money target the simulator already checks, and the level count matches the town.
- **Amended (2026-10-27, D-185):** "costs more the higher or deeper" applies to the extensions (each storey, cellar or wall push dearer than the last), not to rooms by floor.

## D-173 The house has a few incidents, as letters

- **Status:** Accepted (2026-10-27).
- **Decision:** About 1–2 house incidents a year (a target for the simulator), each arriving as a letter with a choice (D-043): for example a fire in the smith or tavern, a rival's break-in at the strongroom, sickness in a crowded barracks. They are more likely when a room is neglected or full (a barracks can't be over capacity, D-174, unless beds are lost). Each incident kind is a data entry (GAME-04); none is a tapping minigame (D-153).
- **Why:** Owner's choice (2026-10-27), the recommended option "A few, as letters", over no incidents and over incidents after launch. Incidents tie the house to capacity and to rivals through letters the game already has.

## D-174 No bed, no signing

- **Status:** Accepted (2026-10-27).
- **Decision:** The guild can't sign a member without a free barracks bed: the roster is capped by beds (D-170). The signing screen says so and points to the barracks. D-173's barracks sickness therefore comes from a full barracks, not an over-full one. Not settled: what happens if beds are lost while members are signed (a fire, D-173), for example whether those members sleep rough until it is rebuilt.
- **Why:** Owner's choice (2026-10-27), "Signing is blocked", over the recommended option (sign, and extras sleep rough with a morale cost) and over a small overflow then a block. A clear cap that makes barracks space a real decision.
- **Amended (2026-10-27, D-182):** settled: members who lose their beds lodge at the inn for a fee.

## D-175 The home town is a faction

- **Status:** Accepted (2026-10-27).
- **Decision:** The home town is a faction, and the standing that holds the town sites (D-171) is its faction standing (D-019), one value in the faction ledger. Patronage, contracts for the town, scandals and failing the town all move it. The town screen shows that value with the mark below which the boosts stop. It is one of the two city factions (D-181).
- **Why:** Owner's choice (2026-10-27), the recommended option "Town is a faction", over a separate town meter. One value per faction already exists, so a second meter would be bolted on (WS-05).

## D-176 Only the gate and strongroom are locked to a floor

- **Status:** Accepted (2026-10-27).
- **Decision:** The gate is on the ground floor and the strongroom is below ground; every other room kind can go on any floor. The lock is a field on the room kind's data entry (GAME-04), and the build sheet greys out kinds that can't go in the chosen cell, with the reason. Building in the hall lists only hall kinds, and building in the compound only compound kinds (D-180).
- **Why:** Owner's choice (2026-10-27), the recommended option "Gate and strongroom only", over no locks and over more locks (training yard on the ground floor, library or Hall of Heroes in a tower). Two locks that make sense at a glance without making layout a puzzle with one answer.
- **Amended (2026-10-27, D-180):** the gate moves to the compound wall, so the strongroom is the only hall room locked to a floor; four kinds are compound-only.

## D-177 Rooms cost a small weekly upkeep

- **Status:** Accepted (2026-10-27).
- **Decision:** Each room costs a small weekly upkeep that rises with its level, shown on the room's page and on the desk's Money page. Amounts are set in the year simulator, with D-172's pacing targets.
- **Why:** Owner's choice (2026-10-27), the recommended option "Small weekly upkeep", over no upkeep. A big house has a running price, and late-game money gets another sink (the roadmap's money risk).
- **Amended (2026-10-27, D-185):** sized at about 20% of spending from year 10.

## D-178 A compound around the hall, with outdoor-only buildings

- **Status:** Accepted (2026-10-27) as the owner's direction; how it is drawn and which kinds are outdoor-only are settled by D-180. Amends D-169 (all rooms on stacked floors) and D-176 (floor locks).
- **Decision:** The guild house is the hall and the compound around it. Some buildings can only be built in the compound, the training yard among them; the rest stay rooms in the hall's floors. Each kind's data entry says where it can go (GAME-04, D-176).
- **Why:** Owner (2026-10-27), adding to the upkeep answer: "for the guild hall I want it to be the hall itself and like the surrounding compound where you can build things like training yard. Some set buildings can only be built in the compound area."

## D-179 The home town is a top-down map with build plots

- **Status:** Accepted (2026-10-27) as the owner's direction; amends the street view in round 1 of `docs/design/mockups/guild-house.html` (replaced by round 2, not kept).
- **Decision:** The home town is a top-down, scrollable map of the town's layout, with its places and empty build plots marked. It is laid out so the town can grow (more plots and sites in updates, D-168). An empty plot is where the guild pays to found a site, which a townsperson then runs; patronage (D-171) is unchanged (owner's choice 2026-10-27, the recommended "Found new sites by patronage", over guild-owned buildings and over both).
- **Why:** Owner (2026-10-27): "I want the town to be a top down view of the town in like a layout so it can be expanded. I want it to be a scrollable map with build plots and locations marked."
- **Amended (2026-10-27, D-184):** at launch every site already stands, so founding means the first payment to an unfunded site; the 3 spare plots wait for site kinds added in updates.

## D-180 The compound is side-on, beside the hall; four outdoor-only kinds

- **Status:** Accepted (2026-10-27). Details D-178; amends D-176 (the gate) and D-169 (the starting gate).
- **Decision:** The compound continues the hall's side-on cutaway at ground level: the player swipes left or right from the hall to the yard, where outdoor plots are drawn at the same scale. The hall stays the home screen (D-155). Four kinds are compound-only: the training yard, the works yard, the gate (now in the compound wall, not the hall's ground floor) and the smith's forge. The other room kinds (barracks, infirmary, armoury, library, tavern, strongroom, Hall of Heroes) stay in the hall, with the strongroom below ground (D-176). Assumed until the simulator sets them: the compound's width in plots, and that compound plots follow the hall's rules (1–3 plots per building, same kinds side by side merge, 3 levels, D-172).
- **Why:** Owner's choice (2026-10-27): the recommended view "Side-on, swipe sideways", over a top-down compound with the hall as one building and over a separate Grounds plan; and for outdoor-only kinds, the recommended works yard and gate plus the smith's forge, leaving the Hall of Heroes in the hall. One picture in one projection keeps the hub as it is.
- **Amended (2026-10-27, D-183):** the compound's width and its plot rules are settled: 3 plots a side at the start, pushed out to about 6.

## D-181 The home town is one of the two city factions

- **Status:** Accepted (2026-10-27). Settles the open point in D-175.
- **Decision:** The guild's home town is one of the 2 city factions among the 6 launch factions (PLAN §7: the crown, two cities, a temple, a merchant house, the outlaws). Funding its sites and doing its contracts move that one city's standing (D-175); contracts for the other city move the other city's standing, as each faction has one value (D-019). The faction count stays 6. The other city is the natural rival town if more towns get sites in an update (D-168); that is a session note, not decided.
- **Why:** Owner's choice (2026-10-27), the recommended option "One of the two cities", over a seventh faction for the town council and over the town following a bigger faction's standing. It adds no new crest, writing or balance work.

## D-182 Members who lose their bed lodge at the inn, for a fee

- **Status:** Accepted (2026-10-27). Settles the open point in D-174.
- **Decision:** If an incident (D-173) or anything else destroys beds while members are signed, the members without a bed lodge at the home town's inn for a weekly fee per member, shown on the Money page, until beds are rebuilt. The fee is lower when the guild funds the inn (D-171). No one can be signed while any member lodges at the inn (owner's confirmation, 2026-10-27), so the inn is never a way round D-174; lodgers are the one case where the roster exceeds the beds (D-170). The inn always takes lodgers: funding it only lowers the fee, so losing the inn to a rival raises it (owner's choice, 2026-10-27, both recommended options). If the guild can't pay, the fee goes into debt like wages (D-190). Fee amounts are set with the year simulator.
- **Why:** Owner's choice (2026-10-27), "Lodge at the inn, for a fee", over the recommended option (sleep rough with a morale cost until rebuilt) and over releasing members until the roster fits. It ties a house incident to the town.

## D-183 The compound starts at 3 plots a side and its walls can be pushed out

- **Status:** Accepted (2026-10-27). Settles the compound's width, left assumed in D-180.
- **Decision:** A new guild owns 3 plots on each side of the hall (6 in all). Buying the neighbouring land pushes a wall out by 1 plot at a rising cost, up to about 6 plots a side (targets, set with the simulator). Compound plots follow the hall's rules: a building takes 1–3 plots, same kinds side by side merge, and each kind has 3 levels (D-169, D-172). Land prices are set with the year simulator.
- **Why:** Owner's choice (2026-10-27), the recommended option "3 plots a side, walls expand", over a fixed 3 a side and over starting with 1 a side. It gives a long career room to grow, and the mock-up already showed 3 plots a side.

## D-184 One hand-made home town: 5 sites standing and 3 spare plots

- **Status:** Accepted (2026-10-27). Settles the town's layout, left open in D-179.
- **Decision:** The home town is one hand-drawn map, the same in every new game. It shows the 5 launch sites already standing (D-171), some unfunded at the start; the guild's compound; the council hall of its city faction (D-181); and 3 empty plots held for site kinds added in updates. At launch the guild's first payment to an unfunded site counts as founding it (D-179). Not settled: what the 3 spare plots show at launch before any update fills them.
- **Why:** Owner's choice (2026-10-27), the recommended option "Hand-made, 5 sites + 3 plots", over a town generated per game and over a town of 5 empty plots. The map art is drawn once and reads the same in every game.

## D-185 Room upkeep near 20% of late spending, a lever to adjust

- **Status:** Accepted (2026-10-27). Sizes D-177's "small weekly upkeep"; confirms the session's reading of D-172.
- **Decision:** Room upkeep is set so that, in the career simulator with the house on, it comes to about 20% of all spending from year 10 (measured 20.0%, p10 12.5%, p90 26%, 40 careers), up from the first pass's 13%. Content: 8 / 17 / 34 copper per cell per week by level. It is a lever to adjust with playtests. And D-172's "a cell costs more the higher or deeper it is" means each new storey, cellar or wall push costs more than the last; a room costs the same on any floor that exists.
- **Why:** Owner (2026-10-27), asked whether 13% counted as small: "Raise to 20 but this is a lever we can adjust if needed." On height costs the owner chose the recommended "Extensions only" over a per-floor surcharge on every room.

## D-186 Room effects: no infirmary bed heals 2× slower; no training place halves growth

- **Status:** Accepted (2026-10-27). Details D-170 for the second house pass.
- **Decision:** A member with a lasting injury and no free infirmary bed stays out twice as long as one in a bed; in a bed, healing runs at the current rate, scaled by whoever runs recovery (staff/SPEC.md). After a quest, a member with no free training-yard place grows at half the chance of one with a place; with a place, growth runs at the current rate, scaled by whoever runs training. Beds and places are filled by the head's policy (D-170). Infirmary beds and training places per cell by level are content numbers set with the simulator. A new guild starts with neither room (D-169), so it heals slowly and grows at half rate until it builds them; the simulator measures what that does to early years.
- **Why:** Owner's choices (2026-10-27): "Heals 2× slower", over the recommended 1.5× and over a bed that only speeds healing; and the recommended "Half the growth chance" for training, over growth only with a place and over a place as a bonus.
- **Amended (2026-10-27, D-187):** the training half is replaced: growth after quests has no place penalty; the yard instead adds training at home at 1.5 times a base rate for placed members and 0.75 times for the rest. The sickbed half stands.

## D-187 A smaller start and training at home in the yard

- **Status:** Accepted (2026-10-27). Amends D-169 (the starting rooms) and the training half of D-186.
- **Decision:** A new guild starts small: about one adventuring party and a few backups to grow into a second (the simulator founds 7 and signs more as beds allow, a session reading), with a 1-cell barracks of 8 beds. It starts with a small training yard of 3-4 places, and either no infirmary or a rudimentary one with a few beds that can be upgraded into a proper infirmary (both to be measured). The yard adds **training at home**: each week, a member at home and fit may grow a point; members with a yard place train at 1.5 times a base rate, members without one at 0.75 times. Growth after quests stays as it was, with no place penalty, so D-186's "half the growth chance without a place" is replaced. The base rate is tuned so a guild's total growth stays near today's, with yard members clearly ahead. Places go to members at home, youngest first (the head's default policy, D-170).
- **Why:** Owner (2026-10-27), after the simulator showed D-186 doubling patron dismissals (10% to 24%): "I want my beginning guild to be able to have basically one adventuring party and a few backup members to grow into a second. I think training yard should start small and boost passive growth of members assigned to it that are not on missions to 1.5x while unplaced get 0.75x. the yard starts small though with let's say 3-4 slots. Also let's try without an infirmary or like a rudimentary infirmary with only a few beds that can be upgraded later to be a proper informary." Then, asked what passive growth means, the recommended "Add home training" over scaling all growth and over both.

## D-188 Founding: pick a starter party and a few extras, paid from one purse

- **Status:** Accepted (2026-10-27). Adds a founding step before the prologue (D-076); sizes D-187's start; amends D-071's starting chest.
- **Decision:** A new game offers 3 ready-made starter parties of 5, each with a clear character (for example seasoned and dear; balanced; green and cheap with a promising youngster). The player picks one, then picks 2-3 individuals from a shortlist of about 6. The guild starts with one founding purse; each party and each extra has a signing fee that rises with its quality, like the sign-on fee (D-138), and what is left is the starting chest. Wages then follow who was picked. Parties, extras and fees are drawn from the seed (GAME-01) and set in content (GAME-04). Not settled: the purse size, the fee scale, what each party character means in numbers, and how the simulator's player picks (to be set with the year simulator).
- **Why:** Owner (2026-10-27): "at the start of the game I want to pick between a few parties as the starter parties for my guild and I want to select a few individuals as well and all of this affects my starting funds." Then the recommended options: "3 parties, then 2-3 extras" over 4-5 parties and over building the party person by person; "Signing fees from one purse" over wages only and over fees plus a higher patron target.
- **Note (2026-10-27):** the "not settled" numbers are now set as the session's assumptions in `packages/content/src/base/founding.ts` (purse 33,500; fees 8 weeks of wage, seasoned party 4x, green a quarter; characters' shifts and ages), measured in the career simulator; the owner has not confirmed them.

## D-189 The patron gives a new guild two grace years with growth goals

- **Status:** Accepted (2026-10-27). Amends the patron's yearly review (D-036, D-141) for a new guild; follows from the smaller start (D-187).
- **Decision:** For the guild's first 2 seasons the patron sets growth goals instead of a ladder-place target: for example field a second party, build a room, earn some renown. Met or missed goals move the patron's confidence as targets do, but the patron can't dismiss the guildmaster before the third Assembly. From the third season the ladder target returns. The goal list and how they are scored are content (GAME-04), set with the year simulator.
- **Why:** Owner's choice (2026-10-27), the recommended "Grace years with growth goals", over targets that scale with the roster and over keeping the patron as tuned. With a one-party start (D-187), the simulator showed 28% of guildmasters dismissed against 10% before, mostly in years 3-4, because a guild of 7 earns too little renown early for the ladder targets.

## D-190 An unpaid inn fee is debt, like wages

- **Status:** Accepted (2026-10-27). Settles the open point in D-182.
- **Decision:** The inn fee for lodgers (D-182) is one more weekly cost paid at the week start with wages and room upkeep. If the chest can't cover it, the chest goes below zero like any other cost; the existing debt rules apply (patron confidence at year's end, the emergency grant, D-146). The inn never turns lodgers out and keeps no tab of its own.
- **Why:** Owner's choice (2026-10-27), the recommended "Debt, like wages", over the inn turning lodgers out to sleep rough, a tab with the town that lowers town standing, and lodgers leaving the guild. No new rule, and the pressure to rebuild beds stays on the Money page.

## D-191 A neglected room is a low-level room in a guild in debt

- **Status:** Accepted (2026-10-27). Details D-173's "more likely when a room is neglected or full".
- **Decision:** No wear or repair state. An incident's chance in a room falls as the room's level rises, rises while the chest is in debt (upkeep effectively unpaid, repairs skipped, D-190), and rises when the room is full (every bed, sickbed or place in use). Upgrading a room is therefore also how to make it safer. The multipliers are content numbers set with the simulator.
- **Why:** Owner's choice (2026-10-27), the recommended "Low level + debt", over wear that builds up with a repair command (a chore on the phone, D-153), risk from a missing staff head (most rooms have no head in the engine yet) and fullness only (upgrading would never make a room safer).

## D-192 The first house incidents: fire, break-in and sickness

- **Status:** Accepted (2026-10-27). The first incident kinds for D-173; each is a data entry (GAME-04).
- **Decision:** Three kinds, each a letter with a paid answer and a free default, which applies if the player ignores the letter and which the simulator always takes:
  - **Fire** in the forge, tavern, works or barracks: one cell drops a level, and a level-1 cell burns out. A burnt barracks cell loses its beds, so members without one lodge at the inn (D-182, D-190). Answers: pay the fire watch (a fee, no damage) or let it burn (rebuild later by command; default).
  - **Break-in** by a rival's thieves: takes a share of the chest; a strongroom cuts the share by its level, and no strongroom is the worst case. Answers: hire thief-takers (a fee, a chance to get the coin back) or write it off (default).
  - **Sickness** in a full barracks: a few members at home fall ill for 1–2 weeks; free infirmary sickbeds shorten it. Answers: pay a healer (shorter) or quarantine (free, longer; default).
  Chances follow D-191 (level, debt, fullness) and are tuned toward 1–2 incidents a year. Fees, shares and durations are content numbers set with the simulator.
- **Why:** Owner's choice (2026-10-27), the recommended "Approve as drafted", over fire and sickness only (leaving the break-in until rivals keep accounts) and over adding more kinds now.
