# Guild year v0

The calendar, the contract board, wages, recovery and recruitment for one guild, so a whole year runs through `simulate` (PLAN §9b step 2, first slice: one guild, no rivals, three classes; D-085, D-113). Every number below is a starting value in content data (`packages/content/src/base/guild.ts`), to be tuned by R2 and R3; none is in engine code. The headless simulator (`tools/year-sim.ts`) plays the player's side with a fixed policy and reports against PLAN §2 and §4.

## Time (PLAN §2a, §2b)

- 48 weeks of 7 days, 336 days; day 1 is the first day of week 1. `guild.found` runs the founding day (day 1 or the day given); `day.advance` moves one day (its `day` must follow today's) and runs that day's rules in a fixed order: week start, quest arrivals, homecomings, recovery, stops. The year ends after week 48; `day.advance` refuses to go past it.
- Parts of the year: Assembly and muster weeks 1–4, campaigning 5–36 (midsummer fair weeks 20–21), winter 37–48. Recruitment windows: weeks 1–4 and 20–21.

## The board (contracts)

- On each week start the board drops expired offers and adds new ones: a number per week by part of the year (winter is thin), each drawn by weighted danger from the content's quest templates of that danger (no ranking tiers yet; they come with rivals), with a fee, travel days each way and an expiry week.
- Fees per danger from content (rising about 2.5 times a step, PLAN §4b), with a small spread. Loot is a share of the fee paid on a win.
- `contract.take` (offer id, member ids, plan; `day` must be today) needs an idle party of at least the minimum size whose members are all fit enough (not out injured). The offer leaves the board and the party leaves that day; the quest resolves on arrival (travel days later) with the resolution v0 rules, unwatched, so the leader's call answers every moment (D-125); the party is home after travelling back. Dead members leave the guild's members and wage bill on arrival; the roster keeps them, flagged dead.

## Money (PLAN §4b)

- Every week start pays wages (each adventurer's weekly wage) and running costs (staff and upkeep, one content number). Fees and loot arrive when the party is home. The chest may go below zero; that is debt, and the report counts weeks in debt. Bankruptcy rules wait for the finance system.
- The Assembly (day 1) pays the patron grant. Every change is a `money.changed` event with its reason and the chest after it; renown changes (win: the danger's renown, rout: minus the same) are `renown.changed` events.

## People

- After a quest, each survivor is out from the day the party is home for rest days per wound step left, plus 3–8 weeks (stream `guild.recovery`) if the quest gave an injury (`injury.gained`); `contract.take` refuses anyone still out, and `member.recovered` marks the day they are fit. A death costs the guild (D-138): the content's funeral, a family share of weeks of the dead member's wage, and renown when the plan was reckless (bold risk, or never retreating); amounts in `packages/content/src/base/guild.ts`.
- Recruitment: on each week start inside a window, a shortlist of prospects replaces the last (stream `guild.recruit`, attributes from the class leanings in content; outside a window it is empty); `recruit.sign` adds one at their asked wage (class base plus a step per point the best three attributes average above 10) and pays the content's sign-on fee, a number of weeks of that wage (D-138). The starting roster is drawn the same way but pays no fee. Signing is never delegated (D-038), so it is always a stop.
- Retirement, ageing, training and morale are later slices.

## Stops (PLAN §2f)

- The engine raises a stop event with a class (`must`, `digest`) and a reason whenever something needs the player: reasons `week-report` (digest, each campaigning week start), `assembly` (must, day 1), `new-contracts` (digest, a week start with an offer and enough free members for a party), `death` (must), `signing-window` (must, window week start), `party-home` (digest). All stops on one day are one stop; `stopDays` and the simulator count stop days by class against the budget (about 80 a year, at most 100).

## Invariants

Money adds up (every `money.changed` carries the running chest; the last equals the state), no adventurer is in two parties, the dead are in no party and on no wage list, every event has a cause, and the resolution invariants hold for every quest.

## Derived state

Some fields are bookkeeping read back from events, not changes of their own: who is away (set by `party.departed`, cleared by `party.returned`), the day a member is fit again (shown by `member.recovered`), today's date (the command's day), and the shortlist being emptied outside a window (it only ever holds the last `prospect.listed`). They need no events of their own.
