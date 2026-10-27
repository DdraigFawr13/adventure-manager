// Named balance scenarios (tools/balance/README.md): each is one way of playing seeded careers.
// A run may change any field from the command line; the baseline keeps the fields it was saved with.

export interface Scenario {
  readonly description: string;
  /** Careers to play: seeds career-0 .. career-(n-1), the same seeds tools/career-sim.ts uses. */
  readonly careers: number;
  readonly years: number;
  /** A player policy from tools/year-sim-play.ts. */
  readonly policy: string;
  readonly house: 'off' | 'on';
  readonly incidents: 'off' | 'on';
  /** With house on: the founding draft's starter party (D-188). */
  readonly party: string;
  /** Founded roster size; unused with the house on (the draft picks it). */
  readonly size: number;
  readonly grants: 'take' | 'refuse';
  /** Staff rules on; `delegate` hands training and recovery to the best affordable hire (R6). */
  readonly staff: 'off' | 'hands-on' | 'delegated';
}

const classic: Scenario = {
  description: 'The guild without the house: a drawn roster of 15, career rules, rivals abstract.',
  careers: 100,
  years: 26,
  policy: 'default',
  house: 'off',
  incidents: 'off',
  party: 'balanced',
  size: 15,
  grants: 'take',
  staff: 'off',
};

const house: Scenario = {
  ...classic,
  description:
    'The house on: founding draft (balanced party, 2 extras), the full house plan built.',
  house: 'on',
  size: 7,
};

export const SCENARIOS: Readonly<Record<string, Scenario>> = {
  classic,
  house,
  'house-incidents': {
    ...house,
    description: 'The house with fire, theft and sickness letters and inn lodgers (D-190–D-193).',
    incidents: 'on',
  },
  'staff-hands-on': {
    ...classic,
    description: 'Staff rules on; the guildmaster runs training and recovery (R6, one side).',
    staff: 'hands-on',
  },
};
