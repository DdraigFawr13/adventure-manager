# Quest report v0

The letter a party sends home after a quest (PLAN §9a R8, §8a; STYLE §9b). It is a view of the quest's events: nothing here changes state, and the same events always give the same letter (GAME-03). Words live in content (`packages/content/data/reports.en.json`); this module only decides which families to render and what facts and slots they get.

## Summary (`summariseQuest`)

From one quest's events (`quest.started` to `quest.ended`), the roster and the quest templates:

- the outcome, the party, and the **writer**: the survivor with the best Wits (ties by id); nobody if all died;
- the contract's foe groups (from its template), how many were beaten, how many exchanges, whether the alarm went up or the party retreated;
- each member's blows that landed (traced back through the cause chain to their attack or cleave; a cleave's second blow counts), signature actions used, and worst wound step;
- lives held back from Dying (a cleric's tending on a Dying member who lived), deaths with the foe whose blow knocked them down (none if a scene did), and lasting injuries.

## The letter (`writeQuestReport`)

Content lists the **sections** in order: a family to render once, or a list (deeds, deaths, injuries) whose items each render a family. A section with no allowed variant is left out, which is how conditional lines work. Salutations and sign-offs are marked `formula` (letter conventions, not counted by the repetition test).

- **Facts** for every line: `outcome.*`; `no-deaths`, `one-death` or `deaths`; `injuries` or `no-injuries`; `unhurt` (nobody past Hurt and nobody dead) or `hurt`; `writer` or `no-writer`; `fight` or `no-fight`; `long-fight` (4+ exchanges), `short-fight` (1–2); `alarm`; `retreated`; `many-foes`.
- A composed contract (D-139) adds its twist's id as a fact (`twist.trap`), so a section can say what the twist did; bad information is first revealed here.
- **Slots**: `quest` (the site's name for a composed contract), `foe` (the contract's last foe group), `party`, `dead` (counts), `writer` (a person).
- **Deeds**: content ranks deed kinds (a life saved, guards, most hits, mends, cleaves, scouting, strikes from shadow, wards) with the least count that earns a line; each member gets at most one deed, the dead and the writer get none (the writer does not praise themself), and the section's `max` caps the list. Item slots `who`, `count` (or `patient` for a save); facts `once` or `many`.
- **Deaths**: one line each, slots `who` and `killer`, fact `struck` (a foe knocked them down in the fight; `killer` names it), `retreat` (a foe struck them down on the way out) or `scene` (a fall or trap on the way in). A death is traced back to the blow that last knocked the member down, not to the beat's death roll.
- **Injuries**: one line each, slot `who`, facts `after-loss` when someone died and `self` when the writer is hurt (written as "I").
- Lines in one list do not open with the same three words: an item that would is re-picked (up to 4 tries). Each line's first letter is capitalised. Picks are keyed by the save's seed, quest id, section and item, so a replay reads the same and two saves read differently.

## Text grammar (`core/text.ts`, D-114)

`{slot}`; `{who.they}` and the other pronoun forms (`them`, `their`, `theirs`, `themself`; a capital first letter capitalises the word); `{who~holds|hold}` agreement by the person's pronoun set or by a number (1 is singular); `{@family}` a nested pick; variants with `if` and `unless` fact lists. Pronoun forms are content. Masking (`mask`) writes `‹slot›` for names and numbers so the R8 test counts sentence shapes.

## People's names

Drawn people get a given and family name and a pronoun set on their own stream (`guild.names`), from `packages/content/data/naming.json` (STYLE §9a); the sample party keeps its names in text data. Pronoun weights are an assumption (she 45, he 45, they 10).

## Histories (`historyOf`, R7, PLAN §8)

Each person's dated record, read from the events in one pass; like the letter, a view that changes nothing. Entries:

- `joined` (`recruit.signed`, the founding roster included);
- `quest`, one per contract they went on, when the party reaches the site: contract id, outcome, the party, their landed blows, signature actions, whom they held back from Dying and who held them back, their worst wound step (from the quest's summary);
- `injured` (`member.laid-up`: the days out), `changed` (`attribute.changed`: growth, age or injury, with the attribute and new value);
- `retired` (`adventurer.retired`, with age) or `died` (on the quest: what knocked them down, as in the letter's deaths).

`writeHistory` renders each entry as one short dated line from content (`packages/content/data/histories.en.json`), the clerk's plain voice. Facts: `outcome.*`; `struck`, `scene` or `retreat` for a death; `growth`, `age` or `injury` for a change; `saved` (they held someone back), `was-saved`, `hits` (3+ blows). Slots: `who`, `quest`, `foe`, `days`, `attribute`, `to`, `count`, `patient`, `saver`, `age`.

## Memorial letters (`writeMemorial`, R7, PLAN §8 rule 6, D-059)

When someone dies, a letter to the guildmaster about them, written sincerely, from their history.

- **Writer:** the comrade who shared the most contracts with them and was alive and on the roster after their death (ties: the most recent shared contract, then id); else the guild clerk (a content name).
- **Facts:** `quests.one` (1), `quests.few` (2–5), `quests.many` (6+); `served.short` (under a year since joining) or `served.long`; their best deed across all contracts, in the content's order: `deed.saved`, `deed.guard`, `deed.striker` (most blows in one contract, 4+), `deed.mend`, or `deed.none`; how they died: `struck`, `retreat` or `scene`; `writer` or `clerk`; `together` when the writer was on the fatal contract; `young` (under 25) or `veteran` (35+); their class as `class.<id>`; `first-is-last` when their first contract was their last; `saved-writer` when the life they saved was the writer's; `close` when the writer shared at least half their contracts.
- **Slots:** `dead` (the person), `writer`, `first` (their first contract's site), `quest` (the fatal one), `killer`, `count` (contracts), `years` (whole years served), `patient` (someone they saved, the first), `deedQuest` (where the remembered deed happened), `age`.
- **Sections** come from content like the quest letter's; a section with no allowed variant is left out. Picks are keyed by the save's seed and the dead person's id. Across one save, a section re-picks (up to 12 times) to avoid a sentence shape an earlier letter used: the caller writes the save's letters in death order with one shared set, so a replay reads the same.
