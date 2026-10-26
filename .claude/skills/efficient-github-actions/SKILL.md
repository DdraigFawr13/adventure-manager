---
name: efficient-github-actions
description: Design, audit or change GitHub Actions workflows so they cost few runner minutes without weakening verification. Use when adding or editing anything in .github/workflows, when CI is slow or expensive, when Actions minutes, billing or spending limits come up, when a run "can't start", when setting up tiered tests, full-regression or deploy workflows, branch-cleanup automation, or agent rules for how often to push.
---

# Efficient GitHub Actions

The goal is fewer billed runner minutes **with the same coverage**: run the cheap checks on every change, the expensive ones when the change warrants them, and everything on demand or before a release. Never delete or weaken a test to save minutes.

## Facts that drive every decision

- **Billing is per job, rounded up to the whole minute.** A 14-job run that finishes in 8 minutes can bill 54. Optimize summed job-minutes, not wall-clock time. Parallel shards each repeat checkout, toolchain setup and dependency install.
- **Public repositories:** standard GitHub-hosted runners are free. **Private repositories:** minutes come out of the account's monthly allowance; larger runners are never free. Check visibility first (`gh api repos/OWNER/REPO --jq .visibility`).
- All of an account's repositories share one concurrent-job limit. A 12-job matrix in one repo can delay another repo's CI even when the minutes are free.
- A skipped job bills nothing. A job whose `if:` is false never starts a runner.
- Windows and macOS runners cost more per minute than Linux in private repositories (historically 2x and 10x). A three-OS matrix is the most expensive shape there is: path-filter it and run it in Tier 3 unless the change is platform-specific.

## Procedure

1. **Measure.** Run `scripts/actions-baseline.py OWNER REPO YYYY-MM-DD` (needs `gh`). It sums per-job billed minutes by workflow and event, and lists failures. Note the biggest buckets; it is usually one or two of: branch pushes duplicating PR runs, full suites re-run on the default branch after merge, wide matrices, and runs that are not cancelled when superseded.
2. **Read every workflow and the repo's own check commands** (package.json scripts, CONTRIBUTING, CLAUDE.md). Check branch protection or rulesets for required check names before renaming or skipping any job.
3. **Design tiers for this repo** (don't paste one template everywhere):
   - **Tier 1, every PR (and default-branch push):** format, lint, typecheck, unit tests, build. Target 2–5 billed minutes.
   - **Tier 2, path-selected on PRs:** integration, browser, simulation tests, chosen from the PR's diff. Use one representative engine or shard, not the whole matrix.
   - **Tier 3, deliberate:** the full matrix, run from a PR label (e.g. `full-regression`), automatically for high-risk paths (lockfiles, toolchain config, workflows, rule-version files), and via `workflow_dispatch`. Keep every original test, seed and engine reachable here.
4. **Implement** with the patterns in `references/patterns.md`:
   - PR plus default-branch triggers only.
   - Per-ref concurrency with cancellation.
   - A diff-scope step that writes job outputs.
   - Aggregate gate jobs that keep stable check names.
   - A full-regression dispatch wrapper.
   - Deliberate, serialized deploys.
   - A self-retiring branch-cleanup job.
   - `timeout-minutes` on every job.
   - Least-privilege `permissions`.
5. **Validate before pushing:**
   - Run `actionlint` (with shellcheck installed).
   - Extract any scope script and test it in a scratch git repo under `bash -eo pipefail`: a docs-only diff, a code diff, a high-risk diff, a test-only diff, a push event, a dispatch, and a diff of thousands of files.
   - Run the repo's local checks.
   - For sharded suites, run the shard runner and coverage verifier locally once.
   - Then push **once** and let the PR's single run be the live test.
6. **Document and set agent rules.** Write a short `docs/CI.md`: before/after with measured run IDs, what runs when, how to run full regression and deploy. The budget rules themselves (CI-01 to CI-06) come from AI-Master-Instructions in `.claude/master/RULES.md`; don't paste them into `AGENTS.md`. Add only the repo-specific sections from `references/agent-policy.md`.
7. **PR body:** problems found (with numbers), changes, expected savings marked as estimates, testing done, risks, and manual steps for the owner. After merge, check that the first default-branch run behaved as designed and record the measured minutes.

## Traps (each one has bitten a real run)

- **`grep -q` under `pipefail`.** Actions runs `bash -eo pipefail`. `git diff | grep -q x` can SIGPIPE the producer on a large diff and report *no match*. Use `grep -E pattern >/dev/null`, or capture the diff in a variable first.
- **Push plus PR in one concurrency group.** If a branch push and its PR share a group, they cancel each other and both bill. Run CI on PRs and the default branch only, and group by `github.ref`.
- **`labeled` events.** Adding `types: [labeled]` for a full-regression label means *any* label restarts CI and cancels the real run. Route other labels to a throwaway group (`github.run_id`) and skip all jobs for them (pattern in references).
- **Gates that go green by mistake.** An `if: always()` gate must require each conditional job to *succeed when the scope said it was needed* and to be *skipped otherwise*. Plain "not failed" lets a wrongly skipped job pass.
- **Workflow-level `paths`/`paths-ignore` with required checks.** A filtered-out workflow never reports, so a required check stays pending forever. With required checks, keep the workflow running and skip expensive jobs or steps inside it.
- **Docs-only filters can skip real checks.** If `format:check` covers Markdown, or scripts live under `docs/`, a `**/*.md` or `docs/**` filter skips them. Read what the checks cover first.
- **Test-file exclusions.** Excluding `*.spec.ts` from "needs E2E" can skip E2E for a PR that only changes E2E specs. Exclude only the unit-test pattern.
- **Reusable workflows rename checks** to `caller-job / called-job`. Keep the PR-facing workflow non-reusable, or accept new check names.
- **Reusable workflows in a private repo** can't be called from a public repo. Pin any shared workflow or action to a tag or SHA, never `@main`, so a run can be reproduced.
- **Diff base.** `pull_request` checks out GitHub's merge commit. With `fetch-depth: 2`, `git diff --name-only HEAD^1 HEAD` is exactly the PR's change.
- **Production deploys and migrations:** `cancel-in-progress: false` in a fixed group, so they queue and never die mid-way. Deploy only default-branch commits, and verify the exact commit in the deploy job, or reuse an artifact built from that commit by the same repo.
- **Branch cleanup workflows** become redundant once Settings → General → "Automatically delete head branches" is on. Guard the job with `github.event.repository.delete_branch_on_merge != true` so it retires itself, and treat an already-deleted branch as success.
- **`create`/`delete` events** run the workflow file from the created ref, so pushing a branch fires its own new version. Workflow-token pushes and deletes trigger nothing.
- **`ubuntu-slim`** is cheaper but constrained (1 vCPU, short job limit). Don't put required gates on a label the account may not provision; a gate that never starts stays pending.
- **Escalation on the default branch:** if the scope script forces Tier 3 for high-risk paths, that applies on the merge push too. Decide deliberately and say so in the docs.

## When a run can't start

Distinguish these before acting:
- Billing or spending-limit annotation ("recent account payments have failed", "spending limit").
- Runner provisioning.
- A run with **zero jobs** (usually an invalid workflow file on that ref; run `actionlint`).
- Missing secrets: guard steps on `secrets.X != ''` and skip cleanly.
- Permissions.
- Real test failures.

Never re-run, push empty commits, or close and reopen a PR to retry a billing-blocked run. Report the exact message to the user: billing and spending caps are account-owner settings and are not reachable through repository tokens.

## Limits of agent tooling

- Repository settings (auto-delete branches, branch protection) and billing usually can't be changed with an agent's token. Give the owner the exact settings path instead.
- `gh api --paginate` may fail behind proxies that reject numeric-ID URLs. Page manually with `&page=N`, as the baseline script does.
