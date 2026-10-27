import { describe, expect, it } from 'vitest';
import type { GameState, StaffRules } from '../src/index.ts';
import { ofType } from './fixture.ts';
import { advanceTo, foundedGuild, play, playDays, testCareer, type Run } from './guild-fixture.ts';

const staff: StaffRules = {
  guildmasterSkill: { min: 10, max: 10 },
  skillCap: 12,
  growBp: 10_000,
  growNearCapBp: 10_000,
  nearCapFrom: 11,
  candidatesPerArea: 2,
  quality: { min: 15, max: 15 },
  wageBaseCopper: 30,
  wageStepCopper: 4,
  trainingStepBp: 1000,
  recoveryStepBp: 1000,
  trainingPlanEveryWeeks: 2,
};
const YEAR = 48 * 7;

function begun(rules: Partial<StaffRules> = {}): Run {
  return foundedGuild(3, { career: testCareer, staff: { ...staff, ...rules } });
}

function hire(run: Run, area: 'training' | 'recovery'): Run {
  const candidate = run.state.guild!.staff!.candidates.find((c) => c.area === area)!; // non-null: listed at the founding.
  return play(run, { type: 'staff.hire', day: run.state.calendar, candidateId: candidate.id });
}

/** Jumps to the last day of the year and steps into the next Assembly. */
function settle(run: Run, adjust: (s: GameState) => void = () => {}): Run {
  const state = structuredClone(run.state);
  state.calendar = YEAR * Math.ceil(state.calendar / YEAR);
  state.guild!.board.length = 0; // non-null: founded.
  adjust(state);
  return play({ ...run, state }, { type: 'day.advance', day: state.calendar + 1 });
}

describe('staff (staff SPEC.md)', () => {
  it('starts with the guildmaster running both areas and a shortlist for each', () => {
    const run = begun();
    const s = run.state.guild!.staff!; // non-null: staff are on.
    expect(s.skills).toEqual({ training: 10, recovery: 10 });
    expect(s.staff).toEqual({});
    expect(
      ofType(run.events, 'staff.listed').map((e) => [e.area, e.quality, e.wageCopper]),
    ).toEqual([
      ['training', 15, 50],
      ['training', 15, 50],
      ['recovery', 15, 50],
      ['recovery', 15, 50],
    ]);
  });

  it('hires from the shortlist onto weekly wages, replaces and releases', () => {
    let run = hire(begun(), 'training');
    expect(run.state.guild!.staff!.staff.training?.quality).toBe(15); // non-null: staff are on.
    expect(() =>
      play(run, { type: 'staff.hire', day: run.state.calendar, candidateId: 'staff.99' }),
    ).toThrow(/shortlist/);
    run = hire(run, 'training');
    expect(ofType(run.events, 'staff.released').length).toBe(1);
    run = advanceTo(run, 8);
    const wages = ofType(run.events, 'money.changed').filter((e) => e.reason === 'staff');
    expect(wages.map((e) => e.amountCopper)).toEqual([-50]);
    run = play(run, { type: 'staff.release', day: 8, area: 'training' });
    expect(run.state.guild!.staff!.staff.training).toBeUndefined(); // non-null: staff are on.
    expect(() => play(run, { type: 'staff.release', day: 8, area: 'training' })).toThrow(/Nobody/);
  });

  it('grows the guildmaster by doing: only areas run all year gain a point, up to the cap', () => {
    const run = settle(hire(begun(), 'recovery'));
    expect(ofType(run.events, 'skill.grew').map((e) => [e.area, e.from, e.to])).toEqual([
      ['training', 10, 11],
    ]);
    // Released mid-year, the guildmaster has not run recovery all year: no growth there.
    const back = settle(
      play(hire(begun(), 'recovery'), { type: 'staff.release', day: 1, area: 'recovery' }),
    );
    expect(ofType(back.events, 'skill.grew').map((e) => e.area)).toEqual(['training']);
    const capped = settle(settle(settle(begun())));
    expect(capped.state.guild!.staff!.skills).toEqual({ training: 12, recovery: 12 }); // non-null: staff are on.
  });

  it('a better runner heals injuries faster, and the guildmaster sees each injured member in', () => {
    const hands = playDays(begun(), 60);
    const injury = ofType(hands.events, 'injury.gained')[0];
    expect(injury).toBeDefined();
    // Same seed and the same quests (wages and stops draw nothing): stop on the day it was reported.
    const day = injury!.day; // non-null: just checked.
    const handsThen = playDays(begun(), day);
    const delegated = playDays(hire(begun(), 'recovery'), day);
    const outUntil = (run: Run) =>
      run.state.guild!.members.find((m) => m.id === injury!.subjectIds[0])?.outUntilDay; // non-null: founded, checked.
    // Three weeks out is 21 days at skill 10, and 10 at quality 15 (half, rounded down).
    expect((outUntil(handsThen) ?? 0) - (outUntil(delegated) ?? 0)).toBe(11);
    const laidUp = (run: Run) =>
      ofType(run.events, 'member.laid-up').map((e) => [e.subjectIds[0], e.days]);
    expect(laidUp(handsThen)).toEqual([[injury!.subjectIds[0], 21]]); // non-null: checked above.
    expect(laidUp(delegated)).toEqual([[injury!.subjectIds[0], 10]]); // non-null: checked above.
    expect(ofType(hands.events, 'stop.raised').some((e) => e.reason === 'infirmary')).toBe(true);
    expect(ofType(delegated.events, 'stop.raised').some((e) => e.reason === 'infirmary')).toBe(
      false,
    );
  });

  it('the guildmaster running training raises a training-plan stop every few campaigning weeks', () => {
    const plans = (run: Run) =>
      ofType(run.events, 'stop.raised').filter((e) => e.reason === 'training-plan').length;
    // Campaigning runs weeks 5-36: 32 weeks, a plan every 2.
    expect(plans(playDays(begun(), 36 * 7 + 1))).toBe(16);
    expect(plans(playDays(hire(begun(), 'training'), 36 * 7 + 1))).toBe(0);
  });
});
