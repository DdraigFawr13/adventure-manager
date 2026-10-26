// The party's walk and the fog it clears. The guild has charted almost all of the March; only the
// far corner the party is bound for is blank vellum (owner, 2026-10-26: the fog read as empty). The party walks a road route out to the farthest place and back; every
// few cells it opens a burst of ink that spreads out and wipes the vellum away, and the vellum grows
// back while the party rests at home. Also answers which cells are still uncharted (for names).
import type { MapData } from './map-data.ts';
import { wobblePath, type Fog } from './map-layers.ts';
import { INK, SEAL } from './map-palette.ts';

/** Walking speed in cells a second; pauses at each end of the route, in seconds. */
const SPEED = 14;
const PAUSE_FAR = 1.6;
const PAUSE_HOME = 2.6;
/** The party reveals a burst of ink every this many route cells. */
const BURST_EVERY = 14;
const BURST_SECONDS = 2.4;
const BURST_RADIUS = 17;
const LANTERN_RADIUS = 6;
const MAX_BURSTS = 4;
/** The vellum corner stays small, so the charted March fills the sheet. */
const MAX_VELLUM_RADIUS = 48;

interface Burst {
  live: boolean;
  x: number;
  y: number;
  born: number;
  seed: number;
}

export interface Journey {
  routeX: Float32Array;
  routeY: Float32Array;
  lastLeg: number;
  /** Where the party is: a fractional route index and whether it is walking. */
  partyAt: (seconds: number) => { idx: number; walking: boolean; regrow: boolean };
  /** Moves the fog on by one frame. */
  step: (seconds: number, dt: number) => void;
  /** True while a cell is still under vellum (so its name stays unwritten). */
  uncharted: (cell: number) => boolean;
  drawTrail: (ctx: CanvasRenderingContext2D, idx: number, z: number) => void;
  drawRings: (ctx: CanvasRenderingContext2D, seconds: number, z: number) => void;
}

/** The sheet corner nearest a cell, avoiding corner `skip` (0 NW, 1 NE, 2 SW, 3 SE). */
function cornerNear(cell: number, W: number, H: number, skip: number): [number, number, number] {
  const x = cell % W;
  const y = Math.floor(cell / W);
  const corners: [number, number, number][] = [
    [0, 0, 0],
    [W, 0, 1],
    [0, H, 2],
    [W, H, 3],
  ];
  return corners
    .filter((c) => c[2] !== skip)
    .reduce((a, b) => (Math.hypot(a[0] - x, a[1] - y) <= Math.hypot(b[0] - x, b[1] - y) ? a : b));
}

export function createJourney(data: MapData, fog: Fog, S: number): Journey {
  const { route } = data;
  const W = data.cells.width;
  const H = data.cells.height;
  const cx = (cell: number) => ((cell % W) + 0.5) * S;
  const cy = (cell: number) => (Math.floor(cell / W) + 0.5) * S;
  const routeX = Float32Array.from(route, cx);
  const routeY = Float32Array.from(route, cy);
  const lastLeg = route.length - 1;
  const legSeconds = lastLeg / SPEED;
  const cycleSeconds = 2 * legSeconds + PAUSE_FAR + PAUSE_HOME;

  // Vellum over one far corner: the one the route ends in, reaching just past the place there.
  fog.clear();
  const hallX = data.guildCell % W;
  const hallY = Math.floor(data.guildCell / W);
  const end = route[lastLeg] ?? data.guildCell;
  const veiled = new Uint8Array(W * H);
  {
    const corner = cornerNear(end, W, H, -1);
    // Centred most of the way to the corner, so the vellum runs off the sheet's edge.
    const x = (end % W) + (corner[0] - (end % W)) * 0.7;
    const y = Math.floor(end / W) + (corner[1] - Math.floor(end / W)) * 0.7;
    const want = Math.hypot(x - (end % W), y - Math.floor(end / W)) + 14;
    const room = Math.hypot(x - hallX, y - hallY) - 40;
    const r = Math.max(24, Math.min(want, room, MAX_VELLUM_RADIUS));
    fog.cover(x, y, r, 3);
    for (let i = 0; i < W * H; i += 1) {
      if (Math.hypot((i % W) - x, Math.floor(i / W) - y) < r) veiled[i] = 1;
    }
  }
  fog.keepAsStart();
  const charted = new Uint8Array(W * H);

  const bursts: Burst[] = Array.from({ length: MAX_BURSTS }, () => ({
    live: false,
    x: 0,
    y: 0,
    born: 0,
    seed: 0,
  }));
  let lastMilestone = -1;
  let lastCycle = -1;
  let burstCount = 0;

  const partyAt: Journey['partyAt'] = (seconds) => {
    const phase = seconds % cycleSeconds;
    if (phase < legSeconds) return { idx: phase * SPEED, walking: true, regrow: false };
    if (phase < legSeconds + PAUSE_FAR) return { idx: lastLeg, walking: false, regrow: false };
    const back = phase - legSeconds - PAUSE_FAR;
    if (back < legSeconds) return { idx: lastLeg - back * SPEED, walking: true, regrow: false };
    return { idx: 0, walking: false, regrow: true };
  };

  /** Clears vellum in a disc and remembers those cells as charted. */
  const reveal = (x: number, y: number, r: number, seed: number, final: boolean) => {
    fog.reveal(x, y, r, seed);
    if (!final) return;
    const reach = Math.ceil(r);
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const px = Math.floor(x) + dx;
        const py = Math.floor(y) + dy;
        if (px >= 0 && py >= 0 && px < W && py < H && dx * dx + dy * dy <= reach * reach) {
          charted[py * W + px] = 1;
        }
      }
    }
  };

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

  return {
    routeX,
    routeY,
    lastLeg,
    partyAt,
    uncharted: (cell) => veiled[cell] === 1 && charted[cell] === 0,
    step(seconds, dt) {
      const cycle = Math.floor(seconds / cycleSeconds);
      const party = partyAt(seconds);
      if (cycle !== lastCycle) {
        lastCycle = cycle;
        lastMilestone = -1;
        // The vellum has grown back over the rest at home, so the names go with it now.
        charted.fill(0);
      }
      if (party.regrow) fog.regrow(1 - Math.exp(-3 * dt));
      const milestone = Math.floor(party.idx / BURST_EVERY);
      const here = route[Math.min(lastLeg, Math.max(0, Math.round(party.idx)))]!;
      // Ink bursts mark new ground only: none on the charted roads near home.
      if (party.walking && milestone !== lastMilestone && veiled[here] === 1) {
        lastMilestone = milestone;
        spawn(party.idx, seconds);
      }
      const at = Math.min(lastLeg, Math.max(0, Math.round(party.idx)));
      // The party's own lantern clears a little ground as it walks.
      reveal((route[at]! % W) + 0.5, Math.floor(route[at]! / W) + 0.5, LANTERN_RADIUS, 7, true);
      for (const b of bursts) {
        if (!b.live) continue;
        const p = (seconds - b.born) / BURST_SECONDS;
        if (p >= 1) b.live = false;
        const grown = BURST_RADIUS * (1 - (1 - Math.min(1, p)) ** 3);
        reveal(b.x, b.y, grown, b.seed, p >= 1);
      }
    },
    /** Dotted route, with the stretch already walked inked solid. */
    drawTrail(ctx, idx, z) {
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
    },
    /** The wet ink edge that spreads out ahead of each reveal. */
    drawRings(ctx, seconds, z) {
      for (const b of bursts) {
        if (!b.live) continue;
        const p = (seconds - b.born) / BURST_SECONDS;
        if (p < 0 || p >= 1) continue;
        const r = BURST_RADIUS * (1 - (1 - p) ** 3);
        const fade = (1 - p) ** 0.7;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 6 / z;
        ctx.globalAlpha = 0.1 * fade;
        wobblePath(ctx, b.x * S, b.y * S, r * S, b.seed);
        ctx.stroke();
        ctx.lineWidth = 1.8 / z;
        ctx.globalAlpha = 0.8 * fade;
        wobblePath(ctx, b.x * S, b.y * S, r * S, b.seed);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
  };
}
