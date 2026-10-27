// Step 4 people (D-195–D-199): standing parties, backgrounds, histories and the memorial letter.
// The numbers are ASSUMPTIONS for the prototype except friendAfterQuests (5, the owner's, D-199).
// The default plan (assault, steady, the leader's call) is the year simulator's default policy
// (tools/year-sim-play.ts); the player changes it per party.
import type {
  BackgroundRules,
  HistoryRules,
  PeopleText,
  StandingRules,
} from '@adventure-manager/engine';
import people from '../../data/people.en.json' with { type: 'json' };
import { reportText } from './reports.ts';

// cast-ok: a fixed data file written to the PeopleText shape; content tests render every family.
export const peopleText = people as unknown as PeopleText;

/** Homes, trades and party names, keyed by content id. */
export const peopleNames: Readonly<Record<string, string>> = people.names;

const idsOf = (prefix: string) => Object.keys(people.names).filter((id) => id.startsWith(prefix));

export const baseStandingRules: StandingRules = {
  names: idsOf('party.'),
  defaultPlan: { approach: 'assault', risk: 'steady', retreat: 'leader' },
};

export const baseBackgroundRules: BackgroundRules = {
  homes: idsOf('home.'),
  trades: idsOf('trade.'),
};

export const baseHistoryRules: HistoryRules = {
  friendAfterQuests: 5,
  deeds: reportText.deeds,
};
