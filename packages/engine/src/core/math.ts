// Named integer rounding (STANDARDS.md): the engine never relies on floating-point results.

export function divRoundDown(numerator: number, denominator: number): number {
  return Math.floor(numerator / denominator);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
