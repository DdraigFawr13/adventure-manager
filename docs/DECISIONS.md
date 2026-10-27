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

## D-064 Pace: one season takes about 2–2.5 hours

- **Status:** Accepted (2026-10-26)
- **Decision:** A typical player takes about 2–2.5 h per in-game season. Derived targets: adventurer career about 12–30 h, guildmaster career about 40–75 h, first season about 3–4 h with onboarding. Weeks per season are set in PLAN §2. Detail: `docs/design/PLAN.md` §1c.
- **Why:** Owner's choice (Plan Q1c), between the proposed 3 h (FM-like) and 1.5 h (faster generations); keeps succession within reach of committed players.

## D-065 Design goals and success criteria (starting set)

- **Status:** Accepted (2026-10-26)
- **Decision:** Five design goals, one per pillar (PLAN §1a), and six success targets (PLAN §1d): demo conversion ≥ 15%, first-season completion ≥ 70%, median playtime > 20 h, ≥ 25% of 40 h+ players reach a second guildmaster, Steam reviews ≥ 80% positive, no dense screen needing more than one explanation in playtests. Numbers are estimates, revisited in PLAN §10 and §14.
- **Why:** Owner accepted the proposed starting set (Plan Q1a/d); gives later sections and playtests something measurable to aim at.

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

## D-085 Prototype order: watched quest first

- **Status:** Accepted (2026-10-26)
- **Decision:** After plan approval, prototypes run in this order: 1 one watched quest (is watching fun?); 2 headless year simulator on the same simulation core (balance, pacing, delegation, careers); 3 desk-density mock-ups and the template-writing test, alongside 1 or 2; 4 a two-year attachment playtest. Detail: `docs/design/PLAN.md` §9b.
- **Why:** Owner's choice (Plan Q9a): test the assumption the whole game rests on first.
- **Amended (2026-10-26, D-090):** step 0, the engine test, comes before step 1.
- **Amended (2026-10-26, D-110, D-113):** the engine test is web-first; resolution v0 comes before step 1; the simulation core is kept as the production engine; each step is time-boxed.
- **Note:** first recorded as "headless simulator first"; the owner reported that answer as a misclick the same day and chose quest first.

## D-086 Riskiest assumptions and their tests

- **Status:** Accepted (2026-10-26)
- **Decision:** Nine risks, each with its cheapest test and pass line: R1 watching quests is fun; R2 the simulation hits the §4 targets (±25%); R3 a year fits the friction budget (≤ 100 stops, ≤ 3 h); R4 the desk holds FM density (25+ rows at 1366 px); R5 ledgers readable (D-084); R6 the player's focus beats delegation by 10–25%; R7 attachment despite deaths; R8 template writing stays fresh; R9 guildmaster careers of 20–30 years. Fun and feel pass only on the owner's recorded playtest notes (GAME-06). Detail: `docs/design/PLAN.md` §9a.
- **Why:** Owner accepted the draft (Plan Q9c).

## D-087 Kingdom map at launch

- **Status:** Accepted (2026-10-26) as a launch goal; design to workshop.
- **Decision:** Launch includes a kingdom map of the March in a striking, on-theme fantasy style showing areas and locations, the player's and rival guilds, current action, and the deeds done across the region. It builds on the home-screen region map (D-049) and is a consequence surface (PLAN §8a). Style, layers and interactions are workshopped with the art plan (PLAN §12). Detail: `docs/design/PLAN.md` §1a.
- **Amended (2026-10-26, D-097):** launch layers are factions, guilds, action and threats; deeds and rumours on the map come later.
- **Why:** Owner's request: the region should be a place the player wants to look at, where the guild's history is visible (Pillars 3 and 4).

## D-088 Data collection: playtest logs, nothing sent from release

- **Status:** Accepted (2026-10-26)
- **Decision:** Playtest builds write a local log of the PLAN §10b measures that testers choose to send. The release sends nothing; §1d targets come from Steam data and achievement unlock rates. Opt-in anonymous telemetry stays open as a future option, decided by the owner as a cost (SAFE-03); the log format allows it. Detail: `docs/design/PLAN.md` §10c.
- **Why:** Owner's choice (Plan Q10a): no backend or personal data for an offline single-player game, while keeping a path to richer data.

## D-089 Playtest stages, measures and follow-up

- **Status:** Accepted (2026-10-26)
- **Decision:** Playtests run owner-only for prototypes, then 6–10 invited vertical-slice players (about two thirds management-sim veterans), a 30–50 closed alpha, the public demo and a 200+ beta. Measures cover pacing, danger and economy, engagement (watched vs auto-resolved, delegation, Trace use), onboarding drop-off, attachment, readability tasks and stability. Each measure has a target; misses become dated findings; the same miss in two rounds goes to the owner as a design problem. Detail: `docs/design/PLAN.md` §10a, §10b, §10d.
- **Why:** Owner accepted the draft (Plan Q10b).

## D-090 Engine chosen after a two-engine test

- **Status:** Accepted (2026-10-26)
- **Decision:** The engine is chosen between web tech in Electron (TypeScript) and Godot 4 (C#) after prototype step 0: the same roster ledger and kingdom-map view built in both, judged on the owner's look-and-feel notes plus measured build time, frame rate and memory at 1366×768, download size and the find-the-fact task. Unity is out. The architecture in PLAN §11b–§11g is engine-neutral. Detail: `docs/design/PLAN.md` §11a; adds step 0 to D-085.
- **Amended (2026-10-26, D-110):** web-first: build the test pieces in web tech; Godot only if web misses its bar.
- **Why:** Owner's choice (Plan Q11a) after the trade-off: web tech favours dense ledgers and speed of building; Godot favours the animated map and board.

## D-091 Engine-neutral architecture

- **Status:** Accepted (2026-10-26)
- **Decision:** Five packages (engine, content, ui, shell, tools); the engine is pure rules with seeded randomness and injected time, one simulate function, and every change an event with a cause id. The event log feeds the Trace, histories, Chronicle, reports, letters and playtest logs. Game values are integers. Content is JSON with schemas, loaded as packs (mods later). Ironman saves are written safely each day, versioned with migrations, never overwritten when unreadable, synced by Steam Cloud. Optional AI flavour is off by default, player-keyed and never blocks templates. Performance: 1366×768 minimum, 60 fps map, day tick under 50 ms, simulated year under 1 s, save/load under 1 s. Detail: `docs/design/PLAN.md` §11b–§11g.
- **Why:** Owner accepted the draft (Plan Q11b); holds for either engine in D-090.

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

## D-098 Art and audio production lists and rough costs

- **Status:** Accepted (2026-10-26)
- **Decision:** An artist draws parts and set pieces; code assembles them (portraits ~200 parts, crests, site maps from ~60 stamps per biome); monsters 72 pieces, icons ~240 drawings, 26 initials, ~10 legendary items, a few textures; a ledger font cut only if D-084's real-monitor check fails. Audio: 60–90 min of commissioned early-music ambience, ~150 desk sounds, 5 biome beds, ~10 stingers, ~40 name-free vocal sounds. Rough estimates: art $23,000–74,000, audio $9,000–37,000, refined in PLAN §14 and replaced by quotes. Pipeline: layered sources exported by script, an asset licence ledger, OFL fonts, contracts that transfer the needed rights. AI-generated images for exploration only (D-094). Detail: `docs/design/PLAN.md` §12a–§12c, §12e.
- **Amended (2026-10-26, D-109):** about 48 monster pieces and about 160 portrait parts; art about $20,000–66,000.
- **Why:** Owner accepted the draft (Plan Q12b) and asked for a review of the Story-Generator repository's map code for art direction.

## D-099 Milestones M0–M7 with gates

- **Status:** Accepted (2026-10-26)
- **Decision:** Build in seven milestones after plan approval, each ending at an owner gate (go, loop or stop): M1 prototypes (§9b, engine chosen), M2 vertical slice (production packages; prologue and first season in one corner of the March: 2 biomes, 3 settlements, 4 classes, ~10 monster kinds, ~6 quest templates, final art for that corner), M3 alpha (all 14 launch systems, about half the content, 30–50 testers), M4 free demo (the first season, alongside the beta), M5 beta (all content, final art and audio, 200+ testers), M6 launch, M7 free updates. Estimate: about 18–28 months to launch for a small team, scheduled in §14. Rules: no bulk art or music before M1 passes R1 and R2; old saves keep loading from M2; content after M2 is data only; Steam page live from M2. Detail: `docs/design/PLAN.md` §13a, §13b.
- **Amended (2026-10-26, D-108, D-111, D-113):** estimates restated for solo at 10–20 h a week: about 31–46 months to launch. The simulation core from M1 is kept. Map base waits for alpha balance. Slip and stop rules in D-111.
- **Why:** Owner accepted the draft (Plan Q13c); proving fun and balance before paying for bulk art protects the art budget (D-098).

## D-100 Launch model decided at the alpha gate

- **Status:** Accepted (2026-10-26)
- **Decision:** The plan assumes a full 1.0 release after the beta. At the M3 (alpha) exit the owner decides again between that and Steam Early Access, with the budget and alpha results in hand. Detail: `docs/design/PLAN.md` §13b.
- **Why:** Owner's choice (Plan Q13a): Early Access brings money sooner and real long saves, but early reviews of a rough build count; the budget that tips it is not known yet.

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

## D-104 Price $24.99; English at launch

- **Status:** Accepted (2026-10-26)
- **Decision:** Launch price $24.99, with about $12.50–15 net per copy (estimate) and break-even at about 4,000–15,000 copies solo. English only at launch; translation decided after launch on regional sales. Paid expansions decided after launch (D-040). Detail: `docs/design/PLAN.md` §14c.
- **Amended (2026-10-26, D-109):** break-even about 3,500–14,000 copies solo, cash costs only.
- **Why:** Owner's choice (Plan Q14b): in line with comparable deep management games and an easy buy after the free demo.

## D-105 Quality, CI and release process

- **Status:** Accepted (2026-10-26)
- **Decision:** Every push runs format, lint, strict types, engine unit tests, the determinism test, the content validator, save fixtures (from M2) and the docs and drift checks; screen tests when ui changes. The 1,000-guild-year balance run and performance checks run before each gate and release, not per push. CI uses path filters so docs-only changes stay free; game builds and Steam uploads run on release tags only, with Steam credentials as secrets set up by the owner. Bugs are GitHub issues in three severities; a save-losing or common-path crash blocks a release, and every fixed blocker or major bug gets a test. Steam branches `playtest`, `beta` and `default`; rollback to the previous build. An 8-step release checklist for the demo, launch and every patch, ending in the owner's sign-off. Detail: `docs/design/PLAN.md` §15.
- **Why:** Owner accepted the draft (Plan Q15b); adopts the tools review (D-092..D-094) and keeps CI minutes low (CI-01..CI-06).

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

## D-109 Lean launch cut

- **Status:** Accepted (2026-10-26)
- **Decision:** Launch has 6 classes (warrior, rogue, ranger, cleric, wizard, bard-like support), 4 ancestries, about 24 monster kinds, about 16 attributes, about 30 traits, about 40 key moments, about 4,500 template lines, 1 tournament, about 6 authored rival guilds (the rest generated), no multiclassing or prestige, and 3 kingdom-map layers (places, guilds, action). Everything stays data; the cut content returns in free updates (PLAN §13c). Detail: `docs/design/PLAN.md` §7, §12.
- **Why:** Owner's choice (plan review Q2): at 10–20 h a week the full scope was an estimated 4–6 years; this keeps the core (watched quests, key moments, permadeath, Chronicle, succession, delegation, the map) and cuts the items with the most cost for their fun.

## D-110 Engine test is web-first

- **Status:** Accepted (2026-10-26)
- **Decision:** The engine-test pieces (ledger and kingdom map) are built in web tech (Electron, TypeScript), reusing the Story-Generator map code. Godot 4 (C#) is built only if web misses its bar: 60 fps map at 1366×768, readable 15 px ledger, the find-the-fact task. A screen-reader check joins the judging list. Amends D-090. Detail: `docs/design/PLAN.md` §11a.
- **Why:** Owner's choice (plan review Q3) on new evidence: Story-Generator is TypeScript and canvas, and building both engines costs weeks a solo builder does not have.

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

## D-150 Mobile first: the phone becomes the lead platform

- **Status:** Accepted (2026-10-27) as the direction. The re-plan it triggers is in progress: each affected decision below is reopened and settled one question at a time, and until a replacement is recorded the old rule still describes the current build.
- **Decision:** The phone version from D-149 (the guildhall as hub, a work desk, the living map, Ask the clerk, pull to continue) becomes the lead platform; the PC version follows it rather than the other way round. This reopens: the launch platform (D-106), the platform line in CONCEPT §13, the desk layout as the home screen (STYLE §3), the 1366×768 minimum and engine-test bars (D-091, D-110), the R4 desk-density test (PLAN §9a), the target player (D-063), price and store terms (D-104), milestones and timeline (D-099, D-108), and budget (D-103). The engine, content, saves and writing are unaffected: the engine has no screen or input in it (GAME-01, GAME-02).
- **Why:** Owner (2026-10-27), asked when mobile should be planned (options: after launch, alongside launch, mobile first, hub on Windows too), chose "Mobile first" after the D-149 mock-ups: "I love this idea and think it is a really great concept. I like all the details and things and depth. I want this planned."

## D-151 Launch on iPhone and Android phones

- **Status:** Accepted (2026-10-27). Replaces D-106 (re-plan under D-150).
- **Decision:** The game launches on iPhone and Android phones at the same time, held upright, as one web-tech codebase wrapped for both stores. Tablets run the phone layout scaled up; a tablet layout of its own is decided later (D-149 leaves it open). Windows follows after launch, and the order of later platforms (Windows, Mac, Steam Deck) is decided then. iPhone builds need a Mac, bought or rented; that cost is set in the budget re-plan.
- **Why:** Owner's choice (re-plan question 1, 2026-10-27), the recommended option: "iPhone + Android". One build serves both stores, and premium games usually sell best on iPhone.
