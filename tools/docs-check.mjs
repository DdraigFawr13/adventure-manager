// Docs checker (D-092): every decision id cited in docs/ exists in DECISIONS.md, and accepted PLAN sections have no leftover draft markers. Usage: node tools/docs-check.mjs [repo-root]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = process.argv[2] || process.cwd();
const dec = readFileSync(join(root, 'docs/DECISIONS.md'), 'utf8');
const ids = new Set([...dec.matchAll(/^## (D-\d{3}) /gm)].map(m => m[1]));
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'archive') walk(p); } else if (/\.(md|html)$/.test(f)) files.push(p); } })(join(root, 'docs'));
let problems = 0;
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    for (const m of l.matchAll(/D-(\d{3})(?:\s*(?:\.\.|–|-)\s*(?:D-)?(\d{3}))?/g)) {
      const a = +m[1], b = m[2] ? +m[2] : a;
      for (let n = a; n <= b; n++) { const id = 'D-' + String(n).padStart(3, '0'); if (!ids.has(id)) { problems++; console.log(`${f.slice(root.length + 1)}:${i + 1} cites ${id}, not in DECISIONS`); } }
    }
  });
}
const plan = readFileSync(join(root, 'docs/design/PLAN.md'), 'utf8').split('\n');
let inAccepted = false;
plan.forEach((l, i) => {
  if (/^## \d+\./.test(l)) inAccepted = /\(Accepted /.test(l);
  if (inAccepted && /\(Draft |\(Proposed\)|open question/.test(l)) { problems++; console.log(`docs/design/PLAN.md:${i + 1} accepted section still says: ${l.trim().slice(0, 80)}`); }
});
console.log(problems ? `${problems} problem(s)` : `OK: ${ids.size} decisions, ${files.length} files checked`);
process.exit(problems ? 1 : 0);
