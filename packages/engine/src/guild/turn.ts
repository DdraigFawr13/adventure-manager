// Shared helpers for one guild command: the calendar, money, and who is free to act.
import type { EventSink } from '../core/events.ts';
import { divRoundDown } from '../core/math.ts';
import type { GameEvent, GameState } from '../resolution/types.ts';
import type { GuildMember, GuildRules, GuildState, MoneyReason } from './types.ts';

export interface GuildTurn {
  readonly state: GameState;
  readonly guild: GuildState;
  readonly rules: GuildRules;
  readonly sink: EventSink<GameEvent>;
}

export function guildTurn(state: GameState, sink: EventSink<GameEvent>): GuildTurn {
  const rules = state.content.guild;
  if (!rules) throw new Error('This game has no guild rules.');
  if (!state.guild) throw new Error('No guild has been founded.');
  return { state, guild: state.guild, rules, sink };
}

/** Weeks since the guild's first day, counting across years (offers expire by this). */
export function weekOf(day: number, rules: GuildRules): number {
  return divRoundDown(day - 1, rules.daysPerWeek) + 1;
}

export function daysPerYear(rules: GuildRules): number {
  return rules.weeksPerYear * rules.daysPerWeek;
}

/** The year a day falls in; year 1 starts on day 1. */
export function yearOf(day: number, rules: GuildRules): number {
  return divRoundDown(day - 1, daysPerYear(rules)) + 1;
}

/** The week within its year (1..weeksPerYear): parts of the year and windows count by this. */
export function weekInYear(day: number, rules: GuildRules): number {
  return ((weekOf(day, rules) - 1) % rules.weeksPerYear) + 1;
}

export function isWeekStart(day: number, rules: GuildRules): boolean {
  return (day - 1) % rules.daysPerWeek === 0;
}

export function partOf(week: number, rules: GuildRules): 'assembly' | 'campaign' | 'winter' {
  if (week <= rules.assemblyWeeks) return 'assembly';
  return week >= rules.winterFromWeek ? 'winter' : 'campaign';
}

export function inWindow(week: number, rules: GuildRules): boolean {
  return rules.signingWindows.some((w) => week >= w.from && week <= w.to);
}

/** Changes renown, counts it toward this year's ladder standing, and records why. */
export function addRenown(
  turn: GuildTurn,
  amount: number,
  causeId: string,
  subjectIds: readonly string[],
): string {
  turn.guild.renown += amount;
  if (turn.guild.career) turn.guild.career.renownThisYear += amount;
  return turn.sink.emit({
    type: 'renown.changed',
    causeId,
    subjectIds,
    amount,
    renown: turn.guild.renown,
  });
}

/** Moves the chest and records why; returns the event id. */
export function pay(
  turn: GuildTurn,
  amountCopper: number,
  reason: MoneyReason,
  causeId: string,
  subjectIds: readonly string[] = [],
): string {
  turn.guild.chestCopper += amountCopper;
  return turn.sink.emit({
    type: 'money.changed',
    causeId,
    subjectIds,
    amountCopper,
    reason,
    chestCopper: turn.guild.chestCopper,
  });
}

export function memberOf(guild: GuildState, id: string): GuildMember {
  const found = guild.members.find((m) => m.id === id);
  if (!found) throw new Error(`${id} is not in the guild.`);
  return found;
}

/** At home and over any wound or injury. */
export function isFree(member: GuildMember, today: number): boolean {
  return !member.away && member.outUntilDay <= today;
}
