// Guard runtime: reads the hook input, runs each check inside try/catch, writes the output JSON and
// the log. Every path fails open: any error lets the tool call through with a one-line note.
// No dependencies; Node 18 or newer. Synced from AI-Master-Instructions (hook/guards); edit it there.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { gitSubcommand, parse } from './parse.mjs';

/** The default mode. A check sets its own: 'ask' or 'deny' (D-034, D-037); Stop never emits a decision. */
export const MODE = 'warn';
export const DEADLINE_MS = 6000;
export const GIT_TIMEOUT_MS = 2000;
export const PREFIX = 'ai-master-guard';
export const DEFAULT_TESTS = ['**/*.test.*', '**/*.spec.*', '**/__tests__/**', 'tests/**', 'test/**', 'e2e/**'];
export const DEFAULT_PROTECTED = ['secrets/**', '.env', '.env.*', '*.pem', 'id_rsa*'];
export const NEVER_PROTECTED = ['.env.example', '.env.sample'];

export class GuardError extends Error {}

export function firstLine(err) {
  return String(err?.message ?? err).split('\n')[0];
}

export function createClock(start = Date.now(), budget = DEADLINE_MS) {
  return {
    left: () => start + budget - Date.now(),
    over: () => Date.now() >= start + budget,
  };
}

/**
 * Run git. Returns stdout without trailing newlines, or null when git exits non-zero or is missing
 * ("can't confirm"). A timeout throws a GuardError, which the runtime reports as an error.
 */
export function git(args, { cwd, clock, limit }) {
  const timeout = Math.min(GIT_TIMEOUT_MS, clock.left());
  if (timeout <= 0) throw new GuardError(`deadline passed before git ${args[0]}`);
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: limit ?? 4 * 1024 * 1024 }).replace(/\n+$/, '');
  } catch (err) {
    if (err.code === 'ETIMEDOUT') throw new GuardError(`git ${args[0]} timed out after ${timeout} ms`);
    // With a limit, a longer output is cut to its first `limit` characters instead of failing.
    if (limit && err.code === 'ENOBUFS' && typeof err.stdout === 'string') return err.stdout.slice(0, limit);
    return null;
  }
}

// ---------- project facts ----------

/**
 * Facts about the project, each read lazily and once per call:
 * root, stateDir, session, synced, handoff, base, tests, protected, userEmail.
 * Also env (the hook's environment). Helpers: git(args, dir, { limit }), rel(arg, dir), commands(), notes (config errors to show).
 */
export function createFacts(input, clock, env = process.env) {
  const cwd = typeof input?.cwd === 'string' && input.cwd ? input.cwd : env.CLAUDE_PROJECT_DIR || process.cwd();
  const cache = new Map();
  const notes = [];
  // A fact that failed (a git timeout) fails again at once, so later checks don't wait for it too.
  const once = (key, fn) => {
    if (!cache.has(key)) {
      try {
        cache.set(key, { value: fn() });
      } catch (error) {
        cache.set(key, { error });
      }
    }
    const hit = cache.get(key);
    if (hit.error) throw hit.error;
    return hit.value;
  };
  const run = (args, dir, opts = {}) => git(args, { cwd: dir ?? facts.root, clock, ...opts });

  const facts = {
    cwd,
    env,
    input,
    notes,
    git: run,
    get root() {
      return once('root', () => path.resolve(git(['rev-parse', '--show-toplevel'], { cwd, clock }) ?? env.CLAUDE_PROJECT_DIR ?? cwd));
    },
    get stateDir() {
      return once('stateDir', () => {
        const common = run(['rev-parse', '--git-common-dir']);
        if (common === null) return null;
        const dir = path.resolve(facts.root, common, 'ai-master');
        fs.mkdirSync(dir, { recursive: true });
        return dir;
      });
    },
    /** { head, ts } at the session's first hook call; written on first use. Null without git or a session id. */
    get session() {
      return once('session', () => {
        const file = sessionFile(facts, input);
        if (!file) return null;
        if (fs.existsSync(file)) {
          try {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
          } catch {
            // A damaged state file is rewritten below.
          }
        }
        const state = { head: run(['rev-parse', '--verify', '--quiet', 'HEAD']) || null, ts: Math.floor(Date.now() / 1000) };
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify(state) + '\n');
        return state;
      });
    },
    get synced() {
      return once('synced', () => {
        const file = path.join(facts.root, '.ai-master.lock');
        if (!fs.existsSync(file)) return null;
        const lock = JSON.parse(fs.readFileSync(file, 'utf8'));
        return new Set([...Object.keys(lock.files ?? {}), '.ai-master.lock']);
      });
    },
    get handoff() {
      return once('handoff', () => ['docs/HANDOFF.md', 'HANDOFF.md'].find((p) => fs.existsSync(path.join(facts.root, p))) ?? null);
    },
    get base() {
      return once('base', () => {
        const head = run(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
        if (head) return head;
        for (const b of ['origin/main', 'origin/master']) {
          if (run(['rev-parse', '--verify', '--quiet', `refs/remotes/${b}`])) return b;
        }
        return null;
      });
    },
    get tests() {
      return once('tests', () => guardList(facts, input, 'tests', DEFAULT_TESTS));
    },
    get protected() {
      return once('protected', () => guardList(facts, input, 'protected', DEFAULT_PROTECTED));
    },
    get userEmail() {
      return once('userEmail', () => run(['config', 'user.email']) || null);
    },
    /** The Bash call's simple commands, each with the directory it runs in. */
    commands() {
      return once('commands', () => withDirs(parse(input?.tool_input?.command ?? ''), cwd));
    },
    /** A command argument as a POSIX path relative to the root, resolved against dir; null if outside the root. */
    rel(arg, dir = cwd) {
      // `~` and `$VAR` expand outside what we can see; treat them as outside the root.
      if (typeof arg !== 'string' || /^[~$]/.test(arg)) return null;
      const abs = path.resolve(dir, arg);
      const r = path.relative(facts.root, abs);
      if (r === '') return '.';
      if (r === '..' || r.startsWith(`..${path.sep}`) || path.isAbsolute(r)) return null;
      return r.split(path.sep).join('/');
    },
  };
  return facts;
}

export const validSessionId = (id) => typeof id === 'string' && /^[\w.-]+$/.test(id);

function sessionFile(facts, input) {
  const id = input?.session_id;
  if (!validSessionId(id)) return null;
  const dir = facts.stateDir;
  return dir ? path.join(dir, 'sessions', `${id}.json`) : null;
}

/** guards.<key> from .ai-master.json, or the defaults. A bad value is noted once per session. */
function guardList(facts, input, key, defaults) {
  const file = path.join(facts.root, '.ai-master.json');
  if (!fs.existsSync(file)) return defaults;
  let value;
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'))?.guards?.[key];
  } catch {
    noteOnce(facts, input, 'manifest-json', '.ai-master.json is not valid JSON; using the default guard paths');
    return defaults;
  }
  if (value === undefined) return defaults;
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return value;
  noteOnce(facts, input, `guards.${key}`, `.ai-master.json guards.${key} must be an array of strings; using the defaults`);
  return defaults;
}

function noteOnce(facts, input, key, message) {
  const file = sessionFile(facts, input);
  if (file) {
    // Mutate the cached state, so a second note in the same call keeps the first one's key.
    const state = facts.session;
    if (state) {
      state.notesShown ??= [];
      if (state.notesShown.includes(key)) return;
      state.notesShown.push(key);
      fs.writeFileSync(file, JSON.stringify(state) + '\n');
    }
  }
  facts.notes.push({ check: 'config', message });
}

/** Merge `patch` into the cached session state and write it back, as noteOnce does. No-op without a session file. */
export function updateSession(facts, patch) {
  const file = facts && sessionFile(facts, facts.input);
  const state = file && facts.session;
  if (!state) return;
  Object.assign(state, patch);
  fs.writeFileSync(file, JSON.stringify(state) + '\n');
}

/** Simple commands with the directory each runs in: cwd, changed by an earlier `cd` or by `git -C`. */
export function withDirs(commands, cwd) {
  let dir = cwd;
  return commands.map((c) => {
    let at = dir;
    if (c.name === 'git') {
      const { dir: d } = gitSubcommand(c.args);
      if (d) at = path.resolve(dir, d);
    }
    if (c.name === 'cd' && c.args[0] && !c.args[0].startsWith('-') && !c.args[0].startsWith('~')) dir = path.resolve(dir, c.args[0]);
    return { ...c, dir: at };
  });
}

// ---------- running checks ----------

export function note({ check, mode, message, rule }) {
  return `${PREFIX} ${check} (${mode}): ${message} (${rule})`;
}

/** The log outcome: the mode when PreToolUse acts on it, else warn. */
function outcome(event, w) {
  return event === 'PreToolUse' && (w.mode === 'ask' || w.mode === 'deny') ? w.mode : 'warn';
}

export function errorNote(message) {
  return `${PREFIX} error: ${message}; check skipped`;
}

/**
 * Run the checks for one hook event. Returns { stdout, warnings, errors }.
 * Never throws: any failure becomes an error note.
 */
export function run(event, checks, input, { env = process.env, clock = createClock(), errors: earlier = [] } = {}) {
  const warnings = [];
  const errors = [...earlier];
  let facts = null;
  try {
    facts = createFacts(input, clock, env);
    void facts.session; // records the session's start on its first hook call
  } catch (err) {
    errors.push({ check: 'runtime', message: firstLine(err) });
  }
  const tool = input?.tool_name;
  for (const check of checks) {
    if (check.tools && !check.tools.includes(tool)) continue;
    if (clock.over()) {
      errors.push({ check: 'runtime', message: 'deadline passed; remaining checks skipped' });
      break;
    }
    try {
      const message = check.test(input, facts);
      if (message) warnings.push({ check: check.id, rule: check.rule, message, mode: check.mode ?? MODE });
    } catch (err) {
      errors.push({ check: check.id, message: firstLine(err) });
    }
  }
  if (facts) errors.push(...facts.notes);

  const out = {};
  const active = event === 'PreToolUse' ? warnings : [];
  const decision = active.some((w) => w.mode === 'deny') ? 'deny' : active.some((w) => w.mode === 'ask') ? 'ask' : null;
  if (warnings.length) {
    const text = warnings.map(note).join('\n');
    out.hookSpecificOutput = decision
      ? { hookEventName: event, permissionDecision: decision, permissionDecisionReason: text }
      : { hookEventName: event, additionalContext: text };
  }
  if (errors.length) out.systemMessage = [...new Set(errors.map((e) => errorNote(e.message)))].join('\n');

  try {
    log(facts, input, event, warnings, errors);
  } catch {
    // Logging is best effort; the warning still reaches Claude.
  }
  return { stdout: Object.keys(out).length ? JSON.stringify(out) : '', warnings, errors, facts };
}

/**
 * On a PreToolUse Bash call that runs `git commit`, write and stage the session's drift counts.
 * Adds 1 to commit_calls per hook call. Never throws: a failure is logged as an `error` line.
 */
async function countCommit(event, input, facts, clock) {
  if (event !== 'PreToolUse' || input?.tool_name !== 'Bash' || !facts || clock.over()) return;
  try {
    const commit = facts.commands().find((c) => c.name === 'git' && gitSubcommand(c.args).sub === 'commit');
    if (!commit) return;
    const { writeCounts } = await import(new URL('./counts.mjs', import.meta.url).href);
    writeCounts(facts, input, commit.dir, clock);
  } catch (err) {
    try {
      log(facts, input, event, [], [{ check: 'counts', message: firstLine(err) }]);
    } catch {
      // Logging is best effort.
    }
  }
}

/** Append one JSON line per warning or error to <git common dir>/ai-master/guards.jsonl. */
export function log(facts, input, event, warnings, errors) {
  if (!facts || (!warnings.length && !errors.length)) return;
  let dir;
  try {
    dir = facts.stateDir;
  } catch {
    return;
  }
  if (!dir) return;
  const base = {
    ts: new Date().toISOString(),
    session_id: input?.session_id ?? null,
    agent_id: input?.agent_id ?? null,
    agent_type: input?.agent_type ?? null,
    event,
  };
  const lines = [
    ...warnings.map((w) => ({ ...base, check: w.check, rule: w.rule, mode: w.mode, outcome: outcome(event, w), detail: w.message.slice(0, 200) })),
    ...errors.map((e) => ({ ...base, check: e.check, rule: null, mode: MODE, outcome: 'error', detail: e.message.slice(0, 200) })),
  ];
  fs.appendFileSync(path.join(dir, 'guards.jsonl'), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
}

/** Entry point: read stdin, load the check modules, run, print. Always exits 0. */
export async function main(event, moduleUrls, { stdin = 0, write = (s) => process.stdout.write(s), env = process.env } = {}) {
  const clock = createClock();
  let input;
  try {
    input = JSON.parse(fs.readFileSync(stdin, 'utf8'));
    if (!input || typeof input !== 'object') throw new GuardError('hook input is not a JSON object');
  } catch (err) {
    write(JSON.stringify({ systemMessage: errorNote(firstLine(err)) }));
    return;
  }
  const checks = [];
  const loadErrors = [];
  for (const url of moduleUrls) {
    try {
      checks.push(...(await import(url)).checks);
    } catch (err) {
      loadErrors.push({ check: 'runtime', message: `${path.basename(String(url))}: ${firstLine(err)}` });
    }
  }
  const { stdout, facts } = run(event, checks, input, { env, clock, errors: loadErrors });
  await countCommit(event, input, facts, clock);
  if (stdout) write(stdout);
}
