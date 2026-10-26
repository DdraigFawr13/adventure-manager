// Small hand-inked marks drawn in screen pixels on top of the map: settlement dots, guild banners
// with a ranking numeral, the party's standees and place-name labels. `u` is the mark scale.
import { INK } from './map-layers.ts';

const PAPER = '#efe4cc';
const TIER_NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V'] as const;

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  spacing: number,
  align: CanvasTextAlign,
  alpha = 1,
): void {
  ctx.font = `italic ${size}px "Sorts Mill Goudy", "IM Fell DW Pica", Georgia, serif`;
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = PAPER;
  ctx.strokeText(text, x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

export function drawTown(ctx: CanvasRenderingContext2D, x: number, y: number, u: number): void {
  ctx.lineWidth = 1.8 * u;
  ctx.beginPath();
  ctx.arc(x, y, 6.5 * u, 0, Math.PI * 2);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 2.4 * u, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
}

/** A pole and pennant standing above the point (x, y), with the guild's tier as a numeral. */
export function drawBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  u: number,
  colour: string,
  tier: number,
): void {
  const top = y - 40 * u;
  ctx.lineWidth = 1.8 * u;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(x, y - 6 * u);
  ctx.lineTo(x, top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + 24 * u, top);
  ctx.lineTo(x + 24 * u, top + 20 * u);
  ctx.lineTo(x + 12 * u, top + 15 * u);
  ctx.lineTo(x, top + 20 * u);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.lineWidth = 1.2 * u;
  ctx.stroke();
  ctx.font = `${Math.round(11 * u)}px "IM Fell English SC", Georgia, serif`;
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PAPER;
  ctx.fillText(TIER_NUMERALS[tier] ?? String(tier), x + 12 * u, top + 12 * u);
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
