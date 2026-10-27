// Report text: the letter a party sends home (R8), people's histories and memorial letters (R7),
// and naming for drawn people.
import type { HistoryText, MemorialText, NamingRules, ReportText } from '@adventure-manager/engine';
import histories from '../../data/histories.en.json' with { type: 'json' };
import memorials from '../../data/memorials.en.json' with { type: 'json' };
import naming from '../../data/naming.json' with { type: 'json' };
import reports from '../../data/reports.en.json' with { type: 'json' };

// cast-ok: a fixed data file written to the ReportText shape; content tests render every family.
export const reportText = reports as unknown as ReportText;

// cast-ok: a fixed data file written to the NamingRules shape; content tests check its lists.
export const baseNaming = naming as unknown as NamingRules;

// cast-ok: a fixed data file written to the HistoryText shape; content tests render every family.
export const historyText = histories as unknown as HistoryText;

// cast-ok: a fixed data file written to the MemorialText shape; content tests render every family.
export const memorialText = memorials as unknown as MemorialText;
