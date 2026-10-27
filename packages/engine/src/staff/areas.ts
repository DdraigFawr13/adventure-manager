// Staff v0 (SPEC.md): who runs training and recovery, what that does, the guildmaster's growth
// by doing, the shortlist of staff, and hiring and releasing them.
import type { EventSink } from '../core/events.ts';
import { clamp, divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import { guildTurn, pay, type GuildTurn } from '../guild/turn.ts';
import type { StopReason } from '../guild/types.ts';
import type { Command, GameEvent, GameState } from '../resolution/types.ts';
import { AREAS, type Area, type StaffState } from './types.ts';

const NEUTRAL = 10;

/** At the founding: the guildmaster's skills; the guildmaster runs both areas. */
export function startStaff(turn: GuildTurn): void {
  const rules = turn.rules.staff;
  if (!rules) return;
  const rng = streamFor(turn.state, 'staff.guildmaster');
  const skill = () => rng.between(rules.guildmasterSkill.min, rules.guildmasterSkill.max);
  const state: StaffState = {
    skills: { training: skill(), recovery: skill() },
    staff: {},
    candidates: [],
    ranAllYear: { training: true, recovery: true },
    nextNo: 0,
  };
  turn.guild.staff = state;
}

/** The skill running an area: the staff member's quality, else the guildmaster's skill. */
export function skillFor(turn: GuildTurn, area: Area): number {
  const staff = turn.guild.staff;
  if (!staff) return NEUTRAL;
  return staff.staff[area]?.quality ?? staff.skills[area];
}

/** Training scales the growth chance; 10,000 is no change (SPEC.md, What an area does). */
export function trainingBp(turn: GuildTurn): number {
  const rules = turn.rules.staff;
  if (!rules) return BP_CERTAIN;
  return Math.max(0, BP_CERTAIN + rules.trainingStepBp * (skillFor(turn, 'training') - NEUTRAL));
}

/** Recovery scales the days a lasting injury keeps someone out, at least one. */
export function injuryDays(turn: GuildTurn, days: number): number {
  const rules = turn.rules.staff;
  if (!rules) return days;
  const bp = BP_CERTAIN - rules.recoveryStepBp * (skillFor(turn, 'recovery') - NEUTRAL);
  return Math.max(1, divRoundDown(days * clamp(bp, 0, 2 * BP_CERTAIN), BP_CERTAIN));
}

export function runsArea(turn: GuildTurn, area: Area): boolean {
  return turn.guild.staff !== undefined && turn.guild.staff.staff[area] === undefined;
}

/** Each week start: staff wages, and the guildmaster's training plan when it is due. */
export function staffWeek(
  turn: GuildTurn,
  campaignWeek: number | null,
  causeId: string,
  stops: Set<StopReason>,
): void {
  const staff = turn.guild.staff;
  const rules = turn.rules.staff;
  if (!staff || !rules) return;
  const wages = AREAS.reduce((sum, a) => sum + (staff.staff[a]?.wageCopper ?? 0), 0);
  if (wages > 0) pay(turn, -wages, 'staff', causeId);
  if (
    campaignWeek !== null &&
    runsArea(turn, 'training') &&
    campaignWeek % rules.trainingPlanEveryWeeks === 0
  )
    stops.add('training-plan');
}

/** At each Assembly after the first: growth by doing, then a fresh shortlist (also at the founding). */
export function staffAssembly(turn: GuildTurn, year: number, causeId: string): void {
  const staff = turn.guild.staff;
  const rules = turn.rules.staff;
  if (!staff || !rules) return;
  if (year > 1) {
    const rng = streamFor(turn.state, 'staff.guildmaster');
    for (const area of AREAS) {
      const from = staff.skills[area];
      const chance =
        from >= rules.skillCap ? 0 : from >= rules.nearCapFrom ? rules.growNearCapBp : rules.growBp;
      // Always draw, so one area's growth never shifts the other's.
      const grows = rng.chance(chance);
      if (grows && staff.ranAllYear[area]) {
        staff.skills[area] = from + 1;
        turn.sink.emit({ type: 'skill.grew', causeId, subjectIds: [], area, from, to: from + 1 });
      }
      staff.ranAllYear[area] = staff.staff[area] === undefined;
    }
  }
  const rng = streamFor(turn.state, 'staff.hire');
  staff.candidates.length = 0;
  for (const area of AREAS)
    for (let n = 0; n < rules.candidatesPerArea; n += 1) {
      const quality = rng.between(rules.quality.min, rules.quality.max);
      staff.nextNo += 1;
      const candidate = {
        id: `staff.${staff.nextNo}`,
        area,
        quality,
        wageCopper: Math.max(1, rules.wageBaseCopper + rules.wageStepCopper * (quality - NEUTRAL)),
      };
      staff.candidates.push(candidate);
      turn.sink.emit({
        type: 'staff.listed',
        causeId,
        subjectIds: [candidate.id],
        area,
        quality,
        wageCopper: candidate.wageCopper,
      });
    }
}

export function hireStaff(
  state: GameState,
  command: Extract<Command, { type: 'staff.hire' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = guildTurn(state, sink);
  const staff = turn.guild.staff;
  if (!staff) throw new Error('This guild has no staff rules.');
  if (command.day !== state.calendar) throw new Error(`Day ${command.day} is not today.`);
  const candidate = staff.candidates.find((c) => c.id === command.candidateId);
  if (!candidate) throw new Error(`${command.candidateId} is not on the shortlist.`);
  staff.candidates.splice(staff.candidates.indexOf(candidate), 1);
  if (staff.staff[candidate.area])
    sink.emit({
      type: 'staff.released',
      causeId: command.id,
      subjectIds: [staff.staff[candidate.area]!.id],
      area: candidate.area,
    }); // non-null: just checked.
  staff.staff[candidate.area] = {
    id: candidate.id,
    quality: candidate.quality,
    wageCopper: candidate.wageCopper,
  };
  staff.ranAllYear[candidate.area] = false;
  sink.emit({
    type: 'staff.hired',
    causeId: command.id,
    subjectIds: [candidate.id],
    area: candidate.area,
    quality: candidate.quality,
    wageCopper: candidate.wageCopper,
  });
}

export function releaseStaff(
  state: GameState,
  command: Extract<Command, { type: 'staff.release' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = guildTurn(state, sink);
  const staff = turn.guild.staff;
  if (!staff) throw new Error('This guild has no staff rules.');
  if (command.day !== state.calendar) throw new Error(`Day ${command.day} is not today.`);
  const member = staff.staff[command.area];
  if (!member) throw new Error(`Nobody is hired for ${command.area}.`);
  delete staff.staff[command.area];
  sink.emit({
    type: 'staff.released',
    causeId: command.id,
    subjectIds: [member.id],
    area: command.area,
  });
}
