// Bakes the kingdom-map base for the engine test (roadmap 1.8, D-110) into
// packages/ui/assets/engine-test/map-base.json. Sizes and the chosen window: tools/worldgen/bake.ts.
// Usage: node tools/bake-map.ts [--ascii] [--dry]
//        node tools/bake-map.ts --search <from> <to>   tries seeds march-<from>..march-<to - 1>
// --ascii prints a coarse picture; --dry skips writing the file.
import { writeFileSync } from 'node:fs';
import { bakeMap, MARCH, MARCH_WORLD, SOURCE_COMMIT, type BakedMap } from './worldgen/bake.ts';
import { findWindow } from './worldgen/window.ts';
import { generateWorld, mirrorWorld } from './worldgen/world.ts';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));

if (flags.has('--search')) {
  const [from, to] = argv.filter((a) => !a.startsWith('--')).map(Number);
  for (let n = from ?? 0; n < (to ?? 20); n += 1) {
    const seed = `march-${n}`;
    const world = generateWorld(seed, MARCH_WORLD.worldSize);
    for (const turn of [false, true]) {
      for (const [flipX, flipY] of [
        [false, false],
        [true, false],
        [false, true],
        [true, true],
      ] as const) {
        const win = findWindow(mirrorWorld(world, flipX, flipY, turn), MARCH.width, MARCH.height);
        if (win) {
          console.log(
            `${seed} flipX=${flipX} flipY=${flipY} turn=${turn} x0=${win.x0} y0=${win.y0} score=${win.score.toFixed(2)}`,
          );
        }
      }
    }
  }
  process.exit(0);
}

const b64 = (view: Int16Array | Uint8Array | Uint32Array): string =>
  Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString('base64');

function ascii(map: BakedMap): string {
  const marks = new Map<number, string>([[map.guildCell, 'G']]);
  map.placeCells.forEach((c, n) => marks.set(c, String(n + 1)));
  marks.set(map.landmarkCell, 'B');
  marks.set(map.closedRoadCell, 'X');
  const onRoad = new Set(map.roads.flatMap((r) => r.cells));
  const onRoute = new Set(map.route);
  const rows: string[] = [];
  for (let y = 0; y < map.height; y += 5) {
    let row = '';
    for (let x = 0; x < map.width; x += 3) {
      const i = y * map.width + x;
      const mark =
        marks.get(i) ??
        marks.get(i + 1) ??
        marks.get(i + map.width) ??
        marks.get(i + map.width + 1);
      if (mark) row += mark;
      else if (onRoute.has(i) || onRoute.has(i + 1) || onRoute.has(i + map.width)) row += '*';
      else if (onRoad.has(i) || onRoad.has(i + 1) || onRoad.has(i + map.width)) row += '+';
      else if (map.water[i] === 3) row += ' ';
      else if (map.water[i] === 2) row += '~';
      else if (map.water[i] === 1) row += '-';
      else if (map.elevation[i]! > 1400) row += '^';
      else if (map.elevation[i]! > 600) row += 'n';
      else if (map.biomeIds[map.biome[i]!] === 'swamp') row += ',';
      else if (
        map.biomeIds[map.biome[i]!]!.includes('forest') ||
        map.biomeIds[map.biome[i]!] === 'taiga'
      )
        row += 'f';
      else row += '.';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

// --pick=seed,flipX,flipY,turn,x0,y0 tries another window (as printed by --search) without editing bake.ts.
const pickArg = argv
  .find((a) => a.startsWith('--pick='))
  ?.slice(7)
  .split(',');
const world = pickArg
  ? {
      ...MARCH_WORLD,
      seed: pickArg[0]!,
      flipX: pickArg[1] === 'true',
      flipY: pickArg[2] === 'true',
      turn: pickArg[3] === 'true',
      x0: Number(pickArg[4]),
      y0: Number(pickArg[5]),
    }
  : MARCH_WORLD;
const map = bakeMap({ ...world, width: MARCH.width, height: MARCH.height });
if (flags.has('--ascii')) console.log(ascii(map));
let land = 0;
for (const w of map.water) if (w !== 3 && w !== 2) land += 1;
const hall = map.guildCell;
const far = map.route[map.route.length - 1]!;
console.log(
  `seed ${map.seed} ${map.width}x${map.height}: land ${Math.round((land / map.water.length) * 100)}%, ` +
    `route ${map.route.length} cells (${(map.route.length / map.dayCells).toFixed(1)} days) hall ${hall} far ${far}, ` +
    `${map.roads.length} roads, ${map.rivers.length} rivers, areas ${map.areas.map((a) => a.id).join(',')}`,
);

if (!flags.has('--dry')) {
  const out = new URL('../packages/ui/assets/engine-test/map-base.json', import.meta.url);
  const json = JSON.stringify({
    width: map.width,
    height: map.height,
    seed: map.seed,
    window: world,
    sourceCommit: SOURCE_COMMIT,
    cellKm: map.cellKm,
    dayCells: map.dayCells,
    biomeIds: map.biomeIds,
    elevation: b64(map.elevation),
    water: b64(map.water),
    biome: b64(map.biome),
    guildCell: map.guildCell,
    placeCells: map.placeCells,
    roads: map.roads,
    route: map.route,
    rivers: map.rivers,
    areas: map.areas,
    landmarkCell: map.landmarkCell,
    closedRoadCell: map.closedRoadCell,
    compass: map.compass,
  });
  writeFileSync(out, json + '\n');
  console.log(`wrote ${out.pathname} (${Math.round(json.length / 1024)} KB)`);
}
