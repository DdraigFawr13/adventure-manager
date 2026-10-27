# Guild year v0

The calendar, the contract board, wages, recovery and recruitment for one guild, so a whole year runs through `simulate` (PLAN §9b step 2, first slice: one guild, no rivals, three classes; D-085, D-113; rivals, the ladder and careers since then: `../career/SPEC.md`). Every number below is a starting value in content data (`packages/content/src/base/guild.ts`), to be tuned by R2 and R3; none is in engine code. The headless simulator (`tools/year-sim.ts`) plays the player's side with a fixed policy and reports against PLAN §2 and §4.

## Time (PLAN §2a, §2b)

- 48 weeks of 7 days, 336 days; day 1 is the first day of week 1. `guild.found` runs the founding day (day 1 or the day given); `day.advance` moves one day (its `day` must follow today's) and runs that day's rules in a fixed order: week start, quest arrivals, homecomings, recovery, stops. Without careers the year ends after week 48 and `day.advance` refuses to go past it; with careers (career/SPEC.md) years follow one another until the career ends.
- Parts of the year: Assembly and muster weeks 1–4, campaigning 5–36 (midsummer fair weeks 20–21), winter 37–48. Recruitment windows: weeks 1–4 and 20–21.

## The board (contracts)

- On each week start the board drops expired offers and adds new ones: a number per week by part of the year (winter is thin), each drawn by weighted danger from the content's quest templates of that danger (in careers the guild's tier also sets the weights and fees, `../career/SPEC.md`), with a fee, travel days each way and an expiry week.
- Fees per danger from content (rising about 2.5 times a step, PLAN §4b), with a small spread. Loot is a share of the fee paid on a win.
- `contract.take` (offer id, member ids, plan; `day` must be today) needs an idle party of at least the minimum size whose members are all fit enough (not out injured). The offer leaves the board and the party leaves that day; the quest resolves on arrival (travel days later) with the resolution v0 rules, unwatched, so the leader's call answers every moment (D-125); the party is home after travelling back. Dead members leave the guild's members and wage bill on arrival; the roster keeps them, flagged dead.

## Money (PLAN §4b)

- Every week start pays wages (each adventurer's weekly wage) and running costs (upkeep, one content number; hired staff are paid apart, staff/SPEC.md). Fees and loot arrive when the party is home. The chest may go below zero; that is debt, and the report counts weeks in debt. Bankruptcy rules wait for the finance system.
- The Assembly (day 1) pays the patron grant. Every change is a `money.changed` event with its reason and the chest after it; renown changes (win: the danger's renown, rout: minus the same) are `renown.changed` events.

## People

- After a quest, each survivor is out from the day the party is home for rest days per wound step left, plus 3–8 weeks (stream `guild.recovery`) if the quest gave an injury (`injury.gained`), scaled by whoever runs recovery (staff/SPEC.md) and reported as `member.laid-up` (days); `contract.take` refuses anyone still out, and `member.recovered` marks the day they are fit. A death costs the guild (D-138): the content's funeral, a family share of weeks of the dead member's wage, and renown when the plan was reckless (bold risk, or never retreating); amounts in `packages/content/src/base/guild.ts`.
- Recruitment: on each week start inside a window, a shortlist of prospects replaces the last (stream `guild.recruit`, attributes from the class leanings in content; outside a window it is empty); `recruit.sign` adds one at their asked wage (class base plus a step per point the best three attributes average above 10) and pays the content's sign-on fee, a number of weeks of that wage (D-138). The starting roster is drawn the same way but pays no fee. Signing is never delegated (D-038), so it is always a stop.
- Ageing and retirement: career/SPEC.md. Training and recovery: staff/SPEC.md. Morale is a later slice.

## Stops (PLAN §2f)

- The engine raises a stop event with a class (`must`, `digest`) and a reason whenever something needs the player: reasons `week-report` (digest, each campaigning week start), `assembly` (must, week 1 of each year), `new-contracts` (digest, a week start with an offer and enough free members for a party), `death` (must), `signing-window` (must, window week start), `party-home` (digest); with careers, staff and crises also `retirement`, `career-ended`, `patron-offer`, `crisis` (must) and `training-plan`, `infirmary` (digest). All stops on one day are one stop; `stopDays` and the simulator count stop days by class against the budget (about 80 a year, at most 100).

## Invariants

Money adds up (every `money.changed` carries the running chest; the last equals the state), no adventurer is in two parties (out or standing), standing parties hold only living members and none is empty, the dead are in no party and on no wage list, every event has a cause, and the resolution invariants hold for every quest.

## Derived state

Some fields are bookkeeping read back from events, not changes of their own: who is away (set by `party.departed`, cleared by `party.returned`), the day a member is fit again (shown by `member.recovered`), today's date (the command's day), and the shortlist being emptied outside a window (it only ever holds the last `prospect.listed`). They need no events of their own.

## Standing parties (D-014, step 4)

With `standing` rules in content, the guild keeps named standing parties between quests (D-014, D-195). Each has an id (`sp.N`), a name id drawn from content's list on its own stream (`guild.party-names`, never a name another standing party holds), its members (up to the party maximum, never fewer than one) and a default plan.

- **At the founding:** `guild.pick` forms the picked starter party as the first standing party with content's default plan; extras stay unassigned. Without the draft nobody is in a standing party until the player forms one.
- **`party.form`** (member ids, plan): a new standing party. Each member leaves any standing party they were in. **`party.assign`** (member id, standing id or null): moves one member, or leaves them unassigned. **`party.plan`** (standing id, plan): sets the default plan. A standing party left with nobody is disbanded. All refuse unknown or departed people and parties over the maximum; being away or recovering does not matter (the roster is a plan, not a departure).
- **Sending one:** `contract.take` may name a standing party (`standingId`). The members and plan sent are the command's, so a swap or a different plan holds for this contract only and the standing party is unchanged. The party out remembers which standing party it was (`party.departed` carries `standingId`, null when none). Size, fitness and away checks are `contract.take`'s as before.
- **Leaving:** a member who dies or retires leaves their standing party in the same command (`party.assigned` to none, caused by the death or the retirement); a party left empty is disbanded.
- Events: `party.formed` (name id, plan), `party.assigned` (from, to; subject the member), `party.planned` (plan), `party.disbanded`. Standing parties have no rule effect: chemistry waits for its own design (D-014, D-196).
- Without `standing` rules nothing here runs and the simulator is unchanged.

## Backgrounds (D-196)

With `backgrounds` in content, each drawn person gets a home and a former trade (content ids) on their own stream (`guild.backgrounds`; the founding draft's `guild.founding-backgrounds`), drawn after the person's other draws, so no other roll moves. They are words only (history/SPEC.md writes the line).

## Founding draft (D-188)

With `founding` rules in content, `guild.found` doesn't draw a roster. It pays the founding purse into the chest (`money.changed`, reason `founding`) and lists the draft: 3 starter parties of 5 and a shortlist of extras, all drawn from the seed on the draft's own streams (`guild.founding` for attributes and class, `guild.founding-life` for ages and potential, `guild.founding-names` for names), so the shared streams later prospects draw from are untouched. Until `guild.pick` settles the draft, `day.advance` is refused.

- **Party characters** are content: each has a name id, an attribute shift (added to every drawn attribute, kept within 1-20), an age band, a potential bonus and a fee share (`feeBp`). The numbers are assumptions in `packages/content/src/base/founding.ts`. Each listed party has one character, in content order.
- **Extras:** `extras.offered` people drawn as normal prospects (no shift).
- **Fees:** each picked person costs `feeWeeks` of their wage (like the sign-on fee, D-138), paid at the pick (reason `sign-on`). A party's members pay that times their character's `feeBp` (a premium for a seasoned party, a discount for a green one); extras pay the plain fee. A party's fee is the sum of its members'. The pick happens on the founding day after its week start, so the chest it pays from already holds the year's grant less the week's running costs; the pick also pays the picked people's first week of wages (reason `wages`), which that week start could not.
- **`guild.pick`** (party index, extra ids): exactly one party and `extras.min`-`extras.max` extras from the shortlist, no repeats; refused if the fees exceed the chest or the beds (house rules) can't hold everyone. Picked people join (`recruit.signed`), the draft is cleared, and the house's bed check runs against the picked roster.
- Events: `founding.listed` per listed person (party index or extra, class, wage, fee), `founding.picked`.
- Without `founding` rules, `guild.found` draws `size` people as before.

### Simulator

The career simulator's house mode founds through the draft. Its player picks a party by a policy (default balanced; `seasoned` and `green` to compare) and the 2 cheapest extras. Target: the purse leaves about 30,000 after a balanced pick (the measured stand-in, 15% dismissed); compare the three characters' dismissals, year-1 chest and early renown.
