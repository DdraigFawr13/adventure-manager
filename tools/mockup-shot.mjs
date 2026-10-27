// Mock-up check (VER-06, D-092, D-167): renders an artifact-style HTML page at desktop width and at the
// phone widths of D-159 with touch emulation, using the container's Playwright. Reports which web fonts
// loaded and whether the page scrolls sideways (a failure), and on phones flags tap targets under
// 44 × 44 px, text under 15 px (D-084) and unlabelled controls (warnings). Saves screenshots and, for
// phones, the accessibility snapshot (what a screen reader would announce).
// Exit code: 1 only for sideways scroll or a tap that fails; read the warnings yourself. The warnings
// are heuristics: controls are found by tag, role, tabindex and pointer cursor (a click handler added
// in script alone is invisible), inline text links are skipped, and text size is the CSS font size,
// so scaled (transformed) text and ::before/::after text are not measured.
// Usage: node tools/mockup-shot.mjs <page.html> [out-dir] [--tap <css selector>]...
// Each --tap is tapped in order on every phone; the checks run before the first tap and after each,
// so screens that appear only after a tap are checked too.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

// The container's Playwright is a global install, which require() finds and ESM import does not.
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const args = process.argv.slice(2);
const taps = [];
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tap') taps.push(args[++i]);
  else if (args[i].startsWith('--')) positional.push(undefined);
  else positional.push(args[i]);
}
const [src, outArg] = positional;
if (!src || taps.includes(undefined) || positional.includes(undefined)) {
  console.error('usage: node tools/mockup-shot.mjs <page.html> [out-dir] [--tap <css selector>]...');
  process.exit(2);
}
const out = resolve(outArg || 'mockup-shots');
mkdirSync(out, { recursive: true });
const name = basename(src, '.html');
// Artifact pages are published without their own <html>/<head>; wrap them the same way.
const page = readFileSync(src, 'utf8');
const wrapped = page.trimStart().toLowerCase().startsWith('<!doctype')
  ? page
  : '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}</style></head><body>' + page + '</body></html>';
const tmp = join(out, `${name}.wrapped.html`);
writeFileSync(tmp, wrapped);

// Phone widths from D-159: the 375 minimum (D-154), a common Android width, a large iPhone, and the
// owner's phone (443, measured in D-165). The Pixel 7 preset supplies touch, a mobile user agent and
// a device pixel ratio; only the viewport changes.
const PHONES = [[375, 667], [412, 839], [430, 932], [443, 790]];
const MIN_TAP = 44;
const MIN_TEXT = 15;

// Runs in the page: what a phone player would trip over.
function phoneFindings({ minTap, minText }) {
  const shown = (e) => {
    const b = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const label = (e) =>
    (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || (e.type === 'submit' || e.type === 'button' ? e.value : '') || e.querySelector('img[alt]')?.alt || '')
      .trim().replace(/\s+/g, ' ').slice(0, 30);
  const tagged = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=link],[onclick],[tabindex]:not([tabindex="-1"])';
  // Elements styled as clickable, minus those inside a control already counted.
  const pointer = [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).cursor === 'pointer' && !e.parentElement?.closest(tagged) && getComputedStyle(e.parentElement).cursor !== 'pointer');
  const controls = [...new Set([...document.querySelectorAll(tagged), ...pointer])].filter(shown);
  // A link inside running text is exempt from target size (WCAG 2.5.8); so is a box or radio inside a label.
  const exempt = (e) =>
    (e.tagName === 'A' && getComputedStyle(e).display === 'inline' && [...e.parentElement.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) ||
    (e.labels?.length && [...e.labels].some((l) => { const b = l.getBoundingClientRect(); return b.width >= minTap && b.height >= minTap; }));
  const small = controls
    .filter((e) => { const b = e.getBoundingClientRect(); return (b.width < minTap || b.height < minTap) && !exempt(e); })
    .map((e) => { const b = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()} "${label(e)}" ${Math.round(b.width)}×${Math.round(b.height)}`; });
  const unlabelled = controls
    .filter((e) => !(label(e) || e.labels?.length || e.getAttribute('aria-labelledby') || e.getAttribute('placeholder')))
    .map((e) => e.outerHTML.slice(0, 60));
  const texts = [...document.querySelectorAll('body *')].filter((e) => shown(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const tiny = texts.filter((e) => parseFloat(getComputedStyle(e).fontSize) < minText);
  const smallestText = texts.length ? Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontSize))) : null;
  return { controls: controls.length, small, unlabelled, tinyText: tiny.length, smallestText, scrollWidth: document.documentElement.scrollWidth };
}

const browser = await chromium.launch();
let failed = false;

const desktop = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await desktop.goto('file://' + tmp);
await desktop.waitForTimeout(1500);
const fonts = await desktop.evaluate(() => [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))]);
const desktopWidth = await desktop.evaluate(() => document.documentElement.scrollWidth);
if (desktopWidth > 1200) failed = true;
await desktop.screenshot({ path: join(out, `${name}-desktop.png`), fullPage: true });
console.log(`desktop 1200px: fonts [${fonts.join(', ') || 'none'}] · ${desktopWidth > 1200 ? `SIDEWAYS SCROLL (${desktopWidth}px)` : 'no sideways scroll'} · ${join(out, `${name}-desktop.png`)}`);
await desktop.close();

for (const [width, height] of PHONES) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], viewport: { width, height } });
  const tab = await ctx.newPage();
  await tab.goto('file://' + tmp);
  await tab.waitForTimeout(1500);
  for (let step = 0; step <= taps.length; step++) {
    if (step > 0) {
      try {
        await tab.locator(taps[step - 1]).first().tap({ timeout: 3000 });
      } catch {
        console.log(`phone ${width}px: TAP FAILED, nothing visible and tappable matches ${taps[step - 1]}`);
        failed = true;
        break;
      }
      await tab.waitForTimeout(400);
    }
    const f = await tab.evaluate(phoneFindings, { minTap: MIN_TAP, minText: MIN_TEXT });
    const state = step === 0 ? '' : `-tap${step}`;
    const shot = join(out, `${name}-phone${width}${state}.png`);
    // The visible screen, as the phone shows it: a full-page shot draws fixed bars mid-page. The
    // checks above still cover the whole page.
    await tab.screenshot({ path: shot });
    writeFileSync(join(out, `${name}-phone${width}${state}.aria.yml`), await tab.locator('body').ariaSnapshot());
    const sideways = f.scrollWidth > width;
    if (sideways) failed = true;
    const where = `phone ${width}px${step ? ` after tap ${step} (${taps[step - 1]})` : ''}`;
    console.log(`${where}: ${f.controls} controls · smallest text ${f.smallestText ?? '-'}px · ${sideways ? `SIDEWAYS SCROLL (${f.scrollWidth}px)` : 'no sideways scroll'} · ${shot}`);
    if (f.small.length) console.log(`  WARN ${f.small.length} tap targets under ${MIN_TAP}×${MIN_TAP}px: ${f.small.slice(0, 5).join('; ')}`);
    if (f.tinyText) console.log(`  WARN ${f.tinyText} text elements under ${MIN_TEXT}px`);
    if (f.unlabelled.length) console.log(`  WARN ${f.unlabelled.length} unlabelled controls: ${f.unlabelled.slice(0, 3).join('; ')}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
