// The bottom sheet of the phone map (D-164): a mark's details with a placeholder picture, or a
// letter when the clock stops itself (D-203). A modal dialog: focus moves in, Escape closes.
import { useEffect, useRef } from 'react';
import type { MarkKind } from '../map/map-scene.ts';

const BACKDROP_GRACE_MS = 500;

export interface SheetContent {
  /** Set for a mark; a letter has none. */
  kind?: MarkKind;
  kindName?: string;
  title: string;
  lines: string[];
}

interface Props {
  content: SheetContent;
  say: (key: string) => string;
  onClose: () => void;
}

/** A framed picture area with an inked motif per kind of mark; the real pictures come later. */
function Motif({ kind }: { kind: MarkKind | undefined }) {
  const house = 'M20 70 V42 L40 26 L60 42 V70 Z M70 70 V50 L84 38 L98 50 V70 Z';
  const marks: Record<MarkKind, string> = {
    town: house,
    village: 'M30 70 V48 L50 32 L70 48 V70 Z',
    guild: 'M52 74 V20 M52 20 H88 V44 L70 38 L52 44',
    landmark: 'M20 72 L50 28 L66 50 L78 38 L100 72 Z',
    threat: 'M36 28 L84 72 M84 28 L36 72',
    party:
      'M60 24 a8 8 0 1 0 0.1 0 M60 34 V56 M60 40 L44 52 M60 40 L76 52 M60 56 L48 74 M60 56 L72 74',
  };
  return (
    <svg className="etp-motif" viewBox="0 0 120 90" aria-hidden="true" focusable="false">
      <path d="M6 6 H114 V84 H6 Z" className="etp-motif-frame" />
      <path d={marks[kind ?? 'party']} className="etp-motif-ink" />
    </svg>
  );
}

export function PhoneSheet({ content, say, onClose }: Props) {
  const close = useRef<HTMLButtonElement>(null);
  const openedAt = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const before = document.activeElement;
    openedAt.current = performance.now();
    close.current?.focus();
    // Escape closes wherever focus is, since the map behind is inert.
    const onEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('keydown', onEscape);
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  return (
    <div
      className="etp-backdrop"
      onClick={(e) => {
        // The click that follows the opening tap lands on the new backdrop; it must not close it.
        if (
          e.target === e.currentTarget &&
          performance.now() - openedAt.current > BACKDROP_GRACE_MS
        )
          onClose();
      }}
    >
      <div
        className="etp-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="etp-sheet-title"
        onKeyDown={(e) => {
          // The Close button is the only control, so Tab stays on it.
          if (e.key === 'Tab') {
            e.preventDefault();
            close.current?.focus();
          }
        }}
      >
        <header className="etp-sheet-head">
          <div>
            <h2 id="etp-sheet-title">{content.title}</h2>
            {content.kindName && <p className="etp-kind">{content.kindName}</p>}
          </div>
          <button
            type="button"
            ref={close}
            className="etp-close"
            aria-label={say('phone.close')}
            onClick={onClose}
          >
            {say('phone.closeMark')}
          </button>
        </header>
        {content.kind && (
          <figure
            className="etp-picture"
            role="img"
            aria-label={say('phone.pictureLabel').replace('{name}', content.title)}
          >
            <Motif kind={content.kind} />
            <figcaption>{say('phone.picture')}</figcaption>
          </figure>
        )}
        <div className="etp-lines">
          {content.lines.map((line, n) => (
            <p key={n}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
