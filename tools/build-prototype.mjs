// Assembles the watched-quest prototype (D-127) into one page for publishing: the Vite build's
// JS and CSS are inlined, fonts come from Google Fonts (the only font host artifacts allow).
// Usage: npm run build -w @adventure-manager/ui && node tools/build-prototype.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'packages/ui/dist');
const css = readFileSync(join(dist, 'app.css'), 'utf8');
// A literal "</script" inside the bundle would end the inline script early.
const js = readFileSync(join(dist, 'app.js'), 'utf8').replaceAll('</script', '<\\/script');
const fonts =
  'https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+DW+Pica:ital@0;1&family=Sorts+Mill+Goudy&display=swap';

const page = `<title>Fenn March Quest Watch</title>
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
const out = join(dist, 'quest-watch.html');
writeFileSync(out, page);
console.log(`Wrote ${out} (${Math.round(page.length / 1024)} KB)`);
