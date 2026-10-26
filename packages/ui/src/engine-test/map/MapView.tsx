// The kingdom map of the engine test (roadmap 1.8, D-110): the inked atlas of the baked Fenn March
// with live layers on top (guilds, factions, a threat stain, a walking party, an ink-reveal fog).
// The atlas is built once into a canvas; every animation frame blits it with the zoom transform and
// draws only the live layers. Words come from content text (engine-test.en.json), never from here.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { engineTestMapText as defaultText } from '@adventure-manager/content';
import '../../../styles/engine-test-map.css';
import { atlasSteps } from './map-atlas.ts';
import {
  clampCamera,
  fitCamera,
  ZOOM_STEP,
  zoomAt,
  type Camera,
  type Sheet2,
} from './map-camera.ts';
import { decodeMap } from './map-data.ts';
import { createScene, type LayerName, type LayerToggles, type Scene } from './map-scene.ts';

const LAYER_ORDER: readonly LayerName[] = ['names', 'guilds', 'factions', 'threat', 'party', 'fog'];
const MAX_DPR = 2;
const PAN_STEP = 90;
/** With reduced motion (D-078, PLAN §6c) the map holds this moment: the party out on its route. */
const STILL_SECONDS = 12;

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
  const sheet = useRef<Sheet2>({ w: 1, h: 1 });
  const scene = useRef<Scene | null>(null);
  const textRef = useRef(text);
  textRef.current = text;
  const frames = useRef({ count: 0, since: 0 });

  // Build the atlas in slices so the page stays alive, then the scene on top of it.
  useEffect(() => {
    let cancelled = false;
    const data = decodeMap();
    const build = atlasSteps(data);
    const pump = () => {
      if (cancelled) return;
      const r = build.next();
      if (!r.done) {
        setTimeout(pump, 0);
        return;
      }
      const atlas = r.value;
      sheet.current = { w: atlas.width, h: atlas.height };
      scene.current = createScene(data, atlas, textRef.current);
      const view = size.current;
      fitCamera(camera.current, view.w, view.h, sheet.current);
      setReady(true);
    };
    // The sheet's lettering needs the old-press faces; wait for them so the first frame is right.
    const faces = ['IM Fell English SC', 'IM Fell DW Pica', 'Sorts Mill Goudy'];
    void Promise.all(faces.map((f) => document.fonts.load(`16px "${f}"`))).then(pump, pump);
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
      clampCamera(camera.current, w, h, sheet.current);
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
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    frames.current = { count: 0, since: start };
    const frame = (now: number) => {
      const s = scene.current;
      if (s) {
        const { w, h, dpr } = size.current;
        const seconds = still.matches ? STILL_SECONDS : (now - start) / 1000;
        s.render(ctx, camera.current, w, h, dpr, seconds, layersRef.current);
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
        sheet.current,
      );
    };
    box.addEventListener('wheel', wheel, { passive: false });
    return () => box.removeEventListener('wheel', wheel);
  }, []);

  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const zoomBy = (factor: number) => {
    const { w, h } = size.current;
    zoomAt(camera.current, factor, w / 2, h / 2, w, h, sheet.current);
  };
  const panBy = (dx: number, dy: number) => {
    const { w, h } = size.current;
    const cam = camera.current;
    cam.x += dx / cam.z;
    cam.y += dy / cam.z;
    clampCamera(cam, w, h, sheet.current);
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
      <header className="etm-sr">
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
