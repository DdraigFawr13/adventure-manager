// One day of the guild's year, in a fixed order: week start, quest arrivals, homecomings,
// recovery, stops (SPEC.md, Time). `guild.found` runs the founding day; `day.advance` the next.
import type { EventSink } from '../core/events.ts';
import type { Command, GameEvent, GameState } from '../resolution/types.ts';
import { expireOffers, freeMemberIds, postOffers } from './board.ts';
import { arrive, comeHome } from './parties.ts';
import { listDraft } from './founding.ts';
import { drawPerson, engage, listProspects } from './people.ts';
import { startCareer, settleYear } from '../career/year.ts';
import { offerEmergency } from '../career/emergency.ts';
import { crisisAssembly, crisisWeek } from '../crisis/chain.ts';
import { houseWeek, startHouse } from '../house/house.ts';
import { staffAssembly, staffWeek, startStaff } from '../staff/areas.ts';
import {
  guildTurn,
  inWindow,
  isWeekStart,
  pay,
  weekInYear,
  weekOf,
  yearOf,
  type GuildTurn,
} from './turn.ts';
import type { GuildState, StopClass, StopReason } from './types.ts';

const STOP_CLASS: Readonly<Record<StopReason, StopClass>> = {
  'week-report': 'digest',
  assembly: 'must',
  'new-contracts': 'digest',
  death: 'must',
  'signing-window': 'must',
  'party-home': 'digest',
  retirement: 'must',
  'career-ended': 'must',
  'training-plan': 'digest',
  infirmary: 'digest',
  'patron-offer': 'must',
  crisis: 'must',
  incident: 'must',
};

const STOP_ORDER: readonly StopReason[] = [
  'career-ended',
  'assembly',
  'retirement',
  'patron-offer',
  'crisis',
  'incident',
  'signing-window',
  'week-report',
  'new-contracts',
  'death',
  'party-home',
  'infirmary',
  'training-plan',
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
    standing: [],
    prospects: [],
    recentShapes: [],
    nextOfferNo: 0,
    nextPartyNo: 0,
    nextPersonNo: 0,
    nextStandingNo: 0,
  };
  state.guild = guild;
  state.calendar = command.day;
  const turn = guildTurn(state, sink);
  const { founding } = rules;
  // With the draft (D-188) the purse replaces the starting chest and nobody is drawn here; the
  // house's bed check moves to `guild.pick`, which knows the roster.
  pay(turn, founding ? founding.purseCopper : rules.startingChestCopper, 'founding', command.id);
  startCareer(turn, command.id);
  startStaff(turn);
  startHouse(turn, founding ? 0 : command.size);
  if (founding) listDraft(turn, founding, command.id);
  else for (let n = 0; n < command.size; n += 1) engage(turn, drawPerson(turn), command.id);
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
  if (turn.guild.draft) throw new Error('Pick the founding party before the first day passes.');
  const career = turn.guild.career;
  if (career?.ended) throw new Error("The guildmaster's career is over.");
  if (!career && weekOf(command.day, turn.rules) > turn.rules.weeksPerYear)
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
  const week = weekInYear(state.calendar, rules);
  const year = yearOf(state.calendar, rules);
  const started = sink.emit({ type: 'week.started', causeId, subjectIds: [], week, year });
  if (week === 1) {
    stops.add('assembly');
    // A later Assembly first settles the year just played; a career that ends there stops the guild.
    if (year > 1 && settleYear(turn, started, stops)) return;
    const tier = guild.career ? rules.career?.tiers[guild.career.tier] : undefined;
    pay(turn, tier ? tier.grantCopper : rules.patronGrantCopper, 'grant', started);
    staffAssembly(turn, year, started);
    if (year > 1) crisisAssembly(turn, year, started, stops);
  }
  const wages = guild.members.reduce((sum, m) => sum + m.wageCopper, 0);
  if (wages > 0) pay(turn, -wages, 'wages', started);
  pay(turn, -rules.runningCostCopper, 'upkeep', started);
  const campaigning = week > rules.assemblyWeeks && week < rules.winterFromWeek;
  houseWeek(turn, started, stops);
  staffWeek(turn, campaigning ? week - rules.assemblyWeeks : null, started, stops);
  expireOffers(turn, weekOf(state.calendar, rules), started);
  postOffers(turn, week, weekOf(state.calendar, rules), started);
  crisisWeek(turn, weekOf(state.calendar, rules), started);
  // After every week-start cost, so the debt test sees this week's crisis pressure too.
  offerEmergency(turn, started, stops);
  if (inWindow(week, rules)) {
    listProspects(turn, started);
    stops.add('signing-window');
  } else guild.prospects.length = 0;
  if (campaigning) stops.add('week-report');
}
