// The contract board: new offers, expiry, and taking a contract with a party.
import type { EventSink } from '../core/events.ts';
import { divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import type { Command, GameEvent } from '../resolution/types.ts';
import type { GameState } from '../resolution/types.ts';
import { guildTurn, isFree, memberOf, partOf, type GuildTurn } from './turn.ts';
import type { Offer } from './types.ts';

export function expireOffers(turn: GuildTurn, week: number, causeId: string): void {
  const { board } = turn.guild;
  for (const offer of board.filter((o) => o.expiresWeek <= week)) {
    board.splice(board.indexOf(offer), 1);
    turn.sink.emit({ type: 'offer.expired', causeId, subjectIds: [offer.id] });
  }
}

export function postOffers(turn: GuildTurn, week: number, causeId: string): void {
  const { rules, guild } = turn;
  const rng = streamFor(turn.state, 'guild.board');
  const count = rules.offersPerWeek[partOf(week, rules)];
  for (let n = 0; n < count; n += 1) {
    const dangerRules = rng.weighted(rules.dangers.map((d) => [d, d.weight] as const));
    const templates = turn.state.content.quests.filter((q) => q.danger === dangerRules.danger);
    if (templates.length === 0) throw new Error(`No quest template is ${dangerRules.danger}.`);
    const template = rng.pick(templates);
    const spreadBp = rng.between(-dangerRules.feeSpreadBp, dangerRules.feeSpreadBp);
    guild.nextOfferNo += 1;
    const offer: Offer = {
      id: `offer.${guild.nextOfferNo}`,
      templateId: template.id,
      danger: dangerRules.danger,
      feeCopper: divRoundDown(dangerRules.feeCopper * (BP_CERTAIN + spreadBp), BP_CERTAIN),
      travelDays: dangerRules.travelDays + rng.between(0, dangerRules.travelSpreadDays),
      expiresWeek: week + rules.offerLifeWeeks,
    };
    guild.board.push(offer);
    turn.sink.emit({
      type: 'offer.posted',
      causeId,
      subjectIds: [offer.id],
      templateId: offer.templateId,
      danger: offer.danger,
      feeCopper: offer.feeCopper,
      travelDays: offer.travelDays,
      expiresWeek: offer.expiresWeek,
    });
  }
}

/** Members who could go out today: home and over their wounds. */
export function freeMemberIds(turn: GuildTurn): string[] {
  return turn.guild.members.filter((m) => isFree(m, turn.state.calendar)).map((m) => m.id);
}

export function takeContract(
  state: GameState,
  command: Extract<Command, { type: 'contract.take' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = guildTurn(state, sink);
  const { guild, rules } = turn;
  if (command.day !== state.calendar) throw new Error(`Day ${command.day} is not today.`);
  const at = guild.board.findIndex((o) => o.id === command.offerId);
  const offer = guild.board[at];
  if (!offer) throw new Error(`${command.offerId} is not on the board.`);
  const ids = command.partyIds;
  const { min, max } = rules.partySize;
  if (ids.length < min || ids.length > max)
    throw new Error(`A party has ${min}–${max} members, not ${ids.length}.`);
  if (new Set(ids).size !== ids.length) throw new Error('A party lists someone twice.');
  for (const id of ids) {
    const who = memberOf(guild, id);
    if (who.away) throw new Error(`${id} is away on a quest.`);
    if (!isFree(who, state.calendar)) throw new Error(`${id} is still recovering.`);
  }
  guild.board.splice(at, 1);
  guild.nextPartyNo += 1;
  const arriveDay = state.calendar + offer.travelDays;
  const party = {
    id: `party.${guild.nextPartyNo}`,
    memberIds: [...ids],
    plan: { ...command.plan },
    offer,
    arriveDay,
    homeDay: arriveDay + offer.travelDays,
    outcome: null,
  };
  guild.parties.push(party);
  for (const id of ids) memberOf(guild, id).away = true;
  sink.emit({
    type: 'party.departed',
    causeId: command.id,
    subjectIds: [party.id, offer.id, ...ids],
    arriveDay,
    homeDay: party.homeDay,
  });
}
