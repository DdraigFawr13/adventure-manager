// The kingdom map's live scene: builds the layers once, then `render` draws one frame (the atlas
// blitted with the zoom transform, then only the live layers). Nothing is allocated per frame
// beyond a few short strings; the heavy canvases are made in `createScene`.
import type { Atlas } from './map-atlas.ts';
import type { Camera } from './map-camera.ts';
import { sitesOf, type MapData } from './map-data.ts';
import { createJourney } from './map-journey.ts';
import { createFactionMark, createFog, createStain, type FactionMark } from './map-layers.ts';
import {
  drawName,
  placeAreaName,
  placeSideName,
  placeTownName,
  Rooms,
  type LabelStyle,
} from './map-labels.ts';
import { drawBanner, drawCross, drawParty } from './map-marks.ts';
import { SEAL } from './map-palette.ts';
import { createSheet } from './map-sheet.ts';
import { townReach } from './map-town.ts';

export type LayerName = 'names' | 'guilds' | 'factions' | 'threat' | 'party' | 'fog';
export type LayerToggles = Readonly<Record<LayerName, boolean>>;
export type SceneText = Readonly<Record<string, string>>;

/** How often (seconds) names are checked against the fog, to keep names off uncharted ground. */
const LOOK_EVERY = 0.4;

export interface Scene {
  render: (
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    viewW: number,
    viewH: number,
    dpr: number,
    seconds: number,
    layers: LayerToggles,
  ) => void;
}

/** Guilds stand at a settlement (index into the sites, 0 the hall) with a tier numeral. */
const GUILDS = [
  { site: 0, nameKey: 'guild.ours', colour: SEAL, tier: 2 },
  { site: 2, nameKey: 'guild.rival-0', colour: '#5b4a8b', tier: 1 },
  { site: 1, nameKey: 'guild.rival-1', colour: '#3f6f8f', tier: 3 },
] as const;
const FACTIONS = [
  { site: 2, nameKey: 'faction.0', colour: '#3e6b3a', r: 30, charge: 'chevron' as const },
  { site: 5, nameKey: 'faction.1', colour: '#b8923e', r: 25, charge: 'waves' as const },
];

export function createScene(data: MapData, atlas: Atlas, text: SceneText): Scene {
  const { cells } = data;
  const W = cells.width;
  const H = cells.height;
  const S = atlas.scale;
  const say = (key: string) => text[key] ?? key;
  const cx = (cell: number) => ((cell % W) + 0.5) * S;
  const cy = (cell: number) => (Math.floor(cell / W) + 0.5) * S;
  const sites = sitesOf(data);
  const sheet = createSheet(data, S, {
    title: say('ui.title'),
    subtitle: say('ui.subtitle'),
    north: say('ui.north'),
    scaleCaption: say('ui.scale'),
  });
  const siteName = (k: number) => (k === 0 ? say('place.guild-hall') : say(`place.${k - 1}`));
  const guildLabels = GUILDS.map(
    (g) => `${say(g.nameKey)}, ${say('ui.tier').replace('{tier}', String(g.tier))}`,
  );
  const landAt = (x: number, y: number) => {
    const i = Math.floor(y) * W + Math.floor(x);
    return x >= 0 && y >= 0 && x < W && y < H && cells.water[i] !== 3 && cells.water[i] !== 2;
  };
  const factionMarks: FactionMark[] = FACTIONS.map((f, n) =>
    createFactionMark(
      {
        x: (sites[f.site]! % W) + 0.5,
        y: Math.floor(sites[f.site]! / W) + 0.5,
        r: f.r,
        colour: f.colour,
        charge: f.charge,
      },
      S,
      atlas.land,
      sheet.inner,
      landAt,
      11 + n * 5,
    ),
  );
  const stain = createStain();
  const fog = createFog(W, H);
  const journey = createJourney(data, fog, S);

  // Names whose ground is still under vellum stay unwritten: sites, then areas, then the landmark.
  const hidden = new Uint8Array(sites.length + data.areas.length + 1);
  const hiddenLandmark = sites.length + data.areas.length;
  let lastLook = -10;
  const look = (seconds: number) => {
    if (seconds - lastLook < LOOK_EVERY && seconds >= lastLook) return;
    lastLook = seconds;
    sites.forEach((c, k) => (hidden[k] = journey.uncharted(c) ? 1 : 0));
    data.areas.forEach((a, k) => (hidden[sites.length + k] = journey.uncharted(a.cell) ? 1 : 0));
    hidden[hiddenLandmark] = journey.uncharted(data.landmarkCell) ? 1 : 0;
  };

  const rooms = new Rooms();
  let lastSeconds = 0;

  function render(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    viewW: number,
    viewH: number,
    dpr: number,
    seconds: number,
    layers: LayerToggles,
  ) {
    const dt = Math.min(0.1, Math.max(0, seconds - lastSeconds));
    lastSeconds = seconds;
    const z = cam.z;
    journey.step(seconds, dt);
    look(seconds);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(-cam.x * z + 7, -cam.y * z + 9, atlas.width * z, atlas.height * z);

    // Sheet layers: atlas, fog, faction bands, threat stain, party trail, ink rings, furniture.
    ctx.setTransform(dpr * z, 0, 0, dpr * z, -cam.x * z * dpr, -cam.y * z * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(atlas.canvas, 0, 0);
    if (layers.fog) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sheet.inner.x, sheet.inner.y, sheet.inner.w, sheet.inner.h);
      ctx.clip();
      fog.draw(ctx, atlas.width, atlas.height, 0.97);
      ctx.restore();
    }
    if (layers.factions) for (const m of factionMarks) ctx.drawImage(m.canvas, m.x, m.y);
    if (layers.threat) {
      const reach = 9 * (0.95 + 0.2 * Math.sin(seconds * 0.12) + 0.04 * Math.sin(seconds * 1.9));
      ctx.save();
      ctx.translate(cx(data.landmarkCell), cy(data.landmarkCell));
      ctx.rotate(seconds * 0.03);
      ctx.globalAlpha = 0.82 + 0.1 * Math.sin(seconds * 1.1);
      ctx.drawImage(stain, -reach * S, -reach * S, reach * 2 * S, reach * 2 * S);
      ctx.restore();
    }
    const party = journey.partyAt(seconds);
    if (layers.party) journey.drawTrail(ctx, party.idx, z);
    journey.drawRings(ctx, seconds, z);
    sheet.draw(ctx);

    // Screen layers: banners, names and the party, in pixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const u = Math.min(1.25, Math.max(0.85, Math.sqrt(z)));
    const ls = Math.min(1.25, Math.max(0.95, Math.pow(z, 0.3) * 1.1));
    const sx = (wx: number) => (wx - cam.x) * z;
    const sy = (wy: number) => (wy - cam.y) * z;
    rooms.reset();
    // Marks claim their ground first, so names keep clear of them.
    sites.forEach((c, k) => {
      const r = townReach(k);
      rooms.claim(
        sx(cx(c)) - r.rx * z,
        sy(cy(c)) - (r.ry + 14) * z,
        sx(cx(c)) + r.rx * z,
        sy(cy(c)) + r.ry * 0.6 * z,
      );
    });
    const banner = (site: number) => ({
      x: sx(cx(sites[site]!)) + townReach(site).rx * 0.62 * z,
      y: sy(cy(sites[site]!)) + 3,
    });
    if (layers.guilds) {
      for (const g of GUILDS) {
        const b = banner(g.site);
        rooms.claim(b.x - 2, b.y - 46 * u, b.x + 22 * u, b.y);
      }
    }
    const cross = { x: sx(cx(data.closedRoadCell)), y: sy(cy(data.closedRoadCell)) };
    if (layers.threat) {
      drawCross(ctx, cross.x, cross.y, u * 0.75);
      rooms.claim(cross.x - 8 * u, cross.y - 8 * u, cross.x + 8 * u, cross.y + 8 * u);
    }
    if (layers.names) {
      const town: LabelStyle = { size: 17 * ls, spacing: 1.2, face: 'caps' };
      const note: LabelStyle = { size: 14 * ls, spacing: 0, face: 'italic', alpha: 0.9 };
      sites.forEach((c, k) => {
        if (hidden[k]) return;
        const reach = { rx: townReach(k).rx * z, ry: townReach(k).ry * z };
        placeTownName(ctx, rooms, siteName(k), sx(cx(c)), sy(cy(c)), reach, town);
      });
      if (!hidden[hiddenLandmark]) {
        const at = { x: sx(cx(data.landmarkCell)), y: sy(cy(data.landmarkCell)) };
        placeTownName(ctx, rooms, say('landmark.0'), at.x, at.y, { rx: 22 * z, ry: 10 * z }, note);
      }
      if (layers.threat) {
        const reach = { rx: 9 * u, ry: 9 * u };
        placeTownName(ctx, rooms, say('threat.0.note'), cross.x, cross.y, reach, note);
      }
      data.areas.forEach((a, k) => {
        if (hidden[sites.length + k]) return;
        const style: LabelStyle = {
          size: 21 * ls,
          spacing: a.id === 'sea' ? 6 : 8,
          face: 'italic',
          alpha: 0.78,
        };
        const at = { x: sx(cx(a.cell)), y: sy(cy(a.cell)) };
        placeAreaName(
          ctx,
          rooms,
          say(`area.${a.id}`),
          at.x,
          at.y,
          (a.angle * Math.PI) / 180,
          style,
        );
      });
      if (layers.factions) {
        for (const f of FACTIONS) {
          const c = sites[f.site]!;
          const style: LabelStyle = { size: 14 * ls, spacing: 3, face: 'caps', alpha: 0.95 };
          const y = sy(cy(c)) + f.r * S * z * 0.55;
          placeAreaName(ctx, rooms, say(f.nameKey), sx(cx(c)), y, 0, style);
        }
      }
    }
    if (layers.guilds) {
      GUILDS.forEach((g, n) => {
        const b = banner(g.site);
        drawBanner(ctx, b.x, b.y, u, g.colour, g.tier);
        if (layers.names && !hidden[g.site]) {
          const style: LabelStyle = { size: 14 * ls, spacing: 0.6, face: 'caps' };
          placeSideName(ctx, rooms, guildLabels[n]!, b.x + 24 * u, b.y - 32 * u, style);
        }
      });
    }
    if (layers.party) {
      const { routeX, routeY, lastLeg } = journey;
      const at = Math.min(lastLeg, Math.max(0, Math.floor(party.idx)));
      const next = Math.min(lastLeg, at + 1);
      const f = party.idx - at;
      const px = sx(routeX[at]! + (routeX[next]! - routeX[at]!) * f);
      const py = sy(routeY[at]! + (routeY[next]! - routeY[at]!) * f);
      drawParty(ctx, px, py, u, SEAL, seconds, party.walking);
      if (layers.names) {
        const style: LabelStyle = { size: 14 * ls, spacing: 0, face: 'italic' };
        drawName(ctx, say('party.0'), px, py + 22 * u, style, 'center');
      }
    }
  }

  return { render };
}
