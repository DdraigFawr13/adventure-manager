// The engine-test roster ledger (D-110, PLAN §11a): 30 rows, sorting, a breakdown on every
// number (D-078) read from the engine's Value parts, keyboard play through one roving focus.
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ATTRIBUTES, type Value } from '@adventure-manager/engine';
import {
  engineTestLedgerText as text,
  engineTestRoster as roster,
  type EngineTestRosterRow as Row,
} from '@adventure-manager/content';

type ColumnId = keyof typeof text.columns;
type Cell =
  | { kind: 'text'; label: string; sort: string }
  | { kind: 'number'; value: number }
  | {
      kind: 'value';
      value: Value;
    };

const COLUMNS: readonly ColumnId[] = [
  'name',
  'ancestry',
  'class',
  'level',
  'age',
  'condition',
  'morale',
  ...ATTRIBUTES,
  'wage',
  'contract',
];
/** Text columns sort A to Z first; number columns sort highest first. */
const TEXT_COLUMNS: ReadonlySet<ColumnId> = new Set(['name', 'ancestry', 'class', 'condition']);
const CONDITION_MARK: Record<string, string> = {
  fit: '●',
  hurt: '◐',
  badlyHurt: '○',
  resting: '☾',
};

function fill(template: string, slots: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => slots[key] ?? '');
}

function cellOf(row: Row, column: ColumnId): Cell {
  switch (column) {
    case 'name':
      return { kind: 'text', label: row.name, sort: row.name };
    case 'ancestry': {
      const label = text.ancestries[row.ancestryId] ?? row.ancestryId;
      return { kind: 'text', label, sort: label };
    }
    case 'class': {
      const label = text.classes[row.classId] ?? row.classId;
      return { kind: 'text', label, sort: label };
    }
    case 'condition': {
      const label = text.conditions[row.condition] ?? row.condition;
      return {
        kind: 'text',
        label,
        sort: String(Object.keys(CONDITION_MARK).indexOf(row.condition)),
      };
    }
    case 'level':
      return { kind: 'number', value: row.level };
    case 'age':
      return { kind: 'number', value: row.age };
    case 'contract':
      return { kind: 'number', value: row.contractWeeks };
    case 'morale':
      return { kind: 'value', value: row.morale };
    case 'wage':
      return { kind: 'value', value: row.wagePennies };
    default: {
      return { kind: 'value', value: row.attributes[column] };
    }
  }
}

function sortKey(cell: Cell): string | number {
  if (cell.kind === 'text') return cell.sort;
  return cell.kind === 'number' ? cell.value : cell.value.total;
}

function compareKeys(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  // Display order only; the engine never sorts by text (STANDARDS: no localeCompare there).
  return String(a).localeCompare(String(b));
}

function Breakdown({
  id,
  row,
  column,
  value,
}: {
  id: string;
  row: Row;
  column: ColumnId;
  value: Value;
}) {
  const title = fill(text.controls.breakdownOf, {
    name: row.name,
    column: text.columnTitles[column] ?? text.columns[column],
  });
  return (
    <div className="et-breakdown" role="tooltip" id={id}>
      <div className="et-breakdown-title">{title}</div>
      <table>
        <tbody>
          <tr>
            <th scope="row">{text.controls.base}</th>
            <td>{value.base}</td>
          </tr>
          {value.parts.map((part) => (
            <tr key={part.sourceId}>
              <th scope="row">{text.sources[part.sourceId] ?? part.sourceId}</th>
              <td>{part.amount > 0 ? `+${part.amount}` : `−${-part.amount}`}</td>
            </tr>
          ))}
          <tr className="et-breakdown-total">
            <th scope="row">{text.controls.total}</th>
            <td>{value.total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function Ledger() {
  const [sort, setSort] = useState<{ column: ColumnId; descending: boolean }>({
    column: 'name',
    descending: false,
  });
  const [focus, setFocus] = useState<{ row: number; col: number }>({ row: -1, col: 0 });
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
    }
  };

  const shown = hover ?? (focus.row >= 0 ? focus : null);
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
                      {cell.value.total}
                      {cell.value.parts.length > 0 && (
                        <span className="et-has-parts" aria-hidden="true" />
                      )}
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
                    onMouseEnter={() => setHover({ row: r, col })}
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
