// Assembles a prototype page into one file for publishing: the Vite build's JS and CSS are
// inlined, fonts come from Google Fonts (the only font host artifacts allow).
// Usage: npm run build -w @adventure-manager/ui && node tools/build-prototype.mjs           (Quest Watch, D-127)
//        npm run build:desk -w @adventure-manager/ui && node tools/build-prototype.mjs desk (Guild Desk, D-150)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PAGES = {
  'quest-watch': {
    dist: 'packages/ui/dist',
    title: 'Fenn March Quest Watch',
    out: 'quest-watch.html',
  },
  desk: { dist: 'packages/ui/dist-desk', title: 'Guild Desk', out: 'guild-desk.html' },
};
const page = PAGES[process.argv[2] ?? 'quest-watch'];
if (!page)
  throw new Error(`Unknown page ${process.argv[2]}; use one of ${Object.keys(PAGES).join(', ')}.`);

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, page.dist);
const css = readFileSync(join(dist, 'app.css'), 'utf8');
// A literal "</script" inside the bundle would end the inline script early.
const js = readFileSync(join(dist, 'app.js'), 'utf8').replaceAll('</script', '<\\/script');
const fonts =
  'https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+DW+Pica:ital@0;1&family=Sorts+Mill+Goudy&display=swap';

const html = `<title>${page.title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="${fonts}">
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;
const out = join(dist, page.out);
writeFileSync(out, html);
console.log(`Wrote ${out} (${Math.round(html.length / 1024)} KB)`);
