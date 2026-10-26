# Resolution v0

How a party, its plan, stats, gear and the site become odds and events (PLAN §9b step 0b, D-113). Decisions: D-118..D-126, D-129..D-131. Every number below is a starting value in content data (`packages/content/src/base/resolution.ts`), to be tuned by R1 and R2; none is in engine code.

## Inputs

- **Party:** 3–6 adventurers, each with the eight working attributes (Might, Agility, Toughness, Stealth, Wits, Presence, Resolve, Lore; 1–20, D-122), a class, a front or back position, a weapon bonus and an armour bonus. v0 classes: warrior, rogue, cleric (default; a healer makes Dying matter).
- **Plan (D-121):** approach (stealth, assault, diplomacy), risk (cautious, steady, bold), retreat threshold (first Badly hurt, first Down, the leader's call (default), first Dying, never).
- **Quest:** a template with 3–7 scenes, then one main fight; the site's tags (e.g. `guarded`, `dark`, `open`) shift scene difficulty per approach (negative is easier: a guarded fort favours stealth, guarded = stealth −2, assault +2); foe groups for the main fight.

## Checks (D-119)

- chance = base 50% + 5% × (attribute − difficulty) + gear + plan + site, clamped 5–95%. The chance is a `Value` with every part named.
- Roll 1–10,000 from the `quest.resolution` stream; success if the roll ≤ chance.
- A failure is **bad** if the roll lands in the top share of the failure band: cautious 15%, steady 30%, bold 50%. Risk also adds to the chance: cautious −5%, steady 0, bold +5%. Both apply only to the checks that press on, scene tests and attacks (content list, D-131); tending, mending, the leader's read and the retreat check are untouched, so a cautious plan never makes the healer or the way out worse.

## Scenes

- The approach picks the tested attribute (stealth → Stealth, assault → Might, diplomacy → Presence; travel and traps use Agility or Wits whatever the approach). The scene says how many members test: the best one, the best two, or everyone.
- Testers are standing members ranked by the attribute. A failed tester takes a wound step (two on a bad failure), or, in an alarm scene, raises the alarm once (+2 to every foe's attack and defence in the main fight); a bad failure there also costs the tester one step.

## Main fight (D-118, D-123)

- Up to 6 exchanges. In each, everyone standing acts once, fastest first (Agility against each foe group's speed; ties by id, D-129). An adventurer attacks the first standing foe group (class attribute + weapon vs the group's defence); a foe group attacks one standing adventurer (group attack vs Agility, minus armour; front-line members are picked 2:1 over back-line). Down and Dying members are not attacked. Each foe group has its own number of hits to beat (content data), and is down when it has taken them.
- A hit moves the target one wound step; a hit with a roll in the lowest 30% of the chance moves it two.
- **Overreach** (D-131): an attack that fails badly leaves the attacker open; the foe group they swung at strikes them at once, and no guard can step in. This is what bold costs in a fight.
- The fight ends when all groups are Down (won), the party retreats, every member is Down or worse (rout), or the exchanges run out (the foes withdraw; the contract is half done).

## Class actions (D-130)

Each class lists its signature actions in content; each kind is one rule, used on its own when it fits, and logged as `action.used`:

- **Guard** (warrior): when a foe aims at a comrade, a standing guard may step in (flat chance) and take the blow instead.
- **Cleave** (warrior): a strong hit also deals one hit to the next standing foe group.
- **Scout** (rogue): a standing scout adds a bonus to every tester in an approach scene.
- **Strike from shadow** (rogue): a bonus when attacking a foe group someone already attacked this exchange.
- **Mend** (cleric): at the end of a beat, a mender who did not tend the fallen tries to bring the most hurt standing member up one step.
- **Ward** (cleric): while a warder stands, every foe attack in the exchange is less likely.

Roles set in the plan and more actions (abilities by level, D-074) are later additions as data.

## Wounds, death and injury (D-120)

- Steps: Fit, Hurt, Badly hurt, Down, Dying; foe groups stop at Down. A Down member does nothing. At the end of each scene or exchange, each standing cleric tends one fallen member, Dying first (Lore check, difficulty 10): a tended Dying member returns to Down (with a `wound.changed` event), a tended Down member is held steady. Each untended Down member then **bleeds**: 30% − 2% per Toughness point above 10 to slip to Dying (D-124). Then each member who was Dying before the bleed rolls makes a **death roll**: 35% − 1.5% per Toughness and Resolve point above 10. A step past Dying forces a death roll at once.
- **Rout:** when no member is standing, the quest ends; the party limps home and the contract fails.
- At the quest's end each member at Badly hurt or worse rolls for a lasting injury: Badly hurt 7.5%, Down 22.5%, Dying 41%.
- Step sizes (failure 1, bad failure 2, alarm bad failure 1, hit 1, strong hit 2, failed retreat 1) are content data too.
- Lasting injuries are events only in v0; nothing is stored on the adventurer yet.
- Target: these numbers start where the headless simulator should give PLAN §4c's deaths per danger rating and about 5 injuries per death; R2 tunes them.

## Retreat and key moments (D-032, D-121, D-125, D-126)

- After each scene and exchange the engine counts members at or past the retreat line (the dead count). When the count rises, a **major moment** is raised for a watched party (push on or pull out); an unwatched leader pulls out. After a push on, the moment comes back only if the count rises again.
- **The leader's call** (default, D-125): the line is first Dying, but each time another member falls (Down or worse) the leader (best Wits) reads the fight. Winning means a larger share of foe groups down than of the party fallen. The read is a Wits check, difficulty 12 minus 1 per 25-point gap between those shares; success makes the right call (hold if winning, pull out if losing), failure the wrong one. A pull-out call raises the moment or the retreat as above.
- **Retreat takes time** (D-126): one check by the standing member with the best Wits (difficulty by danger rating: 6, 9, 12, 15). The way out lasts 1 beat, +1 while carrying anyone Down or Dying, +1 if the check fails. Each `quest.step` is one beat: every standing foe group strikes once if the party fled a fight, then the fallen are tended, bleed and roll for death as usual. If nobody is left standing it becomes a rout. A retreat abandons the contract (its price per PLAN §4g).

## Commands and events

- Commands: `quest.start` (party, plan, quest, day), `quest.step` (one scene or one exchange), `quest.choose` (answer to a raised moment). All go through `simulate(state, command)`.
- Events: `quest.started`, `scene.started`, `exchange.started`, `check.rolled` (purpose, chance `Value`, roll, outcome; purposes: scene, attack, defence, stabilise, bleed, death, injury, retreat, judgement), `wound.changed`, `foe.wounded`, `alarm.raised`, `adventurer.stabilised`, `adventurer.died`, `moment.raised`, `moment.resolved`, `quest.retreated` (beats), `retreat.beat`, `leader.judged` (situation, call), `injury.gained`, `quest.ended` (won, partial, retreated, routed). Each has a cause id: the command or the event that led to it.
- Balance sweep: `node tools/resolution-sweep.ts [quests]` reports deaths and injuries against PLAN §4c and runs the invariants on every quest.
- Tests: one rule test per rule above, the determinism test (same seed and commands, same events), and invariants (no step beyond Dying, every event has a cause).

## Not in v0

Morale (D-121), traits and chemistry, consumables, magic power (D-028), individual enemy tokens (D-123, later), minor-moment choices beyond retreat, rewards and fees.
