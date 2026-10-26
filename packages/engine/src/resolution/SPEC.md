# Resolution v0

How a party, its plan, stats, gear and the site become odds and events (PLAN §9b step 0b, D-113). Decisions: D-118..D-124. Every number below is a starting value in content data (`packages/content/src/base/resolution.ts`), to be tuned by R1 and R2; none is in engine code.

## Inputs

- **Party:** 3–6 adventurers, each with the eight working attributes (Might, Agility, Toughness, Stealth, Wits, Presence, Resolve, Lore; 1–20, D-122), a class, a front or back position, a weapon bonus and an armour bonus. v0 classes: warrior, rogue, cleric (default; a healer makes Dying matter).
- **Plan (D-121):** approach (stealth, assault, diplomacy), risk (cautious, steady, bold), retreat threshold (first Badly hurt, first Down, first Dying, never).
- **Quest:** a template with 3–7 scenes, then one main fight; the site's tags (e.g. `guarded`, `dark`, `open`) shift scene difficulty per approach (negative is easier: a guarded fort favours stealth, guarded = stealth −2, assault +2); foe groups for the main fight.

## Checks (D-119)

- chance = base 50% + 5% × (attribute − difficulty) + gear + plan + site, clamped 5–95%. The chance is a `Value` with every part named.
- Roll 1–10,000 from the `quest.resolution` stream; success if the roll ≤ chance.
- A failure is **bad** if the roll lands in the top share of the failure band: cautious 15%, steady 30%, bold 50%. Risk also adds to every party chance (not to foes' attacks): cautious −5%, steady 0, bold +5%.

## Scenes

- The approach picks the tested attribute (stealth → Stealth, assault → Might, diplomacy → Presence; travel and traps use Agility or Wits whatever the approach). The scene says how many members test: the best one, the best two, or everyone.
- Testers are standing members ranked by the attribute. A failed tester takes a wound step (two on a bad failure), or, in an alarm scene, raises the alarm once (+2 to every foe's attack and defence in the main fight); a bad failure there also costs the tester one step.

## Main fight (D-118, D-123)

- Up to 6 exchanges. In each, every standing adventurer attacks the first standing foe group (class attribute + weapon vs the group's defence), then every standing group attacks one standing adventurer (group attack vs Agility, minus armour; front-line members are picked 2:1 over back-line). Down and Dying members are not attacked.
- A hit moves the target one wound step; a hit with a roll in the lowest quarter of the chance moves it two.
- The fight ends when all groups are Down (won), the party retreats, every member is Down or worse (rout), or the exchanges run out (the foes withdraw; the contract is half done).

## Wounds, death and injury (D-120)

- Steps: Fit, Hurt, Badly hurt, Down, Dying; foe groups stop at Down. A Down member does nothing. At the end of each scene or exchange, each standing cleric tends one fallen member, Dying first (Lore check, difficulty 10): a tended Dying member returns to Down (with a `wound.changed` event), a tended Down member is held steady. Each untended Down member then **bleeds**: 20% − 2% per Toughness point above 10 to slip to Dying (D-124). Then each member who was Dying before the bleed rolls makes a **death roll**: 25% − 1% per Toughness and Resolve point above 10. A step past Dying forces a death roll at once.
- **Rout:** when no member is standing, the quest ends; the party limps home and the contract fails.
- At the quest's end each member at Badly hurt or worse rolls for a lasting injury: Badly hurt 15%, Down 40%, Dying 70%.
- Step sizes (failure 1, bad failure 2, alarm bad failure 1, hit 1, strong hit 2, failed retreat 1) are content data too.
- Lasting injuries are events only in v0; nothing is stored on the adventurer yet.
- Target: these numbers start where the headless simulator should give PLAN §4c's deaths per danger rating and about 5 injuries per death; R2 tunes them.

## Retreat and key moments (D-032, D-121)

- After each scene and exchange the engine counts members at or past the retreat threshold (the dead count). When the count rises, a **major moment** is raised for a watched party (push on or pull out); an unwatched leader pulls out. After a push on, the moment comes back only if the count rises again.
- Retreat is one check by the standing member with the best Wits (difficulty by danger rating: 6, 9, 12, 15); failure gives one random living member a wound step. The retreat carries the Dying home with no further death rolls. It abandons the contract (its price per PLAN §4g).

## Commands and events

- Commands: `quest.start` (party, plan, quest, day), `quest.step` (one scene or one exchange), `quest.choose` (answer to a raised moment). All go through `simulate(state, command)`.
- Events: `quest.started`, `scene.started`, `exchange.started`, `check.rolled` (purpose, chance `Value`, roll, outcome; purposes: scene, attack, defence, stabilise, bleed, death, injury, retreat), `wound.changed`, `foe.wounded`, `alarm.raised`, `adventurer.stabilised`, `adventurer.died`, `moment.raised`, `moment.resolved`, `quest.retreated`, `injury.gained`, `quest.ended` (won, partial, retreated, routed). Each has a cause id: the command or the event that led to it.
- Balance sweep: `node tools/resolution-sweep.ts [quests]` reports deaths and injuries against PLAN §4c and runs the invariants on every quest.
- Tests: one rule test per rule above, the determinism test (same seed and commands, same events), and invariants (no step beyond Dying, every event has a cause).

## Not in v0

Morale (D-121), traits and chemistry, consumables, magic power (D-028), individual enemy tokens (D-123, later), minor-moment choices beyond retreat, rewards and fees.
