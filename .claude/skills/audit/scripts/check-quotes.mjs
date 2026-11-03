#!/usr/bin/env node
// Check every `path:line "quote"` in a report against the file (WS-01). Paths resolve against each base folder in order, then by a
// unique suffix match. A quote must sit inside the cited line or range. Exits 1 on any unverified quote, on zero quotes unless
// --expect 0 is given, or when --expect differs from the count.
//   node .claude/skills/audit/scripts/check-quotes.mjs <report.md> <base folder>... [--expect <n>]
import fs from 'node:fs'; import path from 'node:path';

// Keep PATH and EXT in step with audit-shape.mjs (tests/audit/quotes.test.mjs checks they match).
const PATH = '[\\w./-]+';
const EXT = 'md|js|mjs|cjs|ts|tsx|jsx|json|py|toml|yml|yaml|sh|css|scss|html|vue|svelte|txt|xml|svg|ini|cfg|rs|go|java|kt|c|h|cpp|cs|rb|php|swift|lua|gd';

const args = process.argv.slice(2); let expect = null; const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--expect')) {
    const n = args[i + 1];
    if (args[i] !== '--expect' || expect !== null || n === undefined || !/^\d+$/.test(n)) { console.log('   ?? bad --expect'); process.exit(1); }
    expect = +n; i++;
  } else pos.push(args[i]);
}
const [rep, ...bases] = pos;
for (const f of [rep, ...bases]) if (!f || !fs.existsSync(f)) { console.log(`   ?? ${f ?? 'report'}: file not found`); process.exit(1); }
const txt = fs.readFileSync(rep, 'utf8');
const files = []; const walk = (d) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) { if (n.name === 'node_modules' || n.name === '.git') continue; const p = path.join(d, n.name); n.isDirectory() ? walk(p) : files.push(p); } };
bases.forEach((b) => fs.statSync(b).isDirectory() ? walk(b) : files.push(b));
const isFile = (f) => fs.existsSync(f) && fs.statSync(f).isFile();
// A path from a base, else the one file whose path ends with it; otherwise 'ambiguous' or 'unresolved'.
const resolve = (p) => {
  if (path.isAbsolute(p)) return isFile(p) ? p : 'unresolved';
  for (const b of bases) if (isFile(path.join(b, p))) return path.join(b, p);
  const hits = [...new Set(files.filter((f) => f.endsWith('/' + p)))];
  return hits.length === 1 ? hits[0] : hits.length > 1 ? 'ambiguous' : 'unresolved';
};
const norm = (s) => s.replace(/\\n/g,'').replace(/[`*]/g,'').replace(/\s+/g, ' ').trim();
let ok = 0, bad = [], seen = 0;
const re = new RegExp(`(${PATH}\\.(?:${EXT})):(\\d+)(?:-(\\d+))?[^"\\n]{0,40}?"(.{4,}?)"(?=\\s*(?:\\(|$|\\n|\\/|;|,|followed))`, 'gm'); let m;
while ((m = re.exec(txt))) {
  seen++; const [, raw, a, b, q] = m; const p = raw.replace(/^(\.\/)+/, ''); const f = resolve(p);
  if (f === 'ambiguous' || f === 'unresolved') { bad.push(`${p}:${a} ${f}`); continue; }
  const L = fs.readFileSync(f, 'utf8').split('\n'); const lo = +a - 1, hi = b ? +b : +a;
  const win = norm(L.slice(Math.max(0, lo), hi).join(' '));
  const parts = q.split(/"\s*\/\s*"|\s\/\s/).map((x) => norm(x.replace(/\.\.\.|…/g, ''))).filter(Boolean);
  parts.every((x) => win.includes(x)) ? ok++ : bad.push(`${p}:${a}${b ? '-' + b : ''} "${q.slice(0, 80)}"`);
}
console.log(`${path.basename(rep)}: quotes=${seen} verified=${ok} unverified=${bad.length}`); bad.forEach((x) => console.log('   ?? ' + x));
if (expect !== null && expect !== seen) console.log(`   ?? expected ${expect} quotes, found ${seen}`);
if (bad.length || (seen === 0 && expect !== 0) || (expect !== null && expect !== seen)) process.exitCode = 1;
