# Style

Phase 2 style guide: theme, tone and visual identity. Each section records what the owner decided. Status: in progress.

## 1. Visual metaphor (Accepted 2026-10-26)

**Guildmaster's war table.** The screen is the guildmaster's desk: rosters in ledgers, contracts under wax seals, letters and criers' notices as the inbox (D-043), and quests played out on a painted regional map with miniatures (D-004).

**Readability rule:** the in-world look carries the frame and the set-piece moments (map, inbox, quest board, contract signing). Dense data screens (rosters, finances, scouting) sit on a clean, legible layer: plain paper tone, crisp type, no texture behind numbers. This keeps the FM-style density (D-016) readable.

Rejected: modern FM interface with a fantasy skin (weak identity), illuminated manuscript as the main look (too busy for dense screens), painterly storybook (costly art and too gentle for permadeath).

## 2. Palette mood (Accepted 2026-10-26)

**Candlelit oak.** A lamp-lit study at night: walnut desk (#3b2a1e), vellum paper (#efe4cc), iron-gall ink (#2a2017), oxblood wax (#8e2a22), brass accents (#b8923e). Swatch board: `docs/design/mockups/palette-moods.html`. Hex values are a starting point; final tokens are set during UI work.

Known risk: warm parchment is the common fantasy look, so typography and map art must carry the identity.

**Accepted (2026-10-26, D-048):** status colours (good, warning, bad) are a fixed colour-blind-safe set kept apart from the mood, and factions get their own heraldic set. The mood governs desk, paper, ink and accents only.

Rejected: frontier slate, heraldic baize, ash and bone.

## 3. Screen layout (Accepted 2026-10-26)

**Desk home with ledger tabs.** Mock-up: `docs/design/mockups/ui-layouts.html` (option C).

- **Top bar, fixed on every screen:** guild crest, date, why the calendar stopped, Continue. It never moves, so the continue-stop-respond loop stays in one place.
- **Left:** ledger tabs grouped as Desk, Roster, Parties, Contracts / Guild (Staff, Guildhall, Finances, Armoury) / World (Ranking, Chronicle). Every screen is one click away.
- **Home (Desk):** the regional map fills the centre, with own parties, rivals and rumours as miniatures; a strip below shows this week's parties, the infirmary and bills due.
- **Right:** the letter tray (inbox, D-043) is open on the home screen. It folds away for dense ledgers, and becomes a tab on windows below about 1366 px wide.
- **Opening a ledger** turns the centre into a full paper sheet (the clean data layer from §1).

Known cost: the home screen relies on good map art.

Rejected: ledger tabs with Letters as home (the region gets sidelined), desk-as-menu (an extra step on every trip; doesn't scale to twelve ledgers).

## 4. Quest board (Accepted 2026-10-26)

**Cartographer's map with standees.** Mock-up: `docs/design/mockups/quest-board.html` (option B).

- The dungeon or site map draws itself in ink as the party explores, with the scout's margin notes; unexplored space stays blank vellum. The finished map can go into the Chronicle (D-042).
- Adventurers and monsters are flat portrait standees on bases; a fallen member tips over. Positions are loose, not a grid: the board shows the simulation and isn't a tactics game (D-004).
- Key moments arrive as a wax seal on the map and stop the calendar.
- **More fantasy flair** than the mock-up (owner's note). To define when art direction starts; candidates: illuminated initials and cartouches, painted monster vignettes in the margins, glowing or gilded ink for magic and wards.
- **Later (owner's note):** standee animations and effects: moves, attacks, reactions, spell effects. Not at launch. Like every board movement, they play simulation events and never decide anything (GAME-02).

Owner's note: "B but with a bit more fantasy flare to be added to the art styling. I will also eventually want like effects of moves and reactions of the standees and animations of them doing various things but for now it works great."

Rejected: painted tiles (costly per biome, implies tactics), isometric diorama (most expensive, near the ruled-out 3D), encounter card spread (no sense of place).
