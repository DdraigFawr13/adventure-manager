// Resolution v0 balance sweep (PLAN §9b, R2 preview): runs the base barrow delve many times and
// reports deaths and injuries against PLAN §4c, and runs the invariants on every quest.
// Usage: node tools/resolution-sweep.ts [quests=2000]
import {
  ATTRIBUTES,
  checkInvariants,
  simulate,
  type Adventurer,
  type GameEvent,
  type GameState,
  type RetreatThreshold,
} from '@adventure-manager/engine';
import { baseResolution } from '@adventure-manager/content';

const quests = Number(process.argv[2] ?? 2000);
const party: [string, string, number][] = [
  ['a', 'class.warrior', 0],
  ['b', 'class.rogue', 3],
  ['c', 'class.cleric', 5],
  ['d', 'class.warrior', 2],
  ['e', 'class.rogue', 6],
];

/** Five mid adventurers: attributes spread 8–14. */
function roster(): Adventurer[] {
  return party.map(([id, classId, lean]) => ({
    id,
    classId,
    position: classId === 'class.cleric' ? 'back' : 'front',
    attributes: Object.fromEntries(
      ATTRIBUTES.map((a, i) => [a, 8 + ((i + lean) % 7)]),
    ) as Adventurer['attributes'],
    weaponBp: 300,
    armourBp: 300,
    dead: false,
  }));
}

for (const retreat of ['never', 'down', 'badly-hurt'] as RetreatThreshold[]) {
  let deaths = 0;
  let injuries = 0;
  const outcomes: Record<string, number> = {};
  for (let seed = 0; seed < quests; seed += 1) {
    let state: GameState = {
      seed: `sweep-${seed}`,
      rng: {},
      nextEventNo: 1,
      content: baseResolution,
      roster: roster(),
      quest: null,
    };
    const events: GameEvent[] = [];
    const ids = ['c0'];
    let result = simulate(state, {
      type: 'quest.start',
      id: 'c0',
      day: 1,
      questId: 'q',
      templateId: 'quest.barrow-delve',
      partyIds: party.map(([id]) => id),
      plan: { approach: 'stealth', risk: 'steady', retreat },
      watched: false,
    });
    for (let n = 1; ; n += 1) {
      events.push(...result.events);
      state = result.state;
      if (!state.quest) break;
      ids.push(`c${n}`);
      result = simulate(state, { type: 'quest.step', id: `c${n}`, day: 1 });
    }
    const problems = checkInvariants(state, events, ids);
    if (problems.length) throw new Error(`Seed ${seed}: ${problems.join(' ')}`);
    for (const e of events) {
      if (e.type === 'adventurer.died') deaths += 1;
      if (e.type === 'injury.gained') injuries += 1;
      if (e.type === 'quest.ended') outcomes[e.outcome] = (outcomes[e.outcome] ?? 0) + 1;
    }
  }
  const perAdventurer = ((100 * deaths) / (quests * party.length)).toFixed(2);
  const perDeath = deaths ? (injuries / deaths).toFixed(1) : 'n/a';
  console.log(
    `retreat ${retreat}: deaths ${perAdventurer}% per adventurer (target 0.8% hazardous), ` +
      `injuries per death ${perDeath} (target ~5), outcomes ${JSON.stringify(outcomes)}`,
  );
}
