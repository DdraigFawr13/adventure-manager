// Guild year v0 starting numbers (packages/engine/src/guild/SPEC.md). Every number here is an
// ASSUMPTION from the owner's brief (PLAN §2, §4b, §4c), to be tuned by R2 and R3 with
// tools/year-sim.ts; none is a settled decision. Money is in copper.
//
// - Calendar: 48 weeks of 7 days. Assembly weeks 1-4, campaigning 5-36, winter 37-48.
//   Signing windows: weeks 1-4 and 20-21.
// - Board: 3 new offers a week in the Assembly, 4 campaigning, 1 in winter; each lives 2 weeks.
// - Danger mix 30/40/25/5; travel days each way 4/6/8/9 (+0-2), so the farthest sites are 9-11 days out (D-134);
//   every survivor then refits 7 days at home, so a quest cycle runs about 3 weeks (PLAN §2a); fee spread +-20%.
// - Pay by outcome: won 100%, partial 50%, retreated 0, routed 0; loot on a win 20% of the fee.
// - Running costs 500 a week; patron grant 4000 at the Assembly; starting chest 17000.
// - Wages: base warrior 60, rogue 54, cleric 48, plus 4 per point the best three attributes
//   average above 10 (floor base - 10).
// - Recovery 3 rest days per wound step; an injury adds 3-8 weeks out.
// - Prospects 4 per window week, attributes 7-14, +2..+4 on the class's two lead attributes.
// - Renown per win by danger 1/3/8/20; a rout loses the same.
//
// FEE_SCALE_PERCENT is the one factor tuned so the default policy's year-end surplus lands in
// +10..20% of spending (tools/year-sim.ts, 1,000 years, after the 2026-10-26 travel change); the base fees below are the brief's 900/2250/5600/14000.
import type { GuildRules } from '@adventure-manager/engine';

export const FEE_SCALE_PERCENT = 122;

function fee(baseCopper: number): number {
  return Math.round((baseCopper * FEE_SCALE_PERCENT) / 100);
}

export const baseGuildRules: GuildRules = {
  weeksPerYear: 48,
  daysPerWeek: 7,
  assemblyWeeks: 4,
  winterFromWeek: 37,
  signingWindows: [
    { from: 1, to: 4 },
    { from: 20, to: 21 },
  ],
  offersPerWeek: { assembly: 3, campaign: 4, winter: 1 },
  offerLifeWeeks: 2,
  dangers: [
    {
      danger: 'routine',
      weight: 30,
      feeCopper: fee(900),
      feeSpreadBp: 2000,
      travelDays: 4,
      travelSpreadDays: 2,
      renownWin: 1,
    },
    {
      danger: 'hazardous',
      weight: 40,
      feeCopper: fee(2250),
      feeSpreadBp: 2000,
      travelDays: 6,
      travelSpreadDays: 2,
      renownWin: 3,
    },
    {
      danger: 'perilous',
      weight: 25,
      feeCopper: fee(5600),
      feeSpreadBp: 2000,
      travelDays: 8,
      travelSpreadDays: 2,
      renownWin: 8,
    },
    {
      danger: 'deadly',
      weight: 5,
      feeCopper: fee(14000),
      feeSpreadBp: 2000,
      travelDays: 9,
      travelSpreadDays: 2,
      renownWin: 20,
    },
  ],
  payBp: { won: 10000, partial: 5000, retreated: 0, routed: 0 },
  lootBp: 2000,
  runningCostCopper: 500,
  patronGrantCopper: 4000,
  startingChestCopper: 17000,
  partySize: { min: 4, max: 5 },
  classes: [
    {
      classId: 'class.warrior',
      weight: 4,
      wageBaseCopper: 60,
      lead: ['might', 'toughness'],
      position: 'front',
    },
    {
      classId: 'class.rogue',
      weight: 3,
      wageBaseCopper: 54,
      lead: ['agility', 'stealth'],
      position: 'front',
    },
    {
      classId: 'class.cleric',
      weight: 3,
      wageBaseCopper: 48,
      lead: ['lore', 'resolve'],
      position: 'back',
    },
  ],
  wageStepCopper: 4,
  wagePivot: 10,
  wageFloorBelowBaseCopper: 10,
  restDaysPerWoundStep: 3,
  refitDays: 7,
  injuryWeeks: { min: 3, max: 8 },
  prospectsPerWindowWeek: 4,
  attributeRange: { min: 7, max: 14 },
  leadBonus: { min: 2, max: 4 },
  weaponBp: 300,
  armourBp: 300,
};
