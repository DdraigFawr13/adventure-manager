// Bakes the kingdom-map base for the engine test (roadmap 1.8, D-110) into
// packages/ui/assets/engine-test/map-base.json.
// Usage: node tools/bake-map.ts [seed=fenn-march] [size=160] [--ascii] [--dry]
// --ascii prints a coarse picture (for choosing a seed); --dry skips writing the file.
import { writeFileSync } from 'node:fs';
import { bakeMap, SOURCE_COMMIT, type BakedMap } from './worldgen/bake.ts';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const seed = args[0] ?? 'fenn-march';
const size = Number(args[1] ?? 160);

const b64 = (view: Int16Array | Uint8Array | Uint32Array): string =>
  Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('base64');

function ascii(map: BakedMap): string {
  const marks = new Map<number, string>([[map.guildCell, 'G']]);
  map.placeCells.forEach((c, n) => marks.set(c, String(n + 1)));
  const onRoute = new Set(map.route);
  const rows: string[] = [];
  for (let y = 0; y < map.height; y += 2) {
    let row = '';
    for (let x = 0; x < map.width; x += 1) {
      const i = y * map.width + x;
      const mark = marks.get(i) ?? marks.get(i + map.width);
      if (mark) row += mark;
      else if (onRoute.has(i) || onRoute.has(i + map.width)) row += '*';
      else if (map.water[i] === 3) row += map.biome[i] === 0 ? ' ' : '.';
      else if (map.water[i] === 2) row += '~';
      else if (map.water[i] === 1) row += '-';
      else row += map.elevation[i]! > 1500 ? '^' : map.elevation[i]! > 600 ? 'n' : '#';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

const map = bakeMap({ seed, size });
if (flags.has('--ascii')) console.log(ascii(map));
let land = 0;
for (const w of map.water) if (w !== 3 && w !== 2) land += 1;
console.log(
  `seed ${seed} size ${size}: land ${Math.round((land / map.water.length) * 100)}%, route ${map.route.length} cells`,
);

if (!flags.has('--dry')) {
  const out = new URL('../packages/ui/assets/engine-test/map-base.json', import.meta.url);
  const json = JSON.stringify({
    width: map.width,
    height: map.height,
    seed: map.seed,
    sourceCommit: SOURCE_COMMIT,
    biomeIds: map.biomeIds,
    elevation: b64(map.elevation),
    water: b64(map.water),
    biome: b64(map.biome),
    flow: b64(map.flow),
    guildCell: map.guildCell,
    placeCells: map.placeCells,
    route: map.route,
  });
  writeFileSync(out, json + '\n');
  console.log(`wrote ${out.pathname} (${Math.round(json.length / 1024)} KB)`);
}
