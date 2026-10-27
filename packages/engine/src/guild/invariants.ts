// Guild invariants (STANDARDS.md): money adds up from the events, nobody is in two places,
// the dead neither fight nor draw wages, every event has a cause. Run these with the
// resolution invariants over a whole run's events (from `guild.found` on).
import type { GameEvent, GameState } from '../resolution/types.ts';

export function checkGuildInvariants(
  state: GameState,
  events: readonly GameEvent[],
  commandIds: readonly string[],
): string[] {
  const problems: string[] = [];
  const known = new Set(commandIds);
  let chest = 0;
  for (const event of events) {
    if (!known.has(event.causeId))
      problems.push(`${event.id} has an unknown cause ${event.causeId}.`);
    known.add(event.id);
    if (event.type !== 'money.changed') continue;
    chest += event.amountCopper;
    if (event.chestCopper !== chest)
      problems.push(
        `${event.id} says the chest is ${event.chestCopper}, the events add to ${chest}.`,
      );
  }
  const guild = state.guild;
  if (!guild) return problems;
  if (guild.chestCopper !== chest)
    problems.push(`The chest is ${guild.chestCopper}, the money events add to ${chest}.`);
  const inParty = new Map<string, string>();
  for (const party of guild.parties) {
    for (const id of party.memberIds) {
      const other = inParty.get(id);
      if (other) problems.push(`${id} is in ${other} and ${party.id}.`);
      inParty.set(id, party.id);
    }
  }
  const dead = new Set(state.roster.filter((a) => a.dead).map((a) => a.id));
  for (const [id, partyId] of inParty) {
    if (dead.has(id)) problems.push(`${id} is dead but in ${partyId}.`);
    if (!guild.members.find((m) => m.id === id)?.away)
      problems.push(`${id} is in ${partyId} but not away.`);
  }
  const inStanding = new Map<string, string>();
  for (const party of guild.standing) {
    if (party.memberIds.length === 0) problems.push(`${party.id} stands empty.`);
    for (const id of party.memberIds) {
      const other = inStanding.get(id);
      if (other) problems.push(`${id} stands in ${other} and ${party.id}.`);
      inStanding.set(id, party.id);
      if (!guild.members.some((m) => m.id === id))
        problems.push(`${id} stands in ${party.id} but is not in the guild.`);
    }
  }
  for (const m of guild.members) {
    if (dead.has(m.id)) problems.push(`${m.id} is dead but on wages.`);
    if (m.away && !inParty.has(m.id)) problems.push(`${m.id} is away but in no party.`);
  }
  return problems;
}
