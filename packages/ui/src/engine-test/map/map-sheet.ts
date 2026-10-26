// The sheet's furniture, drawn as vector over the atlas (and over the fog) in sheet pixels, so it
// stays crisp at any zoom: a neat double border with day-ticks, the title cartouche, the compass
// rose and a scale bar in days on foot. Words come from the content text.
import type { MapData } from './map-data.ts';
import { ink, INK, PAPER_CSS, SEA } from './map-palette.ts';

const SERIF = '"IM Fell English SC", Georgia, serif';
const LETTER = '"IM Fell DW Pica", Georgia, serif';
/** Inset of the outer rule, the inner rule and the paper margin, in sheet pixels. */
const OUT = 9;
const IN = 23;
const BAR_DAYS = 4;

export interface SheetText {
  title: string;
  subtitle: string;
  north: string;
  scaleCaption: string;
}

export interface Sheet {
  draw: (ctx: CanvasRenderingContext2D) => void;
  /** The ruled-off drawing area in sheet pixels, for clipping fog to the inside of the border. */
  inner: { x: number; y: number; w: number; h: number };
}

function border(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number): void {
  ctx.beginPath();
  ctx.rect(-4, -4, w + 8, h + 8);
  ctx.rect(IN, IN, w - IN * 2, h - IN * 2);
  ctx.fillStyle = PAPER_CSS;
  ctx.fill('evenodd');
  // Alternate day-ticks between the two rules.
  ctx.fillStyle = INK;
  for (let x = OUT, k = 0; x < w - OUT; x += tick, k += 1) {
    if (k % 2) continue;
    const len = Math.min(tick, w - OUT - x);
    ctx.fillRect(x, OUT, len, IN - OUT);
    ctx.fillRect(x, h - IN, len, IN - OUT);
  }
  for (let y = OUT, k = 0; y < h - OUT; y += tick, k += 1) {
    if (k % 2) continue;
    const len = Math.min(tick, h - OUT - y);
    ctx.fillRect(OUT, y, IN - OUT, len);
    ctx.fillRect(w - IN, y, IN - OUT, len);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.strokeRect(OUT, OUT, w - OUT * 2, h - OUT * 2);
  ctx.lineWidth = 1.3;
  ctx.strokeRect(IN, IN, w - IN * 2, h - IN * 2);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(OUT + 4.5, OUT + 4.5, w - OUT * 2 - 9, h - OUT * 2 - 9);
}

function cartouche(ctx: CanvasRenderingContext2D, x: number, y: number, text: SheetText): void {
  const w = 380;
  const h = 126;
  ctx.fillStyle = PAPER_CSS;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
  ctx.fillStyle = INK;
  for (const [cx, cy] of [
    [x + 7, y + 7],
    [x + w - 7, y + 7],
    [x + 7, y + h - 7],
    [x + w - 7, y + h - 7],
  ] as const) {
    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = '1px';
  ctx.font = `40px ${SERIF}`;
  ctx.fillText(text.title, x + w / 2, y + 62);
  ctx.letterSpacing = '0px';
  ctx.font = `italic 21px ${LETTER}`;
  ctx.fillStyle = ink(0.8);
  ctx.fillText(text.subtitle, x + w / 2, y + 96);
  ctx.beginPath();
  ctx.moveTo(x + 60, y + 74);
  ctx.lineTo(x + w - 60, y + 74);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = ink(0.6);
  ctx.stroke();
}

function scaleBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  day: number,
  text: SheetText,
): void {
  const len = day * BAR_DAYS;
  ctx.fillStyle = 'rgba(240,231,208,0.88)';
  ctx.fillRect(x - 28, y - 32, len + 56, 92);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  for (let d = 0; d < BAR_DAYS; d += 1) {
    ctx.fillStyle = d % 2 ? PAPER_CSS : INK;
    ctx.fillRect(x + d * day, y, day, 9);
    ctx.strokeRect(x + d * day, y, day, 9);
  }
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `19px ${LETTER}`;
  ctx.letterSpacing = '0px';
  for (let d = 0; d <= BAR_DAYS; d += 1) {
    ctx.beginPath();
    ctx.moveTo(x + d * day, y - 6);
    ctx.lineTo(x + d * day, y);
    ctx.stroke();
    ctx.fillText(String(d), x + d * day, y - 11);
  }
  ctx.font = `italic 20px ${LETTER}`;
  ctx.fillText(text.scaleCaption, x + len / 2, y + 36);
}

/** A sixteen-point compass rose with its north letter. */
function compass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  text: SheetText,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = `rgba(${SEA.join(',')},0.9)`;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let k = 0; k < 32; k += 1) {
    const a = (k / 32) * Math.PI * 2;
    const inner = k % 2 ? r * 0.7 : r * 0.66;
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * r * 0.76, Math.sin(a) * r * 0.76);
  }
  ctx.stroke();
  const point = (angle: number, length: number, half: number) => {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.lineTo(-half, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = PAPER_CSS;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.lineTo(half, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  ctx.lineWidth = 0.9;
  for (let k = 0; k < 8; k += 1) point(((k + 0.5) / 8) * Math.PI * 2, r * 0.5, r * 0.07);
  for (let k = 0; k < 4; k += 1) point((k / 4) * Math.PI * 2 + Math.PI / 4, r * 0.62, r * 0.1);
  for (let k = 0; k < 4; k += 1)
    point((k / 4) * Math.PI * 2, k === 0 ? r * 0.98 : r * 0.84, r * 0.13);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${Math.round(r * 0.34)}px ${SERIF}`;
  ctx.fillText(text.north, 0, -r * 1.04);
  ctx.restore();
}

export function createSheet(data: MapData, scale: number, text: SheetText): Sheet {
  const w = data.cells.width * scale;
  const h = data.cells.height * scale;
  const day = data.dayCells * scale;
  const { x: cx, y: cy, r } = data.compass;
  return {
    inner: { x: IN, y: IN, w: w - IN * 2, h: h - IN * 2 },
    draw(ctx) {
      compass(ctx, cx * scale, cy * scale, r * scale, text);
      border(ctx, w, h, day);
      cartouche(ctx, 54, h - 54 - 126, text);
      scaleBar(ctx, 560, h - 92, day, text);
    },
  };
}
