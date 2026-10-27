# Staff v0: two delegable areas (R6, D-145)

Just enough to test R6 (PLAN §9a): staff are competent but limited, and the guildmaster's own focus beats delegation by 10–25% on that area without delegation ever being ruinous. Two areas, **training** and **recovery**; every number is a starting assumption in content (`packages/content/src/base/staff.ts`).

## Who runs an area

- Each area is run by the **guildmaster** or by **hired staff**. A guild starts with the guildmaster running both.
- The guildmaster has a skill per area (1–20), drawn at the founding (content band; backgrounds come later, PLAN §5d). **Growth by doing** (D-029): at each Assembly, an area the guildmaster ran all year may gain a point (a chance, falling as the skill nears its cap); a delegated area never grows.
- **Staff** are hired from a shortlist listed at each Assembly (stream `staff.hire`): each candidate has a quality (1–20) and asks a weekly wage that rises with quality. Staff never improve: they are competent but limited. Wages are paid each week start with the rest (`money.changed`, reason `staff`).
- Commands: `staff.hire` (area, candidate) puts a candidate in charge and on wages; `staff.release` (area) hands the area back to the guildmaster. Hiring and releasing staff are confirmed decisions (D-078), so both are the player's.

## What an area does

- **Training:** the growth chance after a quest (career/SPEC.md) is scaled by `10,000 + step × (skill − 10)` basis points, using the guildmaster's skill or the staff member's quality.
- **Recovery:** the days a lasting injury keeps someone out are scaled by `10,000 − step × (skill − 10)` basis points, rounded down, at least one day.
- With no staff rules in content, both factors are 1 (the one-year simulator is unchanged).

## The price of focus

- Running an area yourself takes time: the guildmaster's areas raise digest stops (PLAN §2f): **training** a `training-plan` stop every few campaigning weeks; **recovery** an `infirmary` stop when a party reports a lasting injury. Delegated areas raise none. The simulator reports stops a year next to outcomes, so focus shows its price in the friction budget (R3).

## What the simulator compares

The career simulator plays the same seeds hands-on (guildmaster runs both) and delegated (hires the best candidate it can afford for both). R6 passes when the hands-on side is 10–25% better on each area (attribute points grown a year; injury weeks lost a year) and the delegated side's careers and chest are not far worse.
