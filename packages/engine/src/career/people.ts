// Careers v0, people (SPEC.md, Adventurers): a life drawn at signing, growth by doing, lasting
// injuries, ageing past the prime, and asking to retire.
import { clamp, divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import type { GuildTurn } from '../guild/turn.ts';
import { yearOf } from '../guild/turn.ts';
import type { StopReason } from '../guild/types.ts';
import { trainingPlacesOf } from '../house/house.ts';
import { trainingBp } from '../staff/areas.ts';
import { ATTRIBUTES, type Adventurer, type Attribute } from '../resolution/types.ts';

const PHYSICAL: readonly Attribute[] = ['might', 'agility', 'toughness'];

/** Birth year and hidden potential, on their own stream so the recruit rolls never move. */
export function drawLife(
  turn: GuildTurn,
  attributes: Readonly<Record<Attribute, number>>,
): Pick<Adventurer, 'birthYear' | 'potential'> {
  const career = turn.rules.career;
  if (!career) return {};
  const rng = streamFor(turn.state, 'career.potential');
  const age = rng.between(career.drawAge.min, career.drawAge.max);
  const potential = Object.fromEntries(
    ATTRIBUTES.map((a) => [
      a,
      Math.min(20, attributes[a] + rng.between(career.potential.min, career.potential.max)),
    ]),
  );
  // cast-ok: built from every name in ATTRIBUTES just above.
  const ceiling = potential as Record<Attribute, number>;
  return { birthYear: yearOf(turn.state.calendar, turn.rules) - age, potential: ceiling };
}

export function ageOf(turn: GuildTurn, who: Adventurer): number | null {
  return who.birthYear === undefined
    ? null
    : yearOf(turn.state.calendar, turn.rules) - who.birthYear;
}

/** Replaces a roster entry's attribute and records why (attributes are part of the person). */
function setAttribute(
  turn: GuildTurn,
  id: string,
  attribute: Attribute,
  to: number,
  reason: 'growth' | 'age' | 'injury',
  causeId: string,
): void {
  const at = turn.state.roster.findIndex((a) => a.id === id);
  const who = turn.state.roster[at];
  if (!who) throw new Error(`${id} is not on the roster.`);
  const from = who.attributes[attribute];
  const next = clamp(to, 1, 20);
  if (next === from) return;
  turn.state.roster[at] = { ...who, attributes: { ...who.attributes, [attribute]: next } };
  turn.sink.emit({
    type: 'attribute.changed',
    causeId,
    subjectIds: [id],
    attribute,
    from,
    to: next,
    reason,
  });
}

/** With a house: the youngest current members, as many as the yard has places, ties by id. */
function trainingPlaceHolders(turn: GuildTurn): Set<string> | null {
  const rules = turn.rules.house;
  const house = turn.guild.house;
  if (!rules || !house) return null;
  const aged: { id: string; age: number }[] = [];
  for (const m of turn.guild.members) {
    const who = turn.state.roster.find((a) => a.id === m.id);
    const age = who ? ageOf(turn, who) : null;
    if (age !== null) aged.push({ id: m.id, age });
  }
  aged.sort((a, b) => a.age - b.age || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return new Set(aged.slice(0, trainingPlacesOf(house, rules)).map((m) => m.id));
}

/** Growth by doing: each survivor may gain a point in one attribute the quest tested. */
export function growAfterQuest(
  turn: GuildTurn,
  ids: readonly string[],
  tested: (who: Adventurer) => readonly Attribute[],
  causeId: string,
): void {
  const career = turn.rules.career;
  if (!career) return;
  const rng = streamFor(turn.state, 'career.growth');
  const placed = trainingPlaceHolders(turn);
  for (const id of ids) {
    const who = turn.state.roster.find((a) => a.id === id);
    const age = who ? ageOf(turn, who) : null;
    if (!who || age === null || !who.potential) continue;
    const base =
      age <= career.growth.youngAge
        ? career.growth.youngBp
        : age <= career.primeAge
          ? career.growth.primeBp
          : 0;
    // Training scales the chance (staff/SPEC.md).
    let chance = divRoundDown(base * trainingBp(turn), BP_CERTAIN);
    // Without a yard place the chance shrinks (house/SPEC.md, D-186).
    if (placed && !placed.has(id))
      chance = divRoundDown(chance * (turn.rules.house?.noPlaceGrowthBp ?? BP_CERTAIN), BP_CERTAIN);
    const options = tested(who).filter((a) => who.attributes[a] < (who.potential?.[a] ?? 0));
    // Always draw twice, so a member's growth never shifts the stream for the next one.
    const grows = rng.chance(chance);
    const pick = rng.int(Math.max(1, options.length));
    const attribute = options[pick];
    if (grows && attribute)
      setAttribute(turn, id, attribute, who.attributes[attribute] + 1, 'growth', causeId);
  }
}

/** A lasting injury costs a point of one physical attribute (PLAN §5a). */
export function injuryLoss(turn: GuildTurn, id: string, causeId: string): void {
  if (!turn.rules.career) return;
  const who = turn.state.roster.find((a) => a.id === id);
  if (!who) return;
  const attribute = streamFor(turn.state, 'career.growth').pick(PHYSICAL);
  setAttribute(turn, id, attribute, who.attributes[attribute] - 1, 'injury', causeId);
}

/** At the Assembly: decline past the prime, then those who ask to retire leave (the policy accepts). */
export function ageAndRetire(turn: GuildTurn, causeId: string, stops: Set<StopReason>): void {
  const career = turn.rules.career;
  if (!career) return;
  const rng = streamFor(turn.state, 'career.age');
  const year = yearOf(turn.state.calendar, turn.rules);
  for (const member of [...turn.guild.members]) {
    const who = turn.state.roster.find((a) => a.id === member.id);
    const age = who ? ageOf(turn, who) : null;
    if (!who || age === null) continue;
    const past = Math.max(0, age - career.primeAge);
    const decline = Math.min(career.declineMaxBp, past * career.declineStepBp);
    for (const attribute of PHYSICAL) {
      const current = turn.state.roster.find((a) => a.id === who.id)?.attributes[attribute] ?? 0;
      if (rng.chance(decline)) setAttribute(turn, who.id, attribute, current - 1, 'age', causeId);
    }
    const asks = rng.chance(Math.min(career.retireMaxBp, past * career.retireStepBp));
    // Someone away on a contract asks next year instead.
    if (!asks || member.away) continue;
    turn.guild.members.splice(turn.guild.members.indexOf(member), 1);
    const at = turn.state.roster.findIndex((a) => a.id === who.id);
    turn.state.roster[at] = { ...who, retiredYear: year };
    turn.sink.emit({ type: 'adventurer.retired', causeId, subjectIds: [who.id], age });
    stops.add('retirement');
  }
}
