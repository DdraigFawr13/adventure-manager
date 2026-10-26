// The kingdom map of the engine test (roadmap 1.8, D-110): the inked atlas of the baked Fenn March
// with live layers on top (guilds, factions, a threat stain, a walking party, an ink-reveal fog).
// The atlas is built once into a canvas; every animation frame blits it with the zoom transform and
// draws only the live layers. Words come from content text (engine-test.en.json), never from here.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import defaultText from '../../../../content/data/engine-test.en.json';
import '../../../styles/engine-test-map.css';
import { atlasSteps, type Atlas } from './atlas.ts';
import { clampCamera, frameBox, ZOOM_STEP, zoomAt, type Camera } from './map-camera.ts';
import { decodeMap } from './map-data.ts';
import { createScene, type LayerName, type LayerToggles, type Scene } from './map-scene.ts';

const LAYER_ORDER: readonly LayerName[] = ['names', 'guilds', 'factions', 'threat', 'party', 'fog'];
const MAX_DPR = 2;
/** Pixels a cell in the atlas; symbols are drawn for 8. */
const ATLAS_SCALE = 8;
const PAN_STEP = 90;

export interface MapViewProps {
  /** Labels and names by key; defaults to the engine-test English file. */
  text?: Readonly<Record<string, string>>;
}

export function MapView({ text = defaultText }: MapViewProps) {
  const say = (key: string) => text[key] ?? key;
  const [layers, setLayers] = useState<LayerToggles>({
    names: true,
    guilds: true,
    factions: true,
    threat: true,
    party: true,
    fog: true,
  });
  const [ready, setReady] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fpsLabel = useRef<HTMLSpanElement>(null);
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const camera = useRef<Camera>({ x: 0, y: 0, z: 1 });
  const size = useRef({ w: 1366, h: 768, dpr: 1 });
  const mapSize = useRef(1);
  const scene = useRef<Scene | null>(null);
  const textRef = useRef(text);
  textRef.current = text;
  const frames = useRef({ count: 0, since: 0 });

  // Build the atlas in slices so the page stays alive, then the scene on top of it.
  useEffect(() => {
    let cancelled = false;
    const data = decodeMap();
    const { width, height, water } = data.cells;
    const owner = new Uint16Array(width * height);
    for (let i = 0; i < owner.length; i += 1) owner[i] = water[i] === 3 ? 0 : 1;
    const build = atlasSteps(data.cells, data.biomeIds, ATLAS_SCALE);
    let drawing: Generator<void, unknown, void> | null = null;
    let atlas: Atlas | null = null;
    const pump = () => {
      if (cancelled) return;
      if (!atlas) {
        const r = build.next();
        if (r.done) {
          atlas = r.value;
          drawing = atlas.drawSteps({
            mode: 'land',
            key: 1,
            owner,
            fillOf: () => null,
            borderOf: () => [128, 100, 70],
            towns: [],
            holy: [],
          });
        }
      } else if (drawing) {
        const r = drawing.next();
        if (r.done) {
          const view = size.current;
          mapSize.current = atlas.size;
          scene.current = createScene(data, atlas, textRef.current);
          const { box, scale } = atlas;
          frameBox(
            camera.current,
            {
              x0: (box.x0 - 3) * scale,
              y0: (box.y0 - 3) * scale,
              x1: (box.x1 + 3) * scale,
              y1: (box.y1 + 3) * scale,
            },
            view.w,
            view.h,
            atlas.size,
          );
          setReady(true);
          return;
        }
      }
      setTimeout(pump, 0);
    };
    pump();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the canvas at the container's size.
  useEffect(() => {
    const box = viewport.current;
    const el = canvas.current;
    if (!box || !el) return;
    const fit = () => {
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const w = Math.max(1, box.clientWidth);
      const h = Math.max(1, box.clientHeight);
      size.current = { w, h, dpr };
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      clampCamera(camera.current, w, h, mapSize.current);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // The frame loop: one draw per animation frame, plus a frame-rate readout.
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let handle = 0;
    const start = performance.now();
    frames.current = { count: 0, since: start };
    const frame = (now: number) => {
      const s = scene.current;
      if (s) {
        const { w, h, dpr } = size.current;
        s.render(ctx, camera.current, w, h, dpr, (now - start) / 1000, layersRef.current);
      }
      frames.current.count += 1;
      if (now - frames.current.since >= 500) {
        const fps = Math.round((frames.current.count * 1000) / (now - frames.current.since));
        if (fpsLabel.current)
          fpsLabel.current.textContent =
            textRef.current['ui.frames']?.replace('{fps}', String(fps)) ?? '';
        frames.current = { count: 0, since: now };
      }
      handle = requestAnimationFrame(frame);
    };
    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, []);

  // Wheel zoom needs a non-passive listener so the page does not scroll.
  useEffect(() => {
    const box = viewport.current;
    if (!box) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = box.getBoundingClientRect();
      const { w, h } = size.current;
      zoomAt(
        camera.current,
        Math.pow(1.0015, -e.deltaY),
        e.clientX - rect.left,
        e.clientY - rect.top,
        w,
        h,
        mapSize.current,
      );
    };
    box.addEventListener('wheel', wheel, { passive: false });
    return () => box.removeEventListener('wheel', wheel);
  }, []);

  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const zoomBy = (factor: number) => {
    const { w, h } = size.current;
    zoomAt(camera.current, factor, w / 2, h / 2, w, h, mapSize.current);
  };
  const panBy = (dx: number, dy: number) => {
    const { w, h } = size.current;
    const cam = camera.current;
    cam.x += dx / cam.z;
    cam.y += dy / cam.z;
    clampCamera(cam, w, h, mapSize.current);
  };
  const onKey = (e: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowLeft: () => panBy(-PAN_STEP, 0),
      ArrowRight: () => panBy(PAN_STEP, 0),
      ArrowUp: () => panBy(0, -PAN_STEP),
      ArrowDown: () => panBy(0, PAN_STEP),
      '+': () => zoomBy(ZOOM_STEP),
      '=': () => zoomBy(ZOOM_STEP),
      '-': () => zoomBy(1 / ZOOM_STEP),
    };
    const act = keys[e.key];
    if (!act) return;
    e.preventDefault();
    act();
  };

  return (
    <div className="etm">
      <div
        className="etm-viewport"
        ref={viewport}
        role="application"
        tabIndex={0}
        aria-label={say('ui.mapLabel')}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          panBy(d.x - e.clientX, d.y - e.clientY);
          d.x = e.clientX;
          d.y = e.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <canvas ref={canvas} className="etm-canvas" />
      </div>
      {!ready && (
        <p className="etm-loading" role="status">
          {say('ui.loading')}
        </p>
      )}
      <header className="etm-panel etm-title">
        <h1>{say('ui.title')}</h1>
        <p>{say('ui.subtitle')}</p>
      </header>
      <fieldset className="etm-panel etm-layers">
        <legend>{say('ui.layers')}</legend>
        {LAYER_ORDER.map((name) => (
          <label key={name}>
            <input
              type="checkbox"
              checked={layers[name]}
              onChange={(e) => setLayers({ ...layers, [name]: e.target.checked })}
            />
            {say(`layer.${name}`)}
          </label>
        ))}
      </fieldset>
      <div className="etm-zoom">
        <button type="button" aria-label={say('ui.zoomIn')} onClick={() => zoomBy(ZOOM_STEP)}>
          {say('ui.zoomInMark')}
        </button>
        <button type="button" aria-label={say('ui.zoomOut')} onClick={() => zoomBy(1 / ZOOM_STEP)}>
          {say('ui.zoomOutMark')}
        </button>
      </div>
      <span className="etm-fps" ref={fpsLabel} aria-live="off" />
    </div>
  );
}
