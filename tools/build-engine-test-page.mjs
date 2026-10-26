// Assembles the engine test (D-110) into one page for publishing as a preview, so the owner can
// judge the look without running the desktop shell: JS and CSS inlined, fonts from Google Fonts
// (the only font host artifacts allow) instead of the local files the shell uses.
// Usage: npm run build:engine-test -w @adventure-manager/ui && node tools/build-engine-test-page.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../packages/ui/dist-engine-test/', import.meta.url));
const assets = readdirSync(join(dist, 'assets'));
const read = (ext) =>
  assets.filter((f) => f.endsWith(ext)).map((f) => readFileSync(join(dist, 'assets', f), 'utf8'));
// The local @font-face rules point at files the page will not have; Google Fonts replaces them.
const css = read('.css')
  .join('\n')
  .replace(/@font-face\{[^}]*\}/g, '');
// A literal "</script" inside the bundle would end the inline script early.
const js = read('.js').join('\n').replaceAll('</script', '<\\/script');
const fonts =
  'https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+DW+Pica:ital@0;1&family=Sorts+Mill+Goudy&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap';

const page = `<title>Fenn March Engine Test</title>
<link rel="stylesheet" href="${fonts}">
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;
const out = join(dist, 'engine-test-preview.html');
writeFileSync(out, page);
console.log(`Wrote ${out} (${Math.round(page.length / 1024)} KB)`);
