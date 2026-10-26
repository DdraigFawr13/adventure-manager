// One seeded guild year played by a fixed policy (used by tools/year-sim.ts).
import {
  checkGuildInvariants,
  checkInvariants,
  isFree,
  simulate,
  stopDays,
  type Command,
  type GameEvent,
  type GameState,
  type GuildRules,
  type Plan,
} from '@adventure-manager/engine';
import { baseResolution } from '@adventure-manager/content';
export const POLICIES: Readonly<Record<string, Plan>> = {
  default: { approach: 'assault', risk: 'steady', retreat: 'leader' },
  cautious: { approach: 'assault', risk: 'cautious', retreat: 'down' },
  bold: { approach: 'assault', risk: 'bold', retreat: 'never' },
};
export const POLICY_NAMES = ['default', 'cautious', 'bold'] as const;
export const GUILD_SIZE = 15;
const baseRules = baseResolution.guild;
if (!baseRules) throw new Error('Base content has no guild rules.');
export const rules: GuildRules = baseRules;
const DAYS = rules.weeksPerYear * rules.daysPerWeek;
const dangerOf = new Map(baseResolution.quests.map((q) => [q.id, q.danger]));

/** A command without its id; the tool numbers commands itself. */
type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

export interface YearResult {
  deaths: number;
  injuries: number;
  quests: number;
  /** Danger → [adventurer-quests, deaths]. */
  byDanger: Map<string, [number, number]>;
  wagesCopper: number;
  spendingCopper: number;
  surplusCopper: number;
  lowestChest: number;
  weeksInDebt: number;
  winterStartChest: number;
  winterLowestChest: number;
  recruits: number;
  stopDays: number;
  stopDaysByKey: Map<string, number>;
  finalChest: number;
  renown: number;
  seconds: number;
}

export function playYear(seed: string, plan: Plan): YearResult {
  const started = performance.now();
  let state: GameState = {
    seed,
    rng: {},
    nextEventNo: 1,
    content: baseResolution,
    roster: [],
    quest: null,
    calendar: 1,
    guild: null,
  };
  const events: GameEvent[] = [];
  const commandIds: string[] = [];
  const run = (command: Bare) => {
    const id = `c${commandIds.length}`;
    commandIds.push(id);
    // cast-ok: the tool adds the id the caller left out; the union member is otherwise whole.
    const result = simulate(state, { ...command, id } as Command);
    state = result.state;
    events.push(...result.events);
  };

  /** The guild as it stands; simulate returns a new state each command, so never keep an old one. */
  const now = () => state.guild!; // non-null: the guild is founded before anything reads it.
  let lowestChest = Infinity;
  let weeksInDebt = 0;
  let winterStartChest = 0;
  let winterLowestChest = Infinity;
  const afterDay = () => {
    play(plan);
    const guild = now();
    lowestChest = Math.min(lowestChest, guild.chestCopper);
    const week = Math.floor((state.calendar - 1) / rules.daysPerWeek) + 1;
    if ((state.calendar - 1) % rules.daysPerWeek === 0) {
      if (guild.chestCopper < 0) weeksInDebt += 1;
      if (week === rules.winterFromWeek) winterStartChest = guild.chestCopper;
    }
    if (week >= rules.winterFromWeek)
      winterLowestChest = Math.min(winterLowestChest, guild.chestCopper);
  };

  /** The player's side: sign the cheapest prospects, then send out parties on board order. */
  const play = (planToUse: Plan) => {
    const day = state.calendar;
    while (now().prospects.length > 0 && now().members.length < GUILD_SIZE) {
      const cheapest = [...now().prospects].sort(
        (a, b) => a.wageCopper - b.wageCopper || (a.adventurer.id < b.adventurer.id ? -1 : 1),
      )[0]!; // non-null: the list is not empty.
      run({ type: 'recruit.sign', day, prospectId: cheapest.adventurer.id });
    }
    for (;;) {
      const offer = now().board[0];
      const party = offer ? formParty() : [];
      if (!offer || party.length < rules.partySize.min) break;
      run({ type: 'contract.take', day, offerId: offer.id, partyIds: party, plan: planToUse });
    }
  };

  /** Fittest first (attribute total), up to the maximum, with a cleric in it when one is free. */
  const formParty = (): string[] => {
    const guild = now();
    const rank = (id: string) => {
      const a = state.roster.find((r) => r.id === id)!; // non-null: members are on the roster.
      return {
        id,
        cleric: a.classId === 'class.cleric',
        total: Object.values(a.attributes).reduce((s, v) => s + v, 0),
      };
    };
    const free = guild.members
      .filter((m) => isFree(m, state.calendar))
      .map((m) => rank(m.id))
      .sort((a, b) => b.total - a.total || (a.id < b.id ? -1 : 1));
    const party = free.slice(0, rules.partySize.max);
    const cleric = free.find((m) => m.cleric);
    if (cleric && !party.some((m) => m.cleric) && party.length === rules.partySize.max)
      party[party.length - 1] = cleric;
    return party.map((m) => m.id);
  };

  run({ type: 'guild.found', day: 1, size: GUILD_SIZE });
  afterDay();
  for (let day = 2; day <= DAYS; day += 1) {
    run({ type: 'day.advance', day });
    afterDay();
  }

  const problems = [
    ...checkInvariants(state, events, commandIds),
    ...checkGuildInvariants(state, events, commandIds),
  ];
  if (problems.length) throw new Error(`Seed ${seed}: ${problems.slice(0, 5).join(' ')}`);

  const result: YearResult = {
    deaths: 0,
    injuries: 0,
    quests: 0,
    byDanger: new Map(),
    wagesCopper: 0,
    spendingCopper: 0,
    surplusCopper: 0,
    lowestChest,
    weeksInDebt,
    winterStartChest,
    winterLowestChest,
    recruits: -GUILD_SIZE,
    stopDays: 0,
    stopDaysByKey: new Map(),
    finalChest: state.guild!.chestCopper, // non-null: founded above.
    renown: state.guild!.renown,
    seconds: 0,
  };
  let danger = '';
  for (const e of events) {
    if (e.type === 'adventurer.died') {
      result.deaths += 1;
      const row = result.byDanger.get(danger);
      if (row) row[1] += 1;
    }
    if (e.type === 'injury.gained') result.injuries += 1;
    if (e.type === 'recruit.signed') result.recruits += 1;
    if (e.type === 'quest.started') {
      danger = dangerOf.get(e.templateId) ?? '';
      const row = result.byDanger.get(danger) ?? [0, 0];
      row[0] += e.subjectIds.length - 1;
      result.byDanger.set(danger, row);
    }
    if (e.type === 'quest.ended') result.quests += 1;
    if (e.type === 'money.changed' && e.reason !== 'founding') {
      result.surplusCopper += e.amountCopper;
      if (e.amountCopper < 0) result.spendingCopper -= e.amountCopper;
      if (e.reason === 'wages') result.wagesCopper -= e.amountCopper;
    }
  }
  result.stopDays = stopDays(events).length;
  result.stopDaysByKey.set('total', result.stopDays);
  for (const key of [
    'must',
    'digest',
    'week-report',
    'assembly',
    'new-contracts',
    'death',
    'signing-window',
    'party-home',
  ])
    result.stopDaysByKey.set(
      key,
      stopDays(events, (e) => e.stopClass === key || e.reason === key).length,
    );
  result.seconds = (performance.now() - started) / 1000;
  return result;
}
