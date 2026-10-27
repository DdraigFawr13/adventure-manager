// The contract board: new offers, expiry, and taking a contract with a party.
import type { EventSink } from '../core/events.ts';
import { divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor, type RngStream } from '../core/rng.ts';
import { fits, shapeId, shapeOf } from '../contract/compose.ts';
import type { Twist } from '../contract/types.ts';
import type { Danger } from '../resolution/types.ts';
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

/** New offers for a week: `week` is the week in its year, `absoluteWeek` counts across years. */
export function postOffers(
  turn: GuildTurn,
  week: number,
  absoluteWeek: number,
  causeId: string,
): void {
  const { rules, guild } = turn;
  const rng = streamFor(turn.state, 'guild.board');
  const count = rules.offersPerWeek[partOf(week, rules)];
  // A guild on the ladder sees its tier's danger mix and fee scale (career/SPEC.md).
  const tier = guild.career ? rules.career?.tiers[guild.career.tier] : undefined;
  for (let n = 0; n < count; n += 1) {
    const dangerRules = rng.weighted(
      rules.dangers.map((d) => [d, tier ? tier.dangerWeights[d.danger] : d.weight] as const),
    );
    const drawn = drawWork(turn, rng, dangerRules.danger);
    const spreadBp = rng.between(-dangerRules.feeSpreadBp, dangerRules.feeSpreadBp);
    guild.nextOfferNo += 1;
    const offer: Offer = {
      id: `offer.${guild.nextOfferNo}`,
      templateId: drawn.templateId,
      shownTemplateId: drawn.shownTemplateId,
      danger: dangerRules.danger,
      feeCopper: divRoundDown(
        divRoundDown(
          dangerRules.feeCopper * (BP_CERTAIN + spreadBp + (drawn.shownTwist?.feeBp ?? 0)),
          BP_CERTAIN,
        ) * (tier ? tier.feeBp : BP_CERTAIN),
        BP_CERTAIN,
      ),
      travelDays: dangerRules.travelDays + rng.between(0, dangerRules.travelSpreadDays),
      expiresWeek: absoluteWeek + rules.offerLifeWeeks,
    };
    guild.board.push(offer);
    turn.sink.emit({
      type: 'offer.posted',
      causeId,
      subjectIds: [offer.id],
      templateId: offer.shownTemplateId,
      danger: offer.danger,
      feeCopper: offer.feeCopper,
      travelDays: offer.travelDays,
      expiresWeek: offer.expiresWeek,
    });
  }
}

/**
 * A composed contract when content has sites and monsters (D-139), avoiding recent shapes;
 * otherwise one of the fixed quest templates of that danger.
 */
function drawWork(
  turn: GuildTurn,
  rng: RngStream,
  danger: Danger,
): { templateId: string; shownTemplateId: string; shownTwist: Twist | null } {
  const contracts = turn.state.content.contracts;
  if (!contracts) {
    const templates = turn.state.content.quests.filter((q) => q.danger === danger);
    if (templates.length === 0) throw new Error(`No quest template is ${danger}.`);
    const id = rng.pick(templates).id;
    return { templateId: id, shownTemplateId: id, shownTwist: null };
  }
  const pairs = contracts.sites.flatMap((site) =>
    contracts.monsters.filter((m) => fits(site, m, danger)).map((m) => [site, m] as const),
  );
  if (pairs.length === 0) throw new Error(`No site and monster kind fit ${danger}.`);
  const twists: readonly (Twist | null)[] = [null, ...contracts.twists];
  const weightOf = (t: Twist | null) => (t ? t.weight : contracts.plainWeight);
  const all = pairs.flatMap(([site, monster]) =>
    twists.map((twist) => {
      const templateId = shapeId({
        siteId: site.id,
        monsterId: monster.id,
        twistId: twist?.id ?? null,
        danger,
      });
      return [{ templateId, twist }, weightOf(twist)] as const;
    }),
  );
  // Shapes posted recently are left out while any other shape is left (SPEC.md, The board).
  const recent = turn.guild.recentShapes;
  const fresh = all.filter(([d]) => !recent.includes(d.templateId));
  const drawn = rng.weighted(fresh.length > 0 ? fresh : all);
  recent.push(drawn.templateId);
  // The memory is per danger: drop this danger's oldest shapes past the limit.
  const mine = recent.filter((id) => shapeOf(id)?.danger === danger);
  for (const old of mine.slice(0, Math.max(0, mine.length - contracts.recentShapes)))
    recent.splice(recent.indexOf(old), 1);
  const shownTwist = drawn.twist && !drawn.twist.hidden ? drawn.twist : null;
  const shape = shapeOf(drawn.templateId);
  if (!shape) throw new Error(`Drew a fixed template ${drawn.templateId} from contracts.`);
  return {
    templateId: drawn.templateId,
    shownTemplateId: shapeId({ ...shape, twistId: shownTwist?.id ?? null }),
    shownTwist,
  };
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
