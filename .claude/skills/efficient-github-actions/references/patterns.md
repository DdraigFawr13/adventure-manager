# Workflow patterns

These snippets are drawn from the workflows merged in Story-Generator #39/#41, Controls-Simulator #46 and Kieran---Soul-Warden #44. Pin action SHAs where the repository already does.

## 1. Triggers and cancellation (every CI workflow)

```yaml
on:
  pull_request:            # feature work is verified here
  push:
    branches: [main]       # post-merge check; NOT feature branches
  workflow_dispatch:       # manual run on any branch

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}   # refs/pull/N/merge per PR, refs/heads/main for main
  cancel-in-progress: true
```

Add `paths-ignore: ['docs/**', '**/*.md']` to both events only if (a) no required check depends on this workflow and (b) the checks don't lint those files.

## 2. Full-regression label without label noise

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled]

concurrency:
  group: ci-${{ (github.event.action == 'labeled' && github.event.label.name != 'full-regression') && github.run_id || github.ref }}
  cancel-in-progress: true

jobs:
  unit:
    if: github.event.action != 'labeled' || github.event.label.name == 'full-regression'
  # gate jobs: if: always() && (github.event.action != 'labeled' || github.event.label.name == 'full-regression')
```

Pass `contains(github.event.pull_request.labels.*.name, 'full-regression')` into the scope step. Every later push stays in full mode until the label is removed.

## 3. Scope step in the Tier 1 job (outputs drive the other jobs)

```yaml
  unit:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    outputs:
      full: ${{ steps.scope.outputs.full }}
      integration: ${{ steps.scope.outputs.integration }}
      browser: ${{ steps.scope.outputs.browser }}
      engines: ${{ steps.scope.outputs.engines }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.ref }}   # empty = triggering commit; set by the dispatch wrapper
          fetch-depth: 2           # HEAD^1 = PR base on the merge commit
      - id: scope
        env:
          CI_EVENT: ${{ github.event_name }}
          CI_FULL: ${{ inputs.full == true || contains(github.event.pull_request.labels.*.name, 'full-regression') }}
        run: bash scripts/ci-scope.sh   # template: scripts/ci-scope.template.sh
      # ... setup + Tier 1 checks; skip expensive steps when steps.scope.outputs.docs_only == 'true'
```

Making the Tier 2/3 jobs `needs: unit` means a Tier 1 failure spends no browser or simulation minutes. The cost is a few minutes of wall time, a good trade when minutes are scarce.

## 4. Conditional matrix from scope output

```yaml
  browser-tests:
    needs: unit
    if: needs.unit.outputs.browser == 'true'
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        include: ${{ fromJSON(needs.unit.outputs.engines) }}   # [{"project":"chromium","shard":1,"shards":1}] vs the full list
```

Run several shards sequentially in one job (a small runner script looping over `suite:shard` tokens) instead of one job per shard. That removes repeated setup and still writes per-partition reports for a coverage verifier.

## 5. Aggregate gate with a stable check name

```yaml
  browser:
    needs: [unit, browser-tests]
    if: always()
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - env:
          UNIT: ${{ needs.unit.result }}
          RESULT: ${{ needs.browser-tests.result }}
          REQUIRED: ${{ needs.unit.outputs.browser }}
        run: |
          test "$UNIT" = success
          if [ "$REQUIRED" = true ]; then test "$RESULT" = success; else test "$RESULT" = skipped; fi
      # full mode only: download partition reports and run the coverage verifier here
```

If branch protection is added, require only the gate names; they always report.

## 6. Full-regression dispatch wrapper (calls the same CI file)

`ci.yml` also declares:

```yaml
on:
  workflow_call:
    inputs:
      full: { type: boolean, default: true }
      ref: { type: string, default: '' }
```

`.github/workflows/full-regression.yml`:

```yaml
name: Full regression
on:
  workflow_dispatch:
    inputs:
      ref: { description: Commit SHA or tag (empty = selected branch head), type: string, default: '' }
permissions:
  contents: read
jobs:
  full:
    uses: ./.github/workflows/ci.yml
    with:
      full: true
      ref: ${{ inputs.ref }}
```

Print `git rev-parse HEAD` in the log so the verified commit is on record. Don't add a second `concurrency` block in the wrapper: the called workflow's block applies.

## 7. Public-repository bonus

```yaml
CI_FULL: ${{ ... || (github.event_name == 'push' && github.event.repository.private == false) }}
```

On a public repo, minutes are free, so the default branch gets the full suite after every merge. This reverts automatically if the repo goes private.

## 8. Deliberate production deploy

```yaml
on:
  workflow_dispatch:
concurrency:
  group: production-deploy
  cancel-in-progress: false
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    timeout-minutes: 30
    steps:
      # checkout -> install -> full verification of THIS commit -> build -> deploy
```

The alternative is to keep `workflow_run` after default-branch CI, but deploy an artifact that CI built from the same commit (`actions/download-artifact` with `run-id: ${{ github.event.workflow_run.id }}`, `github-token`, `actions: read`) instead of rebuilding.

## 9. Migrations

```yaml
concurrency:
  group: database-production
  cancel-in-progress: false
```

Keep the existing path filters, and guard on secrets so the workflow skips cleanly until they are set.

## 10. Self-retiring branch cleanup

```yaml
on:
  pull_request:
    types: [closed]
permissions:
  contents: write
jobs:
  delete:
    if: >-
      github.event.pull_request.merged == true &&
      github.event.repository.delete_branch_on_merge != true &&
      github.event.pull_request.head.repo.full_name == github.repository &&
      github.event.pull_request.head.ref != github.event.repository.default_branch
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - env: { GH_TOKEN: '${{ github.token }}', REPO: '${{ github.repository }}', BRANCH: '${{ github.event.pull_request.head.ref }}' }
        run: |
          gh api "repos/$REPO/git/ref/heads/$BRANCH" --silent 2>/dev/null || { echo "already gone"; exit 0; }
          gh api -X DELETE "repos/$REPO/git/refs/heads/$BRANCH"
```

## 11. Branch overview without PR noise

Don't commit marker files and open PRs per branch. Rebuild one issue ("Active branches") on `create`/`delete`/`workflow_dispatch` with `actions/github-script`. Group branches as open PR / unmerged work / merged, using `repos.compareCommitsWithBasehead`. Use `concurrency: {group: registry, cancel-in-progress: true}` (each run rebuilds everything), and grant `issues: write` plus read scopes. Never delete from it.

## 12. Specialized or heavy workflows (art QA, asset export, screenshots)

Make them `workflow_dispatch` only, unless a narrow `paths` filter guarantees they fire only for their own inputs. Check out `${{ github.ref_name }}`, not a hard-coded branch name, and refuse to commit to the default branch: `if: github.ref_name != github.event.repository.default_branch`.
