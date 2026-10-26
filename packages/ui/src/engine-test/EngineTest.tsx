// The engine-test window (D-110): the two test pieces behind tabs, with the reading settings
// from D-077 (100–150% size slider, clear print) applied to the ledger layer.
import { useEffect, useState } from 'react';
import { engineTestLedgerText as text } from '@adventure-manager/content';
import { Ledger } from './Ledger.tsx';
import { MapView } from './map/MapView.tsx';

type Tab = 'ledger' | 'map';

function initialTab(): Tab {
  return new URLSearchParams(window.location.search).get('tab') === 'map' ? 'map' : 'ledger';
}

export function EngineTest() {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sizePct, setSizePct] = useState(100);
  const [clearPrint, setClearPrint] = useState(false);
  useEffect(() => {
    document.documentElement.style.setProperty('--et-scale', String(sizePct / 100));
  }, [sizePct]);

  return (
    <div className={`et-app${clearPrint ? ' et-clear-print' : ''}`}>
      <nav className="et-bar" aria-label={text.title}>
        <div role="tablist" className="et-tabs">
          {(['ledger', 'map'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`et-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={tab === id ? `et-panel-${id}` : undefined}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(e) => {
                // Arrow keys move between tabs (WAI-ARIA tabs pattern).
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                const other = id === 'ledger' ? 'map' : 'ledger';
                setTab(other);
                document.getElementById(`et-tab-${other}`)?.focus();
              }}
            >
              {text.tabs[id]}
            </button>
          ))}
        </div>
        <label className="et-setting">
          {text.controls.size}
          <input
            type="range"
            min={100}
            max={150}
            step={10}
            value={sizePct}
            onChange={(e) => setSizePct(Number(e.target.value))}
          />
          <output>{sizePct}%</output>
        </label>
        <label className="et-setting">
          <input
            type="checkbox"
            checked={clearPrint}
            onChange={(e) => setClearPrint(e.target.checked)}
          />
          {text.controls.clearPrint}
        </label>
      </nav>
      <main className="et-panel">
        <div
          className="et-tabpanel"
          role="tabpanel"
          id={`et-panel-${tab}`}
          aria-labelledby={`et-tab-${tab}`}
        >
          {tab === 'ledger' ? <Ledger /> : <MapView />}
        </div>
      </main>
    </div>
  );
}
