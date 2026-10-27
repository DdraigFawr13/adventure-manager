// The founding draft's starting numbers (packages/engine/src/guild/SPEC.md, Founding draft). Every
// number is an ASSUMPTION for the D-188 tuning runs (tools/career-sim.ts with the house on); none is
// a settled decision. Money is in copper.
//
// - Purse 33,500: a balanced party of 5 plus the 2 cheapest extras pays about 3,500 in fees (8 weeks
//   of each wage) and leaves about 30,000, the measured stand-in the house start used before the
//   draft: over 100 careers 17,000 left 20% of guildmasters dismissed, 30,000 15% (the run of the
//   reviewed PR #29 branch; an earlier 30,000 run measured 13%).
// - Three starter parties of 5, one per character, in this order: seasoned (+2 to every attribute,
//   age 28-36, fees at 4x), balanced (no shift, age 20-30, plain fees) and green (-1, age 18-22,
//   +4 potential, fees at a quarter).
// - 6 extras offered, drawn as normal prospects; pick 2 or 3. Fee: 8 weeks of the person's wage,
//   like the sign-on fee (D-138), times the party character's share; extras pay the plain fee.
// - Measured (career-sim house=on party=compare, the same 100 seeds each, 26 years, 2026-10-27):
//   dismissed seasoned 9%, balanced 8%, green 9%; year-1 chest median 14,972 / 12,194 / 8,530;
//   first-year renown median 59 / 50 / 43, before the review's fixes. Re-measured after the pick
//   started paying the first week's wages and the draft got its own life and name streams (the
//   same 100 seeds each): dismissed 13% / 14% / 15%; year-1 chest median 15,677 / 9,526 / 8,913;
//   first-year renown median 61 / 48 / 43. Earlier runs, the same 100 seeds each: with plain fees seasoned was dominant
//   (11% dismissed but the richest) and green weak (20%); seasoned at 6x fees fell to 39% dismissed,
//   at 8x 58%. Green's long-run payoff (growth from +4 potential) is not yet measured.
import type { FoundingRules } from '@adventure-manager/engine';

export const baseFoundingRules: FoundingRules = {
  purseCopper: 33500,
  partySize: 5,
  characters: [
    {
      id: 'seasoned',
      attributeShift: 2,
      age: { min: 28, max: 36 },
      potentialBonus: 0,
      feeBp: 40000,
    },
    {
      id: 'balanced',
      attributeShift: 0,
      age: { min: 20, max: 30 },
      potentialBonus: 0,
      feeBp: 10000,
    },
    { id: 'green', attributeShift: -1, age: { min: 18, max: 22 }, potentialBonus: 4, feeBp: 2500 },
  ],
  extras: { offered: 6, min: 2, max: 3 },
  feeWeeks: 8,
};
