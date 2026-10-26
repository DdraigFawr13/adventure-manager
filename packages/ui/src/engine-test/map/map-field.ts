// Small scalar-field tools for the sheet: Gaussian blur, distance to a set, a padded copy so shores
// close up, and quadratic smoothing of a traced line. Pure (no DOM).

/** Separable Gaussian blur; edges repeat their nearest value. */
export function blurField(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float32Array(radius * 2 + 1);
  let total = 0;
  for (let k = -radius; k <= radius; k += 1) {
    const v = Math.exp(-(k * k) / (2 * sigma * sigma));
    kernel[k + radius] = v;
    total += v;
  }
  for (let k = 0; k < kernel.length; k += 1) kernel[k] = kernel[k]! / total;
  const mid = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const sx = Math.min(w - 1, Math.max(0, x + k));
        sum += src[y * w + sx]! * kernel[k + radius]!;
      }
      mid[y * w + x] = sum;
    }
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const sy = Math.min(h - 1, Math.max(0, y + k));
        sum += mid[sy * w + x]! * kernel[k + radius]!;
      }
      out[y * w + x] = sum;
    }
  }
  return out;
}

/** Distance in cells from each cell to the nearest cell where `inSet` is non-zero (chamfer 1, 1.414). */
export function distanceTo(inSet: Uint8Array, w: number, h: number): Float32Array {
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i += 1) d[i] = inSet[i] ? 0 : 1e6;
  const R2 = Math.SQRT2;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      let v = d[i]!;
      if (x > 0) v = Math.min(v, d[i - 1]! + 1);
      if (y > 0) {
        v = Math.min(v, d[i - w]! + 1);
        if (x > 0) v = Math.min(v, d[i - w - 1]! + R2);
        if (x < w - 1) v = Math.min(v, d[i - w + 1]! + R2);
      }
      d[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y -= 1) {
    for (let x = w - 1; x >= 0; x -= 1) {
      const i = y * w + x;
      let v = d[i]!;
      if (x < w - 1) v = Math.min(v, d[i + 1]! + 1);
      if (y < h - 1) {
        v = Math.min(v, d[i + w]! + 1);
        if (x < w - 1) v = Math.min(v, d[i + w + 1]! + R2);
        if (x > 0) v = Math.min(v, d[i + w - 1]! + R2);
      }
      d[i] = v;
    }
  }
  return d;
}

/**
 * A copy of `plane` with `pad` cells added on every side. The first `keep` cells repeat the edge
 * (so a shore that runs off the sheet is not bent by the blur) and the rest take `outside`
 * (so every traced loop closes outside the sheet).
 */
export function padPlane(
  plane: Float32Array,
  w: number,
  h: number,
  pad: number,
  keep: number,
  outside: number,
): { plane: Float32Array; w: number; h: number } {
  const pw = w + pad * 2;
  const ph = h + pad * 2;
  const out = new Float32Array(pw * ph);
  for (let y = 0; y < ph; y += 1) {
    for (let x = 0; x < pw; x += 1) {
      const dx = x < pad ? pad - x : x >= pad + w ? x - (pad + w) + 1 : 0;
      const dy = y < pad ? pad - y : y >= pad + h ? y - (pad + h) + 1 : 0;
      if (Math.max(dx, dy) > keep) {
        out[y * pw + x] = outside;
        continue;
      }
      const sx = Math.min(w - 1, Math.max(0, x - pad));
      const sy = Math.min(h - 1, Math.max(0, y - pad));
      out[y * pw + x] = plane[sy * w + sx]!;
    }
  }
  return { plane: out, w: pw, h: ph };
}

/** Adds a traced line (x, y pairs in pixels) to `path`, rounded by quadratic curves through midpoints. */
export function addSmooth(path: Path2D, xy: readonly number[], closed: boolean): void {
  const n = xy.length / 2;
  if (n < 2) return;
  const px = (k: number) => xy[((k + n) % n) * 2]!;
  const py = (k: number) => xy[((k + n) % n) * 2 + 1]!;
  if (closed) {
    path.moveTo((px(0) + px(1)) / 2, (py(0) + py(1)) / 2);
    for (let k = 1; k <= n; k += 1) {
      path.quadraticCurveTo(px(k), py(k), (px(k) + px(k + 1)) / 2, (py(k) + py(k + 1)) / 2);
    }
    path.closePath();
    return;
  }
  path.moveTo(px(0), py(0));
  for (let k = 1; k < n - 1; k += 1) {
    path.quadraticCurveTo(px(k), py(k), (px(k) + px(k + 1)) / 2, (py(k) + py(k + 1)) / 2);
  }
  path.lineTo(px(n - 1), py(n - 1));
}
