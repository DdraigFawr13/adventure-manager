import { describe, expect, it } from 'vitest';
import { clampCamera, zoomAt, MAX_ZOOM, type Camera } from '../src/engine-test/map/map-camera.ts';
import type { Mark } from '../src/engine-test/map/map-scene.ts';
import {
  advanceClock,
  dateOf,
  FrameStats,
  hitMark,
  isTap,
  justStopped,
  pinchOf,
  pinchStep,
  type Clock,
} from '../src/engine-test/phone/phone-logic.ts';

const sheet = { w: 2400, h: 1600 };

describe('phone map pinch', () => {
  it('keeps the sheet point between the fingers where it was', () => {
    const cam: Camera = { x: 600, y: 500, z: 1 };
    const before = pinchOf({ x: 150, y: 300 }, { x: 250, y: 300 });
    const after = pinchOf({ x: 140, y: 310 }, { x: 300, y: 310 });
    const world = { x: cam.x + before.x / cam.z, y: cam.y + before.y / cam.z };
    const step = pinchStep(before, after);
    // The caller pans by the midpoint's travel, then zooms about the new midpoint.
    cam.x += step.panX / cam.z;
    cam.y += step.panY / cam.z;
    zoomAt(cam, step.factor, step.atX, step.atY, 443, 800, sheet, 2.5);
    expect(step.factor).toBeCloseTo(160 / 100, 5);
    expect(cam.x + after.x / cam.z).toBeCloseTo(world.x, 3);
    expect(cam.y + after.y / cam.z).toBeCloseTo(world.y, 3);
  });

  it('goes past the desktop zoom only when given a higher maximum', () => {
    const near: Camera = { x: 100, y: 100, z: 1 };
    zoomAt(near, 10, 200, 300, 443, 800, sheet);
    expect(near.z).toBe(MAX_ZOOM);
    const phone: Camera = { x: 100, y: 100, z: 1 };
    zoomAt(phone, 10, 200, 300, 443, 800, sheet, 2.5);
    expect(phone.z).toBe(2.5);
    clampCamera(phone, 443, 800, sheet, 2.5);
    expect(phone.z).toBe(2.5);
  });
});

describe('phone map taps', () => {
  const marks: Mark[] = [
    { id: 'town.0', kind: 'town', x: 1000, y: 800, r: 22 },
    { id: 'guild.0', kind: 'guild', x: 1030, y: 780, r: 22 },
  ];
  const cam: Camera = { x: 900, y: 700, z: 1 };

  it('counts a short, still touch as a tap', () => {
    expect(isTap(4, 120)).toBe(true);
    expect(isTap(12, 120)).toBe(false);
    expect(isTap(4, 400)).toBe(false);
  });

  it('picks the nearest mark within reach, and none when too far', () => {
    expect(hitMark(marks, cam, 100, 100)?.id).toBe('town.0');
    expect(hitMark(marks, cam, 128, 82)?.id).toBe('guild.0');
    expect(hitMark(marks, cam, 100, 140)).toBeNull();
  });
});

describe('phone map clock (D-203)', () => {
  const clock = (over: Partial<Clock> = {}): Clock => ({
    seconds: 0,
    playing: true,
    speed: 1,
    ...over,
  });

  it('advances with the speed and not while paused', () => {
    const c = clock({ speed: 4 });
    advanceClock(c, 0.05);
    expect(c.seconds).toBeCloseTo(0.2, 6);
    const paused = clock({ playing: false, speed: 4 });
    advanceClock(paused, 0.05);
    expect(paused.seconds).toBe(0);
  });

  it('does not jump after a stalled frame', () => {
    const c = clock();
    advanceClock(c, 5);
    expect(c.seconds).toBeCloseTo(0.1, 6);
  });

  it('reads one game day as two seconds at 1x, seven days to a week', () => {
    expect(dateOf(0)).toEqual({ day: 1, week: 1 });
    expect(dateOf(1.99)).toEqual({ day: 1, week: 1 });
    expect(dateOf(2)).toEqual({ day: 2, week: 1 });
    expect(dateOf(14)).toEqual({ day: 8, week: 2 });
  });

  it('cues an auto-stop only on the frame the party stops walking', () => {
    expect(justStopped(true, false)).toBe(true);
    expect(justStopped(false, false)).toBe(false);
    expect(justStopped(false, true)).toBe(false);
  });
});

describe('phone map frame-rate panel', () => {
  it('reports fps over half seconds, the lowest window and the worst frame of ten seconds', () => {
    const stats = new FrameStats();
    let t = 1000;
    let last = null;
    // 1 s at 60 fps, then a slow stretch of 20 fps with one 120 ms frame.
    for (let i = 0; i < 60; i += 1) last = stats.frame((t += 1000 / 60)) ?? last;
    expect(last?.fps).toBe(60);
    for (let i = 0; i < 9; i += 1) last = stats.frame((t += 50)) ?? last;
    last = stats.frame((t += 120)) ?? last;
    for (let i = 0; i < 9; i += 1) last = stats.frame((t += 50)) ?? last;
    expect(last?.fps).toBeLessThan(25);
    expect(last?.lowFps).toBeLessThanOrEqual(last?.fps ?? 0);
    expect(last?.worstMs).toBe(120);
  });

  it('forgets a slow frame after ten seconds', () => {
    const stats = new FrameStats();
    let t = 1000;
    let last = null;
    stats.frame(t);
    last = stats.frame((t += 300)) ?? last;
    for (let i = 0; i < 700; i += 1) last = stats.frame((t += 16)) ?? last;
    expect(last?.worstMs).toBe(16);
  });
});
