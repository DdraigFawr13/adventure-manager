// Careers v0 starting numbers (packages/engine/src/career/SPEC.md). Every number is an ASSUMPTION
// for the R2 and R9 tuning runs (tools/career-sim.ts); none is a settled decision. Kept apart from
// baseGuildRules so the one-year simulator's tuned numbers stay as they were; tools join the two.
//
// - 3 tiers of 6 guilds (PLAN §4e). Danger mix per tier: bottom 45/40/13/2, middle 30/40/25/5 (the
//   one-year simulator's mix), top 15/35/35/15. Fee scale 85% / 100% / 120%; patron grant
//   3000 / 4000 / 6000 copper.
// - Rivals: strength 0-100, tier means 64 / 62 / 72 (see the bottom tier's note), spread +-10 at
//   the start; contracts a year 36 / 38 / 40; win chance 50% + 1.5% per point of strength above the danger's difficulty
//   (routine 20, hazardous 40, perilous 60, deadly 80), 5-95%. Expected renown a year for a rival
//   at its tier's mean, from those numbers: about 77 / 100 / 166, set so the default player policy
//   (about 75 / 110 / 139 renown a year in a 20-career run) climbs out of the bottom tier in 3-5
//   years, holds the middle and struggles at the top.
// - Drift a year: a third of the way to the tier's mean, 1 point per 25 renown above or below
//   that expectation, noise +-3.
// - People: drawn at 18-30, potential 0-6 above each attribute; prime ends at 32; growth chance per
//   quest 10% to age 24, 5% to 32; past 32, a 3% a year step (to 30%) to lose each physical point,
//   and an 8% a year step (to 60%) to ask to retire.
// - Patron (D-141): confidence starts at 60 of 100; met +15, missed -15 a place short (at most -40),
//   in debt at year's end -15. Emergency grant (D-146): offered to a guild in debt at a week start,
//   8 weeks of its wages, at most one taken in 3 years, costing 15 confidence and a target one step
//   harder next year. Guildmaster starts at 30-45; health retirement from 60, certain by 75.
import type { CareerRules, GuildRules } from '@adventure-manager/engine';
import { baseGuildRules } from './guild.ts';

export const baseCareerRules: CareerRules = {
  guildsPerTier: 6,
  tiers: [
    {
      dangerWeights: { routine: 45, hazardous: 40, perilous: 13, deadly: 2 },
      feeBp: 8500,
      grantCopper: 3000,
      rivalMean: 64, // Above the middle's 62: strength earns renown by the tier's contracts, so 64 here is about 77 a year.
      rivalContracts: 36,
      rivalRenown: 77,
    },
    {
      dangerWeights: { routine: 30, hazardous: 40, perilous: 25, deadly: 5 },
      feeBp: 10000,
      grantCopper: 4000,
      rivalMean: 62,
      rivalContracts: 38,
      rivalRenown: 100,
    },
    {
      dangerWeights: { routine: 15, hazardous: 35, perilous: 35, deadly: 15 },
      feeBp: 12000,
      grantCopper: 6000,
      rivalMean: 72,
      rivalContracts: 40,
      rivalRenown: 166,
    },
  ],
  drawAge: { min: 18, max: 30 },
  potential: { min: 0, max: 6 },
  primeAge: 32,
  growth: { youngAge: 24, youngBp: 1000, primeBp: 500 },
  declineStepBp: 300,
  declineMaxBp: 3000,
  retireStepBp: 800,
  retireMaxBp: 6000,
  rivalWin: { baseBp: 5000, stepBp: 150, minBp: 500, maxBp: 9500 },
  dangerDifficulty: { routine: 20, hazardous: 40, perilous: 60, deadly: 80 },
  rivalSpread: 10,
  rivalDrift: { pullDiv: 3, renownPerPoint: 25, noise: 3 },
  patron: { start: 60, met: 15, perPlaceShort: 15, maxMiss: 40, debt: 15, max: 100 },
  emergency: { wageWeeks: 8, everyYears: 3, confidenceCost: 15 },
  guildmaster: { age: { min: 30, max: 45 }, healthFromAge: 60, certainAge: 75 },
};

/** The guild rules with careers on: what the career simulator plays. */
export const careerGuildRules: GuildRules = { ...baseGuildRules, career: baseCareerRules };
