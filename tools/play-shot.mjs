// Play page check (gate 1 spec, UI and J1): serves packages/ui/dist (build it first with
// `npm run build -w @adventure-manager/ui`), drives /play.html with the container's Playwright at
// 375 × 667 and 443 × 900, saves screenshots, and fails on a console error, a page that scrolls
// sideways, or a #fight taller than the 375 × 667 viewport.
// Usage: node tools/play-shot.mjs <fight|delve|loop> [out-dir]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const [mode, outArg] = process.argv.slice(2);
if (!['fight', 'delve', 'loop'].includes(mode ?? '')) {
  console.error('usage: node tools/play-shot.mjs <fight|delve|loop> [out-dir]');
  process.exit(2);
}
if (mode !== 'fight') {
  console.error(`play-shot ${mode}: arrives with slice ${mode === 'delve' ? 2 : 3}.`);
  process.exit(2);
}
const root = fileURLToPath(new URL('../packages/ui/dist/', import.meta.url));
if (!existsSync(join(root, 'play.html'))) {
  console.error(
    'play-shot: packages/ui/dist/play.html is missing; run npm run build -w @adventure-manager/ui',
  );
  process.exit(2);
}
const out = resolve(outArg || 'play-shots');
mkdirSync(out, { recursive: true });

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(
    /^(\.\.[/\\])+/,
    '',
  );
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

const failures = [];
const browser = await chromium.launch();
for (const [width, height] of [
  [375, 667],
  [443, 900],
]) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  await page.goto(`${base}/play.html`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#fight');
  await page.evaluate(() => document.fonts.ready);
  const where = `${width}×${height}`;
  const measure = async (state) => {
    const m = await page.evaluate(() => ({
      fight: Math.round(document.getElementById('fight').getBoundingClientRect().height),
      scroll: document.documentElement.scrollWidth,
      stage: Math.round(document.querySelector('.stage').getBoundingClientRect().height),
    }));
    console.log(
      `${where} ${state}: #fight ${m.fight} px, stage ${m.stage} px, page width ${m.scroll} px`,
    );
    if (m.scroll > width)
      failures.push(`${where} ${state}: page scrolls sideways (${m.scroll} px)`);
    if (width === 375 && m.fight > height)
      failures.push(`${where} ${state}: #fight is ${m.fight} px, taller than ${height}`);
  };
  await measure('start');
  await page.screenshot({ path: join(out, `play-fight-${width}-start.png`) });
  // Aim at the first foe the current action can reach, and see the odds.
  await page.locator('.fc.can').first().tap();
  await measure('aimed');
  await page.screenshot({ path: join(out, `play-fight-${width}-aimed.png`) });
  // Play to the end: strike the first reachable foe; a turn with no target swaps rows.
  for (let i = 0; i < 200 && !(await page.locator('.endcard').count()); i += 1) {
    // Each tap re-renders the screen, so wait for it to settle before reading the next state.
    const tap = async (locator) => {
      await locator.tap({ timeout: 3000 });
      await page.waitForTimeout(60);
    };
    const picked = page.locator('.fc.pick');
    const foe = page.locator('.fc.can');
    if (await picked.count()) await tap(picked.first());
    else if (await foe.count()) await tap(foe.first());
    else {
      await tap(page.getByRole('button', { name: 'Swap row' }));
      await tap(page.getByRole('button', { name: 'Swap row' }));
    }
    if (i === 1) {
      // Use a pack item (a firebomb on the first reachable foe): the path the branch review found
      // could crash the page.
      const pack = page.getByRole('button', { name: /^Pack/ });
      if (await pack.isEnabled()) {
        await tap(pack);
        await tap(page.getByRole('button', { name: 'Firebomb' }).last());
        if (await page.locator('.fc.can').count()) {
          await tap(page.locator('.fc.can').first());
          await tap(page.locator('.fc.pick').first());
        }
        // Wait for the foes' turns to hand back to an adventurer, then read the pack's count.
        await page.waitForTimeout(100);
        const left = await page.getByRole('button', { name: /^Pack/ }).textContent();
        console.log(`${where}: firebomb thrown, pack now "${left}"`);
        if (!/3/.test(left ?? ''))
          failures.push(`${where}: the firebomb was not used (pack "${left}")`);
      }
    }
    if (i === 3) {
      // J2 on the page: a reload mid-fight shows the same fight (strip, health and the round).
      const read = () =>
        page.evaluate(() =>
          ['.band', '.turns', '.plist']
            .map((s) => document.querySelector(s)?.textContent ?? '')
            .join('|'),
        );
      const before = await read();
      await page.reload();
      await page.waitForSelector('#fight');
      const after = await read();
      if (before !== after) failures.push(`${where}: the fight changed on reload`);
    }
  }
  if (!(await page.locator('.endcard').count())) failures.push(`${where}: the fight did not end`);
  await measure('end');
  await page.screenshot({ path: join(out, `play-fight-${width}-end.png`) });
  await page.getByRole('button', { name: 'New fight' }).tap();
  if (await page.locator('.endcard').count())
    failures.push(`${where}: New fight did not start a fight`);
  for (const e of errors) failures.push(`${where}: console: ${e}`);
  await ctx.close();
}
await browser.close();
server.close();
console.log(`screenshots in ${out}`);
if (failures.length) {
  console.error(failures.map((f) => `FAIL ${f}`).join('\n'));
  process.exit(1);
}
console.log('play-shot fight: ok');
