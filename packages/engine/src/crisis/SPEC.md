# Crises v0: one small local chain (D-112, D-147)

Just enough to test §9d's late-goals check (PLAN §9d): from about year 5, a crisis can wake and give the middle years a goal. Every number and the chain itself are content (`packages/content/src/base/crises.ts`), so later crises are data entries (GAME-04).

## A chain

- A **chain** is a list of steps; each step is a contract shape (site, monster kind, danger; no twist) and a fee scale on that danger's fee. It also sets the reward for ending it (renown, patron confidence) and the pressure while it stands (weekly cost, confidence at each review).
- Each chain can happen once per career.

## How it runs

- **Start:** at each Assembly from `fromYear`, if no crisis stands and a chain has not happened yet, one roll (stream `crisis.start`) at `startBp` starts the first such chain in content order: `crisis.started`, a must stop `crisis`.
- **Steps:** while a crisis stands, each week start posts its current step on the board if that step is neither on the board nor out with a party (`offer.posted` as usual; the offer carries the chain and step). The fee is the danger's fee × the tier's fee scale × the step's scale; travel is the danger's base travel. It lives as long as other offers; untaken, it is posted again the next week.
- **Advance:** a party that wins the step's contract moves the chain on (`crisis.advanced`); any other outcome leaves the step to be tried again. Winning the last step ends the crisis (`crisis.ended`, outcome `resolved`): the reward's renown and patron confidence.
- **Pressure:** each week start while it stands costs `weeklyCopper` (`money.changed`, reason `crisis`); each patron review while it stands lowers confidence by `confidencePerReview`, shown in `patron.reviewed` (`crisis: true`).
- A crisis never fades by itself in v0; a career that ends with one standing reports it as standing.
- With no crisis rules in content, nothing changes.
