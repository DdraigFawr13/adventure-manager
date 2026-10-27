# Careers v0: many years, rivals, the ladder and the patron

The guild's years run on, one after another, until the guildmaster's career ends (PLAN §9b step 2, R2, R9; D-140, D-141). Every number is a starting assumption in content (`packages/content/src/base/career.ts`), to be tuned against PLAN §4 and §5; none is in engine code.

## Calendar

- Days run on past week 48: the year is `floor((day - 1) / days per year) + 1`, and weeks, parts of the year and signing windows count within the year. `day.advance` stops only when the career has ended.
- Week 1 of every year after the first is the **Assembly** (D-039): the past year is settled (ageing, retirement, ladder, patron), then the new year opens as before (grant, signing window, the board).

## Adventurers

- Drawn people get a birth year (age 18–30 when drawn) and a hidden **potential** per attribute (current plus 0–4; stream `guild.recruit`'s sister stream `career.potential`, so recruit rolls don't move).
- **Growth by doing:** each survivor of a quest rolls once (stream `career.growth`) to gain 1 point in one attribute the quest tested (the approach's attribute, or the class's attack attribute), if it is below potential and they are not past their prime. Chance by age band in content, scaled by whoever runs training (staff/SPEC.md).
- **Ageing** at the Assembly: past the prime age (content, about 32 for the March's people), each physical attribute (Might, Agility, Toughness) has a chance to drop 1 a year, rising with age.
- **Lasting injury:** costs 1 point of one physical attribute at once (PLAN §5a). Picked on `career.growth`.
- **Retirement** at the Assembly: past the prime, a chance by age (content) that the adventurer asks to retire. Retirement is a conversation (D-038, never delegated), so it is a must stop. In v0 the engine settles it at once (the member retires) and the stop reports it; the command to accept or talk them round comes with the text prototype. A retiree leaves the roster and the wage bill (staff careers come later).

## Rivals (D-140)

- The region has 3 tiers of 6 guilds including the player's (PLAN §4e); the 17 rivals are abstract: an id, a tier and a **strength** (0–100). Starting strengths are drawn around each tier's mean (stream `career.rivals`).
- Each year a rival takes a number of contracts by tier, each of a danger drawn from its tier's mix, won with chance `clamp(base + step × (strength − the danger's difficulty))`, and earns that danger's renown for a win (the same table as the player's).
- After the Assembly a rival's strength drifts: a pull toward its tier's mean, a push from how its renown compared with its tier's expectation, and a little noise. Bounded 0–100.

## The ladder

- Each tier is ordered by renown earned in the past year (PLAN §3d; the player's is the sum of its renown changes since the last Assembly). The top guild of each tier but the highest goes up, the bottom of each but the lowest goes down.
- The player's tier sets the board: the danger weights and a fee scale per tier (content), and the patron's grant.
- A founded guild starts in the bottom tier.

## The patron (D-141)

- At each Assembly the patron sets one **target** from the guild's place: win promotion (top two of a lower tier), finish in the top half, or avoid relegation (bottom tier: avoid last place; top tier: stay up). Also every year: end it out of debt.
- **Confidence** 0–100 starts at 60. At the next Assembly: target met, a rise; missed, a fall per place short (capped); in debt at year's end, a fall (amounts in content: `packages/content/src/base/career.ts`). At 0 the guildmaster is dismissed and the career ends.
- **Grace years (D-189):** with `grace` in content, a new guild's first seasons (`grace.years`) have the target `growth` instead of a ladder place: goals of a roster size at year's end, renown earned in the year, and (with house rules) a room finished in the year (`roomsThisYear`, counted by the house). Each goal met adds `goalMet` to confidence, each missed takes `goalMissed`; debt and crisis count as usual. In those years confidence can't fall below 1, so the patron can't dismiss until the Assembly after the last grace year. With 2 grace years that is the third Assembly (the founding is the first), which judges year 2's growth goals with dismissal possible: the session's reading of D-189's "can't dismiss before the third Assembly". `patron.reviewed` carries which goals were met. Without `grace`, the first target is `avoid-bottom` as before.
- **Emergency grant (D-146, PLAN §4g):** at a week start, a guild in debt with a non-zero wage bill gets the patron's offer of a grant (weeks of its adventurers' current wages, content; staff wages are not counted), at most one taken every few years; the guild must still be in debt when it takes it. The offer stands for that week (`patron.offered`, a must stop `patron-offer`); `patron.grant` takes it: the money (`money.changed`, reason `emergency`), and lower confidence (`patron.granted`); nothing else (the owner's choice, D-146: a harder target sank the guilds the grant was meant to save). Abstract rivals have no chest, so they never need it.
- **The guildmaster** starts aged 30–45 (stream `career.patron`). From 60, a yearly chance to retire on health, rising to certain by about 75; that also ends the career.
- Events: `year.settled` (the standings), `tier.changed`, `patron.reviewed` (target, met, confidence), `patron.target`, `career.ended` (reason, years). Career ending is a must stop.

## Not yet

Standing parties (D-014), gear by slot (D-143) and named rivals' stars come in later slices (staff and the first crisis: `../staff/SPEC.md`, `../crisis/SPEC.md`); the simulator reports what it cannot yet measure.
