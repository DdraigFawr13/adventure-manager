// The map camera: where the window looks (world pixels at its top-left) and how far it is zoomed
// (screen pixels per world pixel). All moves are clamped so the map never leaves the window empty.

export interface Camera {
  x: number;
  y: number;
  z: number;
}

export const MAX_ZOOM = 4;
export const ZOOM_STEP = 1.25;

/** The zoom at which the whole map just fits the window. */
export const fitZoom = (viewW: number, viewH: number, mapSize: number): number =>
  Math.min(viewW, viewH) / mapSize;

/** Keeps the zoom in range and the map in view; a map smaller than the window is centred. */
export function clampCamera(cam: Camera, viewW: number, viewH: number, mapSize: number): void {
  cam.z = Math.min(MAX_ZOOM, Math.max(fitZoom(viewW, viewH, mapSize), cam.z));
  const spanX = viewW / cam.z;
  const spanY = viewH / cam.z;
  cam.x = spanX >= mapSize ? (mapSize - spanX) / 2 : Math.min(mapSize - spanX, Math.max(0, cam.x));
  cam.y = spanY >= mapSize ? (mapSize - spanY) / 2 : Math.min(mapSize - spanY, Math.max(0, cam.y));
}

/** Zooms by `factor` keeping the world point under screen position (sx, sy) where it is. */
export function zoomAt(
  cam: Camera,
  factor: number,
  sx: number,
  sy: number,
  viewW: number,
  viewH: number,
  mapSize: number,
): void {
  const wx = cam.x + sx / cam.z;
  const wy = cam.y + sy / cam.z;
  cam.z *= factor;
  clampCamera(cam, viewW, viewH, mapSize);
  cam.x = wx - sx / cam.z;
  cam.y = wy - sy / cam.z;
  clampCamera(cam, viewW, viewH, mapSize);
}

/** Looks at a box (world pixels) so it fills the window, centred. */
export function frameBox(
  cam: Camera,
  box: { x0: number; y0: number; x1: number; y1: number },
  viewW: number,
  viewH: number,
  mapSize: number,
): void {
  cam.z = Math.min(viewW / (box.x1 - box.x0), viewH / (box.y1 - box.y0));
  cam.x = (box.x0 + box.x1) / 2 - viewW / cam.z / 2;
  cam.y = (box.y0 + box.y1) / 2 - viewH / cam.z / 2;
  clampCamera(cam, viewW, viewH, mapSize);
}
