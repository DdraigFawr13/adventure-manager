// Drift counts: on a `git commit` call, write this session's guard counts to
// docs/harness/drift/<date>-<session_id>.json and stage the file, so the commit carries them,
// with each warning's one-line detail.
// Opt-in: only runs where that folder exists. Called by lib.mjs; it throws on failure and the
// caller logs an error line and lets the call through. No dependencies; Node 18 or newer.
// Synced from AI-Master-Instructions (hook/guards); edit it there.

import fs from 'node:fs';
import path from 'node:path';

export const DRIFT_DIR = 'docs/harness/drift';

/**
 * Write and stage the session's counts file in the repo `dir` runs in.
 * Returns the file's path relative to the repo's top level, or null when it writes nothing.
 */
export function writeCounts(facts, input, dir, clock) {
  const sessionId = input?.session_id;
  if (typeof sessionId !== 'string' || !/^[\w.-]+$/.test(sessionId)) return null;
  // A subagent shares its parent's session_id; it gets its own file, so parallel worktree branches never collide.
  const agentId = typeof input?.agent_id === 'string' && /^[\w.-]+$/.test(input.agent_id) ? input.agent_id : null;
  const id = agentId ? `${sessionId}.${agentId}` : sessionId;
  if (clock.over()) return null;
  const session = facts.session; // null without git or a usable session id
  const stateDir = facts.stateDir;
  if (!session || !stateDir) return null;
  const top = facts.git(['rev-parse', '--show-toplevel'], dir);
  if (!top) return null;
  const folder = path.join(top, DRIFT_DIR);
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) return null;

  // This session's earlier file, if any: its name, date and numbers carry over.
  const suffix = `-${id}.json`;
  const earlierName = fs.readdirSync(folder).sort().find((n) => n.endsWith(suffix) && /^\d{4}-\d{2}-\d{2}$/.test(n.slice(0, -suffix.length)));
  let earlier = null;
  if (earlierName) {
    try {
      earlier = JSON.parse(fs.readFileSync(path.join(folder, earlierName), 'utf8'));
    } catch {
      earlier = null; // a damaged file is rewritten under the same name
    }
  }

  const { counts, warnings: fresh } = tally(path.join(stateDir, 'guards.jsonl'), sessionId, agentId);
  for (const [check, n] of Object.entries(earlier?.counts ?? {})) {
    if (Number.isFinite(n) && n > (counts[check] ?? 0)) counts[check] = n;
  }
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const prior = Number.isFinite(earlier?.commit_calls) ? earlier.commit_calls : 0;
  const date = typeof earlier?.date === 'string' ? earlier.date : new Date(Number.isFinite(session.ts) ? session.ts * 1000 : Date.now()).toISOString().slice(0, 10);
  const name = earlierName ?? `${date}${suffix}`;
  const warnings = mergeWarnings(Array.isArray(earlier?.warnings) ? earlier.warnings : [], fresh);
  const body = { date, session: sessionId, ...(agentId ? { agent: agentId } : {}), commit_calls: prior + 1, counts: sorted, ...(warnings.length ? { warnings } : {}) };

  fs.writeFileSync(path.join(folder, name), JSON.stringify(body) + '\n');
  const rel = `${DRIFT_DIR}/${name}`;
  if (facts.git(['add', '--', rel], top) === null) throw new Error(`git add ${rel} failed (is it ignored?)`);
  return rel;
}

/** How many warning details a drift file keeps. */
export const WARNINGS_KEPT = 50;
const DETAIL = new Set(['warn', 'ask', 'deny', 'allowed']);

/** The earlier file's details, then the new ones, without repeats by ts plus check; the last WARNINGS_KEPT. */
function mergeWarnings(earlier, fresh) {
  const seen = new Set();
  const out = [];
  for (const w of [...earlier, ...fresh]) {
    if (typeof w?.ts !== 'string' || typeof w.check !== 'string') continue;
    const key = `${w.ts} ${w.check}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out.slice(-WARNINGS_KEPT);
}

/**
 * For one session and agent (null: the main agent): counts of warn, ask and deny lines per check,
 * allowed lines as allowed:<check> and error lines as error:<check>; and the details of every
 * warn, ask, deny and allowed line that has a ts, in log order.
 */
function tally(file, id, agentId) {
  const counts = {};
  const warnings = [];
  if (!fs.existsSync(file)) return { counts, warnings };
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry?.session_id !== id || (entry.agent_id ?? null) !== agentId || typeof entry.check !== 'string') continue;
    const { outcome, check } = entry;
    const key = outcome === 'error' ? `error:${check}` : outcome === 'allowed' ? `allowed:${check}` : outcome === 'warn' || outcome === 'ask' || outcome === 'deny' ? check : null;
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
    if (DETAIL.has(outcome) && typeof entry.ts === 'string') {
      warnings.push({ ts: entry.ts, check, outcome, detail: String(entry.detail ?? '').slice(0, 200) });
    }
  }
  return { counts, warnings };
}
