# House v0: building the guild house (D-168–D-184, money and space only)

The first simulator pass of the guild house: what rooms cost to build, raise and keep, how long building takes, and how barracks beds cap the roster. Room effects (healing beds, training and study places, staff heads) come in the next pass (owner's scope choice, 2026-10-27). Every number is a starting assumption in content (`packages/content/src/base/house.ts`), tuned with `tools/career-sim.ts`.

## Space

- The **hall** is a stack of floors, each 3 cells wide (D-169). Floor 0 is the ground floor; floors 1, 2… are storeys; floors −1, −2… are cellars. The **compound** has two sides, west and east, each a row of plots, plot 0 next to the hall (D-180, D-183).
- A cell or plot is empty or holds one cell of a **room kind** at a level from 1 to the kind's top level (3 at launch, D-172). The **study** is a fixed cell: it can't be built, upgraded or removed, and it costs no upkeep.
- A **room** is a run of side-by-side cells of the same kind on one floor or one compound side; a run is never longer than the kind's `maxCells` (1–3). The room's level is the lowest level among its cells.
- Each kind says where it may go (D-176, D-180): `hall` or `compound`, and `belowGround` (cellars only) for the strongroom.
- A new guild starts with the content's starting layout (floors, compound sides and cells already built). The founding roster may not exceed the starting beds.

## Building

All building is by command, paid in full when it starts (`money.changed`, reason `building`), refused if the chest can't pay, and finished at the first week start on or after its due week. A cell or plot under work can't take another command until it finishes. Commands:

- `house.build` (place, kind): a new cell of that kind in an empty cell or plot. Next to a room of the same kind, the new cell joins it at that room's level and costs the kind's cell cost summed over levels 1 to that level; otherwise it is level 1.
- `house.upgrade` (place of any cell of a room): raises every cell of the room that is at the room's level by one, at that level's cost per cell.
- `house.extend` (direction): `up` adds an empty floor on top, `down` digs an empty cellar below the lowest floor, `west` or `east` adds an empty plot at the far end of that side, up to the content's maximum. Each step costs more than the last: the content's base plus its step for each one already added (D-172, D-183).
- A second `house.extend` in a direction already under work is refused. A room with any cell under work (a new cell joining it, or an upgrade) can't be joined or upgraded until that work finishes, so a cell never lands at a level that is about to change.
- Only the extensions rise in price (each storey, cellar or wall push costs more than the last); a room's cells cost the same on every floor. The owner confirmed this reading of D-172 (D-185).
- Work time is the content's weeks for the job; a job started in winter takes `winterWeeksBp` of that, rounded up (best done in winter, D-067, D-169; the size of the saving is an assumption).
- Events: `house.started` when paid, `house.finished` when done. Neither holds state objects.

## Running the house

- Each week start, every built cell costs its kind's upkeep at its level (`money.changed`, reason `rooms`), paid with the wages (D-177). The study costs nothing.
- **Beds** (D-170, D-174): the barracks' cells give beds by level. `recruit.sign` is refused while the guild has as many members as beds. Lost beds and inn lodging (D-182) wait for incidents.
- Without house rules in content nothing changes: no house state, no upkeep, no bed cap (the existing simulators are unchanged).

## What the simulator measures (D-172)

With the house on, the career simulator follows the content's `fullHousePlan`, step by step toward a reference **full house** (every kind at level 3), one job at a time, starting the next step at a week start when the chest after paying stays above a reserve of 12 weeks of spending (wages, running cost and upkeep). It reports the year the first extra room is started and finished, the year the full house is finished, the full house's total cost in years of the middle tier's median surplus, and room upkeep as a share of spending. Targets: the first extra room within the first season; the full house costing about 8–12 years of a mid guild's surplus.
