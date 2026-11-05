// Play page check (gate 1 spec, UI, J1 and J3): serves packages/ui/dist (build it first with
// `npm run build -w @adventure-manager/ui`), drives /play.html with the container's Playwright at
// 375 × 667 and 443 × 900, saves screenshots, and fails on a console error, a page that scrolls
// sideways, or a #fight taller than the 375 × 667 viewport.
// fight: the page opens on the start card; walk to the first fight and play it by hand to its end.
// delve: pick an approach and play the whole delve with Auto on, tapping through every screen.
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
if (mode === 'loop') {
  console.error('play-shot loop: arrives with slice 3.');
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

/** The sideways scroll check and, on a fixed 375 × 667 screen, that nothing spills out of its sheet. */
async function measure(page, width, height, where, state, selector = '#fight') {
  const m = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const sheet = document.querySelector('.sheet');
    return {
      box: el ? Math.round(el.getBoundingClientRect().height) : -1,
      scroll: document.documentElement.scrollWidth,
      sheetSpill: sheet ? sheet.scrollHeight - sheet.clientHeight : 0,
    };
  }, selector);
  console.log(
    `${where} ${state}: ${selector} ${m.box} px, page width ${m.scroll} px, sheet spill ${m.sheetSpill} px`,
  );
  if (m.scroll > width) failures.push(`${where} ${state}: page scrolls sideways (${m.scroll} px)`);
  if (width === 375 && m.box > height)
    failures.push(`${where} ${state}: ${selector} is ${m.box} px, taller than ${height}`);
  if (width === 375 && m.sheetSpill > 0)
    failures.push(`${where} ${state}: the sheet scrolls by ${m.sheetSpill} px`);
}

async function open(width, height) {
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
  await page.waitForSelector('#start');
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errors };
}

const tap = async (page, locator) => {
  await locator.tap({ timeout: 5000 });
  await page.waitForTimeout(60);
};

/** Which screen is up: the id of the page's top element. */
const screenOf = (page) =>
  page.evaluate(
    () =>
      document.querySelector('#root > div')?.id ||
      document.querySelector('.broken')?.className ||
      '',
  );

async function waitFor(page, id, where) {
  try {
    await page.waitForSelector(`#${id}`, { timeout: 5000 });
  } catch {
    failures.push(`${where}: no #${id} screen (at "${await screenOf(page)}")`);
    throw new Error('stopped');
  }
}

/** Start card to the first fight: approach, one try at the entry room, Go on, Next room. */
async function toFirstFight(page, width, height, where, shot) {
  await measure(page, width, height, where, 'start', '#start');
  await shot('start');
  await tap(page, page.getByRole('button', { name: 'Enter the barrow' }));
  await waitFor(page, 'choice', where);
  await measure(page, width, height, where, 'choice', '#choice');
  await tap(page, page.locator('#choice .tester').first());
  await shot('choice-picked');
  await tap(page, page.locator('#choice .tester').first());
  await waitFor(page, 'choice-result', where);
  await measure(page, width, height, where, 'choice-result', '#choice-result');
  await shot('choice-result');
  await tap(page, page.getByRole('button', { name: 'Go on' }));
  await waitFor(page, 'breather', where);
  await measure(page, width, height, where, 'breather', '#breather');
  await shot('breather');
  // Scout ahead (a rogue stands), then the seen or heard screen.
  const scout = page.getByRole('button', { name: /^Scout ahead/ });
  if (await scout.count()) {
    await tap(page, scout);
    await measure(page, width, height, where, 'scouted', '#breather');
    await shot('scouted');
  } else failures.push(`${where}: no Scout ahead button at the first breather`);
  await tap(page, page.getByRole('button', { name: /^Next room/ }));
  await waitFor(page, 'fight', where);
  await page.waitForSelector('.roomcard');
  await measure(page, width, height, where, 'room-card');
  await shot('room-card');
  await tap(page, page.getByRole('button', { name: 'Fight', exact: true }));
}

const sizes = [
  [375, 667],
  [443, 900],
];

if (mode === 'fight') {
  for (const [width, height] of sizes) {
    const where = `${width}×${height}`;
    const { ctx, page, errors } = await open(width, height);
    const shot = (name) => page.screenshot({ path: join(out, `play-fight-${width}-${name}.png`) });
    try {
      await toFirstFight(page, width, height, where, shot);
      await measure(page, width, height, where, 'fight start');
      await shot('start-of-fight');
      // Aim at the first foe the current action can reach, and see the odds.
      await page.locator('.fc.can').first().tap();
      await measure(page, width, height, where, 'aimed');
      await shot('aimed');
      // Play to the breather (or the end): strike the first reachable foe; with no target, swap rows.
      for (let i = 0; i < 200 && (await screenOf(page)) === 'fight'; i += 1) {
        const picked = page.locator('.fc.pick');
        const foe = page.locator('.fc.can');
        if (await picked.count()) await tap(page, picked.first());
        else if (await foe.count()) await tap(page, foe.first());
        else {
          await tap(page, page.getByRole('button', { name: 'Swap row' }));
          await tap(page, page.getByRole('button', { name: 'Swap row' }));
        }
        if (i === 1 && (await screenOf(page)) === 'fight') {
          // Use a pack item (a firebomb on the first reachable foe): the path the branch review
          // found could crash the page.
          const pack = page.getByRole('button', { name: /^Pack/ });
          if (await pack.isEnabled()) {
            await tap(page, pack);
            await tap(page, page.getByRole('button', { name: 'Firebomb' }).last());
            if (await page.locator('.fc.can').count()) {
              await tap(page, page.locator('.fc.can').first());
              await tap(page, page.locator('.fc.pick').first());
            }
            await page.waitForTimeout(100);
            if ((await screenOf(page)) === 'fight') {
              const left = await page.getByRole('button', { name: /^Pack/ }).textContent();
              console.log(`${where}: firebomb thrown, pack now "${left}"`);
              if (!/3/.test(left ?? ''))
                failures.push(`${where}: the firebomb was not used (pack "${left}")`);
            }
          }
        }
        if (i === 3 && (await screenOf(page)) === 'fight') {
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
      const after = await screenOf(page);
      if (after !== 'breather' && after !== 'end')
        failures.push(`${where}: the fight did not end (screen "${after}")`);
      await measure(page, width, height, where, 'fight over', `#${after}`);
      await shot('fight-over');
    } catch (e) {
      if (e.message !== 'stopped') failures.push(`${where}: ${e.message}`);
    }
    for (const e of errors) failures.push(`${where}: console: ${e}`);
    await ctx.close();
  }
}

if (mode === 'delve') {
  for (const [width, height] of sizes) {
    const where = `${width}×${height}`;
    const { ctx, page, errors } = await open(width, height);
    const shot = (name) => page.screenshot({ path: join(out, `play-delve-${width}-${name}.png`) });
    try {
      await toFirstFight(page, width, height, where, shot);
      // Retreat asks first: open the card, look at it, stay.
      await tap(page, page.getByRole('button', { name: 'Retreat', exact: true }));
      await page.waitForSelector('[aria-label="Retreat from the barrow?"]');
      await measure(page, width, height, where, 'retreat-card');
      await shot('retreat-card');
      await tap(page, page.getByRole('button', { name: 'Stay' }));
      if (width !== 375) {
        // The 443 px phone only checks the layout of the first screens.
        await tap(page, page.getByRole('button', { name: 'Auto', exact: true }));
        await page.waitForTimeout(700);
        await measure(page, width, height, where, 'auto');
        await shot('auto');
      } else {
        // Auto on, then tap through every screen to the delve's end.
        await tap(page, page.getByRole('button', { name: 'Auto', exact: true }));
        const seen = new Set();
        const started = Date.now();
        let screen = '';
        while ((screen = await screenOf(page)) !== 'end') {
          if (Date.now() - started > 150_000) throw new Error('the delve did not end in 150 s');
          if (screen === 'fight') {
            if (await page.locator('.roomcard[aria-label="Retreat from the barrow?"]').count()) {
              throw new Error('the Retreat card opened by itself');
            }
            if (await page.locator('.roomcard').count()) {
              if (!seen.has('room-card-2')) {
                seen.add('room-card-2');
                await shot('room-card-later');
              }
              await tap(page, page.getByRole('button', { name: 'Fight', exact: true }));
            } else {
              if (!seen.has('auto') && (await page.locator('.autobox').count())) {
                seen.add('auto');
                await measure(page, width, height, where, 'auto');
                await shot('auto');
              }
              // Auto was turned off? Turn it on again (a fight entered with Auto off). The screen can
              // change under us, so a missing button just means look again.
              const autoBtn = page.getByRole('button', { name: 'Auto', exact: true });
              if (await autoBtn.count()) {
                const lit = await autoBtn
                  .getAttribute('aria-pressed', { timeout: 1000 })
                  .catch(() => 'true');
                if (lit !== 'true') await tap(page, autoBtn).catch(() => undefined);
              }
              await page.waitForTimeout(150);
            }
          } else if (screen === 'choice') {
            await tap(page, page.locator('#choice .tester').first());
            await tap(page, page.locator('#choice .tester').first());
          } else if (screen === 'choice-result') {
            await tap(page, page.getByRole('button', { name: 'Go on' }));
          } else if (screen === 'breather') {
            if (!seen.has('breather-2')) {
              seen.add('breather-2');
              await shot('breather-later');
            }
            await tap(page, page.getByRole('button', { name: /^Next room/ }));
          } else {
            throw new Error(`unexpected screen "${screen}"`);
          }
        }
        await measure(page, width, height, where, 'end', '#end');
        await shot('end');
        const headline = (await page.locator('#end .rname').textContent()) ?? '';
        console.log(`${where}: the delve ended: "${headline}"`);
        if (!/warden falls|falls back|routed/i.test(headline))
          failures.push(`${where}: the end screen shows no outcome ("${headline}")`);
        await tap(page, page.getByRole('button', { name: 'New delve' }));
        await waitFor(page, 'start', where);
      }
    } catch (e) {
      if (e.message !== 'stopped') failures.push(`${where}: ${e.message}`);
    }
    for (const e of errors) failures.push(`${where}: console: ${e}`);
    await ctx.close();
  }
}

await browser.close();
server.close();
console.log(`screenshots in ${out}`);
if (failures.length) {
  console.error(failures.map((f) => `FAIL ${f}`).join('\n'));
  process.exit(1);
}
console.log(`play-shot ${mode}: ok`);
