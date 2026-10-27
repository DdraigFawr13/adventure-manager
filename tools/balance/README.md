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

Reading a comparison: `baseline → now [interval]  change [interval]  MOVED`. The change is this run minus the baseline, paired seed by seed: the same seed played two ways shares its luck, so the interval is narrower than comparing two separate runs. MOVED means the change's interval excludes 0; a change without MOVED can be luck. The reverse holds too: about 30 metrics are each tested at 95%, so a run with no real change can still show one or two MOVED by chance, and a median of whole numbers (years, points) can show MOVED for a one-step shift. Trust a MOVED that the change explains, or that repeats at 100 careers.

The header line warns when the comparison means something else: settings that differ from the baseline's, a baseline commit outside this branch's history, or content that differs from what the baseline played (a merged balance change whose baseline wasn't re-saved). The "identical" line shows only when the run plays the baseline's own setup.

Verdicts: `ok` inside the target band, `near` the interval reaches the band, `OFF` the whole interval misses it, blank without a target or an interval. Targets name their source (a decision or PLAN line). Deaths and stop days a year are means here (`tools/career-sim.ts` prints medians), since a median of whole numbers hides small changes; their "±25%" bands borrow R2's pass line, written for medians, as a new reading applied to the mean.

## How many careers

Measured on the stored baselines (house vs house with incidents), the width of the 95% interval of a change:

- 100 careers: dismissals ±6 points paired (±9 unpaired); deaths a year ±0.17; career length ±1.5 years.
- 20 careers: dismissals ±20 points; deaths a year ±0.34.

So 20 careers suits a first look at rates a year (deaths, stops, incidents), though ±0.34 deaths is wide against a 1.5–2.5 band, and is too few for how careers end. Use 100 before recording a number in DECISIONS or HANDOFF.

## Baselines

`baselines/<scenario>.jsonl.gz` holds each career of the scenario as played on the commit named in its first line, with a hash of the content played, then one JSON line per seed with a hash of the career. `--compare` pairs with it seed by seed, so for the four stored scenarios no worktree run of `main` is needed. Other comparisons (another party or policy, delegated staff, another roster size) still need a run of each side; `--compare` with `--policy` or `--party` compares against the scenario's own baseline, which is a different question.

- Save with `node tools/balance/run.ts <scenario> --save` (all four take about 3 minutes). `--save` refuses `--set`, `--sweep`, changed settings and uncommitted code or content, so a baseline is always the scenario as defined on a real commit; `--force` overrides the last two.
- The identity check covers every number a career records (`Career` in `../career-play.ts`), not the event log itself.
- A PR that changes the balance on purpose re-saves the affected baselines in the same PR, like a golden file (STANDARDS.md). A PR that shouldn't change the balance shows "identical … 100 of 100" for each scenario.
- A baseline stores whole careers, so a new metric over fields a career already records works on old baselines without replaying them.
- The files are gzip, so a diff shows only that they changed; two PRs that both re-save one conflict, and the second re-saves after merging (about a minute a scenario).

## Changing the module

- **New scenario**: add an entry to `scenarios.ts`, then `--save` it.
- **New metric**: add it to `metrics.ts` with a `compute` over a list of careers (anything: a share, a median, a ratio), an optional target with its source, and `when` if it applies only with the house or incidents. Intervals and comparisons need nothing more.
- **New number recorded per career**: add it to `Career` in `../career-play.ts`, then re-save the baselines: old ones lack the field, so a metric reading it shows "—".
- Overrides reach any number, flag or word in the content: dots for keys, `[id]` for a list entry by id, a number for a list entry by index. A wrong path or type stops the run before any career plays.
- Tests: `tools/test/balance.test.ts`.
