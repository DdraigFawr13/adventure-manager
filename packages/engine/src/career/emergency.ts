// The patron's emergency grant (D-146, SPEC.md): offered at a week start when the guild is in
// debt, at most one taken every few years; taking it costs confidence and a harder next target.
import type { EventSink } from '../core/events.ts';
import { clamp } from '../core/math.ts';
import { guildTurn, pay, weekOf, yearOf, type GuildTurn } from '../guild/turn.ts';
import type { StopReason } from '../guild/types.ts';
import type { Command, GameEvent, GameState } from '../resolution/types.ts';
import { PLAYER_ID } from './year.ts';

/** Each week start, after wages: last week's offer lapses; a guild in debt may get a new one. */
export function offerEmergency(turn: GuildTurn, causeId: string, stops: Set<StopReason>): void {
  const career = turn.guild.career;
  const rules = turn.rules.career?.emergency;
  if (!career || !rules || career.ended) return;
  career.emergencyOffer = null;
  if (turn.guild.chestCopper >= 0) return;
  const year = yearOf(turn.state.calendar, turn.rules);
  if (career.lastGrantYear !== null && year - career.lastGrantYear < rules.everyYears) return;
  const wages = turn.guild.members.reduce((sum, m) => sum + m.wageCopper, 0);
  // An empty roster has no wages to tide over (D-146 counts wages).
  if (wages === 0) return;
  const grantCopper = wages * rules.wageWeeks;
  career.emergencyOffer = { grantCopper, week: weekOf(turn.state.calendar, turn.rules) };
  turn.sink.emit({ type: 'patron.offered', causeId, subjectIds: [PLAYER_ID], grantCopper });
  stops.add('patron-offer');
}

export function takeEmergency(
  state: GameState,
  command: Extract<Command, { type: 'patron.grant' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = guildTurn(state, sink);
  const career = turn.guild.career;
  const rules = turn.rules.career?.emergency;
  if (!career || !rules) throw new Error('This guild has no patron grants.');
  if (command.day !== state.calendar) throw new Error(`Day ${command.day} is not today.`);
  const offer = career.emergencyOffer;
  if (!offer || offer.week !== weekOf(state.calendar, turn.rules))
    throw new Error('The patron has no grant on offer.');
  if (turn.guild.chestCopper >= 0) throw new Error('The guild is no longer in debt.');
  career.emergencyOffer = null;
  career.lastGrantYear = yearOf(state.calendar, turn.rules);
  career.raiseTarget = true;
  career.confidence = clamp(
    career.confidence - rules.confidenceCost,
    0,
    turn.rules.career!.patron.max,
  ); // non-null: rules.emergency came from it.
  const granted = sink.emit({
    type: 'patron.granted',
    causeId: command.id,
    subjectIds: [PLAYER_ID],
    grantCopper: offer.grantCopper,
    confidence: career.confidence,
  });
  pay(turn, offer.grantCopper, 'emergency', granted);
}
