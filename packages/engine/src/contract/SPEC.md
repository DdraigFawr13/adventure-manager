# Contracts v0

How the board's work is put together (D-139, PLAN §9d): a **site**, a **monster kind** that lives there, and at most one **twist**, at one danger rating. Every number is content (`packages/content/data/contracts.json`); each twist kind is one engine rule.

## Shapes

- A shape is (site, monster kind, twist or none, danger). Its quest template id is `shape:<site>+<monster>+<twist or plain>+<danger>`; `findTemplate` composes it on demand, so quests, saves and replays carry only the id.
- **Site:** tags (shift scene difficulty by approach, as before), home tags (which monster kinds can live there), the dangers it can host, and its scenes, written at hazardous difficulty. Content gives a shift per danger (routine −2, hazardous 0, perilous +1, deadly +2 to start) added to every scene.
- **Monster kind:** a family, the home tags it lives in, and its foe groups per danger it comes in (PLAN §7b, "a few variants by danger rating"). The composed quest fights those groups after the site's scenes.
- A site and a kind fit when they share a home tag and both have the danger.

## Twists (one rule each)

| Kind | Rule | Board |
|---|---|---|
| `scene-shift` (foul weather) | Fixed scenes testing the twist's attribute get harder by its amount | named |
| `foe-shift` (bad information) | Every foe group's attack and defence rise by its amount | hidden; the report reveals it |
| `extra-scene` (a trap) | Its scene is added before the last site scene | named |
| `bleed` (cursed ground) | The fallen's bleed chance rises by its amount, shown as a named part of the chance | named |
| `hostage` | If the alarm is raised, a win counts as half done (the hostage is lost) | named |
| `deadline` | The fight ends this many exchanges sooner (foes slip away: half done) | named |

Each twist has a weight on the board and a fee change in basis points (hidden twists change nothing the board shows). "None" has its own weight.

## The board

- Each new offer draws a danger by weight (as before), then one shape of that danger: every fitting (site, kind) pair with every twist or none, weighted by the twist's weight (pairs count equally).
- **Recent shapes:** the board keeps the last N shapes it posted (content number) and leaves them out of the draw while any other shape of that danger is left. The memory is part of the guild state.
- Offers carry the template id; `offer.posted` names the site, kind and visible twist.
