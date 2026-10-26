// Small hand-inked marks drawn in screen pixels on top of the map: guild banners with a ranking
// numeral, the party's standees and the closed-road cross. `u` is the mark scale.
import { INK, PAPER_CSS as PAPER } from './map-palette.ts';

const TIER_NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V'] as const;

/** A pole and pennant standing above the point (x, y), with the guild's tier as a numeral. */
export function drawBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  u: number,
  colour: string,
  tier: number,
): void {
  const top = y - 44 * u;
  ctx.lineWidth = 1.8 * u;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + 20 * u, top);
  ctx.lineTo(x + 20 * u, top + 17 * u);
  ctx.lineTo(x + 10 * u, top + 12.5 * u);
  ctx.lineTo(x, top + 17 * u);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.lineWidth = 1.2 * u;
  ctx.stroke();
  ctx.font = `${Math.round(10 * u)}px "IM Fell English SC", Georgia, serif`;
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PAPER;
  ctx.fillText(TIER_NUMERALS[tier] ?? String(tier), x + 10 * u, top + 11 * u);
}

/** The party: three standees with a shadow, bobbing a little as they walk. */
export function drawParty(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  u: number,
  colour: string,
  seconds: number,
  walking: boolean,
): void {
  for (let n = 0; n < 3; n += 1) {
    const px = x + (n - 1) * 9 * u;
    const bob = walking ? Math.abs(Math.sin(seconds * 9 + n * 1.3)) * 2.2 * u : 0;
    const py = y + (n === 1 ? -3 : 0) * u;
    ctx.fillStyle = 'rgba(42,32,23,0.5)';
    ctx.beginPath();
    ctx.ellipse(px, py + 1 * u, 6 * u, 2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(px - 4 * u, py - 15 * u - bob, 8 * u, 15 * u, 4 * u);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.lineWidth = 1.2 * u;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
}

/** The seal-red cross the mock-up puts on a closed road. */
export function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, u: number): void {
  ctx.lineWidth = 3 * u;
  ctx.strokeStyle = '#8e2a22';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 8 * u, y - 8 * u);
  ctx.lineTo(x + 8 * u, y + 8 * u);
  ctx.moveTo(x + 8 * u, y - 8 * u);
  ctx.lineTo(x - 8 * u, y + 8 * u);
  ctx.stroke();
  ctx.lineCap = 'butt';
}
