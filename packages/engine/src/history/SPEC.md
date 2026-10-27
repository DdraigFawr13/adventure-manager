# Histories v0: deeds, bonds and memorials

People's histories for the step 4 prototype (R7, PLAN §9a; D-196, D-199). Like the quest report, this is a view: it reads events and never changes the game state, so it has no stream and no rule effect. Words live in content (`packages/content/data/people.en.json`); this module only decides which families to render and with what facts and slots.

## The chronicle (`recordEvents`)

A chronicle is folded from every command's events, in order, with the state after the command (for the roster, standing parties and templates). The page keeps it in its save beside the state, so a person card never needs the whole event log. The same events always give the same chronicle.

- **Entries:** each person has dated entries, oldest first: `joined` (`recruit.signed`; at the founding, with the standing party they joined), `quest` (one per member at `quest.ended`: the site, outcome, standing party, their worst wound step, their deed and who saved them), `injured` (`member.laid-up`: days out), `attribute` (`attribute.changed`: from, to, reason), `friend` (below), `fell-ill`, `died` (the site, how they fell and the foe, and the quest's writer, who leads the reaction) and `retired`.
- **Deeds** come from the quest report's summary (report/SPEC.md) with the content's deed ranking: the same pass that picks the letter's deeds (the writer left out), then the writer's own best remaining deed, so every line in the letter is also in a history. Each living member gets at most one deed per quest.
- **Records:** quests, wins and injuries per person.
- **Bonds (D-196, D-199):** every quest counts once for each pair of members who set out together. When a pair reaches the content's `friendAfterQuests` (5) and both came back alive, they become friends: a `friend` entry for each. Friends have no rule effect until party chemistry is designed (D-014).
- **Places:** each site's last outcome and day, for the March's list.

## Lines (`writeHistoryLine`, `writeBackground`)

- A history line renders the family `history.<kind>`; a deed renders `history.deed.<deed kind>` first and goes in as the `deed` slot. Facts: `outcome.*`, `deed` or `no-deed`, `died` (the quest they died on) or else `badly-hurt` (worst step at Badly hurt or worse), `saved`, `reason.*` for attributes, the fall's cause for a death; slots `who`, `site`, `party`, `deed`, `saver`, `friend`, `count`, `days`, `attribute`, `from`, `to`, `killer`, `age`.
- The background line renders `background.<trade id>` with the `home` slot (guild/SPEC.md, Backgrounds).
- Picks are keyed by the save's seed, the person and the entry's day and index, so a replay reads the same.

## The memorial letter (`summariseLife`, `writeMemorial`)

The guild's chaplain writes when someone dies (D-199; PLAN §8b rule 6: deaths are never quiet). Written sincerely (D-059) from the dead person's chronicle:

- **Summary:** where they came from (background), quests served, their best deeds (up to 2, by the content's deed order, the latest first within a kind), how they fell (site, cause, foe), their living friends (up to 2, most quests together first) and the leader: the quest's writer, unless dead, the same person or already a friend.
- **Sections** are content, as in the quest report: fixed families, and lists `deeds` (`memorial.deed.<kind>` with slot `site`) and `friends` (slot `friend`, with `count`). Facts: `cause.*`, `background` or `no-background`, `first-quest`, `veteran` (10+ quests), `deeds`/`no-deeds`, `friends`/`no-friends`, `leader`/`no-leader`.
- The chaplain's name is picked from content's list by the save's seed, so one guild keeps one chaplain.
- A golden test fixes one letter's text for a fixed seed.
