#!/usr/bin/env bash
# Template: decide which CI tiers a run needs from the change's own diff.
# Copy to scripts/ci-scope.sh and edit the three regexes for the repository.
# Inputs (env): CI_EVENT (github.event_name), CI_FULL (true to force Tier 3).
# Needs actions/checkout with fetch-depth: 2. On pull_request HEAD is GitHub's merge
# commit, so HEAD^1 is the base and the diff is exactly the PR's change.
# Output: key=value lines in $GITHUB_OUTPUT (stdout when run locally).
set -euo pipefail

HIGH_RISK='^(package(-lock)?\.json|pnpm-lock\.yaml|\.nvmrc|tsconfig[^/]*\.json|[a-z]+\.config\.(ts|js|mjs)|\.github/workflows/)'
INTEGRATION='^(src/core/|src/sim/)'          # paths whose changes need integration tests
BROWSER='^(src/|tests/e2e/|index\.html$)'    # paths whose changes need browser tests

out="${GITHUB_OUTPUT:-/dev/stdout}"
full=false
if [ "${CI_FULL:-false}" = true ]; then full=true; fi

if git rev-parse -q --verify HEAD^1 >/dev/null; then
  changed="$(git diff --name-only HEAD^1 HEAD)"
else
  changed="$(git ls-files)"
fi

# Never `grep -q` here: under pipefail an early exit SIGPIPEs printf and reads as "no match".
matches() { printf '%s\n' "$changed" | grep -E "$1" >/dev/null; }

docs_only=true
if printf '%s\n' "$changed" | grep -Ev '\.md$' >/dev/null; then docs_only=false; fi
if matches "$HIGH_RISK"; then full=true; fi

integration=false
browser=false
if [ "${CI_EVENT:-}" = pull_request ] || [ "$full" = true ]; then
  if matches "$INTEGRATION"; then integration=true; fi
  if matches "$BROWSER"; then browser=true; fi
fi
if [ "$full" = true ]; then
  docs_only=false; integration=true; browser=true
  engines='[{"project":"chromium"},{"project":"firefox"},{"project":"webkit"}]'
else
  engines='[{"project":"chromium"}]'
fi

{
  echo "docs_only=$docs_only"
  echo "full=$full"
  echo "integration=$integration"
  echo "browser=$browser"
  echo "engines=$engines"
} >>"$out"
printf 'Changed files:\n%s\n' "$changed" | head -50
