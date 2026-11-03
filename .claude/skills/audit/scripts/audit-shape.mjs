#!/usr/bin/env node
// Check audit reports against the template's shape (docs/specs/audit.md, "audit-shape rules"). Exits 1 on any failure.
//   node .claude/skills/audit/scripts/audit-shape.mjs [report.md...]   (no arguments: every docs/audit/*.md)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep PATH and EXT in step with check-quotes.mjs (tests/audit/quotes.test.mjs checks they match), so it counts every quote line passed here.
const PATH = '[\\w./-]+';
const EXT = 'md|js|mjs|cjs|ts|tsx|jsx|json|py|toml|yml|yaml|sh|css|scss|html|vue|svelte|txt|xml|svg|ini|cfg|rs|go|java|kt|c|h|cpp|cs|rb|php|swift|lua|gd';
const SECTIONS = ['Outcome', 'Scope and method', 'Fix strongly recommended', 'Other findings', 'Not checked', 'Open items from the last audit'];
const STRONG = 'Fix strongly recommended';
const OTHER = 'Other findings';
const FIELDS = ['Rework if left', 'Effort', 'Evidence', 'Case', 'Fix'];
const VALUES = {
  'Rework if left': /^(high|medium|low)$/,
  Effort: /^(S|M|L)$/,
  Evidence: new RegExp(`^\`${PATH}\\.(${EXT}):\\d+(-\\d+)?\` ".{4,}"$|^\`[^\`]+\` absent: searched .+ in .+$|^\`[^\`]+\` protected$`),
};

const template = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'report.md'), 'utf8');
const TOKENS = [...new Set(template.match(/<[^<>\n]+>/g))];

// Return the reason for the first rule the report breaks, or null.
function firstBreak(lines) {
  // 1. Title.
  const title = lines[0].match(/^# Audit: (design|tests|repo|ux), \d{4}-\d{2}-\d{2}$/);
  if (!title) return 'title must be "# Audit: <kind>, <YYYY-MM-DD>"';

  // 2. Header lines, anywhere before ## Outcome.
  const outcomeAt = lines.indexOf('## Outcome');
  const head = outcomeAt < 0 ? lines : lines.slice(0, outcomeAt);
  const kind = head.find((l) => l.startsWith('- **Kind:**'));
  if (kind !== `- **Kind:** ${title[1]}`) return 'missing or wrong Kind line';
  const commit = head.find((l) => l.startsWith('- **Commit:**'));
  if (!commit || !/^- \*\*Commit:\*\* [0-9a-f]{7,40}$/.test(commit)) return 'missing or wrong Commit line';
  if (!head.some((l) => l.startsWith('- **Cost:** '))) return 'missing Cost line';

  // 3. The six ## sections, once each, in template order.
  const h2 = lines.map((l, i) => [l, i]).filter(([l]) => l.startsWith('## '));
  const odd = h2.find(([l]) => !SECTIONS.includes(l.slice(3)));
  if (odd) return `unexpected section "${odd[0].slice(3)}"`;
  let prev = -1;
  for (const s of SECTIONS) {
    const at = h2.filter(([l]) => l === `## ${s}`).map(([, i]) => i);
    if (at.length !== 1 || at[0] < prev) return `missing or out-of-order section "${s}"`;
    prev = at[0];
  }

  // 4. No template placeholder left outside Evidence lines.
  for (const l of lines) {
    if (l.startsWith('- **Evidence:**')) continue;
    const hit = TOKENS.map((t) => [l.indexOf(t), t]).filter(([i]) => i >= 0).sort((a, b) => a[0] - b[0])[0];
    if (hit) return `unfilled placeholder "${hit[1]}"`;
  }

  // Sections by line range, and the findings in each.
  const sectionAt = (i) => {
    const h = h2.filter(([, j]) => j < i).pop();
    return h ? h[0].slice(3) : null;
  };
  const body = (s) => {
    const start = lines.indexOf(`## ${s}`);
    const end = h2.map(([, i]) => i).find((i) => i > start) ?? lines.length;
    return lines.slice(start + 1, end).map((l) => l.trim()).filter(Boolean);
  };
  const findings = [];
  const h3 = lines.map((l, i) => [l, i]).filter(([l]) => l.startsWith('### '));
  for (const [l, i] of h3) {
    const m = l.match(/^### F(\d+) .+/);
    const section = sectionAt(i);
    if (!m) {
      if (section === STRONG || section === OTHER) return `finding ids must run F1 to F${h3.filter(([x]) => /^### F\d+ .+/.test(x)).length}`;
      continue;
    }
    const end = lines.findIndex((x, j) => j > i && /^##(#)? /.test(x));
    const fields = {};
    for (const x of lines.slice(i + 1, end < 0 ? lines.length : end)) {
      const f = x.match(/^- \*\*([^*]+):\*\*(.*)$/);
      if (f) (fields[f[1]] ??= []).push(f[2].trim());
    }
    findings.push({ num: m[1], section, fields });
  }

  // 5. Ids run F1..Fn.
  if (findings.some((f, i) => f.num !== String(i + 1))) return `finding ids must run F1 to F${findings.length}`;

  // 6. The five fields, each once.
  for (const [i, f] of findings.entries()) {
    for (const name of FIELDS) {
      const n = (f.fields[name] ?? []).length;
      if (n === 0) return `F${i + 1} missing ${name}`;
      if (n > 1) return `F${i + 1} has more than one ${name}`;
    }
  }

  // 7. Field values.
  for (const [i, f] of findings.entries()) {
    for (const [name, re] of Object.entries(VALUES)) if (!re.test(f.fields[name][0])) return `F${i + 1} bad ${name} value`;
  }

  // 8. High findings, and only they, under "Fix strongly recommended"; the rest under "Other findings".
  for (const [i, f] of findings.entries()) {
    const high = f.fields['Rework if left'][0] === 'high';
    if (high && f.section !== STRONG) return `F${i + 1} is high and must be under "${STRONG}"`;
    if (!high && f.section !== OTHER) return `F${i + 1} is not high and must be under "${OTHER}"`;
  }

  // 9. A findings section with no findings says None.
  for (const s of [STRONG, OTHER]) {
    if (!findings.some((f) => f.section === s) && !body(s).includes('None.')) return `section "${s}" must list findings or say "None."`;
  }

  // 10. Outcome.
  const outcome = body('Outcome');
  const only = (x) => outcome.length === 1 && outcome[0] === x;
  if (!only('Pending')) {
    if (findings.length === 0) {
      if (!only('No findings.')) return 'outcome must be "Pending" or "No findings."';
    } else {
      for (let n = 1; n <= findings.length; n++) if (!outcome.some((l) => l.startsWith(`F${n} `))) return `outcome has no line for F${n}`;
    }
  }

  // 11. Not checked and the last-audit section are not empty.
  for (const s of ['Not checked', 'Open items from the last audit']) if (body(s).length === 0) return `section "${s}" is empty`;
  return null;
}

let files = process.argv.slice(2);
if (files.length === 0) {
  files = fs.existsSync('docs/audit') ? fs.readdirSync('docs/audit').filter((n) => n.endsWith('.md')).sort().map((n) => `docs/audit/${n}`) : [];
}
let ok = 0;
let failed = 0;
for (const f of files) {
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) {
    console.log(`fail audit-shape ${f}: file not found`);
    failed++;
    continue;
  }
  const lines = fs.readFileSync(f, 'utf8').replace(/\r/g, '').split('\n');
  if (!lines.includes('- **Template:** audit v1')) {
    console.log(`skip audit-shape ${f}: no template line`);
    continue;
  }
  const reason = firstBreak(lines);
  if (reason) {
    console.log(`fail audit-shape ${f}: ${reason}`);
    failed++;
  } else ok++;
}
if (failed) {
  console.log(`audit-shape: ${ok} ok, ${failed} failed`);
  process.exitCode = 1;
} else console.log(ok === 0 ? 'audit-shape: 0 reports' : `audit-shape: ${ok} report${ok === 1 ? '' : 's'} ok`);
