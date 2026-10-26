# Quest report v0

The letter a party sends home after a quest (PLAN §9a R8, §8a; STYLE §9b). It is a view of the quest's events: nothing here changes state, and the same events always give the same letter (GAME-03). Words live in content (`packages/content/data/reports.en.json`); this module only decides which families to render and what facts and slots they get.

## Summary (`summariseQuest`)

From one quest's events (`quest.started` to `quest.ended`), the roster and the quest templates:

- the outcome, the party, and the **writer**: the survivor with the best Wits (ties by id); nobody if all died;
- the contract's foe groups (from its template), how many were beaten, how many exchanges, whether the alarm went up or the party retreated;
- each member's foe hits (traced back through the cause chain to their attack or cleave), signature actions used, and worst wound step;
- lives held back from Dying (a cleric's tending on a Dying member who lived), deaths with the foe whose blow began the fall (traced back to the defence or overreach check; none if they bled out after a scene), and lasting injuries.

## The letter (`writeQuestReport`)

Content lists the **sections** in order: a family to render once, or a list (deeds, deaths, injuries) whose items each render a family. A section with no allowed variant is left out, which is how conditional lines work. Salutations and sign-offs are marked `formula` (letter conventions, not counted by the repetition test).

- **Facts** for every line: `outcome.*`; `no-deaths`, `one-death` or `deaths`; `injuries` or `no-injuries`; `unhurt` (nobody past Hurt and nobody dead) or `hurt`; `writer` or `no-writer`; `fight` or `no-fight`; `long-fight` (4+ exchanges), `short-fight` (1–2); `alarm`; `retreated`; `many-foes`.
- A composed contract (D-139) adds its twist's id as a fact (`twist.trap`), so a section can say what the twist did; bad information is first revealed here.
- **Slots**: `quest` (the site's name for a composed contract), `foe` (the contract's last foe group), `party`, `dead` (counts), `writer` (a person).
- **Deeds**: content ranks deed kinds (a life saved, guards, most hits, mends, cleaves, scouting, strikes from shadow, wards) with the least count that earns a line; each member gets at most one deed, the dead and the writer get none (the writer does not praise themself), and the section's `max` caps the list. Item slots `who`, `count` (or `patient` for a save); facts `once` or `many`.
- **Deaths**: one line each, slots `who` and `killer`, fact `struck` or `bled`.
- **Injuries**: one line each, slot `who`, facts `after-loss` when someone died and `self` when the writer is hurt (written as "I").
- Lines in one list do not open with the same three words: an item that would is re-picked (up to 4 tries). Each line's first letter is capitalised. Picks are keyed by the save's seed, quest id, section and item, so a replay reads the same and two saves read differently.

## Text grammar (`core/text.ts`, D-114)

`{slot}`; `{who.they}` and the other pronoun forms (`them`, `their`, `theirs`, `themself`; a capital first letter capitalises the word); `{who~holds|hold}` agreement by the person's pronoun set or by a number (1 is singular); `{@family}` a nested pick; variants with `if` and `unless` fact lists. Pronoun forms are content. Masking (`mask`) writes `‹slot›` for names and numbers so the R8 test counts sentence shapes.

## People's names

Drawn people get a given and family name and a pronoun set on their own stream (`guild.names`), from `packages/content/data/naming.json` (STYLE §9a); the sample party keeps its names in text data. Pronoun weights are an assumption (she 45, he 45, they 10).
