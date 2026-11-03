// Test checks (VER-01): never skip, weaken or delete a test to get green.
import fs from 'node:fs';
import path from 'node:path';
import { matchesAny, names } from '../glob.mjs';
import { gitSubcommand, operands } from '../parse.mjs';
import { targetDir } from './synced.mjs';

/** Markers that skip or narrow a run. Each is counted on its own. */
export const MARKERS = [
  ['.skip(', /\.skip\(/g],
  ['.only(', /\.only\(/g],
  ['.todo(', /\.todo\(/g],
  ['.fixme(', /\.fixme\(/g],
  ['skip: true', /skip:\s*true/g],
  ['@pytest.mark.skip', /@pytest\.mark\.skip/g],
  ['@unittest.skip', /@unittest\.skip/g],
  ['xit(', /(?<![\w.])xit\(/g],
  ['xdescribe(', /(?<![\w.])xdescribe\(/g],
  ['xtest(', /(?<![\w.])xtest\(/g],
];
export const ASSERTIONS = [/\bexpect\(/g, /\bassert\w*[.(\s]/g, /\bt\.(is|deepEqual|true|false|throws)\(/g];

const JS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);

/** Remove comments: `//` and `/* *\/` in JS and TS files, `#` in Python. Strings are not parsed. */
export function stripComments(text, file) {
  const ext = path.extname(file);
  if (JS.has(ext)) return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  if (ext === '.py') return text.replace(/#[^\n]*/g, '');
  return text;
}

const count = (text, re) => (text.match(re) ?? []).length;
export const assertions = (text) => ASSERTIONS.reduce((n, re) => n + count(text, re), 0);

/** The message when `after` weakens `before`, else null. */
export function weakened(before, after, file) {
  const a = stripComments(before, file);
  const b = stripComments(after, file);
  const added = MARKERS.filter(([, re]) => count(b, re) > count(a, re)).map(([n]) => `\`${n}\``);
  if (added.length) return `adds ${added.join(', ')} to test file \`${file}\``;
  const [was, now] = [assertions(a), assertions(b)];
  return now < was ? `cuts assertions in test file \`${file}\` from ${was} to ${now}` : null;
}

/** `find` actions that delete what the search matched. */
const FIND_EXEC = new Set(['-exec', '-execdir', '-ok', '-okdir']);
const FIND_FILTERS = new Set(['-name', '-iname', '-path', '-ipath', '-wholename', '-iwholename']);

/** True when a `find` call deletes: `-delete`, or an exec action that runs `rm` or `git rm`. */
export function findDeletes(args) {
  if (args.includes('-delete')) return true;
  return args.some((a, i) => FIND_EXEC.has(a) && (args[i + 1] === 'rm' || (args[i + 1] === 'git' && args[i + 2] === 'rm')));
}

/**
 * What a deleting `find` reaches: { starts, filters }. Starts are the words before the first
 * expression word; filters are the values of -name and -path style tests.
 */
export function findScope(args) {
  const first = args.findIndex((a) => a.startsWith('-') || a === '(' || a === '!');
  const starts = first === -1 ? args : args.slice(0, first);
  const filters = args.flatMap((a, i) => (FIND_FILTERS.has(a) && args[i + 1] !== undefined ? [args[i + 1]] : []));
  return { starts: starts.length ? starts : ['.'], filters };
}

/** A filter value names test paths when, read as a file or folder name, it matches the test globs. */
const filterNamesTests = (value, facts) => names(facts.tests, value.replace(/^\.\//, '')) || matchesAny(facts.tests, `x/${value}`);

/** The test path a deleting `find` reaches, or null. */
function findHit(c, facts) {
  if (!findDeletes(c.args)) return null;
  const { starts, filters } = findScope(c.args);
  for (const s of starts) {
    const rel = facts.rel(s, c.dir);
    if (rel === null) continue;
    if (rel !== '.' && names(facts.tests, rel)) return rel;
    // No name filter: everything under the start goes, so ask when it holds a tracked test file.
    if (!filters.length) {
      const tracked = facts.git(['ls-files', '-z', '--', rel]);
      const test = (tracked ?? '').split('\0').find((f) => f && matchesAny(facts.tests, f));
      if (test) return test;
    }
  }
  return filters.find((f) => filterNamesTests(f, facts)) ?? null;
}

/** Earlier stages of the call's pipeline, as words: `find … | xargs rm` takes its paths from them. */
function piped(c, facts) {
  return facts
    .commands()
    .filter((x) => x.pipeline === c.pipeline && x.stage < c.stage)
    .flatMap((x) => x.args.filter((a) => !a.startsWith('-')));
}

const isDir = (abs) => fs.existsSync(abs) && fs.statSync(abs).isDirectory();
const MV_VALUED = new Set(['-t', '--target-directory', '-S', '--suffix']);

/**
 * The root-relative folder a move puts its sources in: the -t argument, an existing destination
 * directory, or the destination's dirname. Null when it is outside the root or unknown.
 */
function moveTarget(t, dest, dir, facts) {
  if (t !== null) return facts.rel(t, dir);
  if (dest === undefined || dest === null) return null;
  const rel = facts.rel(dest, dir);
  if (rel === null) return null;
  const abs = path.resolve(dir, dest);
  return isDir(abs) ? rel : path.posix.dirname(rel);
}

export const checks = [
  {
    id: 'tests.weaken',
    rule: 'VER-01',
    tools: ['Edit', 'Write'],
    mode: 'ask', // D-034
    test(input, facts) {
      const t = input.tool_input ?? {};
      if (typeof t.file_path !== 'string') return null;
      const rel = facts.rel(t.file_path);
      if (rel === null || !matchesAny(facts.tests, rel)) return null;
      if (input.tool_name === 'Edit') return weakened(String(t.old_string ?? ''), String(t.new_string ?? ''), rel);
      const abs = path.resolve(facts.cwd, t.file_path);
      // A new file never warns.
      if (!fs.existsSync(abs)) return null;
      return weakened(fs.readFileSync(abs, 'utf8'), String(t.content ?? ''), rel);
    },
  },
  {
    id: 'tests.delete',
    rule: 'VER-01',
    tools: ['Bash'],
    mode: 'ask', // D-034
    test(input, facts) {
      for (const c of facts.commands()) {
        if (c.name === 'find') {
          const hit = findHit(c, facts);
          if (hit) return `\`find\` deletes test path \`${hit}\`: never delete a test to get green`;
          continue;
        }
        let sources = [];
        let move = null; // the command's words after `mv` or `git mv`
        let deleting = c.name === 'rm';
        if (c.name === 'rm') sources = operands(c.args);
        else if (c.name === 'mv') move = c.args;
        else if (c.name === 'git') {
          const { sub, rest } = gitSubcommand(c.args);
          if (sub === 'rm') {
            sources = operands(rest);
            deleting = true;
          } else if (sub === 'mv') move = rest;
        }
        // `… | xargs rm` with no paths of its own deletes what the earlier stages list.
        if (!move && !sources.length && c.stage > 0 && deleting) {
          const hit = piped(c, facts).find((w) => filterNamesTests(w, facts) || (facts.rel(w, c.dir) !== null && facts.rel(w, c.dir) !== '.' && names(facts.tests, facts.rel(w, c.dir))));
          if (hit) return `deletes test paths listed by an earlier pipeline stage (\`${hit}\`): never delete a test to get green`;
        }
        let into = null; // root-relative destination folder of a move; null when outside the root
        if (move) {
          const t = targetDir(move);
          const ops = operands(move, MV_VALUED);
          sources = t === null ? ops.slice(0, -1) : ops;
          into = moveTarget(t, t === null ? ops.at(-1) : null, c.dir, facts);
        }
        // A rename within one folder is quiet, unless the source is a whole folder (`mv tests old-tests`).
        const renamed = (s, r) => into !== null && path.posix.dirname(r) === into && !isDir(path.resolve(c.dir, s));
        const hit = sources.map((s) => [s, facts.rel(s, c.dir)]).find(([s, r]) => r !== null && names(facts.tests, r) && !renamed(s, r))?.[1];
        if (hit) return `${move ? 'moves' : 'deletes'} test path \`${hit}\`: never delete a test to get green`;
      }
      return null;
    },
  },
];
