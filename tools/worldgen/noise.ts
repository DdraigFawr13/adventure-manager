// From Story-Generator src/engine/worldgen/noise.ts @ 8a5c4ef (D-116); imports point at sibling files with .ts extensions.
// Deterministic value noise (REBOOT_PLAN §7.2 safe math). Lattice values come
// from an integer hash, interpolation is a smoothstep polynomial, and only
// + - * / and floor are used, so every JS engine produces identical maps.

/** Mixes a 32-bit seed with integer lattice coordinates into a uint32. */
export function hash2(seed: number, x: number, y: number): number {
  let h = seed ^ Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Lattice value in [-1, 1]. */
function lattice(seed: number, x: number, y: number): number {
  return (hash2(seed, x, y) / 0xffffffff) * 2 - 1;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Value noise in [-1, 1] at continuous coordinates; one lattice cell per unit. */
export function valueNoise(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smooth(x - x0);
  const ty = smooth(y - y0);
  const a = lattice(seed, x0, y0);
  const b = lattice(seed, x0 + 1, y0);
  const c = lattice(seed, x0, y0 + 1);
  const d = lattice(seed, x0 + 1, y0 + 1);
  const top = a + (b - a) * tx;
  const bottom = c + (d - c) * tx;
  return top + (bottom - top) * ty;
}

export interface FractalOptions {
  /** Size in cells of the largest feature. */
  scale: number;
  octaves: number;
  /** Amplitude multiplier per octave (0–1). */
  persistence: number;
}

/** Fractal (fBm) value noise, normalised to roughly [-1, 1]. */
export function fractalNoise(seed: number, x: number, y: number, options: FractalOptions): number {
  let total = 0;
  let amplitude = 1;
  let norm = 0;
  let frequency = 1 / options.scale;
  for (let octave = 0; octave < options.octaves; octave += 1) {
    // Each octave gets its own seed so layers don't align on the lattice.
    total += valueNoise(seed + octave * 1013, x * frequency, y * frequency) * amplitude;
    norm += amplitude;
    amplitude *= options.persistence;
    frequency *= 2;
  }
  return total / norm;
}
