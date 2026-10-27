// People: drawing adventurers from class leanings, their wages, the shortlist and signing.
import type { EventSink } from '../core/events.ts';
import { divRoundDown } from '../core/math.ts';
import { streamFor } from '../core/rng.ts';
import type { Adventurer, Attribute, Command, GameEvent, GameState } from '../resolution/types.ts';
import { ATTRIBUTES } from '../resolution/types.ts';
import { drawLife } from '../career/people.ts';
import { guildTurn, type GuildTurn, pay } from './turn.ts';
import type { GuildRules, Prospect } from './types.ts';

/** Wage by class base and the best three attributes' average (SPEC.md, People). */
export function wageFor(
  rules: GuildRules,
  classId: string,
  attrs: Adventurer['attributes'],
): number {
  const leaning = rules.classes.find((c) => c.classId === classId);
  if (!leaning) throw new Error(`No leaning for class ${classId}.`);
  const best = ATTRIBUTES.map((a) => attrs[a])
    .sort((a, b) => b - a)
    .slice(0, 3);
  const average = divRoundDown(
    best.reduce((sum, v) => sum + v, 0),
    3,
  );
  const wage = leaning.wageBaseCopper + rules.wageStepCopper * (average - rules.wagePivot);
  return Math.max(leaning.wageBaseCopper - rules.wageFloorBelowBaseCopper, wage);
}

/** Draws one person on the `guild.recruit` stream. */
export function drawPerson(turn: GuildTurn): Prospect {
  const { rules, guild } = turn;
  const rng = streamFor(turn.state, 'guild.recruit');
  const leaning = rng.weighted(rules.classes.map((c) => [c, c.weight] as const));
  // cast-ok: every attribute is set in the loop below before the object is used.
  const attributes = {} as Record<Attribute, number>;
  for (const a of ATTRIBUTES) {
    const lead = leaning.lead.includes(a)
      ? rng.between(rules.leadBonus.min, rules.leadBonus.max)
      : 0;
    attributes[a] = rng.between(rules.attributeRange.min, rules.attributeRange.max) + lead;
  }
  guild.nextPersonNo += 1;
  const adventurer: Adventurer = {
    id: `adv.${guild.nextPersonNo}`,
    ...drawIdentity(turn),
    ...drawLife(turn, attributes),
    classId: leaning.classId,
    position: leaning.position,
    attributes,
    weaponBp: rules.weaponBp,
    armourBp: rules.armourBp,
    dead: false,
  };
  return { adventurer, wageCopper: wageFor(rules, leaning.classId, attributes) };
}

/** Name and pronouns on their own stream, so adding names never moves the recruit rolls. */
function drawIdentity(turn: GuildTurn): Pick<Adventurer, 'name' | 'pronouns'> {
  const naming = turn.rules.naming;
  if (!naming) return {};
  const rng = streamFor(turn.state, 'guild.names');
  const pronouns = rng.weighted(naming.pronouns);
  const given =
    pronouns === 'they'
      ? [...naming.given.she, ...naming.given.he, ...naming.given.any]
      : [...naming.given[pronouns], ...naming.given.any];
  return { name: { given: rng.pick(given), family: rng.pick(naming.family) }, pronouns };
}

/** Puts a person on the roster and on wages. */
export function engage(turn: GuildTurn, person: Prospect, causeId: string): void {
  const { adventurer, wageCopper } = person;
  turn.state.roster.push(adventurer);
  turn.guild.members.push({ id: adventurer.id, wageCopper, outUntilDay: 0, away: false });
  turn.sink.emit({
    type: 'recruit.signed',
    causeId,
    subjectIds: [adventurer.id],
    wageCopper,
  });
}

/** A window week's shortlist replaces the last one. */
export function listProspects(turn: GuildTurn, causeId: string): void {
  turn.guild.prospects.length = 0;
  for (let n = 0; n < turn.rules.prospectsPerWindowWeek; n += 1) {
    const person = drawPerson(turn);
    turn.guild.prospects.push(person);
    turn.sink.emit({
      type: 'prospect.listed',
      causeId,
      subjectIds: [person.adventurer.id],
      classId: person.adventurer.classId,
      wageCopper: person.wageCopper,
    });
  }
}

export function signRecruit(
  state: GameState,
  command: Extract<Command, { type: 'recruit.sign' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = guildTurn(state, sink);
  if (command.day !== state.calendar) throw new Error(`Day ${command.day} is not today.`);
  const at = turn.guild.prospects.findIndex((p) => p.adventurer.id === command.prospectId);
  const person = turn.guild.prospects[at];
  if (!person) throw new Error(`${command.prospectId} is not on the shortlist.`);
  turn.guild.prospects.splice(at, 1);
  // The sign-on fee (D-138); the founding roster in guild.found pays none.
  const fee = turn.rules.signOnWeeks * person.wageCopper;
  const paid =
    fee === 0 ? command.id : pay(turn, -fee, 'sign-on', command.id, [person.adventurer.id]);
  engage(turn, person, paid);
}
