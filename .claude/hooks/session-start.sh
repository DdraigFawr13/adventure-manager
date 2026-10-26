#!/usr/bin/env bash
# SessionStart hook for Claude Code cloud sessions, synced from AI-Master-Instructions.
# Installs the pinned Node and npm (from .nvmrc and package.json "packageManager"), installs
# dependencies with the project's package manager, and points Playwright at the container's
# Chromium when its pinned build is missing. Then runs .claude/hooks/session-start.local.sh
# if the project has one. Local sessions (no CLAUDE_CODE_REMOTE) are left alone.
# A failed step is reported but never blocks the session.

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

say() { echo "session-start: $*"; }
persist() { [ -n "${CLAUDE_ENV_FILE:-}" ] && echo "export $1" >> "$CLAUDE_ENV_FILE"; }

# 1. Pinned Node, only when .nvmrc asks for a version the container lacks.
if [ -f .nvmrc ] && command -v curl >/dev/null; then
  want="$(tr -d 'v[:space:]' < .nvmrc)"
  have="$(node -v 2>/dev/null | tr -d 'v')"
  case "$want" in
    *.*.*) ;;
    *) want="" ;; # only exact versions (x.y.z) are installed; ranges use the container's Node
  esac
  if [ -n "$want" ] && [ "$want" != "$have" ]; then
    dir="${HOME}/.cache/node/node-v${want}-linux-x64"
    if [ ! -x "${dir}/bin/node" ]; then
      mkdir -p "${HOME}/.cache/node"
      say "installing Node ${want}"
      curl -fsSL "https://nodejs.org/dist/v${want}/node-v${want}-linux-x64.tar.xz" \
        | tar -xJ -C "${HOME}/.cache/node" || say "Node ${want} download failed; using $(node -v)"
    fi
    if [ -x "${dir}/bin/node" ]; then
      export PATH="${dir}/bin:${PATH}"
      persist "PATH=\"${dir}/bin:\$PATH\""
    fi
  fi
fi

# 2. Dependencies, by lockfile.
if [ -f package.json ]; then
  pm="$(node -p "(require('./package.json').packageManager||'').split('@')[0]" 2>/dev/null)"
  if [ -f pnpm-lock.yaml ] || [ "$pm" = pnpm ]; then
    command -v pnpm >/dev/null || corepack enable >/dev/null 2>&1
    pnpm install --frozen-lockfile --silent >/dev/null 2>&1 || say "pnpm install failed"
  elif [ -f yarn.lock ] || [ "$pm" = yarn ]; then
    command -v yarn >/dev/null || corepack enable >/dev/null 2>&1
    yarn install --frozen-lockfile --silent >/dev/null 2>&1 || say "yarn install failed"
  else
    npm_want="$(node -p "const p=require('./package.json').packageManager||'';p.startsWith('npm@')?p.slice(4):''" 2>/dev/null)"
    if [ -n "$npm_want" ] && [ "$(npm -v 2>/dev/null)" != "$npm_want" ]; then
      npm install --global "npm@${npm_want}" --silent >/dev/null 2>&1 || say "npm ${npm_want} install failed"
    fi
    # npm install (not ci) reuses the container's cached node_modules.
    npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || say "npm install failed"
  fi
fi

# 3. Playwright: use the container's Chromium when the pinned build isn't installed.
browsers="${PLAYWRIGHT_BROWSERS_PATH:-}"
if [ -n "$browsers" ] && [ -d "$browsers" ] && [ -f node_modules/playwright-core/browsers.json ]; then
  rev="$(node -p "require('./node_modules/playwright-core/browsers.json').browsers.find(b => b.name === 'chromium').revision" 2>/dev/null)"
  if [ -n "$rev" ] && [ ! -d "${browsers}/chromium-${rev}" ]; then
    chrome="$(ls -d "${browsers}"/chromium-[0-9]*/chrome-linux*/chrome 2>/dev/null | sort -V | tail -n 1)"
    if [ -n "$chrome" ]; then
      persist "PLAYWRIGHT_CHROMIUM_PATH=\"${chrome}\""
      say "Playwright wants chromium-${rev}; PLAYWRIGHT_CHROMIUM_PATH=${chrome}"
    fi
  fi
fi

# 4. Project-specific steps.
if [ -f .claude/hooks/session-start.local.sh ]; then
  bash .claude/hooks/session-start.local.sh || say "session-start.local.sh failed"
fi

[ -f package.json ] && say "ready: node $(node -v 2>/dev/null)"
exit 0
