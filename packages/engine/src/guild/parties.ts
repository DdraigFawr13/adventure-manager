// Parties out: the quest resolves on arrival (unwatched, the leader's call answers moments,
// D-125), the party comes home, and fee, loot, renown and recovery follow the outcome.
import { divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import { startQuest, stepQuest } from '../resolution/quest.ts';
import { WOUND } from '../resolution/types.ts';
import { memberOf, pay, type GuildTurn } from './turn.ts';
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
  const injured = new Set<string>();
  const dead = new Set<string>();
  for (const e of sink.events.slice(first)) {
    const [subject = ''] = e.subjectIds;
    if (e.type === 'wound.changed') steps.set(subject, e.to);
    if (e.type === 'injury.gained') injured.add(subject);
    if (e.type === 'adventurer.died') dead.add(subject);
    if (e.type === 'quest.ended') party.outcome = e.outcome;
  }
  const recovery = streamFor(state, 'guild.recovery');
  for (const id of [...party.memberIds]) {
    const who = memberOf(guild, id);
    if (dead.has(id)) {
      guild.members.splice(guild.members.indexOf(who), 1);
      party.memberIds.splice(party.memberIds.indexOf(id), 1);
      stops.add('death');
      continue;
    }
    let restDays = rules.refitDays + (steps.get(id) ?? WOUND.fit) * rules.restDaysPerWoundStep;
    if (injured.has(id))
      restDays +=
        rules.daysPerWeek * recovery.between(rules.injuryWeeks.min, rules.injuryWeeks.max);
    who.outUntilDay = restDays > 0 ? party.homeDay + restDays : 0;
  }
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
  if (amount !== 0) {
    guild.renown += amount;
    sink.emit({
      type: 'renown.changed',
      causeId: returned,
      subjectIds: [party.id],
      amount,
      renown: guild.renown,
    });
  }
}
