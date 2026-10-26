// Engine-test measurements (D-110, PLAN §11a): build time, frames per second on the map while it
// pans and zooms, memory, size on disk, labelled controls, and screenshots of the real Electron
// window at 1366×768. Run under a display: xvfb-run -a node tools/engine-test-measure.mjs [out-dir]
// Numbers here come from a container with software rendering; the owner's Windows machine is the
// real test, so treat fps as a floor, not the verdict.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The container's Playwright (1.64.1, approved in D-117) is a global install, which require()
// finds and ESM import does not; elsewhere install that version to reproduce the numbers.
const { _electron } = createRequire(import.meta.url)('playwright');

const root = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(process.argv[2] ?? 'mockup-shots/engine-test');
mkdirSync(out, { recursive: true });
const results = {};

let start = performance.now();
execFileSync('npx', ['vite', 'build', '-c', 'vite.engine-test.config.ts'], {
  cwd: join(root, 'packages/ui'),
  stdio: 'ignore',
});
results.buildSeconds = Math.round(performance.now() - start) / 1000;

const sizeKb = (path) =>
  Number(execFileSync('du', ['-sk', path], { encoding: 'utf8' }).split('\t')[0]);
results.appKb = sizeKb(join(root, 'packages/ui/dist-engine-test'));
results.electronUnpackedKb = sizeKb(join(root, 'node_modules/electron/dist'));

async function launch(tab) {
  start = performance.now();
  const app = await _electron.launch({
    args: [join(root, 'packages/shell'), `--tab=${tab}`],
    executablePath: join(root, 'node_modules/electron/dist/electron'),
    cwd: root,
  });
  const win = await app.firstWindow();
  await win.waitForLoadState('load');
  await win.evaluate(() => document.fonts.ready);
  // Park the pointer in the top bar so no breakdown opens under it by accident.
  await win.mouse.move(600, 10);
  return { app, win, startMs: Math.round(performance.now() - start) };
}

/** Counts animation frames for `ms` while `drive` runs, and reports fps and the worst frame. */
async function frames(win, ms, drive) {
  await win.evaluate((duration) => {
    window.__frames = [];
    const t0 = performance.now();
    const tick = (now) => {
      window.__frames.push(now);
      if (now - t0 < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, ms);
  const t0 = performance.now();
  await drive(t0 + ms);
  await win.waitForTimeout(Math.max(0, ms + 200 - (performance.now() - t0)));
  return win.evaluate(() => {
    const f = window.__frames;
    let worst = 0;
    for (let i = 1; i < f.length; i += 1) worst = Math.max(worst, f[i] - f[i - 1]);
    const seconds = (f[f.length - 1] - f[0]) / 1000;
    return {
      fps: Math.round(((f.length - 1) / seconds) * 10) / 10,
      worstFrameMs: Math.round(worst),
    };
  });
}

async function memoryMb(app) {
  const metrics = await app.evaluate(({ app: electronApp }) => electronApp.getAppMetrics());
  // workingSetSize is in kilobytes.
  return Math.round(metrics.reduce((sum, m) => sum + m.memory.workingSetSize, 0) / 1024);
}

/** Interactive elements with no accessible name (§6c: the UI is built from labelled controls). */
async function unlabelled(win) {
  return win.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('button, input, select, [role=tab], [tabindex]')) {
      const label =
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') ||
        el.closest('label')?.textContent?.trim() ||
        el.textContent?.trim();
      if (!label) bad.push(el.outerHTML.slice(0, 80));
    }
    return bad;
  });
}

// Ledger.
{
  const { app, win, startMs } = await launch('ledger');
  results.ledgerStartMs = startMs;
  results.ledgerFonts = await win.evaluate(() =>
    [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  );
  results.ledgerRowsFullyVisible = await win.evaluate(
    () =>
      [...document.querySelectorAll('.et-ledger tbody tr')].filter(
        (tr) => tr.getBoundingClientRect().bottom <= innerHeight,
      ).length,
  );
  results.ledgerTextPx = await win.evaluate(
    () => getComputedStyle(document.querySelector('.et-ledger td')).fontSize,
  );
  results.ledgerUnlabelled = await unlabelled(win);
  results.ledgerAria = await win.locator('table.et-ledger').ariaSnapshot();
  await win.screenshot({ path: join(out, 'ledger-1366.png') });
  // Keyboard: focus the grid, move to a wage cell and show its breakdown.
  await win.locator('thead button').first().focus();
  for (let i = 0; i < 3; i += 1) await win.keyboard.press('ArrowDown');
  await win.keyboard.press('End');
  await win.keyboard.press('ArrowLeft');
  results.keyboardBreakdown = await win.locator('[role=tooltip]').innerText();
  await win.screenshot({ path: join(out, 'ledger-keyboard.png') });
  await win.locator('input[type=range]').fill('150');
  await win.locator('input[type=checkbox]').check();
  await win.screenshot({ path: join(out, 'ledger-150-clear.png') });
  results.ledgerMemoryMb = await memoryMb(app);
  await app.close();
}

// Map.
{
  const { app, win, startMs } = await launch('map');
  results.mapStartMs = startMs;
  // The atlas is inked in slices after the page loads; the map is usable once the notice goes.
  const readyStart = performance.now();
  await win.locator('.etm-loading').waitFor({ state: 'detached', timeout: 60_000 });
  results.mapReadyMs = startMs + Math.round(performance.now() - readyStart);
  await win.screenshot({ path: join(out, 'map-1366.png') });
  if ((await win.locator('canvas').count()) === 0) throw new Error('The map tab has no canvas.');
  results.mapIdle = await frames(win, 3000, async () => {});
  const canvas = win.locator('canvas').last();
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  // Input runs for the whole window: zoom in, drag around a circle, zoom out, repeat.
  results.mapPanZoom = await frames(win, 5000, async (until) => {
    let turn = 0;
    while (performance.now() < until) {
      await win.mouse.move(cx, cy);
      for (let i = 0; i < 3; i += 1) await win.mouse.wheel(0, -240);
      await win.mouse.down();
      for (let i = 0; i < 24; i += 1) {
        const a = (i / 24) * 2 * Math.PI;
        await win.mouse.move(cx + Math.cos(a) * 150, cy + Math.sin(a) * 90, { steps: 2 });
      }
      await win.mouse.up();
      for (let i = 0; i < 3; i += 1) await win.mouse.wheel(0, 240);
      turn += 1;
    }
    results.mapPanZoomTurns = turn;
  });
  await win.screenshot({ path: join(out, 'map-zoomed.png') });
  results.mapUnlabelled = await unlabelled(win);
  results.mapMemoryMb = await memoryMb(app);
  results.gpu = await app.evaluate(({ app: electronApp }) => electronApp.getGPUFeatureStatus());
  await app.close();
}

writeFileSync(join(out, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
const { ledgerAria, gpu, ...summary } = results;
console.log(JSON.stringify(summary, null, 2));
console.log(`gpu: ${JSON.stringify(gpu)}`);
console.log(`Screenshots and results.json in ${out}`);
