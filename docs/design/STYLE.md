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

## 5. Typography (Accepted 2026-10-26)

**Old press.** Real 17th-century printing types, with flair in every font rather than titles only (owner's direction). Specimen: `docs/design/mockups/typography-sets.html` (set 3). Earlier rounds: `typography.html`, `typography-flair.html`.

- **Titles, seals, set pieces:** IM Fell English SC.
- **Letters, notices, Chronicle text:** IM Fell DW Pica.
- **Ledgers, numbers, buttons:** Sorts Mill Goudy. Measured: its digits are equal-width, so columns line up.
- **Decorated initial:** the first letter of every in-world letter and notice is a large oxblood initial (owner: "I like the large T start of a paragraph thing").
- **Ornaments:** brass fleurons between sections of letters and notices.
- All faces are SIL Open Font License (SAFE-05); record sources when the files are added.

Known risk: the old-press roughness blurs at small screen sizes, and the ledger is the least crisp of the sets tried. To check during UI work, with a rendered ledger: a minimum ledger size (likely 15 px), and a fallback to a crisper ledger face if dense screens fail readability. The owner decides any fallback.

**Fallback plan (accepted 2026-10-26, D-052):** if the ledger fails the readability check, first make a renamed OFL derivative of Sorts Mill Goudy (a "guild ledger" cut: taller x-height, looser spacing, crisper at small sizes, plus game symbols such as currency, ticks and stat markers) before switching faces. Check each font's licence for Reserved Font Names before renaming. Custom decorated initials (illuminated A–Z artwork) and a custom symbol font (crests, faction marks, class and status icons) belong to art and icon work. A commissioned display face for the logo and set pieces is a later, paid option for the owner to decide.

Owner's direction during the question: start from the Alegreya family, then "it could look a little more whimsical or medieval or fantasy" and "I want all the fonts to have some level of this not just the titles."

Rejected: Alegreya family (too plain), Grenze family, scribe's hand, Texturina throughout, Uncial with Grenze.

## 6. Iconography (Accepted 2026-10-26)

**Woodcut blocks.** Mock-up: `docs/design/mockups/iconography.html` (option A; shapes are stand-ins, an artist draws the real set).

- Black ink, cut like a printer's woodblock, matching the old-press type (§5) and the inked quest map (§4).
- Two drawn levels per icon: a detailed, hatched version for cards and set pieces (48 px and up), and a clean silhouette for ledgers and buttons (16–24 px).
- One ink colour; meaning-bearing colour stays with the status and faction sets (D-048). A status icon always sits beside a word or a status colour, never alone.
- The small level can ship as the custom symbol font (D-052) so icons sit inline with text.

**Accepted (2026-10-26, D-057):** a hand-tinted watercolour wash on large card icons only, as on historical woodcuts, for colour and flair; wax seals reserved for factions, contracts and set pieces.

Rejected: wax seals for every icon (blur at 16 px, clash with the "bad" colour), painted miniatures (cost, mushy when small), clean line glyphs (no period character).

## 7. Portraits (Accepted 2026-10-26)

**Woodcut portraits to start, painted portraits later.** Mock-up: `docs/design/mockups/portraits.html` (option A now, option C later).

- An engraved likeness in a cameo frame, assembled from drawn parts (head, hair, brows, eyes, nose, mouth, beard, ancestry ears, scars, age lines, kit at the collar). The adventurer's seed picks the parts (GAME-01); events add layers: a scar after an injury, greying and lines with age.
- A fallen adventurer's portrait gets a black mourning corner and goes to the Hall of Heroes (D-042).
- Parts are data, so mods can add them (D-044).
- **Painted later (owner's note).** Store each face as art-independent data (part ids, age, scars, colours), not as a picture, so a painted part set can later redraw the same people and existing saves keep their faces. Painted layers cost several times more than ink per part, and colour faces on the ink desk will need an art-direction pass when they arrive.

Owner's note: "Woodcut works to start but I do want painted portraits eventually."

Rejected: scout's sketchbook (scribbles at roster size), silhouette cameos (no faces breaks pillar 1).

## 8. Audio mood (Accepted 2026-10-26)

**Period chamber music, desk sounds, and a bard now and then.**

- **Music (updated 2026-10-26, D-056):** soft ambient music plays generally, built from a small early-music ensemble (lute, viol, recorder, hurdy-gurdy, frame drum); quiet enough to survive hundreds of hours.
- **Bardic songs, after launch (owner's note):** now and then the ambient music gives way to a bard's song, heard as if from the guildhall below. Not needed at launch.
- **Desk ambience carries the game:** quill, pages, seal cracks, candle, rain on the shutters; a guildhall murmur that grows with facilities and changes with the seasons.
- **Big moments:** a low drum when the calendar stops for a key moment; for a death, the room goes quiet and a single bell tolls.
- **Quest board:** ambience per biome.
- References: *Pentiment*, *Kingdom Come: Deliverance*.

Owner's note: "A bit with like a bard playing occasionally."

**Accepted for after launch (D-056):** the bard is tied to the world: the bard plays more often with a tavern (D-011 guildhall upgrades) or a Cantor on the roster; after great deeds or deaths the bard plays a piece titled for them ("The Ballad of the Hollow Barrow"), named in the news and Chronicle.

Open: whether bardic songs are sung or instrumental. If sung, lyrics are authored and never name generated people; the title carries the name.

Owner's note (2026-10-26): "I think there should be soft ambiance music generally but occasionally interrupted with bardic songs. Doesn't need to be at launch."

Rejected: epic orchestral (fatigue, fights the quiet desk), ambience only (no identity), dark folk (too grim for the whimsy asked for).

## 9. Naming and voice

### 9a. Naming flavour (Accepted 2026-10-26)

**Mixed cultures on an English-fenland core.**

- Humans of the March use an English-fenland base: Ashford, Fenn March, Varrowmere, Hollow Barrow; Wenna Cray, Odric Hale.
- Each ancestry and major faction has its own naming rules (sounds, structures, epithets), so a name tells the player where someone is from.
- Naming rules are data (D-044); mods can add cultures.
- Names must be pronounceable and distinct at a glance in a 30-row roster.
- Guardrails: no Pathfinder names (D-002); no culture copies a single real-world nation, and ancestries are never mapped onto real ethnic stereotypes.

Rejected: one English flavour for all (the region feels like one county), Celtic and British throughout (ties the setting to one real culture), invented language (hard to remember at roster scale).
