// The engine-test roster ledger (D-110, PLAN §11a): 30 rows, sorting, a breakdown on every
// number the engine derives (D-078) read from its Value parts, keyboard play through one roving
// focus. Level, age and weeks left are plain facts here; they become Values with the roster system.
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  engineTestLedgerText as text,
  engineTestRoster as roster,
} from '@adventure-manager/content';
import {
  Breakdown,
  CoinSlots,
  COLUMNS,
  CONDITION_MARK,
  cellOf,
  compareKeys,
  fill,
  MONEY_COLUMNS,
  sortKey,
  TEXT_COLUMNS,
  type ColumnId,
} from './ledger-cells.tsx';
import '../../styles/engine-test-ledger.css';

export function Ledger() {
  const [sort, setSort] = useState<{ column: ColumnId; descending: boolean }>({
    column: 'name',
    descending: false,
  });
  const [focus, setFocus] = useState<{ row: number; col: number }>({ row: -1, col: 0 });
  const [dismissed, setDismissed] = useState(false);
  const [hover, setHover] = useState<{ row: number; col: number } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const rows = useMemo(() => {
    const sorted = [...roster].sort((a, b) => {
      const order = compareKeys(sortKey(cellOf(a, sort.column)), sortKey(cellOf(b, sort.column)));
      return (sort.descending ? -order : order) || compareKeys(a.id, b.id);
    });
    return sorted;
  }, [sort]);

  const sortBy = (column: ColumnId) =>
    setSort((s) =>
      s.column === column
        ? { column, descending: !s.descending }
        : { column, descending: !TEXT_COLUMNS.has(column) },
    );

  const moveFocus = (row: number, col: number) => {
    const r = Math.max(-1, Math.min(rows.length - 1, row));
    const c = Math.max(0, Math.min(COLUMNS.length - 1, col));
    setFocus({ row: r, col: c });
    setHover(null);
    setDismissed(false);
    const selector =
      r < 0
        ? `thead th:nth-child(${c + 1}) button`
        : `tbody tr:nth-child(${r + 1}) > :nth-child(${c + 1})`;
    tableRef.current?.querySelector<HTMLElement>(selector)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const delta = step[event.key];
    if (delta) {
      event.preventDefault();
      moveFocus(focus.row + delta[0], focus.col + delta[1]);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveFocus(focus.row, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveFocus(focus.row, COLUMNS.length - 1);
    } else if (event.key === 'Escape') {
      // Dismisses the breakdown without moving focus (WCAG 1.4.13).
      setHover(null);
      setDismissed(true);
    }
  };

  const shown = dismissed ? null : (hover ?? (focus.row >= 0 ? focus : null));
  const status = fill(text.controls.sortedBy, {
    column: text.columns[sort.column],
    direction: sort.descending ? text.controls.descending : text.controls.ascending,
  });

  return (
    <section className="et-sheet" aria-labelledby="et-ledger-title">
      <header className="et-sheet-head">
        <h1 id="et-ledger-title">{text.title}</h1>
        <p>{text.subtitle}</p>
        <p className="et-status" aria-live="polite">
          {status}
        </p>
      </header>
      <table
        className="et-ledger"
        ref={tableRef}
        role="grid"
        aria-labelledby="et-ledger-title"
        onKeyDown={onKeyDown}
      >
        <thead>
          <tr>
            {COLUMNS.map((column, col) => (
              <th
                key={column}
                scope="col"
                className={`et-col-${column}`}
                aria-sort={
                  sort.column === column ? (sort.descending ? 'descending' : 'ascending') : 'none'
                }
              >
                <button
                  type="button"
                  tabIndex={focus.row === -1 && focus.col === col ? 0 : -1}
                  title={text.columnTitles[column]}
                  onClick={() => sortBy(column)}
                  onFocus={() => setFocus({ row: -1, col })}
                >
                  {text.columns[column]}
                  <span aria-hidden="true" className="et-sort-mark">
                    {sort.column === column ? (sort.descending ? '▾' : '▴') : ''}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={row.id}>
              {COLUMNS.map((column, col) => {
                const cell = cellOf(row, column);
                const active = shown?.row === r && shown.col === col;
                const tipId = `et-tip-${row.id}-${column}`;
                const content =
                  cell.kind === 'text' ? (
                    column === 'condition' ? (
                      <span className={`et-cond et-cond-${row.condition}`}>
                        <span aria-hidden="true">{CONDITION_MARK[row.condition]}</span> {cell.label}
                      </span>
                    ) : (
                      cell.label
                    )
                  ) : cell.kind === 'number' ? (
                    cell.value
                  ) : (
                    <span className="et-value">
                      {MONEY_COLUMNS.has(column) ? (
                        <CoinSlots amount={cell.value.total} />
                      ) : (
                        cell.value.total
                      )}
                      <span className="et-has-parts" aria-hidden="true">
                        {text.controls.breakdownMark}
                      </span>
                    </span>
                  );
                const Tag = col === 0 ? 'th' : 'td';
                return (
                  <Tag
                    key={column}
                    scope={col === 0 ? 'row' : undefined}
                    className={`et-col-${column}${cell.kind === 'text' ? '' : ' et-num'}${active ? ' et-active' : ''}`}
                    tabIndex={focus.row === r && focus.col === col ? 0 : -1}
                    aria-describedby={active && cell.kind === 'value' ? tipId : undefined}
                    onFocus={() => setFocus({ row: r, col })}
                    onMouseEnter={() => {
                      setHover({ row: r, col });
                      setDismissed(false);
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    {content}
                    {active && cell.kind === 'value' && (
                      <Breakdown id={tipId} row={row} column={column} value={cell.value} />
                    )}
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
