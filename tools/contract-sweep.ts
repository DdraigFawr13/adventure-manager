// Contract sweep (D-139, R2 preview): every composed shape the board can post, played by the
// reference party (the prototype party, D-137) at the default plan, pooled by danger, by twist,
// and the spread across site × monster pairs. The danger's headline rate weights each shape as
// the board does (pairs equally, twists by their weight); the plain mean is printed beside it. Runs the invariants on every quest.
// Usage: node tools/contract-sweep.ts [quests per shape=60] [approach=stealth]
import {
  checkInvariants,
  fits,
  shapeId,
  simulate,
  type Approach,
  type Danger,
  type GameState,
} from '@adventure-manager/engine';
import { baseResolution, prototypeParty } from '@adventure-manager/content';

const perShape = Number(process.argv[2] ?? 60);
const approaches: readonly Approach[] = ['stealth', 'assault', 'diplomacy'];
const approachArg = approaches.find((a) => a === (process.argv[3] ?? 'stealth'));
if (!approachArg) throw new Error(`Approach must be one of: ${approaches.join(', ')}.`);
const approach: Approach = approachArg;
const contracts = baseResolution.contracts;
if (!contracts) throw new Error('Base content has no contracts.');
const TARGET: Record<Danger, number> = { routine: 0.2, hazardous: 0.8, perilous: 2.5, deadly: 7 };
const DANGERS: readonly Danger[] = ['routine', 'hazardous', 'perilous', 'deadly'];
const partySize = prototypeParty().length;

interface Tally {
  quests: number;
  deaths: number;
  injuries: number;
  won: number;
}
const empty = (): Tally => ({ quests: 0, deaths: 0, injuries: 0, won: 0 });
const pct = (t: Tally) => (100 * t.deaths) / Math.max(1, t.quests * partySize);

function play(templateId: string, seed: number): Tally {
  let state: GameState = {
    seed: `contract-sweep-${seed}`,
    rng: {},
    nextEventNo: 1,
    content: baseResolution,
    roster: prototypeParty(),
    quest: null,
    calendar: 1,
    guild: null,
  };
  const ids = ['c0'];
  const events = [];
  let result = simulate(state, {
    type: 'quest.start',
    id: 'c0',
    day: 1,
    questId: 'q',
    templateId,
    partyIds: state.roster.map((a) => a.id),
    plan: { approach, risk: 'steady', retreat: 'leader' },
    watched: false,
  });
  const t = empty();
  t.quests = 1;
  for (let n = 1; ; n += 1) {
    events.push(...result.events);
    for (const e of result.events) {
      if (e.type === 'adventurer.died') t.deaths += 1;
      if (e.type === 'injury.gained') t.injuries += 1;
      if (e.type === 'quest.ended' && e.outcome === 'won') t.won += 1;
    }
    state = result.state;
    if (!state.quest) break;
    const id = `c${n}`;
    ids.push(id);
    result = simulate(state, { type: 'quest.step', id, day: 1 });
  }
  const problems = checkInvariants(state, events, ids);
  if (problems.length) throw new Error(`${templateId} seed ${seed}: ${problems[0]}`);
  return t;
}

function add(into: Tally, t: Tally): void {
  into.quests += t.quests;
  into.deaths += t.deaths;
  into.injuries += t.injuries;
  into.won += t.won;
}

console.log(
  `${perShape} quests per shape, prototype party, ${approach}, steady, leader's call (targets PLAN §4c, D-137)`,
);
for (const danger of DANGERS) {
  const total = empty();
  let weightedDeaths = 0;
  let weightedQuests = 0;
  const byTwist = new Map<string, Tally>();
  const byPair: [string, number][] = [];
  let shapes = 0;
  for (const site of contracts.sites)
    for (const monster of contracts.monsters) {
      if (!fits(site, monster, danger)) continue;
      const pair = empty();
      for (const twist of [null, ...contracts.twists]) {
        const id = shapeId({
          siteId: site.id,
          monsterId: monster.id,
          twistId: twist?.id ?? null,
          danger,
        });
        const tw = byTwist.get(twist?.id ?? 'plain') ?? empty();
        for (let s = 0; s < perShape; s += 1) {
          const t = play(id, s);
          add(total, t);
          const w = twist ? twist.weight : contracts.plainWeight;
          weightedDeaths += w * t.deaths;
          weightedQuests += w * t.quests;
          add(tw, t);
          add(pair, t);
        }
        byTwist.set(twist?.id ?? 'plain', tw);
        shapes += 1;
      }
      byPair.push([`${site.id}+${monster.id}`, pct(pair)]);
    }
  byPair.sort((a, b) => a[1] - b[1]);
  console.log(
    `\n${danger}: ${shapes} shapes, deaths ${((100 * weightedDeaths) / Math.max(1, weightedQuests * partySize)).toFixed(2)}% per adventurer-quest as the board weights shapes ` +
      `(plain mean over shapes ${pct(total).toFixed(2)}%) [target ${TARGET[danger]}%], ` +
      `injuries per death ${(total.injuries / Math.max(1, total.deaths)).toFixed(1)} [~5], won ${((100 * total.won) / total.quests).toFixed(0)}%`,
  );
  console.log(
    '  by twist: ' +
      [...byTwist].map(([k, t]) => `${k.replace('twist.', '')} ${pct(t).toFixed(2)}%`).join(', '),
  );
  const lo = byPair[0];
  const hi = byPair[byPair.length - 1];
  if (lo && hi)
    console.log(
      `  site × monster spread: lowest ${lo[0]} ${lo[1].toFixed(2)}%, highest ${hi[0]} ${hi[1].toFixed(2)}%`,
    );
}
