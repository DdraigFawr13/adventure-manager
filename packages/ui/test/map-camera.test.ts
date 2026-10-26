import { describe, expect, it } from 'vitest';
import {
  clampCamera,
  fitCamera,
  fitZoom,
  MAX_ZOOM,
  zoomAt,
  type Camera,
} from '../src/engine-test/map/map-camera.ts';
import { blurField, distanceTo, padPlane } from '../src/engine-test/map/map-field.ts';

// The March sheet: 300 x 200 km at 8 px a cell.
const sheet = { w: 2400, h: 1600 };

describe('kingdom-map camera (3:2 sheet)', () => {
  it('opens fitted: the whole sheet in view at 1366 x 768, right-aligned so the switches sit off the paper', () => {
    const cam: Camera = { x: 0, y: 0, z: 1 };
    fitCamera(cam, 1366, 768, sheet);
    expect(cam.z).toBeCloseTo(768 / 1600, 5);
    expect(cam.y).toBeCloseTo(0, 5);
    // The sheet's right edge meets the window's right edge; the spare 214 px is on the left.
    expect(cam.x + 1366 / cam.z).toBeCloseTo(sheet.w, 3);
    expect(cam.x).toBeLessThan(0);
  });

  it('zooms to about twice the fit and no further than a little past 1:1', () => {
    const cam: Camera = { x: 0, y: 0, z: 1 };
    fitCamera(cam, 1366, 768, sheet);
    zoomAt(cam, 100, 700, 400, 1366, 768, sheet);
    expect(cam.z).toBe(MAX_ZOOM);
    expect(MAX_ZOOM).toBeGreaterThanOrEqual(1);
    expect(MAX_ZOOM).toBeLessThanOrEqual(1.5);
    expect(MAX_ZOOM / fitZoom(1366, 768, sheet)).toBeGreaterThan(2);
  });

  it('still fills a window too big for the closest zoom, and survives a 0 px view', () => {
    const cam: Camera = { x: 0, y: 0, z: 1 };
    clampCamera(cam, 3840, 2160, sheet);
    expect(cam.z).toBeCloseTo(fitZoom(3840, 2160, sheet), 5);
    expect(cam.z * sheet.h).toBeGreaterThanOrEqual(2160 - 1e-6);
    clampCamera(cam, 0, 0, sheet);
    expect(Number.isFinite(cam.x) && Number.isFinite(cam.z)).toBe(true);
  });

  it('never leaves a gap of desk inside the window once the sheet fills it', () => {
    const cam: Camera = { x: -5000, y: 9000, z: MAX_ZOOM };
    clampCamera(cam, 1366, 768, sheet);
    expect(cam.x).toBeGreaterThanOrEqual(0);
    expect(cam.y).toBeLessThanOrEqual(sheet.h - 768 / cam.z);
    expect(cam.x + 1366 / cam.z).toBeLessThanOrEqual(sheet.w);
  });
});

describe('kingdom-map fields', () => {
  it('measures the distance to the nearest set cell', () => {
    const set = new Uint8Array(5 * 5);
    set[0] = 1;
    const d = distanceTo(set, 5, 5);
    expect(d[0]).toBe(0);
    expect(d[4]).toBeCloseTo(4, 5);
    expect(d[24]).toBeCloseTo(4 * Math.SQRT2, 5);
  });

  it('pads a plane so the edge repeats for a few cells and then falls to the outside value', () => {
    const plane = Float32Array.from([1, 1, 1, 1]);
    const p = padPlane(plane, 2, 2, 4, 2, 0);
    expect(p.w).toBe(10);
    expect(p.plane[4 * 10 + 3]).toBe(1);
    expect(p.plane[4 * 10 + 1]).toBe(0);
  });

  it('keeps a flat field flat when blurred', () => {
    const flat = new Float32Array(36).fill(0.5);
    for (const v of blurField(flat, 6, 6, 1.2)) expect(v).toBeCloseTo(0.5, 5);
  });
});
