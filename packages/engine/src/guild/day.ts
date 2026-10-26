// One day of the guild's year, in a fixed order: week start, quest arrivals, homecomings,
// recovery, stops (SPEC.md, Time). `guild.found` runs the founding day; `day.advance` the next.
import type { EventSink } from '../core/events.ts';
import type { Command, GameEvent, GameState } from '../resolution/types.ts';
import { expireOffers, freeMemberIds, postOffers } from './board.ts';
import { arrive, comeHome } from './parties.ts';
import { drawPerson, engage, listProspects } from './people.ts';
import { guildTurn, inWindow, isWeekStart, pay, weekOf, type GuildTurn } from './turn.ts';
import type { GuildState, StopClass, StopReason } from './types.ts';

const STOP_CLASS: Readonly<Record<StopReason, StopClass>> = {
  'week-report': 'digest',
  assembly: 'must',
  'new-contracts': 'digest',
  death: 'must',
  'signing-window': 'must',
  'party-home': 'digest',
};

const STOP_ORDER: readonly StopReason[] = [
  'assembly',
  'signing-window',
  'week-report',
  'new-contracts',
  'death',
  'party-home',
];

export function foundGuild(
  state: GameState,
  command: Extract<Command, { type: 'guild.found' }>,
  sink: EventSink<GameEvent>,
): void {
  const rules = state.content.guild;
  if (!rules) throw new Error('This game has no guild rules.');
  if (state.guild) throw new Error('The guild is already founded.');
  const guild: GuildState = {
    chestCopper: 0,
    renown: 0,
    members: [],
    board: [],
    parties: [],
    prospects: [],
    recentShapes: [],
    nextOfferNo: 0,
    nextPartyNo: 0,
    nextPersonNo: 0,
  };
  state.guild = guild;
  state.calendar = command.day;
  const turn = guildTurn(state, sink);
  pay(turn, rules.startingChestCopper, 'founding', command.id);
  for (let n = 0; n < command.size; n += 1) engage(turn, drawPerson(turn), command.id);
  runDay(turn, command.id);
}

export function advanceDay(
  state: GameState,
  command: Extract<Command, { type: 'day.advance' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = guildTurn(state, sink);
  if (command.day !== state.calendar + 1)
    throw new Error(`Day ${command.day} does not follow day ${state.calendar}.`);
  if (weekOf(command.day, turn.rules) > turn.rules.weeksPerYear)
    throw new Error('The year is over.');
  state.calendar = command.day;
  runDay(turn, command.id);
}

function runDay(turn: GuildTurn, causeId: string): void {
  const { rules, guild, sink, state } = turn;
  const today = state.calendar;
  const stops = new Set<StopReason>();
  if (isWeekStart(today, rules)) weekStart(turn, causeId, stops);
  for (const party of [...guild.parties]) {
    if (party.arriveDay === today && party.outcome === null) arrive(turn, party, causeId, stops);
  }
  for (const party of [...guild.parties]) {
    if (party.homeDay !== today) continue;
    comeHome(turn, party, causeId);
    stops.add('party-home');
  }
  for (const m of guild.members) {
    if (m.outUntilDay === today && !m.away)
      sink.emit({ type: 'member.recovered', causeId, subjectIds: [m.id] });
  }
  if (isWeekStart(today, rules) && guild.board.length > 0) {
    if (freeMemberIds(turn).length >= rules.partySize.min) stops.add('new-contracts');
  }
  for (const reason of STOP_ORDER) {
    if (!stops.has(reason)) continue;
    sink.emit({
      type: 'stop.raised',
      causeId,
      subjectIds: [],
      stopClass: STOP_CLASS[reason],
      reason,
    });
  }
}

function weekStart(turn: GuildTurn, causeId: string, stops: Set<StopReason>): void {
  const { rules, guild, sink, state } = turn;
  const week = weekOf(state.calendar, rules);
  const started = sink.emit({ type: 'week.started', causeId, subjectIds: [], week });
  if (week === 1) {
    pay(turn, rules.patronGrantCopper, 'grant', started);
    stops.add('assembly');
  }
  const wages = guild.members.reduce((sum, m) => sum + m.wageCopper, 0);
  if (wages > 0) pay(turn, -wages, 'wages', started);
  pay(turn, -rules.runningCostCopper, 'upkeep', started);
  expireOffers(turn, week, started);
  postOffers(turn, week, started);
  if (inWindow(week, rules)) {
    listProspects(turn, started);
    stops.add('signing-window');
  } else guild.prospects.length = 0;
  if (week > rules.assemblyWeeks && week < rules.winterFromWeek) stops.add('week-report');
}
