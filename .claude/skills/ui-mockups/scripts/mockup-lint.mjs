#!/usr/bin/env node
// mockup-lint: warn-only check of a mock-up page for the Avoid items tagged (lint)
// in .claude/skills/ui-style/references/avoid.md. Node built-ins only, no HTML parser.
// Usage: node mockup-lint.mjs <file.html> --min-text <px> [--allow-font <name>]... [--allow-emoji]
// Exit 0 with one "warn: <kind>: <detail>" line per finding and a count line; exit 2 on a usage error.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Emoji: U+1F000-U+1FAFF only, so ©, ™, digits, arrows and UI glyphs (☰ ✕ ★ ✓) pass.
// Not global, so callers can use .test() safely; the lint builds its own global copy.
export const EMOJI_RE = /[\u{1F000}-\u{1FAFF}]/u;

export const KINDS = ['emoji', 'small-text', 'default-font', 'placeholder'];
const DEFAULT_FACES = ['inter', 'space grotesk', 'roboto'];
const USAGE = 'usage: mockup-lint.mjs <file.html> --min-text <px> [--allow-font <name>]... [--allow-emoji]';

// Replace a match with spaces of the same length, so positions in the file stay true.
const blank = (m) => m.replace(/[^\n]/g, ' ');

// A tag, with quoted attribute values allowed to hold ">".
const TAG = /<(?:[^>"']|"[^"]*"|'[^']*')*>/g;

// The file's text: HTML comments, <script> and <style> blocks and all tags removed (blanked).
// Attribute values are inside tags, so they are not text. Entities are not decoded.
function textOf(html) {
  return html
    .replace(/<!--[\s\S]*?(-->|$)/g, blank)
    .replace(/<script(?=[\s>])[\s\S]*?(<\/script\s*>|$)/gi, blank)
    .replace(/<style(?=[\s>])[\s\S]*?(<\/style\s*>|$)/gi, blank)
    .replace(TAG, blank);
}

// CSS regions: the bodies of <style> blocks and the values of style="…" attributes,
// each with its start offset in the file. Comments and scripts are skipped.
function cssRegions(html) {
  const src = html.replace(/<!--[\s\S]*?(-->|$)/g, blank).replace(/<script(?=[\s>])[\s\S]*?(<\/script\s*>|$)/gi, blank);
  const regions = [];
  for (const m of src.matchAll(/(<style(?=[\s>])[^>]*>)([\s\S]*?)(<\/style\s*>|$)/gi)) {
    regions.push({ start: m.index + m[1].length, css: m[2] });
  }
  const noStyleBlocks = src.replace(/<style(?=[\s>])[\s\S]*?(<\/style\s*>|$)/gi, blank);
  for (const tag of noStyleBlocks.matchAll(TAG)) {
    for (const a of tag[0].matchAll(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
      const css = a[2] ?? a[3];
      regions.push({ start: tag.index + a.index + a[0].length - css.length - 1, css });
    }
  }
  return regions;
}

const detail = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 40);

// Returns [{ kind, pos, detail }] sorted by kind order, then position in the file.
export function lint(html, { minText, allowFonts = [], allowEmoji = false }) {
  const found = [];
  const add = (kind, pos, text) => found.push({ kind, pos, detail: detail(text) });
  const text = textOf(html);

  if (!allowEmoji) {
    for (const m of text.matchAll(new RegExp(EMOJI_RE.source, 'gu'))) add('emoji', m.index, m[0]);
  }

  const allowed = allowFonts.map((f) => f.toLowerCase());
  for (const { start, css } of cssRegions(html)) {
    // (?<![\w-]) skips custom properties (--font-size) and prefixed names.
    for (const m of css.matchAll(/(?<![\w-])font-size\s*:\s*(\d*\.?\d+)(px|rem|em)(?![\w%])/gi)) {
      const n = Number(m[1]);
      const limit = m[2].toLowerCase() === 'px' ? minText : minText / 16;
      if (n < limit) add('small-text', start + m.index, m[0]);
    }
    for (const m of css.matchAll(/(?<![\w-])font-family\s*:\s*([^;}]*)/gi)) {
      const face = m[1].split(',')[0].trim().replace(/^["']|["']$/g, '').trim().toLowerCase();
      if (DEFAULT_FACES.includes(face) && !allowed.includes(face)) add('default-font', start + m.index, m[0]);
    }
  }

  for (const m of text.matchAll(/lorem\s+ipsum/gi)) add('placeholder', m.index, m[0]);
  for (const m of text.matchAll(/\bTODO\b/g)) add('placeholder', m.index, m[0]);

  return found.sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || a.pos - b.pos);
}

// Parse argv; returns options or null on a usage error.
export function parseArgs(argv) {
  const files = [];
  const opts = { minText: null, allowFonts: [], allowEmoji: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--min-text') {
      const v = argv[++i];
      if (v === undefined || !/^\d*\.?\d+$/.test(v) || !(Number(v) > 0)) return null;
      opts.minText = Number(v);
    } else if (a === '--allow-font') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--') || v.trim() === '') return null;
      opts.allowFonts.push(v.trim());
    } else if (a === '--allow-emoji') {
      opts.allowEmoji = true;
    } else if (a.startsWith('-')) {
      return null;
    } else {
      files.push(a);
    }
  }
  if (files.length !== 1 || opts.minText === null) return null;
  return { file: files[0], ...opts };
}

function main(argv) {
  const opts = parseArgs(argv);
  if (!opts) {
    console.error(USAGE);
    return 2;
  }
  let html;
  try {
    html = fs.readFileSync(opts.file, 'utf8');
  } catch (e) {
    console.error(`mockup-lint: can't read ${opts.file}: ${e.code ?? e.message}`);
    console.error(USAGE);
    return 2;
  }
  const found = lint(html, opts);
  for (const f of found) console.log(`warn: ${f.kind}: ${f.detail}`);
  console.log(`mockup-lint: ${found.length} ${found.length === 1 ? 'warning' : 'warnings'}`);
  return 0;
}

const invoked = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (invoked) process.exitCode = main(process.argv.slice(2));
