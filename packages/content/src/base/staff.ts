// Staff v0 starting numbers (packages/engine/src/staff/SPEC.md, D-145). Every number is an
// ASSUMPTION for the R6 run (tools/career-sim.ts, hands-on against delegated); none is settled.
//
// - Guildmaster skill per area 8-12 at the founding, cap 18; a year running the area gives a 60%
//   chance of a point, 30% from 14 up.
// - Shortlist: 3 candidates per area at each Assembly, quality 6-12, wage 30 copper a week plus 4
//   per point above 10 (so 14-38): staff are competent but limited, below a seasoned guildmaster.
// - Effect per point above or below 10: 10% on the growth chance (training), 5% on injury days
//   (recovery).
// - The guildmaster running training raises a digest stop every 4 campaigning weeks.
import type { GuildRules, StaffRules } from '@adventure-manager/engine';
import { careerGuildRules } from './career.ts';

export const baseStaffRules: StaffRules = {
  guildmasterSkill: { min: 8, max: 12 },
  skillCap: 18,
  growBp: 6000,
  growNearCapBp: 3000,
  nearCapFrom: 14,
  candidatesPerArea: 3,
  quality: { min: 6, max: 12 },
  wageBaseCopper: 30,
  wageStepCopper: 4,
  trainingStepBp: 1000,
  recoveryStepBp: 500,
  trainingPlanEveryWeeks: 4,
};

/** Careers with staff on: what the career simulator plays for R6. */
export const staffGuildRules: GuildRules = { ...careerGuildRules, staff: baseStaffRules };
