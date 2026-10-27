// The founding draft (SPEC.md, Founding draft; D-188): listing the starter parties and extras at
// `guild.found`, and `guild.pick` settling them against the founding purse.
import type { EventSink } from '../core/events.ts';
import { bedsOf } from '../house/house.ts';
import type { Command, GameEvent, GameState } from '../resolution/types.ts';
import { drawPerson, engage, foundingFee } from './people.ts';
import { formStanding } from './standing.ts';
import { guildTurn, isWeekStart, pay, type GuildTurn } from './turn.ts';
import type { FoundingRules, Prospect } from './types.ts';

const STREAM = 'guild.founding';

/** Draws one listed party per character, then the extras, and lists each person. */
export function listDraft(turn: GuildTurn, founding: FoundingRules, causeId: string): void {
  const list = (person: Prospect, party: number | null, feeBp?: number) => {
    turn.sink.emit({
      type: 'founding.listed',
      causeId,
      subjectIds: [person.adventurer.id],
      party,
      classId: person.adventurer.classId,
      wageCopper: person.wageCopper,
      feeCopper: foundingFee(founding.feeWeeks, person, feeBp),
    });
  };
  const parties: Prospect[][] = [];
  founding.characters.forEach((character, party) => {
    const people: Prospect[] = [];
    for (let n = 0; n < founding.partySize; n += 1) {
      const person = drawPerson(turn, {
        stream: STREAM,
        attributeShift: character.attributeShift,
        age: character.age,
        potentialBonus: character.potentialBonus,
      });
      people.push(person);
      list(person, party, character.feeBp);
    }
    parties.push(people);
  });
  const extras: Prospect[] = [];
  for (let n = 0; n < founding.extras.offered; n += 1) {
    const person = drawPerson(turn, { stream: STREAM });
    extras.push(person);
    list(person, null);
  }
  turn.guild.draft = { parties, extras };
}

export function pickDraft(
  state: GameState,
  command: Extract<Command, { type: 'guild.pick' }>,
  sink: EventSink<GameEvent>,
): void {
  const turn = guildTurn(state, sink);
  const { guild, rules } = turn;
  const founding = rules.founding;
  const draft = guild.draft;
  if (!founding || !draft) throw new Error('There is no founding draft to pick from.');
  if (command.day !== state.calendar) throw new Error(`Day ${command.day} is not today.`);
  const party = draft.parties[command.partyIndex];
  if (!party) throw new Error(`There is no party ${command.partyIndex}.`);
  const { min, max } = founding.extras;
  if (command.extraIds.length < min || command.extraIds.length > max)
    throw new Error(`Pick ${min} to ${max} extras.`);
  if (new Set(command.extraIds).size !== command.extraIds.length)
    throw new Error('An extra is picked twice.');
  const extras = command.extraIds.map((id) => {
    const found = draft.extras.find((p) => p.adventurer.id === id);
    if (!found) throw new Error(`${id} is not on the shortlist.`);
    return found;
  });
  const picked = [...party, ...extras];
  // A party's fee carries its character's premium or discount; extras pay the plain fee.
  const feeBp = founding.characters[command.partyIndex]?.feeBp;
  const fee =
    party.reduce((sum, p) => sum + foundingFee(founding.feeWeeks, p, feeBp), 0) +
    extras.reduce((sum, p) => sum + foundingFee(founding.feeWeeks, p), 0);
  if (fee > guild.chestCopper) throw new Error('The chest cannot pay the signing fees.');
  if (rules.house && guild.house && picked.length > bedsOf(guild.house, rules.house))
    throw new Error('Every bed is taken.');
  const paid =
    fee === 0
      ? command.id
      : pay(
          turn,
          -fee,
          'sign-on',
          command.id,
          picked.map((p) => p.adventurer.id),
        );
  for (const person of picked) engage(turn, person, paid);
  // The founding day's week start ran before anyone was picked: their first week's wages are due now.
  const wages = picked.reduce((sum, p) => sum + p.wageCopper, 0);
  if (isWeekStart(state.calendar, rules) && wages > 0) pay(turn, -wages, 'wages', paid);
  delete guild.draft;
  const pickedId = sink.emit({
    type: 'founding.picked',
    causeId: command.id,
    subjectIds: picked.map((p) => p.adventurer.id),
    party: command.partyIndex,
    extraIds: [...command.extraIds],
    feeCopper: fee,
  });
  // The picked starter party stands from the first day (SPEC.md, Standing parties); extras wait.
  if (rules.standing)
    formStanding(
      turn,
      party.map((p) => p.adventurer.id),
      rules.standing.defaultPlan,
      pickedId,
    );
}
