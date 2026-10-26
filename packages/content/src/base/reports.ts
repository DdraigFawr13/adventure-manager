// Quest report text (R8 writing test): the letter a party sends home, and naming for drawn people.
import type { NamingRules, ReportText } from '@adventure-manager/engine';
import naming from '../../data/naming.json' with { type: 'json' };
import reports from '../../data/reports.en.json' with { type: 'json' };

// cast-ok: a fixed data file written to the ReportText shape; content tests render every family.
export const reportText = reports as unknown as ReportText;

// cast-ok: a fixed data file written to the NamingRules shape; content tests check its lists.
export const baseNaming = naming as unknown as NamingRules;
