// Crises v0 (SPEC.md): a chain wakes at an Assembly, posts its steps one by one, presses on the
// guild while it stands, and ends when the last step is won.
import { clamp, divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor } from '../core/rng.ts';
import { shapeId } from '../contract/compose.ts';
import { addRenown, pay, type GuildTurn } from '../guild/turn.ts';
import type { Offer, Party, StopReason } from '../guild/types.ts';
import type { CrisisChain } from './types.ts';

function chainOf(turn: GuildTurn, chainId: string): CrisisChain {
  const chain = turn.rules.crises?.chains.find((c) => c.id === chainId);
  if (!chain) throw new Error(`Unknown crisis ${chainId}.`);
  return chain;
}

/** At an Assembly after the first: maybe wake the next chain that has not happened yet. */
export function crisisAssembly(
  turn: GuildTurn,
  year: number,
  causeId: string,
  stops: Set<StopReason>,
): void {
  const rules = turn.rules.crises;
  if (!rules) return;
  const crisis = (turn.guild.crisis ??= { active: null, done: [] });
  if (crisis.active || year < rules.fromYear) return;
  const chain = rules.chains.find((c) => !crisis.done.includes(c.id));
  if (!chain) return;
  if (!streamFor(turn.state, 'crisis.start').chance(rules.startBp)) return;
  crisis.active = { chainId: chain.id, step: 0, startedYear: year };
  crisis.done.push(chain.id);
  turn.sink.emit({ type: 'crisis.started', causeId, subjectIds: [chain.id], chainId: chain.id });
  stops.add('crisis');
}

/** Each week start: the pressure, and the current step on the board unless it is posted or out. */
export function crisisWeek(turn: GuildTurn, absoluteWeek: number, causeId: string): void {
  const active = turn.guild.crisis?.active;
  if (!active) return;
  const chain = chainOf(turn, active.chainId);
  pay(turn, -chain.pressure.weeklyCopper, 'crisis', causeId);
  const isStep = (o: Offer) => o.crisis?.chainId === chain.id && o.crisis.step === active.step;
  if (turn.guild.board.some(isStep) || turn.guild.parties.some((p) => isStep(p.offer))) return;
  const step = chain.steps[active.step];
  const danger = turn.rules.dangers.find((d) => d.danger === step?.danger);
  if (!step || !danger)
    throw new Error(`Crisis ${chain.id} step ${active.step} has no danger rules.`);
  const career = turn.guild.career;
  const tier = career ? turn.rules.career?.tiers[career.tier] : undefined;
  const templateId = shapeId({
    siteId: step.siteId,
    monsterId: step.monsterId,
    twistId: null,
    danger: step.danger,
  });
  turn.guild.nextOfferNo += 1;
  const offer: Offer = {
    id: `offer.${turn.guild.nextOfferNo}`,
    templateId,
    shownTemplateId: templateId,
    danger: step.danger,
    feeCopper: divRoundDown(
      divRoundDown(danger.feeCopper * step.feeBp, BP_CERTAIN) * (tier ? tier.feeBp : BP_CERTAIN),
      BP_CERTAIN,
    ),
    travelDays: danger.travelDays,
    expiresWeek: absoluteWeek + turn.rules.offerLifeWeeks,
    crisis: { chainId: chain.id, step: active.step },
  };
  turn.guild.board.push(offer);
  turn.sink.emit({
    type: 'offer.posted',
    causeId,
    subjectIds: [offer.id, chain.id],
    templateId: offer.shownTemplateId,
    danger: offer.danger,
    feeCopper: offer.feeCopper,
    travelDays: offer.travelDays,
    expiresWeek: offer.expiresWeek,
  });
}

/** At a party's homecoming: a won step moves the chain on; the last one ends the crisis. */
export function crisisHome(turn: GuildTurn, party: Party, causeId: string): void {
  const link = party.offer.crisis;
  const crisis = turn.guild.crisis;
  const active = crisis?.active;
  if (!link || !crisis || !active || party.outcome !== 'won') return;
  if (link.chainId !== active.chainId || link.step !== active.step) return;
  const chain = chainOf(turn, active.chainId);
  active.step += 1;
  const advanced = turn.sink.emit({
    type: 'crisis.advanced',
    causeId,
    subjectIds: [chain.id, party.id],
    chainId: chain.id,
    step: active.step,
  });
  if (active.step < chain.steps.length) return;
  crisis.active = null;
  const ended = turn.sink.emit({
    type: 'crisis.ended',
    causeId: advanced,
    subjectIds: [chain.id],
    chainId: chain.id,
    outcome: 'resolved',
  });
  addRenown(turn, chain.reward.renown, ended, [chain.id]);
  const career = turn.guild.career;
  const max = turn.rules.career?.patron.max;
  if (career && max !== undefined)
    career.confidence = clamp(career.confidence + chain.reward.confidence, 0, max);
}

/** The patron's review: confidence lost to a crisis still standing, or 0. */
export function crisisPressure(turn: GuildTurn): number {
  const active = turn.guild.crisis?.active;
  return active ? chainOf(turn, active.chainId).pressure.confidencePerReview : 0;
}
