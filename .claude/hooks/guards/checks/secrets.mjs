// Secret checks (SAFE-02): printing, staging and writing protected files or key-like text.
// A matched secret is never quoted: messages name the file or the pattern, never the text.
import path from 'node:path';
import { names } from '../glob.mjs';
import { NEVER_PROTECTED } from '../lib.mjs';
import { gitSubcommand, hasFlag, operands } from '../parse.mjs';

/** Key patterns by name. The name is what a message shows. */
export const KEY_PATTERNS = [
  ['aws-key', /AKIA[0-9A-Z]{16}/],
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['github-token', /gh[pousr]_[A-Za-z0-9]{36}/],
  ['github-token', /github_pat_[A-Za-z0-9_]{22,}/],
  ['anthropic-key', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['slack-token', /xox[baprs]-[A-Za-z0-9-]{10,}/],
];

/** Only the first 1 MiB of a staged diff is scanned. */
export const DIFF_LIMIT = 1024 * 1024;

const PRINTERS = new Set(['cat', 'less', 'more', 'head', 'tail', 'bat', 'source', '.']);
/** Later pipeline stages that pass `env` output on without sending it anywhere else. */
const FILTERS = new Set(['grep', 'sort', 'uniq', 'head', 'tail', 'wc']);
/** A stage that writes a file or runs a program (`sort -o f`, `sort --compress-program=sh`, `uniq - out`) is not a filter. */
function writesFile(c) {
  if (c.name === 'sort') return c.args.some((a) => /^-[A-Za-z]*o/.test(a) || a.startsWith('--output') || a.startsWith('--compress-program'));
  if (c.name === 'uniq') return operands(c.args, new Set(['-f', '-s', '-w'])).some((a) => a !== '-');
  return false;
}
const SED_STRIP = /^s\/=\.\*\$?\/[^&\\]*\/g?$/;

/**
 * A value stripper: `cut` with only delimiter `=` and field 1 (`-d=`, `-d =`, `-f1`, `-f 1`), or `sed`
 * with an optional `-E` and one script matching SED_STRIP (no `&` or backreference). Any other option
 * or a file operand disqualifies it.
 */
export function stripsValues(c) {
  if (c.name === 'cut') {
    let delim = null;
    let field = null;
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      if (a === '-d') delim = c.args[++i] ?? null;
      else if (a.startsWith('-d')) delim = a.slice(2);
      else if (a === '-f') field = c.args[++i] ?? null;
      else if (a.startsWith('-f')) field = a.slice(2);
      else return false;
    }
    return delim === '=' && field === '1';
  }
  if (c.name === 'sed') {
    const words = c.args[0] === '-E' ? c.args.slice(1) : c.args;
    return words.length === 1 && SED_STRIP.test(words[0]);
  }
  return false;
}

/** True when a bare `env` or `printenv` at `c` feeds only filters, at least one value stripper, and no redirect. */
function excused(c, commands) {
  const line = commands.filter((x) => x.pipeline === c.pipeline);
  const later = line.filter((x) => x.stage > c.stage);
  if (!later.length || line.some((x) => x.redirects.length)) return false;
  return later.every((x) => (FILTERS.has(x.name) && !writesFile(x)) || stripsValues(x)) && later.some(stripsValues);
}

/** Names of the key patterns that match text, without repeats. */
export function keyNames(text) {
  if (typeof text !== 'string' || !text) return [];
  return [...new Set(KEY_PATTERNS.filter(([, re]) => re.test(text)).map(([n]) => n))];
}

/** True when a root-relative path is protected. `.env.example` and `.env.sample` never are. */
export function isProtected(rel, facts) {
  if (rel === null || rel === undefined) return false;
  if (NEVER_PROTECTED.includes(path.posix.basename(rel))) return false;
  return names(facts.protected, rel);
}

/** Root-relative paths from `git status --porcelain -z` or `git diff --name-only -z` output. */
function listed(out, porcelain) {
  if (!out) return [];
  const parts = out.split('\0').filter(Boolean);
  const paths = [];
  for (let i = 0; i < parts.length; i++) {
    if (!porcelain) {
      paths.push(parts[i]);
      continue;
    }
    const xy = parts[i].slice(0, 2);
    const file = parts[i].slice(3);
    // A rename or copy is followed by its old path, which is not being added.
    if (xy[0] === 'R' || xy[0] === 'C') i += 1;
    // A deletion stages no content.
    if (!xy.includes('D')) paths.push(file);
  }
  return paths;
}

const firstProtected = (paths, facts) => paths.find((p) => isProtected(p, facts));

/** Added lines (`+`, not `+++`) of a diff. */
const addedLines = (diff) => (diff ?? '').split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');

const COMMIT_VALUED = new Set(['-m', '-F', '-C', '-c', '-t', '--message', '--file', '--reuse-message', '--reedit-message', '--template', '--author', '--date', '--fixup', '--squash', '--trailer', '--cleanup']);

/** True when `git commit` args stage tracked changes too: -a, --all, or a short group such as -am. */
function commitAll(rest) {
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--') return false;
    if (a === '--all') return true;
    if (COMMIT_VALUED.has(a)) {
      i += 1;
      continue;
    }
    if (/^-[A-Za-z]+/.test(a) && !a.startsWith('--')) {
      // Letters up to the first that takes a value (-am msg: a, then m's value).
      for (const ch of a.slice(1)) {
        if (ch === 'a') return true;
        if ('mFCct'.includes(ch)) {
          if (a.endsWith(ch)) i += 1;
          break;
        }
      }
    }
  }
  return false;
}

function stage(c, facts) {
  const { sub, rest } = gitSubcommand(c.args);
  if (sub === 'add') {
    const ops = operands(rest, new Set(['--chmod', '--pathspec-from-file']));
    const named = ops.map((o) => facts.rel(o, c.dir)).find((r) => isProtected(r, facts));
    if (named) return `\`git add\` stages protected file \`${named}\``;
    // What the add would take in: run status on the same pathspecs, in the same directory.
    if (!ops.length && !hasFlag(rest, 'A', '--all')) return null;
    const out = facts.git(['status', '--porcelain', '-uall', '-z', '--', ...ops], c.dir);
    const hit = firstProtected(listed(out, true), facts);
    return hit ? `\`git add\` would stage protected file \`${hit}\`` : null;
  }
  if (sub === 'commit') {
    const all = commitAll(rest);
    const staged = listed(facts.git(['diff', '--cached', '--name-only', '-z'], c.dir), false);
    let hit = firstProtected(staged, facts);
    if (!hit && all) hit = firstProtected(listed(facts.git(['diff', '--name-only', '-z'], c.dir), false), facts);
    if (hit) return `\`git commit\` would commit protected file \`${hit}\``;
    // With -a, unstaged changes to tracked files are committed too, so scan them as well.
    // Plain diff text whatever the user's config: no colour, external diff or textconv.
    const plain = ['diff', '--no-color', '--no-ext-diff', '--no-textconv'];
    let text = addedLines(facts.git([...plain, '--cached'], c.dir, { limit: DIFF_LIMIT }));
    if (all) text += '\n' + addedLines(facts.git(plain, c.dir, { limit: DIFF_LIMIT }));
    const keys = keyNames(text);
    return keys.length ? `\`git commit\` would commit a line matching ${keys.join(', ')}` : null;
  }
  return null;
}

export const checks = [
  {
    id: 'secrets.print',
    rule: 'SAFE-02',
    tools: ['Bash'],
    mode: 'ask', // D-037
    test(input, facts) {
      const commands = facts.commands();
      for (const c of commands) {
        const bare = (c.name === 'printenv' || c.name === 'env') && !c.args.length;
        if (bare && excused(c, commands)) continue;
        if (c.name === 'printenv') return '`printenv` prints environment variables, which can hold secrets';
        if (c.name === 'env' && !c.args.length) return '`env` with no command prints environment variables, which can hold secrets';
        if (!PRINTERS.has(c.name)) continue;
        const hit = operands(c.args, new Set(['-n', '-c'])).map((o) => facts.rel(o, c.dir)).find((r) => isProtected(r, facts));
        if (hit) return `\`${c.name}\` prints protected file \`${hit}\``;
      }
      return null;
    },
  },
  {
    id: 'secrets.stage',
    rule: 'SAFE-02',
    tools: ['Bash'],
    mode: 'ask', // D-037
    test(input, facts) {
      for (const c of facts.commands()) {
        if (c.name !== 'git') continue;
        const message = stage(c, facts);
        if (message) return message;
      }
      return null;
    },
  },
  {
    id: 'secrets.write',
    rule: 'SAFE-02',
    tools: ['Edit', 'Write', 'NotebookEdit'],
    mode: 'ask', // D-037
    test(input, facts) {
      const t = input.tool_input ?? {};
      const file = t.file_path ?? t.notebook_path;
      if (typeof file === 'string' && isProtected(facts.rel(file), facts)) return `writes protected file \`${facts.rel(file)}\``;
      const keys = keyNames([t.content, t.new_string, t.new_source].filter((v) => typeof v === 'string').join('\n'));
      return keys.length ? `the new text matches ${keys.join(', ')}: keep keys in an ignored env file` : null;
    },
  },
];
