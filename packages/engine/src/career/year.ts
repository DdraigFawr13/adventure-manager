// Careers v0, the year (SPEC.md): the career begins at the founding; each later Assembly settles
// the year just played (rivals' contracts, the ladder, the patron's review, the guildmaster's
// health), ages the roster, moves the rivals and sets the patron's next target.
import { clamp, divRoundDown } from '../core/math.ts';
import { BP_CERTAIN, streamFor, type RngStream } from '../core/rng.ts';
import type { GuildTurn } from '../guild/turn.ts';
import { yearOf } from '../guild/turn.ts';
import type { StopReason } from '../guild/types.ts';
import type { Danger } from '../resolution/types.ts';
import { ageAndRetire } from './people.ts';
import type { CareerRules, CareerState, Rival, TargetKind } from './types.ts';

export const PLAYER_ID = 'guild.player';
const DANGERS: readonly Danger[] = ['routine', 'hazardous', 'perilous', 'deadly'];

/** At the founding: rivals drawn around their tiers, the guildmaster's age, the first target. */
export function startCareer(turn: GuildTurn, causeId: string): void {
  const rules = turn.rules.career;
  if (!rules) return;
  const rng = streamFor(turn.state, 'career.rivals');
  const rivals: Rival[] = [];
  rules.tiers.forEach((tier, t) => {
    // The founded guild takes one place in the bottom tier.
    const count = t === 0 ? rules.guildsPerTier - 1 : rules.guildsPerTier;
    for (let n = 0; n < count; n += 1)
      rivals.push({
        id: `rival.${rivals.length + 1}`,
        tier: t,
        strength: clamp(
          tier.rivalMean + rng.between(-rules.rivalSpread, rules.rivalSpread),
          0,
          100,
        ),
        renown: 0,
      });
  });
  const age = streamFor(turn.state, 'career.patron').between(
    rules.guildmaster.age.min,
    rules.guildmaster.age.max,
  );
  const career: CareerState = {
    tier: 0,
    renownThisYear: 0,
    rivals,
    confidence: rules.patron.start,
    target: 'avoid-bottom',
    guildmasterBirthYear: yearOf(turn.state.calendar, turn.rules) - age,
    emergencyOffer: null,
    lastGrantYear: null,
    raiseTarget: false,
    ended: null,
  };
  turn.guild.career = career;
  turn.sink.emit({
    type: 'patron.target',
    causeId,
    subjectIds: [PLAYER_ID],
    target: career.target,
    tier: 0,
  });
}

/** One rival's contracts for the year: each won by a roll on strength against the danger. */
function rivalYear(
  rules: CareerRules,
  rival: Rival,
  renownByDanger: Readonly<Record<string, number>>,
  rng: RngStream,
): number {
  const tier = rules.tiers[rival.tier];
  if (!tier) throw new Error(`No tier ${rival.tier}.`);
  const dangers = DANGERS.map((d) => [d, tier.dangerWeights[d]] as const);
  let renown = 0;
  for (let n = 0; n < tier.rivalContracts; n += 1) {
    const danger = rng.weighted(dangers);
    const difficulty = rules.dangerDifficulty[danger];
    const win = clamp(
      rules.rivalWin.baseBp + rules.rivalWin.stepBp * (rival.strength - difficulty),
      rules.rivalWin.minBp,
      rules.rivalWin.maxBp,
    );
    if (rng.chance(win)) renown += renownByDanger[danger] ?? 0;
  }
  return renown;
}

function placesShort(target: TargetKind, place: number, perTier: number): number {
  const limit =
    target === 'top-two' ? 2 : target === 'top-half' ? divRoundDown(perTier, 2) : perTier - 1;
  return Math.max(0, place - limit);
}

/** The next target from where the guild now stands (SPEC.md, The patron). */
function nextTarget(tier: number, place: number, moved: number, rules: CareerRules): TargetKind {
  const top = tier === rules.tiers.length - 1;
  if (moved > 0) return 'avoid-bottom';
  if (moved < 0) return 'top-two';
  if (place <= 2) return top ? 'top-half' : 'top-two';
  if (place <= divRoundDown(rules.guildsPerTier, 2)) return top ? 'avoid-bottom' : 'top-half';
  return 'avoid-bottom';
}

/** Week 1 of a year after the first: settle the year just played. Returns true if the career ended. */
export function settleYear(turn: GuildTurn, causeId: string, stops: Set<StopReason>): boolean {
  const rules = turn.rules.career;
  const career = turn.guild.career;
  if (!rules || !career || career.ended) return false;
  const year = yearOf(turn.state.calendar, turn.rules);
  const played = year - 1;
  const rng = streamFor(turn.state, 'career.rivals');
  const renownByDanger = Object.fromEntries(turn.rules.dangers.map((d) => [d.danger, d.renownWin]));
  for (const rival of career.rivals) rival.renown = rivalYear(rules, rival, renownByDanger, rng);

  // The ladder: each tier by renown earned in the year; ties go to the player, then by id.
  const tierOf = (id: string) =>
    id === PLAYER_ID ? career.tier : (career.rivals.find((r) => r.id === id)?.tier ?? 0);
  const renownOf = (id: string) =>
    id === PLAYER_ID
      ? career.renownThisYear
      : (career.rivals.find((r) => r.id === id)?.renown ?? 0);
  const all = [PLAYER_ID, ...career.rivals.map((r) => r.id)];
  const standings = rules.tiers.map((_, t) =>
    all
      .filter((id) => tierOf(id) === t)
      .sort(
        (a, b) =>
          renownOf(b) - renownOf(a) ||
          (a === PLAYER_ID ? -1 : b === PLAYER_ID ? 1 : a < b ? -1 : 1),
      ),
  );
  const myTier = career.tier;
  const mine = standings[myTier] ?? [];
  const place = mine.indexOf(PLAYER_ID) + 1;
  const settled = turn.sink.emit({
    type: 'year.settled',
    causeId,
    subjectIds: [PLAYER_ID],
    year: played,
    tier: myTier,
    standings: mine.map((id) => ({ id, renown: renownOf(id) })),
    leaders: standings.map((order) => order[0] ?? ''),
  });
  // The top of each tier but the highest goes up, the bottom of each but the lowest goes down.
  const topTier = rules.tiers.length - 1;
  const moved = place === 1 && myTier < topTier ? 1 : place === mine.length && myTier > 0 ? -1 : 0;
  standings.forEach((order, t) => {
    const first = order[0];
    const last = order[order.length - 1];
    if (t < topTier && first) moveTier(career, first, t + 1);
    if (t > 0 && last) moveTier(career, last, t - 1);
  });
  if (moved !== 0)
    turn.sink.emit({
      type: 'tier.changed',
      causeId: settled,
      subjectIds: [PLAYER_ID],
      from: myTier,
      to: career.tier,
    });

  // The patron's review of the year's target, then the guildmaster's health.
  const short = placesShort(career.target, place, rules.guildsPerTier);
  const inDebt = turn.guild.chestCopper < 0;
  const change =
    (short === 0
      ? rules.patron.met
      : -Math.min(rules.patron.maxMiss, short * rules.patron.perPlaceShort)) -
    (inDebt ? rules.patron.debt : 0);
  career.confidence = clamp(career.confidence + change, 0, rules.patron.max);
  const reviewed = turn.sink.emit({
    type: 'patron.reviewed',
    causeId: settled,
    subjectIds: [PLAYER_ID],
    target: career.target,
    place,
    met: short === 0,
    inDebt,
    change,
    confidence: career.confidence,
  });
  const age = year - career.guildmasterBirthYear;
  const gm = rules.guildmaster;
  const healthBp =
    age < gm.healthFromAge
      ? 0
      : divRoundDown(
          BP_CERTAIN * (age - gm.healthFromAge + 1),
          gm.certainAge - gm.healthFromAge + 1,
        );
  const retires = streamFor(turn.state, 'career.patron').chance(Math.min(BP_CERTAIN, healthBp));
  if (career.confidence <= 0 || retires) {
    const reason = career.confidence <= 0 ? 'dismissed' : 'retired';
    career.ended = { reason, year: played };
    turn.sink.emit({
      type: 'career.ended',
      causeId: reviewed,
      subjectIds: [PLAYER_ID],
      reason,
      years: played,
    });
    stops.add('career-ended');
    return true;
  }

  ageAndRetire(turn, reviewed, stops);
  for (const rival of career.rivals) {
    const tier = rules.tiers[rival.tier];
    if (!tier) continue;
    const pull = divRoundDown(tier.rivalMean - rival.strength, rules.rivalDrift.pullDiv);
    const push = divRoundDown(rival.renown - tier.rivalRenown, rules.rivalDrift.renownPerPoint);
    const noise = rng.between(-rules.rivalDrift.noise, rules.rivalDrift.noise);
    rival.strength = clamp(rival.strength + pull + push + noise, 0, 100);
  }
  career.renownThisYear = 0;
  career.target = nextTarget(career.tier, place, moved, rules);
  // A grant taken this year makes next year's target one step harder (D-146).
  if (career.raiseTarget) career.target = harder(career.target);
  career.raiseTarget = false;
  turn.sink.emit({
    type: 'patron.target',
    causeId: reviewed,
    subjectIds: [PLAYER_ID],
    target: career.target,
    tier: career.tier,
  });
  return false;
}

const HARDER: Readonly<Record<TargetKind, TargetKind>> = {
  'avoid-bottom': 'top-half',
  'top-half': 'top-two',
  'top-two': 'top-two',
};

export function harder(target: TargetKind): TargetKind {
  return HARDER[target];
}

function moveTier(career: CareerState, id: string, to: number): void {
  if (id === PLAYER_ID) {
    career.tier = to;
    return;
  }
  const rival = career.rivals.find((r) => r.id === id);
  if (rival) rival.tier = to;
}
