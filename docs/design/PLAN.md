# Plan

Phase 3 plan. Outline approved by the owner on 2026-10-26 (D-062). Each section is drafted in order, with decisions flagged and asked one at a time. Status: **approved by the owner on 2026-10-26 (M0, D-115)**, with the plan review's decisions (D-108..D-114). Changes from here go through DECISIONS.

Inputs: `docs/design/CONCEPT.md` (locked, D-045), `docs/design/STYLE.md` (locked, D-061), `docs/DECISIONS.md`.

## Part A: Game design

1. **Goals and target player.** Who it's for, session lengths, measurable success criteria. Written below.
2. **Core loop and pacing.** Day, week, season, generation in detail; a friction budget (clicks and stops per in-game week). Written below.
3. **Systems map.** Per system: pillar served, inputs and outputs, the player's real decisions, delegation; a diagram of how systems feed each other. Written below.
4. **Economy and balance.** Money, renown, knowledge: sources and sinks; difficulty curve; tuning targets (e.g. death rate by quest tier). Written below.
5. **Progression.** Adventurers, guild and guildmaster, from first recruit to the next generation. Written below.
6. **Onboarding, UX and accessibility.** The gentle first season, screen rules, colour-blind, keyboard and text-size support. Written below.
7. **Launch content list.** Classes, ancestries, monsters, quest templates, sites; all as data. Written below.
8. **Making consequences visible.** How every outcome reaches the player (log lines, letters, inspector fields). Written below.
9. **Risks and prototypes.** Riskiest assumptions and the cheapest test for each (quest simulation fun to watch? desk holds FM density? old-press ledgers readable?). Written below.
10. **Playtest and metrics plan.** Written below.

## Part B: Production

11. **Technology and architecture.** Engine choice, deterministic simulation package, data formats, saves, modding, optional AI flavour. Written below.
12. **Art and audio production.** What an artist makes vs what is generated, with costs. Written below.
13. **Milestones.** Prototype, vertical slice, alpha, free demo, beta, launch, post-launch roadmap (painted portraits, standee animations, bardic songs, war campaigns). Written below.
14. **Budget, team and business assumptions.** Written below.
15. **Quality, CI and release process.** Written below.

---

## 1. Goals and target player (Accepted 2026-10-26)

Numbers are targets, not measurements (REP-01). Decisions: D-063..D-065.

### 1a. Design goals (Accepted 2026-10-26, D-065)

The game succeeds as a design when a player:

1. Tells a story about one of their adventurers to someone else (Pillar 1).
2. Hesitates before sending a party out, because the risk is real and the people matter (Pillar 2).
3. Plays past their first guildmaster's retirement or dismissal and keeps going with the same guild (Pillar 3).
4. Notices the region changed because of a contract they took or refused (Pillar 4).
5. Hands a system to staff and later takes it back because they wanted to do it better themselves (Pillar 5).

**Launch feature goal (owner, 2026-10-26, D-087):** a **kingdom map** of the March in a striking, on-theme fantasy style that shows its areas and locations, the guilds, what is happening now and the deeds done there. It builds on the home-screen region map (D-049, STYLE §3). Owner: "We can workshop that later but I'd like something like that at launch." Details to workshop with the art work (§12).

### 1b. Target player (Accepted 2026-10-26, D-063)

**Amended (2026-10-27, D-153):** the same player on a phone, in sittings of about 10–30 minutes; a season still totals about 2–2.5 hours.

- **Primary:** management-sim veterans who already like depth and spreadsheets: Football Manager, Battle Brothers, Darkest Dungeon, RimWorld, Crusader Kings players with a taste for fantasy. They accept dense screens (D-016, CONCEPT §13) and learn by playing, not by tutorial.
- **Secondary:** tabletop RPG players (Pathfinder, D&D) who know classes and parties but are new to management sims. They need the gentle first season (CONCEPT §19) and delegation to carry them.
- **Not targeted:** players who want to control fights directly, or who want a short session-based roguelite. Both are served better by other games, and chasing them would pull against D-003 and the generational save.
- Why the primary is management veterans: the concept (FM-level depth, Ironman saves, a desk-only guildmaster) is built for them; designing for them first and onboarding the secondary group is cheaper than diluting depth.

### 1c. Session lengths (Accepted 2026-10-26, D-064)

**Amended (2026-10-27, D-153):** on the phone a sitting is about 10–30 minutes; the typical and long session lines below were written for PC.

The anchor is **one in-game season ≈ 2–2.5 h** for a typical player (owner's choice). Other figures follow from it and from CONCEPT §4; all are targets to measure in playtests (§10). Weeks per season are set in §2.

- **Adventurer career** (6–12 seasons): about 12–30 h.
- **Guildmaster career** (20–30 seasons): about 40–75 h, so most committed players see at least one succession (Pillar 3).
- **Short session:** 20–30 min. Quitting is safe at any point because of the daily autosave (D-033, CONCEPT §29).
- **Typical session:** 1–2 h, ending at a natural stop (a quest's end, a week report).
- **Long session:** 3 h or more, more than a season.
- **First season:** about 3–4 h for a new player, including onboarding.
- Delegation (CONCEPT §19) and time-skip (CONCEPT §4) let fast players go quicker; neither is assumed in these figures.

### 1d. Success criteria (Accepted 2026-10-26, D-065)

**Under review (2026-10-27, D-150):** the Steam-review and Steam-data measures need phone sources. The owner decides them (D-065, D-088).

Accepted 2026-10-26 as a starting set (D-065); numbers are estimates, revisited in §10 and §14. Measured after release from opt-in, offline-friendly telemetry or store data (method decided in §10):

- **Demo:** at least 15% of demo players who finish the free seasons buy the game.
- **First season:** at least 70% of new saves finish their first season.
- **Retention:** median playtime of buyers over 20 h.
- **Pillar 3 check:** at least 25% of players with over 40 h reach a second guildmaster.
- **Reception:** Steam reviews at least 80% positive ("Very Positive" band).
- **Readability:** in playtests, no dense screen (roster, finances, scouting) needs more than one explanation per player (ties to STYLE §5 risk).

---

## 2. Core loop and pacing (Accepted 2026-10-26)

Decisions: D-066..D-068, D-113. All times are targets for a typical player in a mid-sized guild (2–4 parties), to be measured in the prototype (§9) and playtests (§10).

### 2a. Units of time (Accepted 2026-10-26, D-066, D-067)

- **Season = one in-game year**, opened by the Guild Assembly (D-039). Plays in about 2–2.5 h (D-064).
- **Calendar:** 12 months of 4 weeks of 7 days = 48 weeks, 336 days. Month and day names come from the setting (STYLE §9a); the engine only needs the counts.
- **Quest length:** about 2–4 weeks including travel, so a party runs about 8–12 quests a year.

### 2b. The year (Accepted 2026-10-26, D-067)

| Part | Weeks | What happens | Target time |
|---|---|---|---|
| Assembly and muster (spring) | 1–4 | Rankings, promotion and relegation, patron review; recruitment window opens; contract renewals; new contract board. | ~30 min |
| Campaigning (spring–autumn) | 5–36 | Main contract season. Midsummer fair (about weeks 20–21): short second recruitment window and the main tournament. | ~95 min |
| Winter | 37–48 | The planning season: next year's budget, building, training plans; healing; slow travel and few contracts; the odd winter raid (D-113). | ~15 min |
| Year's end | — | Chronicle entry, ageing, retirements, the year in review. | ~5 min |

### 2c. The day (Accepted 2026-10-26, D-068)

- Continue advances day by day and only stops for a reason (D-009). A day with no stop passes in under a second, so most days are never seen.
- All stops on the same day are bundled into one stop; the top bar names the reason (STYLE §3).
- Every stop has a sensible default answer, so resolving a routine stop takes 1–3 clicks.

### 2d. The week (Accepted 2026-10-26, D-068)

- **Week report** on the first day of each campaigning week: one letter on the desk summarising last week (results, injuries, money, morale changes) and this week's contract board.
- **Routine week:** take or decline contracts, send a party with its saved plan, continue. Target: 10 clicks or fewer and about 1.5 min.
- **Parties out:** the player watches one party live on the board; the others are summary cards (D-032). Watching is optional and can be sped up or skipped; the result is the same either way (GAME-02).
- **A standing tension most weeks** (amended 2026-10-26, D-113): the board is built so most weeks hold one live dilemma, such as a deadline clash between two contracts, a promise to an adventurer coming due, or a rival bidding for the same contract. The hook to play one more week is that dilemma plus a party's quest ending.
- With contracts delegated (CONCEPT §19) the week report becomes a digest and need not stop at all, except that choosing contracts is never delegated (D-038), so the board stops whenever there is a new contract worth a decision.

### 2e. The generation (Accepted 2026-10-26, D-068)

- **Adventurers:** survivors' careers last 6–12 years (D-034), but about half of careers end in death (D-071), so about 25% of a roster leaves each year through death, retirement or departure. A mid-sized guild needs about 4 recruits a year to hold strength.
- **Guildmaster:** 20–30 years (about 40–75 h). Decline shows in their stats over the last few years; retirement or dismissal triggers succession (CONCEPT §1, §22).
- **Succession:** a set piece at year's end: choose the next guildmaster (a senior staff member, a retired adventurer, or a newcomer with a background), who inherits the charter, traits and debts. Target: about 10 min.

### 2f. Friction budget (Accepted 2026-10-26, D-068)

Per year, for a typical mid-sized guild:

| Part | Stops | Time per stop | Time |
|---|---|---|---|
| Assembly and muster | ~15 | ~2 min | ~30 min |
| Campaigning, routine (week reports) | ~32 | ~1.5 min | ~48 min |
| Campaigning, events (key moments, people, offers) | ~25 | ~1.9 min | ~47 min |
| Winter | ~8 | ~2 min | ~15 min |
| Year's end | ~2 | ~2.5 min | ~5 min |
| **Total** | **~80** | | **~145 min** |

Rules that keep it there:

1. **Three stop classes.** *Must stop:* major key moments (a life at risk, a moral choice, a large reward), offers with a deadline, departures, big conversations. *Digest:* minor reports and people issues go into the next week report. *Never stop:* minor quest moments, resolved by the party leader (D-032).
2. **Player tunes the classes** per category (like FM's inbox settings), except that never-delegated items (D-038) always stop.
3. **Rate cap:** at most one event stop per day; at most about 3 event stops per week on average. When the simulation produces more, the cap moves only Digest-class items into the digest, lowest priority first; Must-stop items always stop, even past the cap.
4. **Time-skip** (D-034) is offered whenever no party is out and nothing has a deadline; winter defaults to it.
5. **Measure it:** the prototype logs stops per year and seconds per stop; §10 sets the playtest checks.

---

## 3. Systems map (Accepted 2026-10-26)

Decisions: D-069, D-070. This section names each system and how it connects; numbers and formulas belong to §4 (economy) and §5 (progression).

### 3a. Guild resources (Accepted 2026-10-26, D-070)

What systems trade in. Each has one home (SRC-01):

- **Money:** the guild's coin. Contracts, loot sales and patron grants in; wages, upkeep, gear, facilities and loans out (§4).
- **Renown:** the guild's public fame. Earned by deeds; drives the ranking, who wants to join and which contracts are offered (see 3d).
- **Faction standing:** one value per faction (D-019). Moves with contracts taken, refused and failed; the patron is one faction (D-036).
- **Knowledge:** per subject (a monster kind, a site, a rival) (D-041). Improves plans and reveals key-moment options.
- **Per adventurer:** morale, fatigue, health, trust in the guildmaster, experience. Not guild resources, but every system reads or writes them.

### 3b. Systems (Accepted 2026-10-26, D-070)

Launch has 14 systems (D-070). Format per system: pillars served · inputs → outputs · the player's real decisions · who it can be delegated to.

**People**

1. **Adventurers** (D-007, D-008, D-021, D-037). Pillars 1, 2. Includes injury, death and recovery (D-070). Inputs: quest results, training, conversations, wages, guild identity, healer and infirmary. Outputs: performance in quests, morale, demands, departures, stories; time out, scars and trauma traits, deaths, revival offers and their price. Decisions: who to keep, what to promise, how to handle a demand or feud, contract terms, rest or rush back, pay for revival or not. Delegation: none for big conversations or revival (D-038); minor morale chats to the deputy; recovery plans to the healer.
2. **Recruitment** (D-013). Pillar 1. Inputs: shortlists from scouting, renown, charter, money, windows (D-067). Outputs: new adventurers, poaching offers both ways, sales. Decisions: whom to sign, whether to poach or sell. Delegation: none for signing (D-038). Launch has three sources; the training academy moves to Early update (D-070).
3. **Training and development** (CONCEPT §5). Pillars 1, 5. Inputs: trainers, training yard, quest experience. Outputs: attribute growth, class levels, talent choices. Decisions: training focus per adventurer, level-up talents. Delegation: head trainer. Academy apprentices join this system in Early update (D-070).

**Quests**

4. **Contracts** (D-011, D-015). Pillars 2, 4. Inputs: region state, faction standing, renown, ranking tier, rumours from the inbox. Outputs: offered work with fee, loot share, deadline and clauses; region changes when work is done or ignored. Decisions: which contracts to take or refuse (never delegated, D-038), terms to push for. Delegation: deputy haggles fees within limits the player sets.
5. **Parties and plans** (D-014). Pillar 2. Inputs: adventurers, chemistry, scouting and research, gear. Outputs: a party and a plan (roles, approach, risk tolerance, retreat thresholds) handed to the simulation. Decisions: who goes, which plan. Delegation: saved plans per party; party leaders pick minor tactics (D-032).
6. **Quest simulation and key moments** (D-004, D-032). Pillar 2. Inputs: party, plan, gear, research, magic (D-028), site from seeded templates (D-030). Outputs: events for the log and board, loot, wounds, deaths, experience, reports, renown, region change. Decisions: major key moments (push on, retreat, spare, spend). Delegation: minor moments to party leaders; full auto-resolve as a setting.
7. **Scouting and research** (D-013, D-041; merged by D-070). Pillars 2, 5. One department (scouts and librarian) and one ledger of what the guild knows about people, sites, monsters and rivals. Inputs: scout staff, library, survivors' reports, quest events. Outputs: shortlists of prospects with attribute ranges that narrow as knowledge grows, better plan options, revealed key-moment choices, rival reports. Decisions: what and whom to scout or research. Delegation: scouts and librarian.
8. **Gear and loot** (D-012). Pillars 1, 2. Inputs: loot, money, armoury, the smith's shop (D-143). Outputs: kit tiers on adventurers, storied magic items, sale income. Decisions: kit policy, who gets special pieces, sell or keep. Delegation: quartermaster equips to policy; special and storied pieces stay with the player. Commissioning items moves to Early update (D-070). **Amended (D-143):** gear sits in RPG-style slots on each adventurer, equipped by hand or by the quartermaster's policy; basics are bought from a smith's shop, and buildings may later give discounts or rarer stock.

**Guild**

9. **Finances and patron** (D-011, D-036). Pillar 3. Inputs: all income and costs, patron expectations. Outputs: balance, debt, patron satisfaction, dismissal risk. Decisions: budget split, loans, which patron to court. Delegation: deputy manages routine spending within a budget.
10. **Staff and facilities** (D-011). Pillars 3, 5. Inputs: money, renown (who will work for you). Outputs: staff quality for every delegated area, room and town-site bonuses. Decisions: whom to hire, which room to build or which town site to fund next (D-168). Delegation: heads of department are the player's call; the deputy can hire junior staff.
11. **Guild identity** (D-020). Pillar 3. Inputs: charter, the guild's record of deeds. Outputs: earned traits, which recruits and factions are drawn to the guild, morale effects. Decisions: the charter at founding, whether to act against it. Delegation: none.
12. **Guildmaster** (D-003, D-029). Pillar 3. Inputs: background, what the player personally does. Outputs: effectiveness in each area the player handles, ageing, succession. Decisions: where to spend personal focus. Delegation: n/a; this is the player.

**World**

13. **Region and factions** (D-019, D-030). Pillar 4. Inputs: contracts done, refused and ignored; rival guilds' actions; seeded world events. Outputs: new and closed contracts, faction power, road and trade state, threats that spread. Decisions: none directly; the player shapes it through contracts and patron choice.
14. **Rivals, ranking and tournaments** (D-005, D-039, D-069). Pillar 4. Inputs: renown (3d), rival guild simulation. Outputs: tier, promotion and relegation at the Assembly, bigger contracts, poaching pressure, tournament invitations. Decisions: whether to enter a tournament, whom to send. Delegation: none needed.

**Surfaces** (no decisions of their own; covered in §8): calendar and stops (§2), inbox and news (D-043), Chronicle and Hall of Heroes (D-042).

### 3c. How the systems feed each other (Accepted 2026-10-26, D-070)

The spine is **contract → party → quest → results**. Every other system either prepares the party or spends what the quest brings home.

```mermaid
flowchart LR
  subgraph World
    REG[Region and factions]
    RIV[Rivals, ranking, tournaments]
  end
  subgraph Quests
    CON[Contracts]
    PAR[Parties and plans]
    SIM[Quest simulation]
    SCO[Scouting and research]
    GEAR[Gear and loot]
  end
  subgraph People
    ADV[Adventurers]
    REC[Recruitment]
    TRN[Training]
  end
  subgraph Guild
    FIN[Finances and patron]
    STF[Staff and facilities]
    IDN[Guild identity]
    GM[Guildmaster]
  end
  REG -->|offers| CON
  RIV -->|tier unlocks| CON
  CON --> PAR
  ADV --> PAR
  SCO -->|plan options| PAR
  GEAR --> PAR
  PAR --> SIM
  SIM -->|fees, loot sales| FIN
  SIM -->|loot| GEAR
  SIM -->|wounds, deaths| ADV
  SIM -->|experience| TRN
  SIM -->|reports| SCO
  SIM -->|renown| RIV
  SIM -->|deeds| IDN
  SIM -->|done or failed| REG
  TRN --> ADV
  SCO -->|shortlists| REC
  REC --> ADV
  IDN -->|draws recruits| REC
  IDN -->|morale| ADV
  FIN -->|wages, budgets| STF
  FIN -->|patron review| GM
  STF -->|delegated work| SCO
  STF --> TRN
  STF -->|healer| ADV
  GM -->|personal focus| STF
  RIV -->|poaching| ADV
```

Checks on the map (WS-05), run on the diagram's edges: every system is reached from quest results within two steps, and every system feeds at least one other. No system is bolted on. The thinnest link is tournaments (only renown, money and pride); §4 must give them a reason to matter.

### 3d. Renown and the ranking (Accepted 2026-10-26, D-069)

- **Renown** is one public number, earned by deeds: contracts by tier, named kills, defences held, tournament results.
- Each tier of the ranking is ordered by **renown earned in the past year**. At the Assembly (D-039) the top of each tier is promoted and the bottom relegated.
- Total renown (all years, slowly fading) still shapes who wants to join and which contracts are offered.
- **Later (owner's note):** "Go with 1 but I eventually want to add a layer of intrigue and underhanded dealings that can mix things up a bit." This belongs with the Later tier's intrigue and investigation (D-035). To keep that open, every renown change is stored as an entry with its source and date (a deed, a tournament, a scandal), so a later intrigue layer can add, contest or strip entries without reworking the ranking (GAME-04). What the intrigue layer contains is not decided.

### 3e. Delegation summary (Accepted 2026-10-26, D-070)

| Area | Staff | Never delegated (D-038) |
|---|---|---|
| Scouting and research | Scouts, librarian | Signing |
| Training | Head trainer | — |
| Recovery | Healer | Revival |
| Kit | Quartermaster | Special and storied items |
| Fee haggling, routine spending, minor morale | Deputy | Choosing contracts, big conversations |
| Minor quest moments | Party leaders (D-032) | Major key moments |

---

## 4. Economy and balance (Accepted 2026-10-26)

Decisions: D-071..D-073, D-113. This section sets shapes, ratios and targets; exact numbers are tuned in the prototype (§9) against these targets. "Mid-sized guild" means about 15 adventurers in 3 parties.

### 4a. Sources and sinks (Accepted 2026-10-26, D-073)

| Resource | Sources | Sinks |
|---|---|---|
| Money | Contract fees, loot sales, patron grant, tournament prizes, selling adventurers' contracts | Wages (the largest cost), staff, upkeep, gear, facilities, revival, loan interest, release fees |
| Renown | Contracts by danger, named kills, defences held, tournament results, storied items | Yearly fading of total renown, failed or abandoned contracts, deaths through recklessness (a party sent far above its level), breaking the charter, later: scandals (D-069) |
| Faction standing | Contracts for a faction, defending its land, patronage | Contracts against its interests, refusing its work, failing it, serving its enemies |
| Knowledge | Scouting, library research, survivors' reports (even from failed quests), quest events | Goes stale: monster and site knowledge fades slowly, rival knowledge fast (rosters change) |

Rules:
1. **Every source has a sink.** Nothing accumulates without limit; late-game money goes into the guild house, town sites (D-168), stars' wages and revival, not a growing pile.
2. **Failure pays in knowledge.** A failed quest's survivors bring back reports, so a loss always leaves the guild better informed (Pillars 2, 5).
3. **Rivals play by the same rules.** AI guilds earn, spend, recruit and die through the same simulation (GAME-02); no hidden bonuses or rubber-banding.

### 4b. Money pressure (Accepted 2026-10-26, D-072)

**Tight early, steady later**, as in FM.

- **Wages** are the largest cost: about 55–65% of spending at every tier.
- **A founded guild** starts with about 3 months of running costs in the chest plus a small patron grant. One bad run of contracts hurts; two in a row means a loan or a sale.
- **A well-run mid-tier guild** is comfortable: about 10–20% surplus a year, spent on facilities and better recruits.
- **A top guild** feels pressure again: stars ask for big wages and loot cuts, rivals bid for them, and the patron expects more.
- **Bankruptcy** follows CONCEPT §22: debt, seized assets and a renown hit, not the end.
- **Contract fees** rise about 2–3 times per danger rating and per ranking tier (to be tuned, §9).

### 4c. Death and danger (Accepted 2026-10-26, D-071)

**Target: about 2 deaths a year** in a mid-sized guild on tier-appropriate contracts at default risk: one death every 1–1.5 h of play, about half of careers ending in death, turnover about 25% a year (about 4 recruits a year).

Contracts carry a danger rating. Working names: **Routine, Hazardous, Perilous, Deadly** (final names per STYLE §9). Starting targets per adventurer per quest, at default risk with no special knowledge:

| Danger | Share of a mid guild's work | Death per adventurer | Any death in a party of 5 |
|---|---|---|---|
| Routine | ~30% | 0.2% | ~1% |
| Hazardous | ~40% | 0.8% | ~4% |
| Perilous | ~25% | 2.5% | ~12% |
| Deadly | ~5% | 7% | ~30% |

Check (computed): 3 parties × ~10 quests × 5 adventurers = 150 adventurer-quests a year at a 1.36% average gives about 2.0 deaths a year.

- The plan moves these numbers: cautious retreat thresholds and good knowledge roughly halve them; reckless settings roughly double them (to be tuned, §9).
- Injuries are far more common than deaths: as a starting target, about 5 lasting injuries for every death.
- Rough model behind the choice (estimate, not measured; survivors retire after about 9 years):

| Deaths a year | Leavers a year | Turnover | Careers ending in death | Play time per death |
|---|---|---|---|---|
| ~1 | ~2.7 | ~18% | ~37% | ~2.2 h |
| ~2.5 | ~4.2 | ~28% | ~60% | ~0.9 h |
| ~5 | ~6.7 | ~44% | ~75% | ~0.5 h |

### 4d. Tournaments: why they matter (Accepted 2026-10-26, D-073)

§3c flagged tournaments as the thinnest link. Proposal: tournaments are the guild's **shop window**.

- **Renown burst:** a tournament win is worth about a month of good contracts in renown, in one week.
- **Recruitment draw:** prospects watch. A strong showing improves the next recruitment window (more and better prospects interested).
- **Scouting rivals:** entering reveals knowledge of rival adventurers who compete, and exposes yours to poaching interest in return.
- **Low lethality:** trials and cups are rarely deadly, so they are where young adventurers get experience and nerves are tested in front of a crowd; the main tournament prize is often a storied item.
- **Cost:** a party entered is a party not on contracts for 1–2 weeks at the busiest time of year (midsummer).

### 4e. Difficulty curve (Accepted 2026-10-26, D-073)

- **Start choice sets difficulty** (D-026): founding (tiny roster, bottom tier, low expectations) or taking over a guild from a list that runs from a struggling bottom-tier hall to an established top guild with a demanding patron. No separate difficulty slider at launch.
- **Ladder:** 3 tiers of 6 guilds (18 guilds in the region, including the player's). At each Assembly the top 1 of a tier goes up and the bottom 1 goes down; top tiers get bigger, deadlier and better-paid contracts. The number of tiers and guilds is region data (GAME-04). Owner's note: "1 but bigger ladders later": larger ladders come after launch (tier and size not set). Estimate: a well-run founded guild reaches the middle tier in 3–5 years and the top in 8–12.
- **Danger tracks ambition:** the player always chooses contracts (D-038), so difficulty within a tier is the player's own risk appetite.
- **Early protection:** the first season (gentle onboarding, CONCEPT §19) offers mostly Routine and Hazardous work and the patron expects little.
- **Late pressure:** a top guild faces rivals poaching its stars, high wages, a demanding patron and Deadly contracts; staying on top is harder than getting there (as in FM).

### 4f. Tuning targets (Accepted 2026-10-26, D-073)

Measured in the prototype and playtests (§9, §10). All are estimates until then:

- Death rate per adventurer per quest by danger rating: §4c.
- Money: wages 55–65% of spending; founded guild runway about 3 months; well-run mid guild 10–20% surplus a year (§4b).
- Ranking: a well-run founded guild promoted within 3–5 years; a careless top guild relegated within 2–3.
- Renown: total renown fades about 10% a year, so a guild that stops performing slides within a few years.
- Knowledge: a monster kind well researched stays useful for about 3–5 years; a rival scouting report for about 1 year.
- Tournaments: entering is worth it for a mid-sized guild about once a year, not every time.

### 4g. Prices and recovery (Accepted 2026-10-26, D-113)

- **Every safe choice has a visible price.** Caution (early retreats) costs fees and renown through abandoned contracts; delegating a system shows, when it is handed over, what the guildmaster stops learning (§5d); skipping winter costs the planning it would have held. The headless simulator checks that cautious and bold play, and delegated and hands-on play, each come out ahead in some seeds (§9d).
- **Recovery without rubber-banding.** A guild in trouble gets visible, costly ways back, all of which rivals can use too: a patron's emergency grant with strings, charity contracts from a faction, and debt paid in service. A "bad first two years" seed set tests them (§9d).

---

## 5. Progression (Accepted 2026-10-26)

Decisions: D-074, D-075. Shapes and targets only; exact curves are tuned in the prototype (§9). Times assume one season = one year (D-066) and survivors' careers of 6–12 years (D-034).

### 5a. Adventurers: the four layers over a career (Accepted 2026-10-26, D-075)

The four layers (D-037) grow at different speeds, so every year shows some change:

- **Attributes (1–20)** grow through training and quests toward a hidden potential (CONCEPT §5), fastest in the first 3–4 years. They peak in the adventurer's prime and decline with age and lasting injuries; physical attributes fall first, mental ones last. Ancestry sets the ages (a long-lived ancestry peaks later and declines slower), as data (GAME-04).
- **Class levels** (Accepted 2026-10-26, D-074): **10 levels at launch**, the main visible sign of growth. Each level adds class abilities and one talent pick. Pace: about 1 level a year early in a career, slowing later; most survivors retire around level 7–9; level 10 marks a legend. Multiclassing or a prestige path opens at level 5, after launch (D-109).
  - **Planned: 20 levels later** (owner's note: "Start with 10. Plan for 20 eventually"). To keep that open, the level count, experience curve and per-level abilities are class data (GAME-04), and level-gated rules (prestige at 5, danger ratings) refer to bands, not fixed numbers. Going to 20 later needs its own pacing decision (faster levelling or longer careers) and twice the per-class content.
- **Talents** are chosen at each level: the player picks, or the head trainer picks to a plan (D-070 delegation). Multiclassing or a prestige path opens at a set level (CONCEPT §15); both come in an update after launch (D-109).
- **Traits** change through events, not training: scars and trauma from injuries (D-008), deeds ("Survived the Fen Drake"), habits and personality shifts. They are the layer that carries the adventurer's story.

**Shape of a career** (targets): years 1–3 rapid growth; years 4–8 prime, most dangerous work; years 9+ decline, the choice between retiring them, keeping them as a mentor in a quieter role, or one last contract.

### 5b. Adventurers: the end of a career (Accepted 2026-10-26, D-075)

- **Retirement** is a conversation (D-038): the adventurer asks, or the player suggests it. Refusing a request costs morale; pushing someone out costs trust among their friends.
- **Retired adventurers can become staff** (trainer, scout, healer or quartermaster, by attributes and class), limited by their attributes and by staff wages. This turns the old generation into the guild's teachers (Pillar 3) and gives a reason to keep veterans alive. They age out of staff work in turn.
- **Death** goes to the Chronicle and Hall of Heroes (D-042); friends and rivals react (D-021).
- **Revival** (D-008) costs lost levels or traits and a debt, so a revived veteran comes back changed, not restored.

### 5c. The guild (Accepted 2026-10-26, D-075)

The guild grows on four tracks, each visible on the desk:

- **Ranking tier** (D-069, D-073): the public ladder.
- **Facilities (superseded at launch by the guild house below, D-168):** training yard, infirmary, library, armoury, tavern (CONCEPT §9), each with **3 levels**. Each level is a real choice of money and time (a build takes weeks, done best in winter, D-067). A full set of level-3 facilities costs about 8–12 years of a mid guild's surplus (estimate), so the player chooses what to specialise in. Owner's note: "plan on eventually having those grow to larger numbers or break the facilities into smaller portions kind of city building style on that you have buildings you can build and upgrade as part of your guild hall / compound." Later (tier not set): more facility levels, or a guild compound of separate buildings to place, build and upgrade. To keep that open, each facility is a building entry in data with its own levels and effects (GAME-04), and the guildhall screen draws from that list rather than five fixed slots.
- **The guild house and the home town (Accepted 2026-10-27, D-168–D-171):** replaces the 5 fixed facilities above at launch. The hall is a side-on cutaway of floors 3 cells wide that grows up into storeys and a tower and down into dug cellars; a room takes 1–3 cells, and rooms of the same kind side by side merge (D-169). A new guild starts with the common room (a small tavern) and a small barracks around the study, which holds the work desk; the 11 room kinds of D-149 are the launch list, 7 in the hall and 4 in the compound (D-180). Size and level set a room's capacity (barracks beds cap the roster, infirmary beds cap fast healing, yard and library places cap training and study), and a staff head's skill sets its strength; members go to rooms by state or by the head's policy (D-170). In the home town the guild funds 5 sites the townsfolk own, each with 3 levels: smith (cheaper and rarer gear), temple (cheaper healing and revival), inn (better recruits), market (better loot prices) and stables (faster travel). The boosts hold while the guild's standing with the town holds, so a scandal or a rival's bigger purse can cost one (D-171). Kept from Fallout Shelter: growth, merging, upgrades, people in rooms, scarce space. Left out: tap-to-collect resources (D-153). Settled with the mock-up (`docs/design/mockups/guild-house.html`, D-172–D-180): every kind has 3 levels and cells cost more the higher or deeper they are, with a full house at about 8–12 years of a mid guild's surplus (D-172); each room has a small weekly upkeep (D-177); a few incidents a year arrive as letters (D-173); no free bed, no signing (D-174); the strongroom is below ground (D-176). Around the hall is a compound, drawn side-on and reached by swiping sideways, where the training yard, works yard, gate and smith's forge are built, and only there (D-178, D-180). The home town is a faction whose standing holds the sites (D-175), shown as a top-down, scrollable town map with its places and empty plots, where the guild founds new sites by patronage (D-179). The home town is one of the two city factions (D-181) and one hand-made map with the 5 sites standing and 3 spare plots for updates (D-184); the compound starts at 3 plots a side and can be pushed out to about 6 (D-183); members who lose their beds lodge at the inn for a fee (D-182), which goes into debt like wages when the chest can't pay (D-190). Incidents strike low-level rooms more often, and more while the guild is in debt or a room is full (D-191); the first kinds are a fire, a rival's break-in and sickness in a full barracks, each a letter with a paid answer and a free default (D-192).
- **Earned traits** (D-020): granted by what the guild repeatedly does, not by one event, and lost when it stops. At most **5 active** at once, so they describe the guild as it is now; old ones go to the Chronicle.
- **Renown and the Chronicle** (D-042): the guild's history grows every year whatever the result.

### 5d. The guildmaster (Accepted 2026-10-26, D-075)

- **Stats (1–20):** about 8, covering what the player can do personally: judging ability, judging potential, negotiation, motivation, people management (morale and promises), tactics (plans and key moments), coaching, and contacts. Final list in §7 content data.
- **Background** (D-029) sets starting stats and contacts.
- **Growth by doing** (D-029): each stat grows when the player personally does that work and stays still when it is delegated. Target: a focused stat gains about 1 point a year early in a career, slowing toward a cap set by the background.
- **Ageing:** a guildmaster starts at about 30–45; stats begin to decline in the last 3–5 years of a 20–30 year career (D-034); the patron or the guildmaster's health ends it.

### 5e. The next generation (Accepted 2026-10-26, D-075)

- **Succession** (D-068 set piece): the heir is chosen from senior staff, retired adventurers who became staff, or a newcomer with a background. An heir who was an adventurer brings their own history and contacts.
- **What passes on:** guild, charter, traits, the guild house and funded town sites, roster, debts, rivalries, faction standing and the Chronicle. **What doesn't:** the old guildmaster's stats and personal contacts; promises the old guildmaster made are remembered, and the new one inherits the trust or resentment.
- **Adventurers react** to the new guildmaster: some loyal to the old one may leave or test the new one (D-021).
- **Later (Early update, D-070):** the academy adds a home-grown line, including the children of guild heroes.

---

## 6. Onboarding, UX and accessibility (Accepted 2026-10-26)

Decisions: D-076..D-078. Mock-ups: `docs/design/mockups/onboarding.html`, `docs/design/mockups/readability.html`.

### 6a. The first season (Accepted 2026-10-26, D-076)

Goal: a new player finishes the first season in about 3–4 h (D-064) and 70% of new saves do (D-065), without slowing down the management-sim veteran (D-063). Mock-up: `docs/design/mockups/onboarding.html`.

Owner's note: "I like a for the first season but I like having a small prologue as an intro to the system and I really like having on theme clerks notes on relevant documents."

1. **A small prologue** (about 10–15 min): the guild's first contract, a small job near home with the starting party, walking through briefing, the board, one key moment and the report. It runs on the real systems with a fixed seed (GAME-01), not a separate script, so it stays correct as systems change. Skippable.
2. **Staff open the ledgers** through the first season: ledgers start sealed and open when they first matter (first injury opens the Infirmary, first wages day opens Finances, first window opens Scouting, first Assembly opens Ranking), each with a short letter from the staff member who runs it. A fallback date opens any ledger whose trigger never fires. A checklist shows what is open and what comes next.
3. **The clerk's notes:** pencilled, in-world notes on relevant documents, the first time a ledger opens and whenever a document has something unusual (a contract with a harsh clause, a prospect seen only once). The player can put them away for good, or per ledger.
4. **Veteran start** (a setting at new game) skips the prologue and opens every ledger on day one; the clerk's notes stay on unless put away.

### 6b. Screen rules (Accepted 2026-10-26, D-078)

**Amended (2026-10-27, D-154, D-155):** screens are built for phones 375 points wide and up, held upright; home is the guildhall hub on every platform.

1. **Every number explains itself.** Hovering or focusing any number shows how it was made (base, modifiers, sources), in plain words. The engine produces the breakdown (GAME-02); the UI never recomputes it.
2. **One sheet, one job.** Each ledger answers one question (who is fit? what do we owe?); comparisons open side by side instead of in a new mode.
3. **The top bar never moves** (STYLE §3): date, why the calendar stopped, Continue. On phones the pull handle is Continue (D-149, D-078).
4. **Every stop has a default** (D-068) and the default is shown on the button.
5. **Confirm only what can't be undone:** signing and releasing, dismissing staff, revival, sending a party on a Deadly contract. Everything else (plans, kit, training focus) can be changed freely until Continue.
6. **Uncertainty looks uncertain:** scouted attributes show as ranges until known (CONCEPT §10); predictions show odds in words and numbers ("likely, about 70%").
7. **Never colour alone:** every status has an icon or word as well as its colour (D-048).

### 6c. Accessibility (Accepted 2026-10-26, D-078)

- **Colour-blind:** the fixed status set (D-048) is chosen to stay distinct under the three common types; faction colours always carry a heraldic charge as well.
- **Text size and readability (Accepted 2026-10-26, D-077):** a size slider from 100% to 150%, plus a **clear print** setting that switches ledgers and letters to a modern book serif (an open-font-licence face, chosen in UI work); titles, seals and the decorated initial keep the old-press faces. Mock-up: `docs/design/mockups/readability.html`. Corrected 2026-10-26: the first mock-up showed the old-press ledger with its default old-style, proportional figures by mistake. The face has lining figures (measured: equal width, all on the line, via `lining-nums`), and all numbers in the game use them. Minimum size: §9c.
- **Keyboard** (when Windows follows; phones play by touch, D-078): everything playable by keyboard; Space continues; number keys pick stop options; letters jump to ledgers; all bindings can be changed.
- **No time pressure:** the calendar never moves without Continue; reading a letter or a key moment never has a timer.
- **Motion:** board animations and map drawing can be shortened or turned off; nothing important is shown only in motion.
- **Sound:** every sound that carries meaning (the death bell, the key-moment drum, D-055) has a visible counterpart; optional captions for vocal sounds (D-060).
- **Screen readers:** checked in the phone engine test (D-154) but not promised at launch; the UI is built from labelled controls so it can be added later (assumption to check in §11).

---

## 7. Launch content list (Accepted 2026-10-26)

Decisions: D-079..D-081, D-109, D-112. Every item is a data entry (GAME-04, D-044), so counts can grow after launch without engine work. Names are working names; final names follow STYLE §9a.

### 7a. People (Accepted 2026-10-26, D-079, D-081)

- **Classes: 6 at launch** (lean cut, D-109; 8 planned, D-018). Launch list: warrior, rogue, ranger, cleric, wizard and a bard-like support; guardian and druid follow in updates. Final names and identities are original (D-002).
  - Per class: abilities across 10 levels (D-074); about 15 class talents, plus a shared pool of about 30 general talents.
  - **Prestige paths and multiclassing:** not at launch (D-109); planned for an update, opening at level 5 (D-074).
  - Casters (cleric, wizard, support) draw on limited daily power with risks (D-028); each class's magic is tagged with a tradition slot left empty for later.
- **Ancestries: 4 at launch** (D-079; lean cut, D-109): Marchfolk, Stonewrights, Lanthe and Barrowborn; Reedfolk follow in an update (their hook, fen travel speed, is the lightest on other systems). Mock-up: `docs/design/mockups/ancestries.html` (option C). Names, ages and hooks are first drafts:
  - **Marchfolk** (humans of the March): learn fastest. Prime about 24–32.
  - **Stonewrights** (stout hill miners): shrug off poison and wounds, slow to heal from trauma. Prime about 40–80.
  - **Lanthe** (long-lived wood folk): grow slowly, can serve under several guildmasters (Pillar 3). Prime about 60–200.
  - **Reedfolk** (fen stilt-dwellers; after launch, D-109): parties with one travel the fens fast. Prime about 22–34.
  - **Barrowborn** (born near the old barrows): see in the dark, sense the restless dead; the temple faction distrusts them. Prime about 24–32.
  - Each sets attribute leanings, ageing (D-075), naming rules (D-058) and one or two traits. Later as data: Hearthlings (small folk), Grael (tusked clans), Mossbacks, Ashlings.
- **Attributes: about 16** (lean cut, D-109) on the 1–20 scale (D-007), including hidden ones (potential, consistency, loyalty). Final list during the prototype (§9).
- **Traits:** about 30 at launch (D-109): about 15 personality and about 15 earned (scars, trauma, deeds, habits).
- **Staff roles: 6** (deputy, trainer, scout, librarian, healer, quartermaster), each with about 6 role attributes.
- **Guildmaster backgrounds: 5** (ex-adventurer, merchant, noble, scholar, temple-raised).

### 7b. Threats (Accepted 2026-10-26, D-080)

- **Monsters: about 24 kinds** (lean cut, D-109) in 7 families (beasts, the restless dead, fen things, goblin-kind, giants and trolls, cultists and bandits, old magic), each kind with a few variants by danger rating.
- **Named beasts:** generated from monster kinds with a name, a history and a bounty (CONCEPT §12); they remember fights and grow.
- **Bandit and cult groups** for defence work, tied to the outlaw faction.

### 7c. Places and work (Accepted 2026-10-26, D-080)

- **Region:** one authored region, the March (D-030): **8 settlements** (at least; D-144 adds another major city and wild-country outposts), **5 biomes** (fen, downs and woods, moor, hills and caves, coast), about 12 authored landmarks.
- **Factions: 6**: the crown, two cities, a temple, a merchant house and the outlaws (CONCEPT §16), each with a crest, colours and naming rules.
- **Rival guilds: 17** (3 tiers of 6 with the player, D-073): about 6 authored (name, crest, charter, specialty, patron, home town, founding adventurers) and the rest generated from templates by seed (D-109).
- **Site templates** (seeded, D-030): delve sites (barrows, ruins, mines, caves, sunken chapels and so on), beast lairs, and defence sites (village, fort, bridge, mill). **20 templates** (D-080).
- **Quest templates:** delves, hunts, bounties on named beasts, defences, plus the prologue contract (D-076). **20 templates** (D-080).
- **Key-moment templates:** the decisions that stop the calendar (push on, retreat, spare, spend). **about 40 templates** (lean cut, D-109), each with several text variants.
- **Tournaments: 1** at launch (D-109): the guild trials at the midsummer fair (D-067); the monster-hunt cup and arena event follow in updates.
- **Region crises: 3–4 small ones** (D-112): local, data-driven chains of contracts and consequences (for example a plague in one town, a great beast waking in one valley, an outlaw rising on one road) that can start from about year 5 and give the middle years goals. Larger region-wide crises and guild legacy projects come after launch. Owner's note: "Small crisis at launch. Legacy goals and larger crises after launch."

### 7d. Guild and gear (Accepted 2026-10-26, D-080)

- **Guild house:** 11 building kinds, each 1–3 cells wide with 3 levels (D-172): 7 rooms on stacked floors and 4 in the compound (D-168, D-169, D-180); replaces 5 facilities × 3 levels (D-075). Incident letters (D-173) are extra templates, not yet counted in §7e.
- **Home-town sites: 5** × 3 levels, funded by patronage (D-171).
- **Gear:** 4 tiers × about 10 kit types (to revisit when the slots and items of D-143 are designed); about 30 magic-item templates that generate storied items, plus about 10 authored legendary items placed in the region.
- **Guild traits:** about 25 earnable traits (D-020, D-075).
- **Charter options:** values scale, about 8 specialties, about 12 house rules.

### 7e. Writing (Accepted 2026-10-26, D-080)

- Letters, reports, rumours, criers' notices, Chronicle entries and conversation lines, all as templates with many variants (D-059). Target **about 4,500 template lines** (lean cut, D-109; was about 6,000), costed in §12.

---

## 8. Making consequences visible (Accepted 2026-10-26)

Decisions: D-082, D-083. Pillars 2 and 4 only work if the player can see what their choices caused (GAME-04). Mock-up: `docs/design/mockups/consequences.html`.

### 8a. Surfaces (Accepted 2026-10-26, D-083)

Each outcome reaches the player through one or more of these, from immediate to permanent:

| Surface | Carries | When |
|---|---|---|
| Quest log and board (D-004, STYLE §4) | Every simulation event as one line, played on the board | Live |
| Party summary cards (D-032) | Parties not being watched | Live |
| Week report (D-068) | Digest: results, injuries, money, morale moves | Weekly |
| Letters (D-043) | Consequences that need or deserve attention, from a person in the world | When they land |
| Criers and gossip (D-043) | Public news: rankings, rivals' deeds, region changes | When they land |
| Region map (D-049), raised to the kingdom map (D-087, D-097) | Areas and locations, guilds, parties and rivals in action (factions, threats, deeds and rumours on the map after launch, D-109) | Always |
| Inspector fields | Every person, item, place and faction: value, breakdown (D-078) and dated history | On demand |
| Chronicle and Hall of Heroes (D-042) | Deeds, deaths, storied items, records | Permanent |
| Year in review (D-067) | The year's biggest causes and effects | Year's end |

### 8b. Rules (Accepted 2026-10-26, D-083)

1. **No silent change.** Every change to a resource, a person or a place writes at least a log line or an inspector history entry; important ones also send a letter.
2. **Every change records its cause** (the decision or event that started it) and the player can reach that cause in at most 2 clicks. The engine records causes; the UI only shows them (GAME-02).
3. **Delayed consequences name their cause.** A letter about a raid 8 weeks after a refused contract says so.
4. **Importance follows the stop classes** (D-068): must-stop outcomes get a stop and a letter; digest outcomes go to the week report; minor ones go to the log and history only.
5. **Forewarning follows knowledge** (D-041): a spreading threat shows first as a rumour (in the inbox until the threats map layer arrives after launch, D-109), then sharper as scouts and the library learn more. Nothing important arrives with no warning at all unless the guild chose not to look.
6. **Deaths are never quiet:** the bell (STYLE §8), a memorial letter written sincerely (D-059), friends' and rivals' reactions, a Chronicle entry.
7. **Optional AI flavour** (Early update, D-035) may rewrite the words of a surface, never its causes or numbers (GAME-03).

### 8c. How causes are told (Accepted 2026-10-26, D-082)

**In-world first, with a trace, and numbers that stand out.** Mock-up: `docs/design/mockups/consequences.html` (option C, with option A's inspector). Owner's note: "C but I like seeing the numbers stand out in A so add that feature."

- **The world speaks first:** letters, criers and gossip tell consequences in the speaker's voice (D-059), including blame where a person would give it.
- **Trace:** a small "Trace" mark on every letter and every changed value opens the plain cause chain: each step dated, the player's own decisions marked, what the guild knew at each step (and what better knowledge would have shown, D-041), and what can be done now.
- **Inspector histories** (from option A): every value on a person, item, place or faction shows its current number, the change in bold with a sign (−8, +3) in the status colours (D-048), and a dated history where each entry has a "because" line. A history entry links to its trace.
- Trace and history wording is templated from recorded causes (GAME-02, GAME-04); only letters carry the world's voice.

---

## 9. Risks and prototypes (Accepted 2026-10-26)

Decisions: D-084..D-086, D-110, D-113. A prototype answers one question cheaply. **The simulation core is kept** (amended 2026-10-26, D-113): it is written as the production engine package from the start (§11b), with tests; only prototype screens are throwaway. Prototyping is the first build step after the plan is approved (D-001). "Fun" and feel checks pass only on the owner's recorded playtest notes (GAME-06).

### 9a. Riskiest assumptions (Accepted 2026-10-26, D-086)

**Amended (2026-10-27, D-154):** R4 is now a phone test. Find 5 facts in under 10 seconds each, using the hub, the work desk and Ask the clerk. The 25-row rule is dropped. How it runs: D-159; round 2 changes: D-162. **Passed** in round 2 (D-165).

Ranked by how much of the game fails if the assumption is wrong. "Cheapest test" is the smallest thing that answers it.

| # | Assumption | If wrong | Cheapest test | Passes when |
|---|---|---|---|---|
| R1 | Watching a quest (log and board) is tense and fun | The core loop (Pillar 2) is dull; players auto-resolve everything | One quest, simulated: text log plus a plain board with standees; owner watches 10 quests | Owner wants to watch the next one; auto-resolve feels like a loss; key moments feel like real choices |
| R2 | The simulation hits the §4 targets: ~2 deaths a year, money tight early, ladder movement | Balance needs rework after art is built | Headless year simulator (no graphics): 1,000 seeded guild-years, report deaths, money, promotions | Medians within ±25% of §4 targets; no runaway rival in 30 simulated years |
| R3 | A year fits the friction budget: ~80 stops, ~145 min (D-068) | Sessions drag or feel empty | Same headless simulator counts stops by class; then a timed playtest of one year in the text prototype | ≤ 100 stops a year for the mid-sized guild (top guild: §9d); owner plays a year in ≤ 3 h |
| R4 | The desk layout holds FM density (30-row roster, finances) on a 1366 px screen | Dense screens need a redesign late | Clickable HTML mock-ups of roster, finances and contract board at 1366 and 1920 px | 25+ roster rows visible at 1366 px; owner finds 5 set facts in under 10 s each |
| R5 | Old-press ledgers are readable | Dense screens tire players (STYLE §5) | Rendered ledger specimens at real sizes (done, §9c: 15 px, lining figures) | Confirmed on real monitors during R4 (now: confirmed on the owner's phone in R4, D-166) |
| R6 | Staff are competent but limited: the player's own focus visibly beats delegation (D-038) | Delegating everything is optimal; the player becomes a spectator | Headless simulator: same seeds, delegated vs a careful player policy | Player focus 10–25% better on the chosen area; delegation never ruinous |
| R7 | Players get attached to adventurers who die about twice a year | Deaths feel like stat loss, not loss | Owner plays two years in the text prototype with generated histories and memorial letters | Owner can name and describe 3 adventurers after a session |
| R8 | Template writing stays fresh at ~4,500 lines (D-080, D-109) | Repetition breaks the fiction within a few years | Write one template family (quest reports) with variants; generate 200 reports; count repeated sentences | No sentence repeats more than once in 50 reports |
| R9 | Players reach a second guildmaster (Pillar 3; D-065: 25% of 40 h+ players) | The generational pillar is invisible | Can only be measured late (beta); early proxy: headless simulator shows patron dismissal or retirement within 20–30 years | Median guildmaster career 20–30 simulated years |

Not risks for prototypes (handled elsewhere): engine choice and determinism (§11), art cost (§12), team and budget (§14).

### 9b. Prototype order (Accepted 2026-10-26, D-085)

The riskiest question first. All prototypes come after the plan is approved (D-001).

0. **Engine test, web-first** (D-110, amends D-090): the ledger and kingdom-map view built in web tech; if web misses a bar, the owner decides what follows; there is no Godot fallback (D-163).
0b. **Resolution v0** (D-113): half a page plus code for how a party, its plan, stats, gear and the site become odds and events; every number in data, tuned later. R1 needs it.
1. **One quest, watched** (R1): a minimal simulation core drives a text log and a plain board with standees; the owner watches 10 quests. If watching isn't tense, Pillar 2 and the core loop need rethinking before anything else is built.
2. **Headless year simulator** (R2, R3, R6, R9): the same simulation core with no graphics; 1,000 seeded guild-years reporting deaths, money, ladder movement, stops by class, delegated vs careful play, and guildmaster careers against the §2 and §4 targets.
3. **Desk-density mock-ups and writing test** (R4, R8): HTML mock-ups at 1366 and 1920 px (now phone screens, D-154), and one template family generated 200 times. Neither needs the engine, so they can run alongside step 1 or 2.
4. **Two years in the text prototype** (R7): the attachment check, as a phone-first web page (D-160). Scope, histories, letters home, the on-page R7 check and the screens: D-195–D-199, mock-up `docs/design/mockups/step4-prototype.html`.

**Time-boxes** (D-111, D-113; estimates at 10–20 h a week): engine test 4–6 weeks; resolution v0 and step 1 6–10 weeks; step 2 starts with one guild, no rivals and three classes and widens in steps, 8–12 weeks; step 3 alongside; step 4 (two in-game years played) 4–6 weeks. A step over its box by half goes to the owner at once, not at the gate.

**Stop and slip rules** (D-111): if R1 fails twice (two rounds of the 10-quest watch test miss the pass line, with one round of changes between them), building stops and the core loop is redesigned before anything else. A milestone running 50% over its estimate triggers a cut review at that gate: content is dropped or deferred, quality checks never are. Whether to end the project is the owner's call, not a rule.

### 9c. Ledger readability check (Accepted 2026-10-26, D-084)

Mock-up: `docs/design/mockups/readability.html` (first section).

- **Minimum ledger size: 15 px** at 100% (owner's choice); the size slider (D-077) goes up from there.
- **All numbers use lining figures** (`lining-nums`). Measured at 40 px: the ledger face's default figures are old-style and proportional (13.6–20.8 px wide); lining figures are equal width (21.1 px) and sit on the line.
- Confirmed on the owner's phone in the phone R4 (D-166); D-052 (own ledger cut) and clear print as the default (D-077) are not needed now. Long sittings are not yet tested.

### 9d. Added checks (Accepted 2026-10-26, D-113)

From the plan review (`docs/design/PLAN-REVIEW.md`). The headless simulator (step 2) also reports:

- **No dominant safe play:** cautious vs bold risk settings and delegated vs hands-on play each come out ahead in some seeds (§4g).
- **Winter cash:** money through winter with wages running; no guild is ruined by winter alone.
- **Bad starts:** a set of seeds with two bad first years; most guilds recover through the §4g levers without rubber-banding.
- **Top guild load:** stops a year and deaths for a 6-party guild, not only the mid guild; target ≤ 130 stops a year (estimate).
- **Late goals:** in seeds that reach year 10+, at least one crisis or new pressure arrives between years 5 and 15 (D-112).

The writing test (R8) also checks **shape repetition**: across 100 simulated quests, no site × monster × complication combination repeats more than 3 times, using combined modifiers rather than flat templates. A small template previewer in `tools` generates N outputs and counts repeats (D-113).

---

## 10. Playtest and metrics plan (Accepted 2026-10-26)

Decisions: D-088, D-089. Ties the §1 targets (D-065) and the §9 pass lines (D-086) to who plays, when, and what is measured. Milestone names follow §13.

### 10a. Who plays, when (Accepted 2026-10-26, D-089)

| Stage | Players | What it answers |
|---|---|---|
| Prototypes (§9b) | The owner | R1–R9; fun and feel pass only on the owner's recorded notes (GAME-06) |
| Vertical slice | 6–10 invited players: about two thirds management-sim veterans, one third tabletop players (D-063) | First season (D-076), readability (D-084), desk density, attachment |
| Alpha | 30–50 closed testers | Full year and multi-year play, balance (§4), friction budget (D-068), crashes |
| Free demo | Public | Demo conversion (D-065), first-season completion, store feedback |
| Beta | 200+ testers | Long saves, succession (R9), save upgrades (GAME-05), performance |

### 10b. What is measured (Accepted 2026-10-26, D-089)

- **Pacing:** minutes per in-game year, stops per year by class, seconds per stop (D-064, D-068).
- **Danger and economy:** deaths per year, money runway, promotions and relegations against §4 (D-071..D-073).
- **Engagement:** share of quests watched vs auto-resolved (R1 proxy), share of areas delegated (R6), Trace and inspector use (D-082), clerk's notes put away (D-076).
- **Onboarding:** time to finish the prologue and the first season; where players stop playing.
- **Attachment:** after a session, "name three of your adventurers and something that happened to them" (R7).
- **Readability and UX:** timed find-the-fact tasks on dense screens (R4); think-aloud sessions at the vertical slice.
- **Stability:** crashes, unreadable saves (must be zero, GAME-05).

### 10c. How data is collected (Accepted 2026-10-26, D-088)

**Under review (2026-10-27, D-150):** the release still sends nothing, but the Steam data and achievement rates named here have no phone equivalent yet.

Owner's note: "1 but leave 2 open as a future option."

- **Playtest builds** write a local log of the §10b measures; testers choose to send it with their feedback. No server.
- **The release game sends nothing.** §1d targets are measured from Steam's own data (median playtime, reviews, demo-to-purchase) and achievement unlock rates used as measures: for example "Survived the first year" (first-season completion) and "A new guildmaster" (Pillar 3).
- **Future option:** anonymous, opt-in telemetry from released copies. It needs a backend, a privacy policy and consent handling, so it comes back to the owner as a cost decision (SAFE-03) if ever wanted. The playtest log format is designed so the same events could be sent later.

### 10d. Acting on results (Accepted 2026-10-26, D-089)

- Every measure has the target from §1d, §4 or §9a; a miss produces a dated finding in the playtest log with a proposed change.
- Changes to settled rules go through DECISIONS (SRC-04); numbers tuned inside the engine's data need no decision entry.
- Two playtest rounds in a row missing the same target is a design problem, not a tuning problem: it goes to the owner.

---

## 11. Technology and architecture (Accepted 2026-10-26)

Decisions: D-090, D-091, D-110, D-114. Constraints from earlier decisions (the PC and Steam ones replaced by mobile first: phones by touch, D-151, D-155; phone stores, D-158): PC first, mouse and keyboard, dense screens (D-016); deterministic engine with seeded randomness and injected time (GAME-01); one simulation function, UI never recomputes (GAME-02); content as data (GAME-04, D-044); versioned saves (GAME-05); Ironman autosave each day (D-033); Steam release with achievements as measures (D-088); 15 px old-press ledgers with lining figures (D-084).

### 11a. Engine and platform (Accepted 2026-10-26, D-090, D-110)

**Amended (2026-10-27, D-150, D-151, D-154):** mobile first. Launch is on iPhone and Android phones from one web-tech codebase, and the engine test is rebuilt as a phone app judged on the owner's phone. Windows follows after launch.

**Amended (2026-10-27, D-163):** web tech is the engine; the Godot fallback below no longer stands. The comparison stays as the record.

**Web-first** (owner's choice after the plan review, D-110, amends D-090): build the two test pieces in web tech (Electron, TypeScript), reusing Story-Generator's map code (§12d). Superseded by D-163: Godot is not built, and a missed bar goes to the owner. The bars stayed: 60 fps on the map at 1366×768, the 15 px ledger readable, the find-the-fact task (R4) passed (phone versions: D-154). Unity is out. Earlier plan (D-090): build both, then choose; the comparison below still stands as the record.

**Engine test** (prototype step 0, before the watched quest, D-085):

- **Build (web; the Godot fallback is superseded, D-163):** (1) one roster ledger: 30 rows, sorting, a hover breakdown on a number (D-078), 15 px old-press type with lining figures (D-084), clear print and the 100–150% size slider (D-077); (2) one kingdom-map view (D-087): layered illustration, zoom and pan, a party moving, faction and guild marks, a threat stain, one ink-reveal effect. The map piece tests the technique; faction marks and threat stains are not at launch (D-109).
- **Judged on:** the owner's look-and-feel notes (GAME-06), plus measured build time, frames per second and memory at 1366×768, download size, the find-the-fact task (R4), and whether the ledger works with a screen reader (labelled controls, §6c).
- The rest of §11 holds for the web engine (D-163).

Comparison at the time of the choice (2026-10-26):

What the game mostly is: ledgers, letters and inspectors (dense typography), plus two illustrated 2D views (the kingdom map, D-087, and the quest board, D-050). No 3D, no physics.

| | A · Web tech in a desktop shell | B · Godot 4 (C#) | C · Unity |
|---|---|---|---|
| Simulation | TypeScript package, also runs headless in Node | C# library, also runs headless in .NET | C# library |
| Ledgers and letters | HTML/CSS: best-in-class text, tables, OpenType features (lining figures) | Godot Control nodes: workable, more effort for dense typographic tables | uGUI/UI Toolkit: workable, heavy |
| Map and board | Canvas/WebGL (e.g. PixiJS) | Strong native 2D, animation and shaders | Strong |
| Steam | Electron + steamworks.js (last updated April 2026, per a repo tracker; to verify) | GodotSteam (community, widely used) | Steamworks.NET |
| Download size (estimate) | ~150 MB shell | ~60–100 MB | ~100 MB+ |
| Cost and licence | Free, open source | Free, MIT | Paid tiers above a revenue threshold; 2023 runtime-fee episode (current terms to check) |
| Iteration with AI help | Fastest: one language, and the mock-ups are already HTML | Good | Fair |

### 11b. Architecture (Accepted 2026-10-26, D-091)

**Amended (2026-10-27, D-151, D-158):** on phones, saves use the stores' own backup in place of Steam Cloud, and the shell is a phone app wrapper in place of Electron for the launch.

Packages (one repository):

- **engine**: the rules. Pure code, no UI, no clock, no unseeded randomness (GAME-01). One `simulate(state, command)` used for preview and commit (GAME-02); random streams live in the state (§11h, D-114). Every change is an **event** with a cause id.
- **content**: classes, ancestries, monsters, sites, quests, key moments, text templates as data files with schemas (GAME-04).
- **ui**: screens that read state and events, send commands, never compute rules.
- **shell**: desktop window, saves on disk, Steam (achievements, cloud saves).
- **tools**: the headless year simulator (§9b step 2), a content validator, a save inspector.

The **event log** is the spine: the Trace and inspector histories (D-082), the Chronicle (D-042), the week report, letters (D-083) and playtest logs (D-088) are all views of the same events, so they can never disagree.

```mermaid
flowchart LR
  CONTENT[content: data files] --> ENGINE[engine: simulate + seeded RNG]
  UI[ui: screens] -->|commands| ENGINE
  ENGINE -->|state + events| UI
  ENGINE -->|events| LOG[event log]
  LOG --> TRACE[Trace and histories]
  LOG --> CHRON[Chronicle]
  LOG --> PLAYLOG[playtest log]
  SHELL[shell: saves, Steam] <--> ENGINE
  TOOLS[tools: headless simulator, validator] --> ENGINE
```

### 11c. Determinism (Accepted 2026-10-26, D-091)

- Seeded generators (for example PCG or xoshiro), never global: named streams per system kept in the state (§11h, D-114); engine time passed in.
- Game values are integers (money in copper coins, shown as gold, silver and copper at 10 to 1 each, D-135; stats as whole numbers, chances in per-ten-thousand), so results do not depend on floating-point differences.
- One determinism test: the same seed and commands give the same events (GAME-06).

### 11d. Data formats and modding (Accepted 2026-10-26, D-091)

- Content as JSON files checked against JSON Schema at load and in CI; text templates in their own files for writing and later translation.
- Content loads as packs in order (base game first), so mods (D-044, Later) are just more packs.

### 11e. Saves (Accepted 2026-10-26, D-091)

- One save per guild in Ironman mode, written each day tick (D-033): write to a temporary file, then swap, keeping the last good save as a backup.
- Every save carries a save-format version and the content version; older saves upgrade on load through a chain of small migrations; an unreadable save is never overwritten (GAME-05).
- Steam Cloud syncs the save folder.

### 11f. Optional AI flavour (Early update) (Accepted 2026-10-26, D-091)

- Off by default; the player supplies their own provider key; text only, and only for surfaces that already have templates (GAME-03, D-017).
- The engine never waits on it: template text shows first and AI text replaces it if it arrives. Provider and cost decided when the feature is built (SAFE-03).

### 11g. Performance targets (Accepted 2026-10-26, D-091)

**Amended (2026-10-27, D-154):** the targets apply on a phone 375 points wide and up. They are 60 fps for the map with smooth pinch and pan, and 15 px minimum text. The verdict comes from the owner's device.

- Minimum screen 1366×768; 60 fps on the map and board on a mid-range laptop from about 2020.
- A day tick with no stop under 50 ms; a headless simulated guild-year under 1 s, so the 1,000 seeded guild-years in §9b take under about 17 minutes run one after another.
- Save and load under 1 s for a 30-year save.

### 11h. Engine foundations (Accepted 2026-10-26, D-114)

Four foundations from the plan review (`docs/design/PLAN-REVIEW.md` C1–C4), built before any game rule because adding them later touches every system:

1. **Values explain themselves.** Every game number is a value carrying its parts (base, modifiers, sources) and the cause id of its last change. The breakdown on hover (D-078), the Trace and inspector histories (D-082) read these; the UI never rebuilds them (GAME-02).
2. **Named random streams.** Randomness comes from streams derived from (seed, name), one per system, with their positions stored in the game state; `simulate(state, command)` takes no separate seed. Adding a roll in recruitment then does not reshuffle quests, so balance runs and replays stay comparable. Story-Generator does the same (§12d).
3. **Replayable bug reports.** Playtest builds keep the commands since the last daily snapshot in the save (D-033), so a tester's save and log replay the bug exactly on the developer's machine. A replay that diverges is itself a determinism bug.
4. **Event-log retention.** Recent years keep every event; older years keep events that a history, Trace or Chronicle entry points to, plus yearly summaries; Chronicle-worthy events are kept forever. The rule is tested against the 30-year save target (§11g).

Also: package boundaries are enforced by lint, not only described (the engine imports nothing from ui or shell and cannot reach the clock or `Math.random`); content types and validation come from one schema source; text templates get a grammar (variables, pronouns, plurals, conditional lines) before the writing test (R8); interface labels live in string files like world text, so translation stays cheap (D-104).

### 11i. Code standards (Accepted 2026-10-26, D-114)

- A short `docs/STANDARDS.md` is written at the start of M1, before the first line of game code: strict types and no `any`; a pure engine; a test for every rule; naming; small files; a definition of done per feature (checks green, behaviour tested, docs updated, VER-07).
- Each package has a short `AGENTS.md` stating its rules (for example "engine: no clock, no `Math.random`, no ui imports"), so AI coding sessions start inside the rules.
- **Invariant checks** in the engine (money adds up, no negative health, every event has a cause) run in every balance sweep; generated text has golden-file tests.
- **Rules specs just in time:** a half-page spec per system is written just before that system is coded, with its numbers in data, not all up front.
- **Dependencies:** the stack's dependency list is approved once when the engine is settled (SAFE-03), not package by package.

---

## 12. Art and audio production (Accepted 2026-10-26)

Decisions: D-097, D-098, D-109, D-113. Inputs: STYLE §1–§8 (locked), content volume (D-080), kingdom map goal (D-087), tools review (D-094). **All costs are rough estimates** (REP-01) from typical freelance rates; §14 turns them into a budget, and real quotes replace them.

### 12a. Made by hand vs generated (Accepted 2026-10-26, D-098)

The rule: an artist draws **parts and set pieces**; code **assembles** them (GAME-04). Generated images from AI tools are for exploration only, never shipped, until licence and store-disclosure checks pass (D-094).

| Asset | Made by | How much (launch) |
|---|---|---|
| Kingdom map of the March (D-087) | Artist (base) + code (live layers) | 1 base map in layers, plus marks and banners (§12d) |
| Quest-board site maps (STYLE §4) | Code: an ink renderer draws site templates from an artist's stamp library | ~60 stamps per biome × 5 biomes |
| Portraits (STYLE §7) | Artist draws parts; code assembles by seed | ~160 parts across 4 ancestries (D-109) |
| Monsters | Artist | ~24 kinds × (standee + hatched card) = ~48 pieces (D-109) |
| Icons (STYLE §6) | Artist | ~120 icons × 2 levels; ~40 card icons tinted |
| Crests and seals | Artist draws charges and frames; code assembles | 6 factions, ~6 authored rival crests; the crest builder serves the player and generated rivals (D-109) |
| Decorated initials (STYLE §5) | Artist | 26 letters |
| Legendary items | Artist | ~10 illustrations |
| Desk, paper, ledgers, seals | Mostly code (CSS or shaders) plus a few textures | ~15 textures |
| Ledger font cut and symbol font (D-052) | Type designer, only if the ledger fails the real-monitor check (D-084) | 1 cut, ~150 symbols |

### 12b. Audio (Accepted 2026-10-26, D-098)

| Asset | Made by | How much (launch) |
|---|---|---|
| Ambient early-music (STYLE §8) | Commissioned composer, small ensemble | 60–90 min of loopable pieces |
| Desk sounds (quill, pages, seals, candle, rain) | Licensed library plus custom recordings | ~150 sounds |
| Biome ambience for the board | Licensed library, edited | 5 beds |
| Big-moment stingers (drum, bell) | Composer | ~10 |
| Vocal sounds (D-060) | Voice actors, name-free | ~40 short sounds |
| Bardic songs (D-056) | After launch | — |

### 12c. Cost estimate (rough) (Accepted 2026-10-26, D-098)

| Area | Low | High | Basis (estimate) |
|---|---|---|---|
| Kingdom map | $3,000 | $10,000 | Layered illustrated map plus mark and banner sets |
| Site stamps (5 biomes) | $3,000 | $8,000 | ~300 small ink pieces |
| Portrait parts | $3,000 | $10,000 | ~160 parts at $20–60 (D-109) |
| Monsters | $4,000 | $12,000 | ~48 pieces at $80–250 (D-109) |
| Icons | $3,000 | $8,000 | ~240 drawings, small |
| Crests, seals, initials, items | $3,000 | $8,000 | Parts and ~36 set pieces |
| Textures and UI art | $1,000 | $4,000 | |
| Type (only if needed) | $0 | $6,000 | D-052 fallback |
| **Art total** | **$20,000** | **$66,000** | Lean cut (D-109); was $23,000–74,000 |
| Music (60–90 min) | $6,000 | $25,000 | Higher end for live players |
| Sound effects and ambience | $2,000 | $8,000 | Library licences plus custom |
| Vocal sounds | $1,000 | $4,000 | |
| **Audio total** | **$9,000** | **$37,000** | |

Ways to bring it down, in order of least harm: fewer monster kinds at launch (done: about 24, D-109), reuse portrait parts across ancestries, library music for winter and menus, one artist for map and icons so the style holds.

### 12d. Kingdom map workshop (Accepted 2026-10-26, D-097)

Mock-up: `docs/design/mockups/kingdom-map.html` (interactive: base style and layer switches).

- **Base: hand-illustrated now, procedural later.** The launch March gets a hand-illustrated base map in layers; live marks and later generated regions (D-030) use the procedural ink renderer built for the quest board. Owner's note: "Go with c. But the map will need to look better eventually. The story generator repo might have some use there because it has a good starting point for a map that I would just want more detail on for a region to give it more life." The `DdraigFawr13/Story-Generator` repository was reviewed on 2026-10-26 (facts verified at the cited lines):
  - It is the owner's browser world simulator (TypeScript, React, Vite, Vitest, Playwright) with a seeded world generator: plate terrain and erosion, climate, rivers and lakes, biomes, named regions (ranges, passes, fords, harbours), routes (`src/engine/worldgen/`).
  - Randomness comes from named seeded streams derived from (seed, name), never `Math.random` (`src/engine/core/rng.ts:1-3`), which matches GAME-01.
  - Its atlas draws an ink-style map on canvas: paper land with biome tints, shaded peaks, hills as arcs, two-tone trees, an ink coastline, double frame, compass rose, region names in spaced italics, realm borders as soft bands (Story-Generator `docs/phases/UI_ROOMS.md:28-44`).
  - Uses here: generate the March's terrain, rivers and routes from a seed as the layout an artist paints over; the generator and atlas symbols as a starting point for the procedural ink renderer and later generated regions (D-030).
  - Facts above were checked by opening the cited lines in that repository on 2026-10-26.
  - It is written in TypeScript with canvas rendering: reuse fits the web option of the engine test directly; Godot would need a port to C#. Evidence for D-090, not a decision.
  - Licence: `UNLICENSED` (`package.json:5`); the owner holds the rights, so reuse is approved (D-116); check the licences of any of its dependencies that come along, and record provenance (SAFE-05).
- **Launch layers** (lean cut, D-109): areas and places (always), **guilds** (banners with ranking tier) and **action** (parties and rivals moving, key-moment seals). Each mark links to its Trace (D-082). **Factions** (who holds sway where) and **threats** (spreading ink stains, closed roads) follow in an update; meanwhile faction standing lives in its ledger and threats arrive as rumours and letters.
- **Geography review** (D-144, owner's addition): before the base is drawn, check that rivers run believably and roads follow sensible lines (valleys, fords, passes, bridges); place every town for a reason (a crossroads, a ford, a harbour, a resource such as ore, timber, salt, fish, wool or peat) with a specialty the economy and contracts can use; add at least one more major city and outposts in the wild and harsh areas. §7c's 8 settlements becomes a floor.
- **When it is drawn** (D-113): at M2 the artist draws the slice's corner in final style and the rest as a sketch; the full base is commissioned once alpha balance is stable, so places that move during balancing are not redrawn.
- **Later:** **deeds** on the map (inked cartouches, the fallen with a mourning corner; meanwhile deeds live in the Chronicle, D-042) and **rumours** as pencil notes (meanwhile in the inbox, D-043).

### 12e. Pipeline and licences (Accepted 2026-10-26, D-098)

- Art in layered source files, exported by a script to the sizes the game needs; never edited by hand after export.
- Every asset gets a line in an asset ledger (`assets/LICENSES.md`): who made it, licence, date, source file (SAFE-05).
- Fonts: OFL faces only (STYLE §5); check Reserved Font Names before any renamed cut.
- Contracts with artists and composers transfer the rights the game needs; drafted when hiring (SAFE-01).

---

## 13. Milestones (Accepted 2026-10-26)

Decisions: D-099..D-101, D-108, D-111. Inputs: prototype order (§9b, D-085), playtest stages (§10a, D-089), engine test (D-090), scope tiers (CONCEPT §28), launch content (D-080, D-081), art and audio (D-098). **Durations are estimates** (REP-01), restated on 2026-10-26 for the owner building solo with AI help at 10–20 hours a week (D-108; the first figures assumed a small team) and for the lean launch cut (D-109).

### 13a. The ladder (Accepted 2026-10-26, D-099)

**Amended (2026-10-27, D-156):** the phone engine test joins M1, and phone builds run from M2 on. Launch is about 39–68 months from plan approval (estimate). The figures below are the earlier Windows plan.

Each milestone ends at a gate: the owner reviews the exit checks and says go, loop or stop. A missed check loops the milestone; the same miss twice is a design problem that goes to the owner (D-089).

| # | Milestone | What is built | Who plays (§10a) | Exit checks | Estimate |
|---|---|---|---|---|---|
| M0 | Plan approved | PLAN §1–§15 and the plan review (done 2026-10-26, D-115) | — | Owner approves the whole plan (D-001) | done |
| M1 | Prototypes | §9b steps 0–4: engine test, one watched quest, headless year simulator, desk mock-ups and writing test, two years in the text prototype. The simulation core is kept; prototype screens are throwaway (§9, D-113) | Owner | Engine settled web-first (D-110); R1–R4 and R6–R8 pass lines met (D-086); R9 proxy shows 20–30-year careers; §9d checks pass | 5–8 months |
| M2 | Vertical slice | The production engine, content, ui and shell packages (§11b). The prologue and first season (D-076) in one corner of the March: 2 biomes, 3 settlements, 4 classes, ~10 monster kinds, ~6 quest templates; final art and audio for that corner only; the slice's corner of the kingdom map in final style, the rest sketched (D-113) | 6–10 invited players | First season in 3–4 h (D-064); no dense screen needs more than one explanation (D-065); testers name 3 adventurers (R7); determinism test and save upgrade test pass (GAME-05, GAME-06); a tester's bug replays from their save (D-114) | 7–10 months |
| M3 | Alpha | All 14 launch systems (D-070) in, playable over many years; whole March with about half the launch content; placeholder art allowed outside the slice | 30–50 closed testers | Medians within ±25% of the §4 targets over real play; ≤ 100 stops a year for the mid-sized guild (D-068, §9d); no unreadable saves; feature complete for launch | 10–15 months |
| M4 | Free demo | The first season as a free build (D-040), cut from the alpha with final art for what it shows; Steam page live since M2 | Public (e.g. a Steam festival) | ≥ 70% of demo starts finish the first season (D-065); crash-free sessions; store feedback logged | 2–3 months, alongside M5 |
| M5 | Beta | All launch content (D-080, D-081 as cut by D-109), final art and audio, achievements, Steam Cloud; balance and writing passes | 200+ testers | 30-year saves load and upgrade; succession reached in long saves (R9); §11g performance met on the minimum machine; no known save-losing bug | 7–10 months |
| M6 | Launch | Release build, store assets, day-one patch plan | Everyone | Release checklist (§15) passes; owner signs off | 2–3 months |
| M7 | Post-launch | Free updates (§13c) | Everyone | Each update keeps old saves loading (GAME-05) | ongoing |

Total to launch: **about 31–46 months** (about 2.5–4 years) from plan approval, solo at 10–20 h a week with the lean cut (sum of the ranges with the demo run alongside the beta; estimate, D-108). The first estimate, 18–28 months, assumed a small team. Slip and stop rules: §9b (D-111).

### 13b. Rules across milestones (Accepted 2026-10-26, D-099, D-100)

**Under review (2026-10-27, D-150):** the Steam page from M2 and Early Access are Steam-only. Their phone equivalents are open.

- **Art money follows proof.** No bulk art or music is commissioned before M1 passes R1 and R2 (the game is fun to watch and the economy holds). M2 commissions only the slice's corner, and the map's full base waits for alpha balance (§12d); bulk art starts once alpha balance is stable, so systems that change late don't waste drawings (§12).
- **The slice sets the bar, the alpha sets the breadth.** The slice is small but final quality, so it tests feel and readability; the alpha is wide but rough, so it tests systems and balance.
- **Content grows as data.** Content added after M2 is data entries only (GAME-04); the content validator runs in CI from M2.
- **Saves are protected from M2.** Every build from the slice on keeps older saves loading through migrations (GAME-05); testers' long saves are the beta's best evidence for R9.
- **Steam page at M2** so wishlists build through the alpha before the demo, and for about 19–28 months before launch (sum of M3, M5 and M6; estimate). Wishlist targets: §14f.
- **Launch model: decided at the alpha gate** (owner's choice, Plan Q13a). The plan assumes a full 1.0 after the beta. At the M3 exit the owner looks again, with the budget (§14) and alpha results in hand, at Early Access instead: selling from the alpha's end and growing to 1.0 over 6–12 months. Early Access brings money sooner and gives real 40 h+ saves for R9; it costs early reviews of a rough build, and old saves must survive every big change.

### 13c. Post-launch roadmap (Accepted 2026-10-26, D-101)

Free updates, in this order (owner chose war campaigns first, Plan Q13b); each adds to the launch engine and content packs without reworking them (D-044); war campaigns need the most new engine code. Paid expansions stay undecided (D-040) and belong to §14.

1. **War campaigns** (Early update, D-035): multi-party campaigns; the biggest new play after launch.
2. **Map deeds and rumours** (D-097): inked cartouches for deeds, pencil rumours.
3. **Training academy and item commissioning** (Early update, D-070).
4. **Escorts and expeditions** (Early update, D-035).
5. **Look and sound upgrades:** painted portraits (D-054), standee animations (D-050), bardic songs (D-056).
6. **Optional AI flavour** (Early update, D-017, §11f).
7. **Restored launch-cut content** (D-109), in batches alongside the above: guardian and druid classes, prestige paths and multiclassing, Reedfolk, more monster kinds and key moments, the monster-hunt cup and arena event, the factions and threats map layers. Then **larger crises and guild legacy projects** (D-112).
8. **Later tier**, each needing its own decision: 20 class levels (D-074), magic traditions, generated regions (D-030), intrigue (D-069), public mod tools (D-044), social features.

---

## 14. Budget, team and business assumptions (Accepted 2026-10-26)

Decisions: D-102..D-104, D-108, D-113. Inputs: art and audio costs (D-098), milestones and timing (D-099), launch model at the alpha gate (D-100), premium with a free demo (D-040), success targets (D-065), no runtime dependency, paid service or backend without asking (SAFE-03). **Every figure here is an estimate** (REP-01) unless marked as a fact; quotes and real spending replace them.

### 14a. Team (Accepted 2026-10-26, D-102)

Owner's choice (Plan Q14a): **start solo, hire later.**

- **M1–M2:** the owner directs and designs; code is written with AI help (Claude Code, D-094); contractors are paid per job for the slice's art and audio (§12). The owner's own time is unpaid and not in the budget.
- **Hire gate:** at the M2 (slice) gate, and again at M3 (alpha), the owner decides whether to add paid help, with the slice's results and the funding route (§14d) in view. The most likely first hire is one developer for 12–18 months.
- **Contractors throughout:** illustrator (map, icons, monsters, portraits; one artist where possible so the style holds, §12c), composer, sound designer, and optionally a writer for the ~4,500 template lines (D-080, D-109).
- **Risk:** progress depends on the owner's hours. The gates (D-099) are where a slow pace shows up and gets decided on, not hidden.

### 14b. Budget (Accepted 2026-10-26, D-103)

**Amended (2026-10-27, D-156, D-157):** for mobile first, the solo budget is about $66,000–219,000 with contingency. D-157 lists each change from the table below, which predates mobile first.

Two cases: solo all the way, and solo plus one developer hired at a gate. Contingency 20%. All figures in US dollars, estimates.

| Item | Low | High | Basis (estimate) |
|---|---|---|---|
| Art (D-098, D-109) | 20,000 | 66,000 | §12c |
| Audio (D-098) | 9,000 | 37,000 | §12c |
| Writing (optional contractor) | 3,500 | 10,000 | ~4,500 lines (D-109) ≈ 67,500 words at $0.05–0.15 a word; $0 if the owner writes with AI help |
| Marketing | 5,000 | 15,000 | Trailer, store capsule art, festival build polish; festivals themselves are free |
| Legal and business | 2,000 | 6,000 | Contractor agreements that transfer rights (§12e), a name and trademark check, company set-up if needed |
| AI and dev tools | 3,000 | 9,000 | $100–200 a month for 31–46 months (D-108; plan prices to check) |
| Test hardware | 1,000 | 2,000 | A minimum-spec laptop for §11g |
| Steam Direct fee | 100 | 100 | Fact: $100 per app, recouped after $1,000 of sales (Steam's terms, to recheck at sign-up) |
| **Subtotal** | **43,600** | **145,100** | |
| **Solo total with 20% contingency** | **~52,000** | **~174,000** | |
| One developer, 12–18 months (if hired) | 60,000 | 144,000 | $5,000–8,000 a month; varies a lot by country |
| **Total with a hire, with contingency** | **~124,000** | **~347,000** | |

Figures restated on 2026-10-26 for the lean cut and solo timeline (D-108, D-109); first figures: ~$57,000–185,000 solo, ~$128,000–358,000 with a hire.

**Spend before the hire gate (M1–M2):** about $8,000–27,000 (rounded estimate, including 12–18 months of tools): the slice's corner of the map and a sketch of the rest ($1,000–3,000, D-113), about a fifth of the other art and audio for the slice's corner, tools, the Steam fee and first contracts. Bulk art waits for M1 to pass (D-099).

### 14c. Price and revenue (Accepted 2026-10-26, D-104)

**Amended (2026-10-27, D-152, D-157):** on the phone stores the game is a free download with a $14.99 unlock, about $10–12 net per sale. Break-even is about 5,500–22,000 unlocks (estimates).

- **Launch price: $24.99** (owner's choice, Plan Q14b). Comparable deep management games sit around $25–35 (for example Darkest Dungeon, Wildermyth, Battle Brothers, RimWorld; list prices to recheck at launch); Football Manager is higher with an established brand.
- **Net per copy: about $12.50–15** (50–60% of the list price, estimate). Steam keeps 30% (fact for the first $10 million of sales); sales tax and VAT come out of prices in many regions, and regional pricing, launch discounts and refunds take more.
- **Break-even (estimate):** solo budget about **3,500–14,000 copies**; with a hire about **8,000–28,000 copies**. This covers cash costs only: not the owner's time, income tax, company costs or post-launch work (D-113).
- **Post-launch work** (free updates, D-101) is owner time plus art per update, budgeted after launch from sales.
- **Demo:** the first season, free (D-040, M4); D-065's 15% demo conversion is the measure.
- **§1d targets** (D-065) were revisited for this budget and stand unchanged; break-even needs no extra target.
- **Paid expansions:** stay undecided (D-040); decide after launch on sales and the post-launch plan (D-101). Free updates first.
- **Languages:** English at launch. Text lives in template files ready for translation (D-091); translation is decided after launch on sales by region.

### 14d. Funding route (Accepted 2026-10-26, D-103)

- **M1–M2: self-funded** (about $8,000–27,000, §14b).
- **At the slice gate** the slice is the pitch. Routes to choose between then: keep self-funding; a publisher deal (money and marketing for a revenue share and some control); crowdfunding (money and an early audience, but promises to keep); Early Access at the alpha gate (D-100).
- No publisher, investor or crowdfunding talks before the owner decides (SAFE-01).

### 14e. Assumptions to check (Accepted 2026-10-26, D-103)

**Amended (2026-10-27, D-157):** check the restated mobile-first figures in D-157, not the Steam ones below.

Each is an assumption the budget rests on; if one breaks, §14 is revisited at the next gate.

1. Art and audio quotes land within the §12c ranges.
2. AI-assisted solo development at 10–20 h a week reaches the vertical slice in 12–18 months (M1 + M2, D-108).
3. Wishlists from the Steam page (live from M2) and the demo carry the launch; no paid advertising in the budget.
4. The list price and net share above hold at launch.
5. The owner's time stays at 10–20 h a week (D-108); a lasting change re-plans at the next gate.

### 14f. Wishlists and testers (Accepted 2026-10-26, D-113)

**Under review (2026-10-27, D-150):** wishlists and Steam playtest recruiting have no phone version yet. Test builds go through the stores' test tracks (D-158).

- **Wishlist targets** (estimates, to check against current store data when the page goes up at M2): about 1,000 at the slice gate, about 5,000 after the demo's first festival, 10,000 or more at launch. Missing a target by half goes to the owner at that gate.
- **Audience:** a short devlog about once a month from M2 (map art, letters, a death in the Chronicle), linked from the Steam page.
- **Testers:** alpha and beta testers come from a sign-up on the Steam page (Steam's own playtest feature) and the devlog. A community space (such as a Discord server) is the owner's call at M2 (SAFE-01).

---

## 15. Quality, CI and release process (Accepted 2026-10-26)

**Amended (2026-10-27, D-158):** for the phone launch, the stores' test tracks, staged rollouts, fix-forward releases and phone screen tests (375 and 430 points) replace the Steam and 1366×768 items below.

Decisions: D-105, D-106, D-114. Inputs: tools review (D-092..D-094, `docs/design/TOOLS-REVIEW.md` §3), architecture and saves (D-091), milestones (D-099), playtest logs (D-088), team (D-102), shared rules CI-01..CI-06, VER-01..VER-07, GAME-01..GAME-06. Tool names for the checks follow the engine test (D-090); the shape below holds for either engine.

### 15a. Checks (Accepted 2026-10-26, D-105)

Every check runs locally before a push (VER-02); CI repeats the fast ones.

| Check | What it proves | When |
|---|---|---|
| Format, lint, strict types | Code is consistent and type-safe | Every push |
| Engine unit tests | Each rule does what PLAN and DECISIONS say | Every push |
| Determinism test | Same seed and commands give the same events (GAME-06) | Every push |
| Content validator | Every data file matches its schema; ids and references resolve (D-091) | Every push |
| Invariant checks | Money adds up, no negative health, every event has a cause (D-114) | Every balance run |
| Save fixtures | A saved game from every released version (and every alpha and beta build) loads and upgrades (GAME-05) | Every push from M2 |
| Screen tests | Key screens render at 1366×768 and 1920×1080, 15 px ledgers, no clipped text at 150% size (D-077, D-084) | Every push touching ui |
| Docs and drift checks | Decision ids exist; no draft markers; master rules in sync (D-092) | Every push |
| Balance run | 1,000 seeded guild-years against the §4 and §9a targets (under ~17 min, §11g) | Before each gate and release, and on demand; not per push |
| Performance | §11g targets on the minimum machine | Before each gate and release |
| Review | Adversarial review of the whole diff before a PR and before ready (D-093); `code-review` and `security-review` skills on code PRs (D-094) | Every PR |

### 15b. CI (Accepted 2026-10-26, D-105)

- **Pull requests and `main`:** the "every push" checks above, with path filters so docs-only changes stay free (CI-01, CI-04). One job, time limit, least privilege, per-branch concurrency (CI-06). Added through the `efficient-github-actions` skill with the chosen stack's `stacks/` layer.
- **Release tags only:** build the game for each launch platform (§15e) and upload it to a Steam branch. Builds never run on ordinary pushes.
- **Manual:** the balance run and performance run, triggered before gates and releases (CI-04).
- **Steam credentials** live as repository secrets used only by the release job, set up by the owner (SAFE-01, SAFE-02).

### 15c. Bugs and crashes (Accepted 2026-10-26, D-105)

- **Where:** GitHub issues, one per bug, with the build version, the save and the playtest log (D-088) attached.
- **Crash log and replay:** the game writes a local crash report next to the playtest log; nothing is sent automatically (D-088). Testers attach it with their save, which carries the commands since the last daily snapshot, so the bug replays exactly (D-114).
- **Severity:**
  1. **Blocker:** loses or corrupts a save, or crashes on a common path. Stops a release; fixed before anything else.
  2. **Major:** a wrong rule result, a stuck screen, or a broken Trace (D-082). Fixed before the next gate.
  3. **Minor:** text, layout, balance numbers. Batched.
- Every fixed blocker or major bug gets a test that would have caught it (VER-07), and a LESSONS line if a process let it through (SRC-05).

### 15d. Versions and builds (Accepted 2026-10-26, D-105, D-106)

**Amended (2026-10-27, D-151, D-158):** launch is on iPhone and Android phones, and Windows follows. D-158 replaces the Steam branches, Cloud, achievements and rollback below for the phone launch, and adapts checklist items 4 and 5.

- **Launch platform: Windows** (owner's choice, Plan Q15a). Linux and Steam Deck players can run the Windows build through Proton, but it is not promised on the store page. Steam Deck support (a 1280×800 layout below the 1366×768 minimum, D-091, and controller play) and a Mac build are decided after launch.
- **Version:** `major.minor.patch` for the game, plus the save-format and content versions stored in every save (D-091).
- **Steam branches:** `playtest` for slice and alpha testers (M2, M3), `beta` for M5 and later opt-in previews, `default` for the release. The free demo (D-040) is a separate Steam app, as Steam sets up demos (to recheck at sign-up).
- **Rollback:** Steam keeps earlier builds; a bad release is rolled back by setting the previous build live, and saves made by the bad build must still load in the next fixed one.

### 15e. Release checklist (Accepted 2026-10-26, D-105)

Used at M4 (demo), M6 (launch, D-099) and for every patch:

1. All "every push" checks green on the release commit; balance and performance runs within targets.
2. No open blocker; majors reviewed by the owner.
3. Save fixtures from every earlier public build load.
4. Fresh install and upgrade install tested on the minimum machine for each launch platform.
5. Achievements and Steam Cloud work on the release branch (D-088, D-091).
6. Asset licence ledger complete (`assets/LICENSES.md`, §12e, SAFE-05); store page's AI-content disclosure answered if any generated content shipped (D-094).
7. Patch notes written in plain words; the version in the game matches the tag.
8. Owner signs off (SAFE-01); the build is set live.

### 15f. After release (Accepted 2026-10-26, D-105)

- **Hotfix:** a blocker found after release gets a patch release as soon as it is fixed and checked; nothing else rides on it.
- **Updates:** the free updates (D-101) go to the `beta` branch first, then `default`.
- **Old saves:** every update keeps every older save loading (GAME-05); save fixtures are never deleted.
