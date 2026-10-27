// Resolution v0 balance sweep (PLAN §9b, R2 preview): runs the base barrow delve many times and
// reports deaths and injuries against PLAN §4c, and runs the invariants on every quest. Then
// each contract (all four, the deadly Gallows Spire included) with the prototype party at cautious, default and reckless plans (D-131).
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
import { baseResolution, prototypeParty } from '@adventure-manager/content';

const quests = Number(process.argv[2] ?? 2000);
const party: [string, string, number][] = [
  ['a', 'class.warrior', 0],
  ['b', 'class.rogue', 3],
  ['c', 'class.cleric', 5],
  ['d', 'class.warrior', 2],
  ['e', 'class.rogue', 6],
];

function attributesFor(lean: number): Adventurer['attributes'] {
  const attributes = Object.fromEntries(ATTRIBUTES.map((a, i) => [a, 8 + ((i + lean) % 7)]));
  // cast-ok: built from every name in ATTRIBUTES just above.
  return attributes as Adventurer['attributes'];
}

/** Five mid adventurers: attributes spread 8–14. */
function roster(): Adventurer[] {
  return party.map(([id, classId, lean]) => ({
    id,
    classId,
    position: classId === 'class.cleric' ? 'back' : 'front',
    attributes: attributesFor(lean),
    weaponBp: 300,
    armourBp: 300,
    dead: false,
  }));
}

const retreats: readonly RetreatThreshold[] = ['badly-hurt', 'down', 'leader', 'dying', 'never'];
for (const retreat of retreats) {
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
      calendar: 1,
      guild: null,
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

const targetDeathPct: Record<string, number> = {
  routine: 0.2,
  hazardous: 0.8,
  perilous: 2.5,
  deadly: 7,
};
// PLAN §4c: cautious settings roughly halve deaths, reckless ones roughly double them (D-131).
const presets = [
  { name: 'cautious', risk: 'cautious', retreat: 'down', factor: 0.5 },
  { name: 'default', risk: 'steady', retreat: 'leader', factor: 1 },
  { name: 'reckless', risk: 'bold', retreat: 'never', factor: 2 },
] as const;
console.log(
  '\nEach contract, prototype party: cautious (cautious, first Down), default, reckless (bold, never):',
);
for (const quest of baseResolution.quests) {
  for (const preset of presets) {
    let exchanges = 0;
    let foeAttacks = 0;
    let fights = 0;
    let deaths = 0;
    let injuries = 0;
    const outcomes: Record<string, number> = {};
    for (let seed = 0; seed < quests; seed += 1) {
      let state: GameState = {
        seed: `contract-${seed}`,
        rng: {},
        nextEventNo: 1,
        content: baseResolution,
        roster: prototypeParty(),
        quest: null,
        calendar: 1,
        guild: null,
      };
      let result = simulate(state, {
        type: 'quest.start',
        id: 'c0',
        day: 1,
        questId: 'q',
        templateId: quest.id,
        partyIds: state.roster.map((a) => a.id),
        plan: { approach: 'stealth', risk: preset.risk, retreat: preset.retreat },
        watched: false,
      });
      let fought = false;
      for (let n = 1; ; n += 1) {
        for (const e of result.events) {
          if (e.type === 'exchange.started') {
            exchanges += 1;
            fought = true;
          }
          if (e.type === 'check.rolled' && e.purpose === 'defence') foeAttacks += 1;
          if (e.type === 'adventurer.died') deaths += 1;
          if (e.type === 'injury.gained') injuries += 1;
          if (e.type === 'quest.ended') outcomes[e.outcome] = (outcomes[e.outcome] ?? 0) + 1;
        }
        state = result.state;
        if (!state.quest) break;
        result = simulate(state, { type: 'quest.step', id: `c${n}`, day: 1 });
      }
      if (fought) fights += 1;
    }
    const target = (targetDeathPct[quest.danger] ?? 0) * preset.factor;
    console.log(
      `${quest.id} (${quest.danger}) ${preset.name}: deaths ` +
        `${((100 * deaths) / (quests * prototypeParty().length)).toFixed(2)}% (target ~${target}%), ` +
        `injuries per death ${deaths ? (injuries / deaths).toFixed(1) : 'n/a'}, ` +
        `exchanges per fight ${(exchanges / Math.max(1, fights)).toFixed(1)}, foe attacks per fight ` +
        `${(foeAttacks / Math.max(1, fights)).toFixed(1)}, outcomes ${JSON.stringify(outcomes)}`,
    );
  }
}
