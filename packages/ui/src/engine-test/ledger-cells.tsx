// The ledger's cells (D-110): what each column shows, how it sorts, and the breakdown a derived
// number opens (D-078). Money shows as gold, silver and copper (D-135); the engine splits it.
import { ATTRIBUTES, splitCoins, type Value } from '@adventure-manager/engine';
import {
  coinRates,
  engineTestLedgerText as text,
  type EngineTestRosterRow as Row,
} from '@adventure-manager/content';

export type ColumnId = keyof typeof text.columns;
export type Cell =
  | { kind: 'text'; label: string; sort: string }
  | { kind: 'number'; value: number }
  | {
      kind: 'value';
      value: Value;
    };

export const COLUMNS: readonly ColumnId[] = [
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
export const TEXT_COLUMNS: ReadonlySet<ColumnId> = new Set([
  'name',
  'ancestry',
  'class',
  'condition',
]);
export const CONDITION_MARK: Record<string, string> = {
  fit: '●',
  hurt: '◐',
  badlyHurt: '○',
  resting: '☾',
};

export function fill(template: string, slots: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => slots[key] ?? '');
}

export function cellOf(row: Row, column: ColumnId): Cell {
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
      return { kind: 'value', value: row.wageCopper };
    default: {
      return { kind: 'value', value: row.attributes[column] };
    }
  }
}

export function sortKey(cell: Cell): string | number {
  if (cell.kind === 'text') return cell.sort;
  return cell.kind === 'number' ? cell.value : cell.value.total;
}

export function compareKeys(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  // Display order only; the engine never sorts by text (STANDARDS: no localeCompare there).
  return String(a).localeCompare(String(b));
}

/** Money columns show gold, silver and copper (D-135); the engine splits, the ui joins words. */
export const MONEY_COLUMNS: ReadonlySet<ColumnId> = new Set(['wage']);

function amountText(amount: number, column: ColumnId): string {
  if (!MONEY_COLUMNS.has(column)) return String(amount);
  const coins = splitCoins(amount, coinRates);
  const parts = (['gold', 'silver', 'copper'] as const)
    .filter((coin, i, all) => coins[coin] > 0 || (i === all.length - 1 && amount === 0))
    .map((coin) => `${coins[coin]}${text.coins[coin]}`);
  return parts.join(' ');
}

/** In the ledger column each coin has its own slot, so gold, silver and copper line up down the page. */
export function CoinSlots({ amount }: { amount: number }) {
  const coins = splitCoins(amount, coinRates);
  return (
    <span className="et-coins">
      {(['gold', 'silver', 'copper'] as const).map((coin) => (
        <span key={coin} className="et-coin">
          {coins[coin] > 0 || (coin === 'copper' && amount === 0)
            ? `${coins[coin]}${text.coins[coin]}`
            : ''}
        </span>
      ))}
    </span>
  );
}

function signed(amount: number, column: ColumnId): string {
  return `${amount < 0 ? '−' : '+'}${amountText(Math.abs(amount), column)}`;
}

export function Breakdown({
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
    <div className="et-breakdown" role="tooltip" id={id} aria-hidden="true">
      <div className="et-breakdown-title">{title}</div>
      <table>
        <tbody>
          <tr>
            <th scope="row">{text.controls.base}</th>
            <td>{amountText(value.base, column)}</td>
          </tr>
          {value.parts.map((part) => (
            <tr key={part.sourceId}>
              <th scope="row">{text.sources[part.sourceId] ?? part.sourceId}</th>
              <td>{signed(part.amount, column)}</td>
            </tr>
          ))}
          <tr className="et-breakdown-total">
            <th scope="row">{text.controls.total}</th>
            <td>{amountText(value.total, column)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
