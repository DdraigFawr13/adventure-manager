// Assembles the watched-quest prototype (D-127) into one page for publishing: the Vite build's
// JS and CSS are inlined, fonts come from Google Fonts (the only font host artifacts allow).
// Usage: npm run build -w @adventure-manager/ui && node tools/build-prototype.mjs
// Since D-200 the Quest Watch builds to quest-watch.js/.css beside the step 4 page.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'packages/ui/dist');
const css = readFileSync(join(dist, 'quest-watch.css'), 'utf8');
// A literal "</script" inside the bundle would end the inline script early.
const js = readFileSync(join(dist, 'quest-watch.js'), 'utf8').replaceAll('</script', '<\\/script');
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
const out = join(dist, 'quest-watch.single.html');
writeFileSync(out, page);
console.log(`Wrote ${out} (${Math.round(page.length / 1024)} KB)`);
