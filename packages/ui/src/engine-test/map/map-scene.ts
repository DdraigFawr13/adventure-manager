// The kingdom map's live scene: builds the layers once, then `render` draws one frame (the atlas
// blitted with the zoom transform, then only the live layers). Nothing is allocated per frame
// beyond a few short strings; the heavy canvases are made in `createScene`.
import type { Atlas } from './atlas.ts';
import type { Camera } from './map-camera.ts';
import { densestCell, openSeaCell, type MapData } from './map-data.ts';
import { createFactions, createFog, createStain, INK, wobblePath } from './map-layers.ts';
import { drawBanner, drawCross, drawLabel, drawParty, drawTown } from './map-marks.ts';

export type LayerName = 'names' | 'guilds' | 'factions' | 'threat' | 'party' | 'fog';
export type LayerToggles = Readonly<Record<LayerName, boolean>>;
export type SceneText = Readonly<Record<string, string>>;

const SEAL = '#8e2a22';
/** Walking speed in cells a second; pauses at each end of the route, in seconds. */
const SPEED = 7;
const PAUSE_FAR = 1.6;
const PAUSE_HOME = 2.6;
/** The party reveals a burst of ink every this many route cells. */
const BURST_EVERY = 15;
const BURST_SECONDS = 2.4;
const BURST_RADIUS = 15;
const MAX_BURSTS = 4;
const MAX_LABELS = 40;
/** Printed width of a label, from its length: close enough to keep names apart. */
const labelWidth = (text: string, size: number, spacing: number) =>
  text.length * (size * 0.47 + spacing);

interface Burst {
  live: boolean;
  x: number;
  y: number;
  born: number;
  seed: number;
}

interface Guild {
  cell: number;
  nameKey: string;
  colour: string;
  tier: number;
}

export interface Scene {
  render: (
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    viewW: number,
    viewH: number,
    dpr: number,
    seconds: number,
    layers: LayerToggles,
  ) => void;
}

const destinationOf = (route: readonly number[]): number => route[route.length - 1] ?? -1;

/** The place farthest from the guild hall that is not the route's destination, or -1. */
function farthestOther(
  places: readonly { cell: number }[],
  route: readonly number[],
  width: number,
): number {
  const hall = places[0]!.cell;
  const end = destinationOf(route);
  let best = -1;
  let gap = -1;
  for (const p of places) {
    if (p.cell === hall || p.cell === end) continue;
    const dx = (p.cell % width) - (hall % width);
    const dy = Math.floor(p.cell / width) - Math.floor(hall / width);
    if (dx * dx + dy * dy > gap) {
      gap = dx * dx + dy * dy;
      best = p.cell;
    }
  }
  return best;
}

export function createScene(data: MapData, atlas: Atlas, text: SceneText): Scene {
  const { cells, placeCells, guildCell, route } = data;
  const W = cells.width;
  const S = atlas.scale;
  const P = atlas.size;
  const say = (key: string) => text[key] ?? key;
  const cx = (cell: number) => ((cell % W) + 0.5) * S;
  const cy = (cell: number) => (Math.floor(cell / W) + 0.5) * S;

  const places: { cell: number; nameKey: string }[] = [
    { cell: guildCell, nameKey: 'place.guild-hall' },
    ...placeCells.map((cell, n) => ({ cell, nameKey: `place.${n}` })),
  ];
  const guilds: Guild[] = [
    { cell: guildCell, nameKey: 'guild.ours', colour: SEAL, tier: 2 },
    { cell: placeCells[1]!, nameKey: 'guild.rival-0', colour: '#5b4a8b', tier: 1 },
    { cell: placeCells[3]!, nameKey: 'guild.rival-1', colour: '#3f6f8f', tier: 3 },
  ];
  const factionAreas = [
    { cell: placeCells[0]!, nameKey: 'faction.0', colour: '#3e6b3a', r: 19 },
    { cell: placeCells[4]!, nameKey: 'faction.1', colour: '#b8923e', r: 17 },
  ];
  const threatCell = placeCells[2]!;

  // Area names sit on the ground they name.
  const areas: { x: number; y: number; nameKey: string }[] = [];
  const addArea = (nameKey: string, accept: (cell: number) => boolean) => {
    const cell = densestCell(cells, accept, 5);
    if (cell < 0) return;
    areas.push({ x: cx(cell), y: cy(cell), nameKey });
  };
  const isLand = (i: number) => cells.water[i] !== 3 && cells.water[i] !== 2;
  const biomeOf = (i: number) => data.biomeIds[cells.biome[i]!] ?? '';
  addArea('area.mountain', (i) => isLand(i) && cells.elevation[i]! > 1500);
  addArea('area.lake', (i) => cells.water[i] === 2);
  addArea('area.forest', (i) => biomeOf(i) === 'temperate-forest' || biomeOf(i) === 'taiga');
  addArea('area.swamp', (i) => biomeOf(i) === 'swamp');
  const sea = openSeaCell(cells);
  if (sea >= 0) areas.push({ x: cx(sea), y: cy(sea), nameKey: 'area.sea' });

  const factions = createFactions(
    cells,
    factionAreas.map((f) => ({
      x: (f.cell % W) + 0.5,
      y: Math.floor(f.cell / W) + 0.5,
      r: f.r,
      colour: f.colour,
    })),
  );
  const stain = createStain();
  const fog = createFog(W, cells.height);
  // The march starts charted except two pockets: the party's destination and one more place.
  fog.clear();
  const unexplored = [destinationOf(route), farthestOther(places, route, W)];
  unexplored.forEach((cell, n) => {
    if (cell < 0) return;
    fog.cover((cell % W) + 0.5, Math.floor(cell / W) + 0.5, n === 0 ? 36 : 17, n + 3);
  });
  fog.keepAsStart();

  const routeX = Float32Array.from(route, (c) => cx(c));
  const routeY = Float32Array.from(route, (c) => cy(c));
  const lastLeg = route.length - 1;
  const legSeconds = lastLeg / SPEED;
  const cycleSeconds = 2 * legSeconds + PAUSE_FAR + PAUSE_HOME;
  const bursts: Burst[] = Array.from({ length: MAX_BURSTS }, () => ({
    live: false,
    x: 0,
    y: 0,
    born: 0,
    seed: 0,
  }));
  // Screen rectangles of the labels printed so far this frame (x0, y0, x1, y1), reused each frame.
  const rooms = new Float64Array(MAX_LABELS * 4);
  let claimed = 0;
  const claim = (x0: number, y0: number, x1: number, y1: number) => {
    if (claimed >= MAX_LABELS) return;
    const at = claimed * 4;
    rooms[at] = x0;
    rooms[at + 1] = y0;
    rooms[at + 2] = x1;
    rooms[at + 3] = y1;
    claimed += 1;
  };
  const isFree = (x0: number, y0: number, x1: number, y1: number) => {
    for (let k = 0; k < claimed; k += 1) {
      if (
        x0 < rooms[k * 4 + 2]! &&
        x1 > rooms[k * 4]! &&
        y0 < rooms[k * 4 + 3]! &&
        y1 > rooms[k * 4 + 1]!
      )
        return false;
    }
    return true;
  };
  /** The first baseline at or below `y` where a label `w` wide and `size` high overlaps nothing. */
  const freeLine = (x0: number, y: number, w: number, size: number) => {
    let line = y;
    for (let n = 0; n < 6 && !isFree(x0, line - size, x0 + w, line + 5); n += 1)
      line += size * 0.95;
    return line;
  };
  const guildLabels = guilds.map(
    (g) => `${say(g.nameKey)}, ${say('ui.tier').replace('{tier}', String(g.tier))}`,
  );
  let lastSeconds = 0;
  let lastMilestone = -1;
  let lastCycle = -1;
  let burstCount = 0;

  const spawn = (idx: number, seconds: number) => {
    const slot = bursts.find((b) => !b.live) ?? bursts[0]!;
    const cell = route[Math.min(lastLeg, Math.max(0, Math.round(idx)))]!;
    slot.live = true;
    slot.x = (cell % W) + 0.5;
    slot.y = Math.floor(cell / W) + 0.5;
    slot.born = seconds;
    burstCount += 1;
    slot.seed = burstCount * 3 + 1;
  };

  /** Where the party is: a fractional route index and whether it is walking. */
  const partyAt = (seconds: number): { idx: number; walking: boolean; regrow: boolean } => {
    const phase = seconds % cycleSeconds;
    if (phase < legSeconds) return { idx: phase * SPEED, walking: true, regrow: false };
    if (phase < legSeconds + PAUSE_FAR) return { idx: lastLeg, walking: false, regrow: false };
    const back = phase - legSeconds - PAUSE_FAR;
    if (back < legSeconds) return { idx: lastLeg - back * SPEED, walking: true, regrow: false };
    return { idx: 0, walking: false, regrow: true };
  };

  function stepFog(seconds: number, dt: number) {
    const cycle = Math.floor(seconds / cycleSeconds);
    const party = partyAt(seconds);
    if (cycle !== lastCycle) {
      lastCycle = cycle;
      lastMilestone = -1;
    }
    if (party.regrow) fog.regrow(1 - Math.exp(-3 * dt));
    const milestone = Math.floor(party.idx / BURST_EVERY);
    if (party.walking && milestone !== lastMilestone) {
      lastMilestone = milestone;
      spawn(party.idx, seconds);
    }
    const at = Math.min(lastLeg, Math.max(0, Math.round(party.idx)));
    // The party's own lantern clears a little ground as it walks.
    fog.reveal((route[at]! % W) + 0.5, Math.floor(route[at]! / W) + 0.5, 5, 7);
    for (const b of bursts) {
      if (!b.live) continue;
      const p = (seconds - b.born) / BURST_SECONDS;
      if (p >= 1) {
        b.live = false;
        fog.reveal(b.x, b.y, BURST_RADIUS, b.seed);
        continue;
      }
      fog.reveal(b.x, b.y, BURST_RADIUS * (1 - (1 - p) * (1 - p) * (1 - p)), b.seed);
    }
  }

  function render(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    viewW: number,
    viewH: number,
    dpr: number,
    seconds: number,
    layers: LayerToggles,
  ) {
    const dt = Math.min(0.1, Math.max(0, seconds - lastSeconds));
    lastSeconds = seconds;
    const z = cam.z;
    stepFog(seconds, dt);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(-cam.x * z + 7, -cam.y * z + 9, P * z, P * z);

    // World layers: atlas, fog, washes, threat stain, party trail and ink rings.
    ctx.setTransform(dpr * z, 0, 0, dpr * z, -cam.x * z * dpr, -cam.y * z * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(atlas.canvas, 0, 0);
    if (layers.fog) fog.draw(ctx, P, 0.94);
    if (layers.factions) {
      ctx.globalAlpha = 0.95;
      ctx.drawImage(factions, 0, 0, P, P);
      ctx.globalAlpha = 1;
    }
    if (layers.threat) {
      const reach = 11 * (0.95 + 0.2 * Math.sin(seconds * 0.12) + 0.04 * Math.sin(seconds * 1.9));
      ctx.save();
      ctx.translate(cx(threatCell), cy(threatCell));
      ctx.rotate(seconds * 0.03);
      ctx.globalAlpha = 0.82 + 0.1 * Math.sin(seconds * 1.1);
      ctx.drawImage(stain, -reach * S, -reach * S, reach * 2 * S, reach * 2 * S);
      ctx.restore();
    }
    const party = partyAt(seconds);
    if (layers.party) drawTrail(ctx, party.idx, z);
    drawRings(ctx, seconds, z);

    // Screen layers: marks and names, in pixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const u = Math.min(1.5, Math.max(0.8, Math.sqrt(z)));
    const sx = (wx: number) => (wx - cam.x) * z;
    const sy = (wy: number) => (wy - cam.y) * z;
    for (const p of places) drawTown(ctx, sx(cx(p.cell)), sy(cy(p.cell)), u);
    if (layers.threat) {
      drawCross(ctx, sx(cx(threatCell)), sy(cy(threatCell)), u);
      if (layers.names)
        drawLabel(
          ctx,
          say('threat.0.note'),
          sx(cx(threatCell)),
          sy(cy(threatCell)) + 30 * u,
          15,
          2,
          'center',
        );
    }
    // Names: place and guild labels claim their room first; area and faction names slide down
    // until they find free space, so no two labels are printed over each other.
    claimed = 0;
    if (layers.names) {
      for (const p of places) {
        const x = sx(cx(p.cell)) + 12 * u;
        const y = sy(cy(p.cell)) + 5;
        drawLabel(ctx, say(p.nameKey), x, y, 16, 3, 'left');
        claim(x, y - 16, x + labelWidth(say(p.nameKey), 16, 3), y + 5);
      }
      if (layers.guilds) {
        guilds.forEach((g, n) => {
          const x = sx(cx(g.cell)) + 30 * u;
          const y = sy(cy(g.cell)) - 28 * u;
          drawLabel(ctx, guildLabels[n]!, x, y, 15, 1, 'left');
          claim(x, y - 15, x + labelWidth(guildLabels[n]!, 15, 1), y + 5);
        });
      }
      const size = 20 * Math.min(1.3, Math.max(0.85, Math.sqrt(z)));
      for (const a of areas) {
        const text = say(a.nameKey);
        const w = labelWidth(text, size, 7);
        const x = sx(a.x);
        const y = freeLine(x - w / 2, sy(a.y), w, size);
        drawLabel(ctx, text, x, y, size, 7, 'center', 0.7);
        claim(x - w / 2, y - size, x + w / 2, y + 5);
      }
      if (layers.factions) {
        for (const f of factionAreas) {
          const text = say(f.nameKey);
          const w = labelWidth(text, 15, 4);
          const x = sx(cx(f.cell));
          const y = freeLine(x - w / 2, sy(cy(f.cell)) - f.r * S * z * 0.6, w, 15);
          drawLabel(ctx, text, x, y, 15, 4, 'center', 0.9);
          claim(x - w / 2, y - 15, x + w / 2, y + 5);
        }
      }
    }
    if (layers.guilds) {
      for (const g of guilds) drawBanner(ctx, sx(cx(g.cell)), sy(cy(g.cell)), u, g.colour, g.tier);
    }
    if (layers.party) {
      const at = Math.min(lastLeg, Math.max(0, Math.floor(party.idx)));
      const next = Math.min(lastLeg, at + 1);
      const f = party.idx - at;
      const px = sx(routeX[at]! + (routeX[next]! - routeX[at]!) * f);
      const py = sy(routeY[at]! + (routeY[next]! - routeY[at]!) * f);
      drawParty(ctx, px, py, u, SEAL, seconds, party.walking);
      if (layers.names) drawLabel(ctx, say('party.0'), px, py + 22 * u, 15, 1, 'center');
    }
  }

  /** Dotted route, with the stretch already walked inked solid. */
  function drawTrail(ctx: CanvasRenderingContext2D, idx: number, z: number) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = SEAL;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2.5 / z;
    ctx.setLineDash([1 / z, 7 / z]);
    ctx.beginPath();
    ctx.moveTo(routeX[0]!, routeY[0]!);
    for (let i = 1; i < route.length; i += 1) ctx.lineTo(routeX[i]!, routeY[i]!);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3 / z;
    ctx.setLineDash([9 / z, 4 / z]);
    ctx.beginPath();
    ctx.moveTo(routeX[0]!, routeY[0]!);
    for (let i = 1; i <= Math.floor(idx); i += 1) ctx.lineTo(routeX[i]!, routeY[i]!);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  }

  /** The wet ink edge that spreads out ahead of each reveal. */
  function drawRings(ctx: CanvasRenderingContext2D, seconds: number, z: number) {
    for (const b of bursts) {
      if (!b.live) continue;
      const p = (seconds - b.born) / BURST_SECONDS;
      if (p < 0 || p >= 1) continue;
      const r = BURST_RADIUS * (1 - (1 - p) * (1 - p) * (1 - p));
      const fade = Math.pow(1 - p, 0.7);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8 / z;
      ctx.globalAlpha = 0.1 * fade;
      wobblePath(ctx, b.x * S, b.y * S, r * S, b.seed);
      ctx.stroke();
      ctx.lineWidth = 2.2 / z;
      ctx.globalAlpha = 0.8 * fade;
      wobblePath(ctx, b.x * S, b.y * S, r * S, b.seed);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  return { render };
}
