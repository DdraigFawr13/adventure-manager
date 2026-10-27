// Parties out: the quest resolves on arrival (unwatched, the leader's call answers moments,
// D-125), the party comes home, and fee, loot, renown and recovery follow the outcome.
import { divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import { startQuest, stepQuest } from '../resolution/quest.ts';
import { WOUND } from '../resolution/types.ts';
import { growAfterQuest, injuryLoss } from '../career/people.ts';
import { layUp } from '../house/house.ts';
import { injuryDays, runsArea } from '../staff/areas.ts';
import { crisisHome } from '../crisis/chain.ts';
import { addRenown, memberOf, pay, type GuildTurn } from './turn.ts';
import type { Party, StopReason } from './types.ts';

/** Runs the party's quest to its end; records the outcome, the dead and the recovery times. */
export function arrive(turn: GuildTurn, party: Party, causeId: string, stops: Set<StopReason>) {
  const { state, sink, rules, guild } = turn;
  const first = sink.events.length;
  startQuest(
    state,
    {
      type: 'quest.start',
      id: causeId,
      day: sink.day,
      questId: `run.${party.id}`,
      templateId: party.offer.templateId,
      partyIds: party.memberIds,
      plan: party.plan,
      watched: false,
    },
    sink,
  );
  while (state.quest) stepQuest(state, causeId, sink);
  const steps = new Map<string, number>();
  const injured = new Map<string, string>();
  const dead = new Map<string, string>();
  let endedId = causeId;
  for (const e of sink.events.slice(first)) {
    const [subject = ''] = e.subjectIds;
    if (e.type === 'wound.changed') steps.set(subject, e.to);
    if (e.type === 'injury.gained') injured.set(subject, e.id);
    if (e.type === 'adventurer.died') dead.set(subject, e.id);
    if (e.type === 'quest.ended') {
      party.outcome = e.outcome;
      endedId = e.id;
    }
  }
  const recovery = streamFor(state, 'guild.recovery');
  for (const id of [...party.memberIds]) {
    const who = memberOf(guild, id);
    const diedId = dead.get(id);
    if (diedId !== undefined) {
      buryMember(turn, who.id, who.wageCopper, party, diedId);
      guild.members.splice(guild.members.indexOf(who), 1);
      party.memberIds.splice(party.memberIds.indexOf(id), 1);
      stops.add('death');
      continue;
    }
    let restDays = rules.refitDays + (steps.get(id) ?? WOUND.fit) * rules.restDaysPerWoundStep;
    const injury = injured.get(id);
    if (injury !== undefined) {
      injuryLoss(turn, id, injury);
      const weeks = recovery.between(rules.injuryWeeks.min, rules.injuryWeeks.max);
      let days = injuryDays(turn, rules.daysPerWeek * weeks);
      // A free sickbed keeps the days; without one they grow (house/SPEC.md, D-186).
      const bed = layUp(turn, id, party.homeDay, restDays, days);
      if (bed) days = bed.days;
      restDays += days;
      turn.sink.emit({
        type: 'member.laid-up',
        causeId: injury,
        subjectIds: [id],
        days,
        ...(bed && { sickbed: bed.sickbed }),
      });
      // The guildmaster running recovery sees each injured member in (staff/SPEC.md).
      if (runsArea(turn, 'recovery')) stops.add('infirmary');
    }
    who.outUntilDay = restDays > 0 ? party.homeDay + restDays : 0;
  }
  // Growth by doing (career/SPEC.md): the quest tested the approach and each member's attack.
  const approach = state.content.rules.approachAttribute[party.plan.approach];
  growAfterQuest(
    turn,
    party.memberIds,
    (who) => [approach, state.content.rules.classes[who.classId]?.attackAttribute ?? approach],
    endedId,
  );
}

/** A death costs the guild (D-138): the funeral, the family's share, and renown if the plan was reckless. */
function buryMember(
  turn: GuildTurn,
  id: string,
  wageCopper: number,
  party: Party,
  diedId: string,
): void {
  const { rules } = turn;
  const cost = rules.death.funeralCopper + rules.death.familyShareWeeks * wageCopper;
  if (cost !== 0) pay(turn, -cost, 'funeral', diedId, [id]);
  const reckless = party.plan.risk === 'bold' || party.plan.retreat === 'never';
  if (!reckless || rules.death.recklessRenownLoss === 0) return;
  addRenown(turn, -rules.death.recklessRenownLoss, diedId, [id, party.id]);
}

/** Brings the party home: members are free to rest, and the fee, loot and renown arrive. */
export function comeHome(turn: GuildTurn, party: Party, causeId: string): void {
  const { rules, guild, sink } = turn;
  const outcome = party.outcome;
  if (outcome === null) throw new Error(`${party.id} came home before its quest was played.`);
  for (const id of party.memberIds) memberOf(guild, id).away = false;
  guild.parties.splice(guild.parties.indexOf(party), 1);
  const returned = sink.emit({
    type: 'party.returned',
    causeId,
    subjectIds: [party.id, ...party.memberIds],
    outcome,
  });
  const fee = divRoundDown(party.offer.feeCopper * rules.payBp[outcome], BP_CERTAIN);
  if (fee !== 0) pay(turn, fee, 'fee', returned, [party.id]);
  if (outcome === 'won') {
    const loot = divRoundDown(party.offer.feeCopper * rules.lootBp, BP_CERTAIN);
    if (loot !== 0) pay(turn, loot, 'loot', returned, [party.id]);
  }
  const danger = rules.dangers.find((d) => d.danger === party.offer.danger);
  const amount =
    outcome === 'won'
      ? (danger?.renownWin ?? 0)
      : outcome === 'routed'
        ? -(danger?.renownWin ?? 0)
        : 0;
  if (amount !== 0) addRenown(turn, amount, returned, [party.id]);
  crisisHome(turn, party, returned);
}
