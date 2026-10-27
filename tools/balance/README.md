# Balance runner

`node tools/balance/run.ts <scenario>` plays a scenario's seeded careers (the same seeds and player as `tools/career-sim.ts`) and prints every metric with a 95% interval and a verdict against its target. Decision: D-202.

## Everyday use

| Want to know | Command |
|---|---|
| What scenarios and metrics exist | `node tools/balance/run.ts --list` |
| Where a scenario stands against its targets | `node tools/balance/run.ts house-incidents` |
| Did my code change move the balance? | `node tools/balance/run.ts classic --compare` (prints "identical to the baseline: 100 of 100" when nothing moved) |
| What does one number do? | `... house-incidents --compare --set 'guild.house.incidents.kinds[incident.fire].weeklyBp=60'` |
| Which value of a number fits? | `... house-incidents --sweep 'guild.house.incidents.kinds[incident.fire].weeklyBp=15,30,60'` |
| A quick look | add `--careers 20` |
| Another player or starter party | `--policy bold`, `--party green` (with `--compare`, against the scenario's baseline) |
| Numbers for a script or page | `--json out.json` |

Reading a comparison: `baseline → now [interval]  change [interval]  MOVED`. The change is this run minus the baseline, paired seed by seed: the same seed played two ways shares its luck, so the interval is narrower than comparing two separate runs. MOVED means the change's interval excludes 0; a change without MOVED can be luck.

Verdicts: `ok` inside the target band, `near` the interval reaches the band, `OFF` the whole interval misses it. Targets name their source (a decision or PLAN line); "±25%" bands use R2's pass line.

## How many careers

Measured on the stored baselines (house vs house with incidents), the width of the 95% interval of a change:

- 100 careers: dismissals ±6 points paired (±9 unpaired); deaths a year ±0.17; career length ±1.5 years.
- 20 careers: dismissals ±20 points; deaths a year ±0.34.

So 20 careers is enough for rates a year (deaths, stops, incidents) and too few for how careers end. Use 100 before recording a number in DECISIONS or HANDOFF.

## Baselines

`baselines/<scenario>.jsonl.gz` holds each career of the scenario as played on the commit named in its first line, one JSON line per seed with a hash. `--compare` pairs with it, so no worktree run of `main` is needed. The `baselines` folder is excluded from the "+changes" check, so saving a baseline doesn't mark itself as uncommitted.

- Save with `node tools/balance/run.ts <scenario> --save` (all four take about 3 minutes). Save only content as written (no `--set`) on a committed tree, so the first line names a real commit.
- A PR that changes the balance on purpose re-saves the affected baselines in the same PR, like a golden file (STANDARDS.md). A PR that shouldn't change the balance shows "identical … 100 of 100" for each scenario.
- A baseline stores whole careers, so a new metric works on old baselines without replaying them.

## Changing the module

- **New scenario**: add an entry to `scenarios.ts`, then `--save` it.
- **New metric**: add it to `metrics.ts` with a `compute` over a list of careers (anything: a share, a median, a ratio), an optional target with its source, and `when` if it applies only with the house or incidents. Intervals and comparisons need nothing more.
- **New number recorded per career**: add it to `Career` in `../career-play.ts`, then re-save the baselines (old ones lack the field).
- Overrides reach any number, flag or word in the content: dots for keys, `[id]` for a list entry by id, a number for a list entry by index. A wrong path or type stops the run before any career plays.
- Tests: `tools/test/balance.test.ts`.
