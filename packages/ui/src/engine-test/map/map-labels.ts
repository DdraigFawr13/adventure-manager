// Names on the map, drawn in screen pixels so they stay upright and crisp: settlements in small caps,
// areas and water in spaced italic. A label claims its screen rectangle when printed; a later one
// that would overlap tries another place or slides down, so no two names are printed over each other.
import { INK, PAPER_CSS } from './map-palette.ts';

const MAX_ROOMS = 64;
const SMALL_CAPS = '"IM Fell English SC", Georgia, serif';
const ITALIC = 'italic {s}px "IM Fell DW Pica", "Sorts Mill Goudy", Georgia, serif';

export interface LabelStyle {
  size: number;
  spacing: number;
  /** 'caps' is the small-caps face; 'italic' the spaced italic of areas and water. */
  face: 'caps' | 'italic';
  alpha?: number;
}

/** Printed width of a label, from its length: close enough to keep names apart. */
export const labelWidth = (text: string, style: LabelStyle): number =>
  text.length * (style.size * (style.face === 'caps' ? 0.5 : 0.44) + style.spacing);

export function setFont(ctx: CanvasRenderingContext2D, style: LabelStyle): void {
  ctx.font =
    style.face === 'caps'
      ? `${style.size}px ${SMALL_CAPS}`
      : ITALIC.replace('{s}', String(style.size));
  ctx.letterSpacing = `${style.spacing}px`;
}

/** Prints a name with a paper halo; `angle` (radians) turns it about (x, y). */
export function drawName(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: LabelStyle,
  align: CanvasTextAlign,
  angle = 0,
): void {
  const alpha = style.alpha ?? 1;
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  setFont(ctx, style);
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = PAPER_CSS;
  ctx.strokeText(text, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** The screen rectangles of names (and marks) printed so far this frame; reused each frame. */
export class Rooms {
  private readonly box = new Float64Array(MAX_ROOMS * 4);
  private count = 0;

  reset(): void {
    this.count = 0;
  }

  claim(x0: number, y0: number, x1: number, y1: number): void {
    if (this.count >= MAX_ROOMS) return;
    const at = this.count * 4;
    this.box[at] = x0;
    this.box[at + 1] = y0;
    this.box[at + 2] = x1;
    this.box[at + 3] = y1;
    this.count += 1;
  }

  isFree(x0: number, y0: number, x1: number, y1: number): boolean {
    for (let k = 0; k < this.count; k += 1) {
      const b = k * 4;
      if (
        x0 < this.box[b + 2]! &&
        x1 > this.box[b]! &&
        y0 < this.box[b + 3]! &&
        y1 > this.box[b + 1]!
      )
        return false;
    }
    return true;
  }

  /** The first baseline at or below `y` where a label `w` wide and `size` high overlaps nothing. */
  freeLine(x0: number, y: number, w: number, size: number): number {
    let line = y;
    for (let n = 0; n < 8 && !this.isFree(x0, line - size, x0 + w, line + 5); n += 1)
      line += size * 0.9;
    return line;
  }
}

/** Prints a settlement's name beside its drawing: right, left, below or above, whichever is free first. */
export function placeTownName(
  ctx: CanvasRenderingContext2D,
  rooms: Rooms,
  text: string,
  x: number,
  y: number,
  reach: { rx: number; ry: number },
  style: LabelStyle,
): void {
  const w = labelWidth(text, style);
  const s = style.size;
  const tries: { x: number; y: number; align: CanvasTextAlign; x0: number }[] = [
    { x: x + reach.rx + 3, y: y + 4, align: 'left', x0: x + reach.rx + 3 },
    { x: x - reach.rx - 3, y: y + 4, align: 'right', x0: x - reach.rx - 3 - w },
    { x, y: y + reach.ry + s + 2, align: 'center', x0: x - w / 2 },
    { x, y: y - reach.ry - 18, align: 'center', x0: x - w / 2 },
  ];
  const pick = tries.find((t) => rooms.isFree(t.x0, t.y - s, t.x0 + w, t.y + 5)) ?? tries[0]!;
  drawName(ctx, text, pick.x, pick.y, style, pick.align);
  rooms.claim(pick.x0, pick.y - s, pick.x0 + w, pick.y + 5);
}

/** Prints an area or water name at its spot, turned along its ground; slides down if the room is taken. */
export function placeAreaName(
  ctx: CanvasRenderingContext2D,
  rooms: Rooms,
  text: string,
  x: number,
  y: number,
  angle: number,
  style: LabelStyle,
): void {
  const w = labelWidth(text, style);
  const s = style.size;
  // Half-extents of the turned rectangle's bounding box.
  const ex = (Math.abs(Math.cos(angle)) * w + Math.abs(Math.sin(angle)) * s) / 2;
  const ey = (Math.abs(Math.sin(angle)) * w + Math.abs(Math.cos(angle)) * s) / 2;
  let cy = y;
  for (let n = 0; n < 8 && !rooms.isFree(x - ex, cy - ey, x + ex, cy + ey); n += 1) cy += s * 0.9;
  drawName(ctx, text, x, cy + s * 0.3, style, 'center', angle);
  rooms.claim(x - ex, cy - ey, x + ex, cy + ey);
}

/** Prints a left-aligned name at (x, y), moving up and down in line steps until the room is free. */
export function placeSideName(
  ctx: CanvasRenderingContext2D,
  rooms: Rooms,
  text: string,
  x: number,
  y: number,
  style: LabelStyle,
): void {
  const w = labelWidth(text, style);
  const s = style.size;
  const steps = [0, -1, 1, -2, 2, -3];
  const step = steps.find((k) => rooms.isFree(x, y + k * s - s, x + w, y + k * s + 5)) ?? 0;
  const line = y + step * s;
  drawName(ctx, text, x, line, style, 'left');
  rooms.claim(x, line - s, x + w, line + 5);
}
