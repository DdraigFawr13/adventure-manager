// Engine-test ledger data (D-110): a generated 30-row roster and its words. Throwaway with the
// engine-test screens; the roster system replaces it.
import type { Attribute, Value } from '@adventure-manager/engine';
import roster from '../../data/engine-test-roster.json' with { type: 'json' };
import text from '../../data/engine-test-ledger.en.json' with { type: 'json' };
import mapText from '../../data/engine-test.en.json' with { type: 'json' };

export interface EngineTestRosterRow {
  readonly id: string;
  readonly name: string;
  readonly ancestryId: string;
  readonly classId: string;
  readonly level: number;
  readonly age: number;
  readonly condition: string;
  readonly morale: Value;
  readonly attributes: Readonly<Record<Attribute, Value>>;
  readonly wageCopper: Value;
  readonly contractWeeks: number;
}

// cast-ok: written by tools/make-engine-test-roster.ts from engine Values; the content test checks every total.
export const engineTestRoster = roster.rows as readonly EngineTestRosterRow[];

type Lookup = Readonly<Record<string, string>>;

/** The map's words and invented place names, keyed by id. */
export const engineTestMapText: Lookup = mapText;

/** The ledger's words; id-keyed tables are lookups, so a missing id shows as the id. */
export const engineTestLedgerText: Omit<
  typeof text,
  'ancestries' | 'classes' | 'conditions' | 'sources' | 'columnTitles'
> & {
  readonly ancestries: Lookup;
  readonly classes: Lookup;
  readonly conditions: Lookup;
  readonly sources: Lookup;
  readonly columnTitles: Lookup;
} = text;
