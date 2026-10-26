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

export function weekOf(day: number, rules: GuildRules): number {
  return divRoundDown(day - 1, rules.daysPerWeek) + 1;
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
