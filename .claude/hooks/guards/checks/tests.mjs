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
        let sources = [];
        let move = null; // the command's words after `mv` or `git mv`
        if (c.name === 'rm') sources = operands(c.args);
        else if (c.name === 'mv') move = c.args;
        else if (c.name === 'git') {
          const { sub, rest } = gitSubcommand(c.args);
          if (sub === 'rm') sources = operands(rest);
          else if (sub === 'mv') move = rest;
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
