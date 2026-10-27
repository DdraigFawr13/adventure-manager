// Pure logic of the phone map (D-154, D-164, D-203): pinch maths, tap and hit tests, the game clock
// and the frame-rate statistics. No DOM here, so the tests run it directly.
import type { Camera } from '../map/map-camera.ts';
import type { Mark } from '../map/map-scene.ts';

/** A touch is a tap, not a drag, when it moves less than this many pixels and lasts less than this. */
export const TAP_MOVE_PX = 10;
export const TAP_MS = 300;
/** The nearest mark within this many screen pixels of a tap is the one hit (half of a 44 px target). */
export const HIT_PX = 22;

export interface Point {
  x: number;
  y: number;
}

/** Two fingers: their midpoint and the distance between them. */
export interface Pinch extends Point {
  d: number;
}

export const pinchOf = (a: Point, b: Point): Pinch => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
});

/**
 * One pinch move: pan by how far the midpoint travelled, then zoom by the change in finger spread
 * around the new midpoint, so the map point between the fingers stays between them.
 */
export const pinchStep = (
  before: Pinch,
  after: Pinch,
): { panX: number; panY: number; factor: number; atX: number; atY: number } => ({
  panX: before.x - after.x,
  panY: before.y - after.y,
  factor: after.d / before.d,
  atX: after.x,
  atY: after.y,
});

export const isTap = (movedPx: number, ms: number): boolean => movedPx < TAP_MOVE_PX && ms < TAP_MS;

/** The mark nearest a screen point, within `reach` or the mark's own larger radius (the party's). */
export function hitMark(
  marks: readonly Mark[],
  cam: Camera,
  sx: number,
  sy: number,
  reach: number = HIT_PX,
): Mark | null {
  let best: Mark | null = null;
  let bestD = Infinity;
  for (const m of marks) {
    const d = Math.hypot((m.x - cam.x) * cam.z - sx, (m.y - cam.y) * cam.z - sy);
    if (d <= Math.max(reach, m.r) && d < bestD) {
      best = m;
      bestD = d;
    }
  }
  return best;
}

/** The game clock (D-203): map seconds that run only while playing, times the speed. */
export interface Clock {
  seconds: number;
  playing: boolean;
  speed: number;
}

export const SPEEDS = [1, 2, 4] as const;
/** One game day is this many real seconds at 1x. */
export const DAY_SECONDS = 2;
/** A long frame (a stalled tab) must not make the party jump. */
const MAX_STEP_SECONDS = 0.1;

export const advanceClock = (clock: Clock, realSeconds: number): void => {
  if (!clock.playing) return;
  clock.seconds += Math.min(MAX_STEP_SECONDS, Math.max(0, realSeconds)) * clock.speed;
};

export function dateOf(seconds: number): { day: number; week: number } {
  const day = Math.floor(seconds / DAY_SECONDS) + 1;
  return { day, week: Math.floor((day - 1) / 7) + 1 };
}

/** True on the frame the party stops walking: the cue for an auto-stop. */
export const justStopped = (wasWalking: boolean, walking: boolean): boolean =>
  wasWalking && !walking;

/** Frame-rate statistics: fps over each half second, and the lows over the last ten seconds. */
export interface FrameReading {
  fps: number;
  lowFps: number;
  worstMs: number;
}

const WINDOW_MS = 500;
const HISTORY_MS = 10_000;

export class FrameStats {
  private last = 0;
  private windowStart = 0;
  private count = 0;
  private windows: { at: number; fps: number }[] = [];
  private frames: { at: number; ms: number }[] = [];
  private latest: FrameReading = { fps: 0, lowFps: 0, worstMs: 0 };

  /** Records a frame at `now` (ms); returns a fresh reading when a half second has passed. */
  frame(now: number): FrameReading | null {
    if (this.last === 0) {
      this.last = now;
      this.windowStart = now;
      return null;
    }
    this.frames.push({ at: now, ms: now - this.last });
    this.last = now;
    this.count += 1;
    while (this.frames.length > 0 && now - this.frames[0]!.at > HISTORY_MS) this.frames.shift();
    if (now - this.windowStart < WINDOW_MS) return null;
    const fps = (this.count * 1000) / (now - this.windowStart);
    this.windows.push({ at: now, fps });
    while (this.windows.length > 0 && now - this.windows[0]!.at > HISTORY_MS) this.windows.shift();
    this.count = 0;
    this.windowStart = now;
    this.latest = {
      fps: Math.round(fps),
      lowFps: Math.round(Math.min(...this.windows.map((w) => w.fps))),
      worstMs: Math.round(Math.max(...this.frames.map((f) => f.ms))),
    };
    return this.latest;
  }
}
