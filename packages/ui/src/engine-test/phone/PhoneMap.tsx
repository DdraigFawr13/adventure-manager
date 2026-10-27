// The kingdom map as a phone page (D-154, D-164, D-203): full screen, pinch and drag, tappable marks
// that open a bottom sheet, a game clock with pause and speeds that stops itself when the party
// arrives, and an on-page frame-rate panel. The map drawing is the desktop scene (../map/); words
// come from content text (engine-test.en.json, phone.* keys).
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { engineTestMapText as text } from '@adventure-manager/content';
import { atlasSteps, type Atlas } from '../map/map-atlas.ts';
import { clampCamera, fitCamera, ZOOM_STEP, zoomAt, type Camera } from '../map/map-camera.ts';
import { decodeMap } from '../map/map-data.ts';
import { createScene, type Scene } from '../map/map-scene.ts';
import {
  advanceClock,
  dateOf,
  FrameStats,
  hitMark,
  isTap,
  justStopped,
  pinchOf,
  pinchStep,
  SPEEDS,
  type Clock,
  type Pinch,
  type Point,
} from './phone-logic.ts';
import { describeMarks } from './phone-marks.ts';
import { PhoneSheet, type SheetContent } from './PhoneSheet.tsx';

const mapData = decodeMap();
let built: Atlas | null = null;

const MAX_DPR = 2;
/** The phone goes closer than the desktop (1.25): the atlas softens a little, the lettering stays crisp. */
const PHONE_MAX_ZOOM = 2.5;
/** Opens on the guild hall at this zoom, so the lettering is readable at once. */
const START_ZOOM = 0.5;
/** Labels never print under 15 px (D-084); the scene's smallest lettering is 13 px at scale 1. */
const LABEL_FLOOR = 15 / 13;
const PAN_STEP = 90;
const say = (key: string) => text[key] ?? key;

type Open = { mark: string } | { letter: 'far' | 'home' } | null;

export function PhoneMap() {
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState<number>(1);
  const [open, setOpen] = useState<Open>(null);
  const [showFps, setShowFps] = useState(true);
  const viewport = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dateLabel = useRef<HTMLSpanElement>(null);
  const fpsLines = useRef<(HTMLSpanElement | null)[]>([]);
  const showFpsRef = useRef(showFps);
  showFpsRef.current = showFps;
  const camera = useRef<Camera>({ x: 0, y: 0, z: 1 });
  const size = useRef({ w: 400, h: 700, dpr: 1 });
  const sheet = useRef({ w: 1, h: 1 });
  const scene = useRef<Scene | null>(null);
  const clock = useRef<Clock>({ seconds: 0, playing: !reduced, speed: 1 });
  const marks = useMemo(() => describeMarks(mapData, text), []);

  // Build the atlas in slices so the page stays alive, then the scene on top of it.
  useEffect(() => {
    let cancelled = false;
    const build = built ? null : atlasSteps(mapData);
    const pump = () => {
      if (cancelled) return;
      const r = build?.next();
      if (r && !r.done) {
        setTimeout(pump, 0);
        return;
      }
      if (r) built = r.value;
      const atlas = built;
      if (!atlas) return;
      sheet.current = { w: atlas.width, h: atlas.height };
      const s = createScene(mapData, atlas, text, { labelFloor: LABEL_FLOOR });
      scene.current = s;
      const { w, h } = size.current;
      const cam = camera.current;
      fitCamera(cam, w, h, sheet.current);
      const hall = s.marks(0, START_ZOOM).find((m) => m.id === 'town.0');
      if (hall) {
        cam.z = START_ZOOM;
        clampCamera(cam, w, h, sheet.current, PHONE_MAX_ZOOM);
        cam.x = hall.x - w / 2 / cam.z;
        cam.y = hall.y - h / 2 / cam.z;
        clampCamera(cam, w, h, sheet.current, PHONE_MAX_ZOOM);
      }
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
      clampCamera(camera.current, w, h, sheet.current, PHONE_MAX_ZOOM);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // The frame loop: clock, auto-stop, one draw, frame-rate panel and date readout.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    let handle = 0;
    let before = performance.now();
    let walking: boolean | null = null;
    let day = -1;
    const stats = new FrameStats();
    const frame = (now: number) => {
      const c = clock.current;
      const s = scene.current;
      // The clock waits for the map: no game time passes while the atlas is still being inked.
      if (s) advanceClock(c, (now - before) / 1000);
      before = now;
      if (s) {
        const party = s.partyState(c.seconds);
        if (c.playing && walking !== null && justStopped(walking, party.walking)) {
          c.playing = false;
          setPlaying(false);
          // Bring the party into view above the letter, which covers the lower part of the screen.
          const cam = camera.current;
          const at = s.marks(c.seconds, cam.z).find((m) => m.kind === 'party');
          if (at) {
            const { w, h } = size.current;
            cam.x = at.x - w / 2 / cam.z;
            cam.y = at.y - (h * 0.3) / cam.z;
            clampCamera(cam, w, h, sheet.current, PHONE_MAX_ZOOM);
          }
          setOpen({ letter: party.far ? 'far' : 'home' });
        }
        walking = party.walking;
        const { w, h, dpr } = size.current;
        s.render(ctx, camera.current, w, h, dpr, c.seconds, ALL_LAYERS);
        const d = dateOf(c.seconds);
        if (d.day !== day && dateLabel.current) {
          day = d.day;
          dateLabel.current.textContent = say('phone.date')
            .replace('{day}', String(d.day))
            .replace('{week}', String(d.week));
        }
      }
      const reading = stats.frame(now);
      const [a, b, z] = fpsLines.current;
      if (reading && showFpsRef.current && a && b && z) {
        a.textContent = say('phone.fpsNow').replace('{fps}', String(reading.fps));
        b.textContent = say('phone.fpsLow').replace('{fps}', String(reading.lowFps));
        z.textContent = say('phone.fpsWorst').replace('{ms}', String(reading.worstMs));
      }
      handle = requestAnimationFrame(frame);
    };
    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, []);

  const panBy = (dx: number, dy: number) => {
    const { w, h } = size.current;
    const cam = camera.current;
    cam.x += dx / cam.z;
    cam.y += dy / cam.z;
    clampCamera(cam, w, h, sheet.current, PHONE_MAX_ZOOM);
  };
  const zoomBy = (factor: number, sx?: number, sy?: number) => {
    const { w, h } = size.current;
    zoomAt(camera.current, factor, sx ?? w / 2, sy ?? h / 2, w, h, sheet.current, PHONE_MAX_ZOOM);
  };

  // Gestures: one finger drags, two pinch (the point between them stays put), a short still touch taps.
  const touches = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);
  const tap = useRef<{ id: number; x: number; y: number; at: number; ok: boolean } | null>(null);
  const local = (e: PointerEvent): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const pair = (): [Point, Point] | null => {
    const [a, b] = [...touches.current.values()];
    return a && b ? [a, b] : null;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    touches.current.set(e.pointerId, p);
    if (touches.current.size === 1)
      tap.current = { id: e.pointerId, ...p, at: e.timeStamp, ok: true };
    else if (tap.current) tap.current.ok = false;
    const two = pair();
    if (two) pinch.current = pinchOf(two[0], two[1]);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const before = touches.current.get(e.pointerId);
    if (!before) return;
    const p = local(e);
    touches.current.set(e.pointerId, p);
    const two = pair();
    if (two && pinch.current) {
      const next = pinchOf(two[0], two[1]);
      const step = pinchStep(pinch.current, next);
      panBy(step.panX, step.panY);
      zoomBy(step.factor, step.atX, step.atY);
      pinch.current = next;
    } else if (touches.current.size === 1) {
      panBy(before.x - p.x, before.y - p.y);
      const t = tap.current;
      if (t && Math.hypot(p.x - t.x, p.y - t.y) >= 10) t.ok = false;
    }
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const t = tap.current;
    const p = local(e);
    touches.current.delete(e.pointerId);
    // With two fingers still down (a third lifted), the pinch carries on from where they are.
    const two = pair();
    pinch.current = two ? pinchOf(two[0], two[1]) : null;
    if (!t || t.id !== e.pointerId || !t.ok) return;
    tap.current = null;
    if (!isTap(Math.hypot(p.x - t.x, p.y - t.y), e.timeStamp - t.at)) return;
    const found = scene.current?.marks(clock.current.seconds, camera.current.z) ?? [];
    const hit = hitMark(found, camera.current, p.x, p.y);
    if (hit) setOpen({ mark: hit.id });
  };
  const onCancel = (e: PointerEvent<HTMLDivElement>) => {
    touches.current.delete(e.pointerId);
    const two = pair();
    pinch.current = two ? pinchOf(two[0], two[1]) : null;
    tap.current = null;
  };
  // A pop-up opening mid-gesture (an auto-stop) makes the map inert, so its pointer-ups may never
  // come: start the next gesture clean.
  useEffect(() => {
    if (!open) return;
    touches.current.clear();
    pinch.current = null;
    tap.current = null;
  }, [open]);
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

  const play = (on: boolean) => {
    clock.current.playing = on;
    setPlaying(on);
  };
  const setClockSpeed = (n: number) => {
    clock.current.speed = n;
    setSpeed(n);
  };

  const content = ((): SheetContent | null => {
    if (!open) return null;
    if ('letter' in open) {
      const key = `phone.letter.${open.letter}`;
      const farName = marks.find((m) => m.id === `town.${scene.current?.farSite ?? -1}`)?.name;
      return {
        title: say(`${key}.title`).replace('{place}', farName ?? say('phone.farRoad')),
        lines: [say(`${key}.body`)],
      };
    }
    const info = marks.find((m) => m.id === open.mark);
    if (!info) return null;
    return { kind: info.kind, kindName: info.kindName, title: info.name, lines: info.lines };
  })();

  // The places list says only what the map shows: names under the uncharted vellum stay unsaid.
  const shown = new Set(
    scene.current?.marks(clock.current.seconds, camera.current.z).map((m) => m.id) ?? [],
  );

  return (
    <div className="etp">
      <div className="etp-stage" inert={open !== null}>
        <h1 className="etp-sr">{say('ui.title')}</h1>
        <div
          className="etp-viewport"
          ref={viewport}
          role="application"
          tabIndex={0}
          aria-label={say('phone.mapLabel')}
          onKeyDown={onKey}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
          onLostPointerCapture={onCancel}
        >
          <canvas ref={canvas} className="etp-canvas" />
        </div>
        <div className="etp-sr">
          <h2>{say('phone.places')}</h2>
          <ul>
            {marks
              .filter((m) => shown.has(m.id))
              .map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setOpen({ mark: m.id })}>
                    {`${m.name}, ${m.kindName}`}
                  </button>
                </li>
              ))}
          </ul>
        </div>
        {!ready && (
          <p className="etp-loading" role="status">
            {say('ui.loading')}
          </p>
        )}
        {showFps && (
          <div className="etp-fps" aria-hidden="true">
            {[0, 1, 2].map((n) => (
              <span key={n} ref={(el) => void (fpsLines.current[n] = el)} />
            ))}
          </div>
        )}
        <button
          type="button"
          className="etp-fps-toggle"
          aria-pressed={showFps}
          aria-label={say(showFps ? 'phone.fpsHide' : 'phone.fpsShow')}
          onClick={() => setShowFps(!showFps)}
        >
          {say('phone.fpsMark')}
        </button>
        <div className="etp-zoom">
          <button type="button" aria-label={say('ui.zoomIn')} onClick={() => zoomBy(ZOOM_STEP)}>
            {say('ui.zoomInMark')}
          </button>
          <button
            type="button"
            aria-label={say('ui.zoomOut')}
            onClick={() => zoomBy(1 / ZOOM_STEP)}
          >
            {say('ui.zoomOutMark')}
          </button>
        </div>
        <div className="etp-clock" role="group" aria-label={say('phone.clock')}>
          <button type="button" className="etp-play" onClick={() => play(!playing)}>
            {say(playing ? 'phone.pause' : 'phone.play')}
          </button>
          {SPEEDS.map((n) => (
            <button
              type="button"
              key={n}
              aria-pressed={speed === n}
              aria-label={say('phone.speed').replace('{n}', String(n))}
              onClick={() => setClockSpeed(n)}
            >
              {say('phone.speedMark').replace('{n}', String(n))}
            </button>
          ))}
          <span className="etp-date" ref={dateLabel} />
        </div>
      </div>
      {content && (
        <PhoneSheet
          key={JSON.stringify(open)}
          content={content}
          say={say}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

const ALL_LAYERS = {
  names: true,
  guilds: true,
  factions: true,
  threat: true,
  party: true,
  fog: true,
} as const;
