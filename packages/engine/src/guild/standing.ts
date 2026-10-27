// Standing parties (SPEC.md, Standing parties; D-014): named parties kept between quests. They are
// a plan of who usually goes together; `contract.take` sends people, not a standing party's roster.
import type { EventSink } from '../core/events.ts';
import { streamFor } from '../core/rng.ts';
import type { Command, GameEvent, GameState, Plan } from '../resolution/types.ts';
import { guildTurn, memberOf, type GuildTurn } from './turn.ts';
import type { StandingParty, StandingRules } from './types.ts';

function standingRules(turn: GuildTurn): StandingRules {
  const rules = turn.rules.standing;
  if (!rules) throw new Error('This game has no standing parties.');
  return rules;
}

function standingOf(turn: GuildTurn, id: string): StandingParty {
  const found = turn.guild.standing.find((p) => p.id === id);
  if (!found) throw new Error(`There is no standing party ${id}.`);
  return found;
}

/** The standing party a member is in, if any. */
export function standingWith(turn: GuildTurn, memberId: string): StandingParty | undefined {
  return turn.guild.standing.find((p) => p.memberIds.includes(memberId));
}

/** A new standing party with a name no other standing party holds, drawn on its own stream. */
export function formStanding(
  turn: GuildTurn,
  memberIds: readonly string[],
  plan: Plan,
  causeId: string,
): StandingParty {
  const rules = standingRules(turn);
  const { guild } = turn;
  const taken = new Set(guild.standing.map((p) => p.nameId));
  const free = rules.names.filter((n) => !taken.has(n));
  if (free.length === 0) throw new Error('No party name is left.');
  const nameId = streamFor(turn.state, 'guild.party-names').pick(free);
  guild.nextStandingNo += 1;
  const party: StandingParty = {
    id: `sp.${guild.nextStandingNo}`,
    nameId,
    memberIds: [],
    plan: { ...plan },
  };
  guild.standing.push(party);
  const formed = turn.sink.emit({
    type: 'party.formed',
    causeId,
    subjectIds: [party.id, ...memberIds],
    nameId,
    plan: { ...plan },
  });
  for (const id of memberIds) move(turn, id, party, formed);
  return party;
}

/** Moves one member into a standing party (or none); a party left empty is disbanded. */
function move(turn: GuildTurn, memberId: string, to: StandingParty | null, causeId: string): void {
  const from = standingWith(turn, memberId);
  if (from === to) return;
  if (to) {
    if (to.memberIds.length >= turn.rules.partySize.max)
      throw new Error(`${to.id} already has ${turn.rules.partySize.max} members.`);
    to.memberIds.push(memberId);
  }
  if (from) from.memberIds.splice(from.memberIds.indexOf(memberId), 1);
  const assigned = turn.sink.emit({
    type: 'party.assigned',
    causeId,
    subjectIds: [memberId],
    from: from?.id ?? null,
    to: to?.id ?? null,
  });
  if (from) disbandIfEmpty(turn, from, assigned);
}

function disbandIfEmpty(turn: GuildTurn, party: StandingParty, causeId: string): void {
  if (party.memberIds.length > 0) return;
  turn.guild.standing.splice(turn.guild.standing.indexOf(party), 1);
  turn.sink.emit({ type: 'party.disbanded', causeId, subjectIds: [party.id] });
}

/** A member who died or retired leaves their standing party (SPEC.md), caused by the death or retirement. */
export function leaveStanding(turn: GuildTurn, memberId: string, causeId: string): void {
  move(turn, memberId, null, causeId);
}

export function standingCommand(
  state: GameState,
  command: Extract<Command, { type: 'party.form' | 'party.assign' | 'party.plan' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = guildTurn(state, sink);
  standingRules(turn);
  if (command.day !== state.calendar) throw new Error(`Day ${command.day} is not today.`);
  switch (command.type) {
    case 'party.form': {
      const ids = command.memberIds;
      if (ids.length < 1 || ids.length > turn.rules.partySize.max)
        throw new Error(`A standing party has 1–${turn.rules.partySize.max} members.`);
      if (new Set(ids).size !== ids.length) throw new Error('A party lists someone twice.');
      for (const id of ids) memberOf(turn.guild, id);
      formStanding(turn, ids, command.plan, command.id);
      break;
    }
    case 'party.assign':
      memberOf(turn.guild, command.memberId);
      move(
        turn,
        command.memberId,
        command.standingId === null ? null : standingOf(turn, command.standingId),
        command.id,
      );
      break;
    case 'party.plan': {
      const party = standingOf(turn, command.standingId);
      party.plan = { ...command.plan };
      sink.emit({
        type: 'party.planned',
        causeId: command.id,
        subjectIds: [party.id],
        plan: { ...command.plan },
      });
      break;
    }
  }
}
