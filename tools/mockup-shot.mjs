// Mock-up check (VER-06, D-092): renders an artifact-style HTML page at desktop and phone width with the
// container's Playwright, reports which web fonts loaded and whether the page scrolls sideways, and saves
// screenshots. Usage: node tools/mockup-shot.mjs <page.html> [out-dir]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

// The container's Playwright is a global install, which require() finds and ESM import does not.
const { chromium } = createRequire(import.meta.url)('playwright');

const src = process.argv[2];
if (!src) { console.error('usage: node tools/mockup-shot.mjs <page.html> [out-dir]'); process.exit(2); }
const out = resolve(process.argv[3] || 'mockup-shots');
mkdirSync(out, { recursive: true });
const name = basename(src, '.html');
// Artifact pages are published without their own <html>/<head>; wrap them the same way.
const page = readFileSync(src, 'utf8');
const wrapped = page.trimStart().toLowerCase().startsWith('<!doctype')
  ? page
  : '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}</style></head><body>' + page + '</body></html>';
const tmp = join(out, `${name}.wrapped.html`);
writeFileSync(tmp, wrapped);

const browser = await chromium.launch();
let failed = false;
for (const [label, width] of [['desktop', 1200], ['phone', 400]]) {
  const tab = await browser.newPage({ viewport: { width, height: 900 } });
  await tab.goto('file://' + tmp);
  await tab.waitForTimeout(1500);
  const fonts = await tab.evaluate(() => [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))]);
  const scrollWidth = await tab.evaluate(() => document.documentElement.scrollWidth);
  const sideways = scrollWidth > width;
  if (sideways) failed = true;
  const shot = join(out, `${name}-${label}.png`);
  await tab.screenshot({ path: shot, fullPage: true });
  console.log(`${label} ${width}px: fonts [${fonts.join(', ') || 'none'}] · ${sideways ? `SIDEWAYS SCROLL (${scrollWidth}px)` : 'no sideways scroll'} · ${shot}`);
  await tab.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
