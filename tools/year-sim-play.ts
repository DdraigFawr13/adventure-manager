// One seeded guild year played by a fixed policy (used by tools/year-sim.ts).
import {
  apply,
  bedsOf,
  simulate,
  upkeepOf,
  checkGuildInvariants,
  checkInvariants,
  isFree,
  shapeOf,
  stopDays,
  type Command,
  type GameEvent,
  type GameState,
  type GuildRules,
  type Plan,
  type Place,
  type ResolutionContent,
  AREAS,
  weekInYear,
} from '@adventure-manager/engine';
import { baseResolution, type HousePlanStep } from '@adventure-manager/content';
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

/** The raw year: final state and every event, for tools that read events themselves. */
export interface PlayedYear {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

export function playYear(seed: string, plan: Plan): YearResult {
  return summariseYear(runYear(seed, plan));
}

interface Tracked extends PlayedYear {
  readonly started: number;
  readonly lowestChest: number;
  readonly weeksInDebt: number;
  readonly winterStartChest: number;
  readonly winterLowestChest: number;
}

/** Options for tools that want a bigger guild or a year cut short (the desk mock-up). */
export interface RunOptions {
  readonly size?: number;
  readonly lastDay?: number;
  /** Content to play (the career tool turns careers on); default the base content. */
  readonly content?: ResolutionContent;
  /** With staff on: hire the best candidate the chest can carry a year of, for each area (R6). */
  readonly delegate?: boolean;
  /** Called after each day's play, to sample the state (the career tool's R6 readings). */
  readonly onDay?: (state: GameState) => void;
  /** Refuse the patron's emergency grant instead of taking it (a comparison run). */
  readonly refuseGrants?: boolean;
  /** With house rules on: the build plan to follow, one job at a time (the career tool's house mode). */
  readonly housePlan?: readonly HousePlanStep[];
  /** With founding rules: the character of the starter party to pick (D-188); default balanced. */
  readonly party?: string;
}

/** With the house on: the roster the policy grows toward as beds allow. */
const HOUSE_ROSTER = 15;

/** Weeks of spending the house policy keeps in the chest after paying for a step. */
const HOUSE_RESERVE_WEEKS = 12;

export function runYear(seed: string, plan: Plan, options: RunOptions = {}): Tracked {
  const size = options.size ?? GUILD_SIZE;
  const lastDay = options.lastDay ?? DAYS;
  const started = performance.now();
  const state: GameState = {
    seed,
    rng: {},
    nextEventNo: 1,
    content: options.content ?? baseResolution,
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
    // The tool owns this state, so it changes it in place (D-148): no copy per command.
    // cast-ok: the tool adds the id the caller left out; the union member is otherwise whole.
    events.push(...apply(state, { ...command, id } as Command));
  };

  /** The guild as it stands, read fresh each time. */
  const now = () => state.guild!; // non-null: the guild is founded before anything reads it.
  let lowestChest = Infinity;
  let weeksInDebt = 0;
  let winterStartChest = 0;
  let winterLowestChest = Infinity;
  const afterDay = () => {
    play(plan);
    options.onDay?.(state);
    const guild = now();
    lowestChest = Math.min(lowestChest, guild.chestCopper);
    const week = weekInYear(state.calendar, rules);
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
    if (options.delegate) delegate(day);
    // The simulated player takes the patron's emergency grant (D-146) unless told to refuse.
    if (now().career?.emergencyOffer && now().chestCopper < 0 && !options.refuseGrants)
      run({ type: 'patron.grant', day });
    if (options.housePlan) houseStep(day);
    const houseRules = state.content.guild?.house;
    // With the house on, `size` is only the founding roster (D-187): the policy grows toward
    // HOUSE_ROSTER (two parties and backups) as beds allow, the roster the simulator was tuned at.
    const limit = () => {
      const h = now().house;
      return h && houseRules ? Math.min(HOUSE_ROSTER, bedsOf(h, houseRules)) : size;
    };
    while (now().prospects.length > 0 && now().members.length < limit()) {
      const cheapest = [...now().prospects].sort(
        (a, b) => a.wageCopper - b.wageCopper || (a.adventurer.id < b.adventurer.id ? -1 : 1),
      )[0]!; // non-null: the list is not empty.
      run({ type: 'recruit.sign', day, prospectId: cheapest.adventurer.id });
    }
    for (;;) {
      // A crisis step goes first (crisis/SPEC.md); then board order.
      const offer = now().board.find((o) => o.crisis) ?? now().board[0];
      const party = offer ? formParty() : [];
      if (!offer || party.length < rules.partySize.min) break;
      run({ type: 'contract.take', day, offerId: offer.id, partyIds: party, plan: planToUse });
    }
  };

  /** With a founding draft (D-188): the party of the chosen character and the 2 cheapest extras. */
  const pickFounders = () => {
    const draft = now().draft;
    const founding = state.content.guild?.founding;
    if (!draft || !founding) return;
    const character = options.party ?? 'balanced';
    const partyIndex = founding.characters.findIndex((c) => c.id === character);
    if (partyIndex < 0) throw new Error(`Unknown party character ${character}.`);
    const extraIds = [...draft.extras]
      .sort((a, b) => a.wageCopper - b.wageCopper || (a.adventurer.id < b.adventurer.id ? -1 : 1))
      .slice(0, founding.extras.min)
      .map((p) => p.adventurer.id);
    run({ type: 'guild.pick', day: 1, partyIndex, extraIds });
  };

  /** Scars the engine refused to repair (a run grown too long since); the policy stops asking. */
  const unrepairable = new Set<string>();
  const scarKey = (p: Place) =>
    p.area === 'hall' ? `h${p.floor}.${p.cell}` : `c${p.side}.${p.plot}`;
  /** The fire damage to repair (D-193), barracks first. */
  const repairs = (day: number): { command: Bare; urgent: boolean }[] =>
    [...(now().house?.scars ?? [])]
      .filter((x) => !unrepairable.has(scarKey(x.place)))
      .sort((a, b) => Number(b.kindId === 'room.barracks') - Number(a.kindId === 'room.barracks'))
      .map((x) => ({
        command: { type: 'house.repair', day, place: x.place },
        // Lost barracks beds put members at the inn: repaired at once, into debt if need be.
        urgent: x.kindId === 'room.barracks',
      }));

  /** The house policy: at a week start with no work running, repair fire damage first (barracks at once, D-193), else start the plan's next step, if the chest after paying keeps 12 weeks of spending. */
  let planStep = 0;
  const houseStep = (day: number) => {
    const plan = options.housePlan;
    const guild = now();
    const houseRules = state.content.guild?.house;
    if (!plan || !guild.house || !houseRules) return;
    if ((day - 1) % rules.daysPerWeek !== 0 || guild.house.work.length > 0) return;
    const wages = guild.members.reduce((sum, m) => sum + m.wageCopper, 0);
    const weekly = wages + rules.runningCostCopper + upkeepOf(guild.house, houseRules);
    /** Starts the job if the chest allows; the cost comes from a preview on a copy. */
    const tryRun = (command: Bare, urgent: boolean, reason: 'building' | 'repair'): boolean => {
      let cost: number;
      try {
        // cast-ok: the id is added to a bare command, so the union member is whole.
        const preview = simulate(state, { ...command, id: 'preview' } as Command);
        cost = -preview.events.flatMap((e) =>
          e.type === 'money.changed' && e.reason === reason ? [e.amountCopper] : [],
        )[0]!; // non-null: a started job pays once.
      } catch (error) {
        // No coin yet, or a cell held by work or a standing letter: try again next week.
        if (error instanceof Error && /chest|under work/.test(error.message)) return false;
        // A plan step on a burnt-out cell waits for its repair.
        if (
          error instanceof Error &&
          /holds no room/.test(error.message) &&
          command.type === 'house.upgrade'
        )
          if ((now().house?.scars ?? []).some((x) => scarKey(x.place) === scarKey(command.place)))
            return false;
        if (
          command.type === 'house.repair' &&
          error instanceof Error &&
          /runs to at most/.test(error.message)
        ) {
          unrepairable.add(scarKey(command.place));
          return false;
        }
        throw error;
      }
      if (!urgent && now().chestCopper - cost < HOUSE_RESERVE_WEEKS * weekly) return false;
      run(command);
      return true;
    };
    // Repairs first; one the chest can't spare doesn't hold up the plan (house/SPEC.md, Simulator).
    for (const fix of repairs(day)) if (tryRun(fix.command, fix.urgent, 'repair')) return;
    const step = plan[planStep];
    if (!step) return;
    const command: Bare =
      step.type === 'build'
        ? { type: 'house.build', day, place: step.place, kindId: step.kindId }
        : step.type === 'upgrade'
          ? { type: 'house.upgrade', day, place: step.place }
          : { type: 'house.extend', day, direction: step.direction };
    if (tryRun(command, false, 'building')) planStep += 1;
  };

  /** A full delegator (R6): each area goes to the best listed candidate better than the staff member already hired, if a year's wage is in the chest; the guildmaster's own skill is never weighed. */
  const delegate = (day: number) => {
    for (const area of AREAS) {
      const staff = now().staff;
      if (!staff) return;
      const current = staff.staff[area]?.quality ?? 0;
      const best = staff.candidates
        .filter((c) => c.area === area && c.quality > current)
        .filter((c) => c.wageCopper * rules.weeksPerYear <= now().chestCopper)
        .sort((a, b) => b.quality - a.quality || (a.id < b.id ? -1 : 1))[0];
      if (best) run({ type: 'staff.hire', day, candidateId: best.id });
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

  run({ type: 'guild.found', day: 1, size });
  pickFounders();
  afterDay();
  // A career run stops when the guildmaster's career ends (career/SPEC.md).
  for (let day = 2; day <= lastDay && !state.guild?.career?.ended; day += 1) {
    run({ type: 'day.advance', day });
    afterDay();
  }

  const problems = [
    ...checkInvariants(state, events, commandIds),
    ...checkGuildInvariants(state, events, commandIds),
  ];
  if (problems.length) throw new Error(`Seed ${seed}: ${problems.slice(0, 5).join(' ')}`);
  return { state, events, started, lowestChest, weeksInDebt, winterStartChest, winterLowestChest };
}

function summariseYear(played: Tracked): YearResult {
  const { state, events, started, lowestChest, weeksInDebt, winterStartChest, winterLowestChest } =
    played;
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
      danger = shapeOf(e.templateId)?.danger ?? dangerOf.get(e.templateId) ?? '';
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
