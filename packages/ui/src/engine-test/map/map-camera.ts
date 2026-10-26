// The map camera: where the window looks (sheet pixels at its top-left) and how far it is zoomed
// (screen pixels per sheet pixel). All moves are clamped so the paper never leaves a gap.

export interface Camera {
  x: number;
  y: number;
  z: number;
}

/** The sheet in pixels (width, height). */
export interface Sheet2 {
  w: number;
  h: number;
}

/** Closest look: the atlas is inked at 8 px a cell, so a little past 1:1 is as far as it stays crisp. */
export const MAX_ZOOM = 1.25;
export const ZOOM_STEP = 1.25;

/** The zoom at which the whole sheet just fits the window. */
export const fitZoom = (viewW: number, viewH: number, sheet: Sheet2): number =>
  Math.min(viewW / sheet.w, viewH / sheet.h);

/**
 * Keeps the zoom in range and the sheet in view. Spare width goes to the left (the layer switches
 * live there, off the paper); spare height is shared top and bottom.
 */
export function clampCamera(cam: Camera, viewW: number, viewH: number, sheet: Sheet2): void {
  cam.z = Math.min(MAX_ZOOM, Math.max(fitZoom(viewW, viewH, sheet), cam.z));
  const spanX = viewW / cam.z;
  const spanY = viewH / cam.z;
  cam.x = spanX >= sheet.w ? sheet.w - spanX : Math.min(sheet.w - spanX, Math.max(0, cam.x));
  cam.y = spanY >= sheet.h ? (sheet.h - spanY) / 2 : Math.min(sheet.h - spanY, Math.max(0, cam.y));
}

/** Zooms by `factor` keeping the sheet point under screen position (sx, sy) where it is. */
export function zoomAt(
  cam: Camera,
  factor: number,
  sx: number,
  sy: number,
  viewW: number,
  viewH: number,
  sheet: Sheet2,
): void {
  const wx = cam.x + sx / cam.z;
  const wy = cam.y + sy / cam.z;
  cam.z *= factor;
  clampCamera(cam, viewW, viewH, sheet);
  cam.x = wx - sx / cam.z;
  cam.y = wy - sy / cam.z;
  clampCamera(cam, viewW, viewH, sheet);
}

/** Opens fitted: the whole March in view. */
export function fitCamera(cam: Camera, viewW: number, viewH: number, sheet: Sheet2): void {
  cam.z = fitZoom(viewW, viewH, sheet);
  clampCamera(cam, viewW, viewH, sheet);
}
