import { describe, expect, it } from 'vitest';
import { checkInvariants, simulate } from '../src/index.ts';
import { chanceValue, rollCheck } from '../src/resolution/check.ts';
import { adventurer, finish, game, ofType, run, steadyPlan } from './fixture.ts';

const fixed = (roll: number) => ({ int: () => roll - 1 });
const certain = { minChanceBp: 0, maxChanceBp: 10_000 };

describe('checks are percent chances (D-119)', () => {
  it('adds a clamp part so the breakdown still sums to the clamped chance', () => {
    const value = chanceValue(
      5000,
      [{ sourceId: 'attribute.might', amount: 6000 }],
      500,
      9500,
      'c',
    );
    expect(value.total).toBe(9500);
    expect(value.parts).toContainEqual({ sourceId: 'rule.clamp', amount: -1500 });
  });

  it('marks strong successes and bad failures by the roll band', () => {
    expect(rollCheck(fixed(1000), 6000, 2500, 3000).outcome).toBe('strong-success');
    expect(rollCheck(fixed(6000), 6000, 2500, 3000).outcome).toBe('success');
    expect(rollCheck(fixed(6001), 6000, 2500, 3000).outcome).toBe('failure');
    expect(rollCheck(fixed(8801), 6000, 2500, 3000).outcome).toBe('bad-failure');
  });
});

describe('scenes (SPEC "Scenes", D-121)', () => {
  it('tests the approach attribute and shows the site tag and risk as parts', () => {
    const state = game([adventurer('a', { stealth: 14 })]);
    const { events } = run(state, { ...steadyPlan, risk: 'bold' });
    const gate = ofType(events, 'check.rolled').find((e) =>
      e.chance.parts.some((p) => p.sourceId === 'attribute.stealth'),
    );
    const parts = gate?.chance.parts.map((p) => [p.sourceId, p.amount]);
    expect(parts).toEqual([
      ['attribute.stealth', 2000],
      ['site.tag.guarded', 1000],
      ['plan.risk.bold', 500],
    ]);
  });

  it('moves a failed tester one step, or two on a bad failure', () => {
    const roster = [adventurer('a', { agility: 1 })];
    const quest = {
      scenes: [
        {
          id: 's',
          kind: 'fixed',
          attribute: 'agility',
          difficulty: 20,
          testers: 'all',
          onFailure: 'wound',
        },
      ],
    } as const;
    const plain = run(
      game(roster, {
        rules: {
          ...certain,
          risk: { ...game([]).content.rules.risk, steady: { chanceBp: 0, badFailureShareBp: 0 } },
        },
        quest,
      }),
    );
    const bad = run(
      game(roster, {
        rules: {
          ...certain,
          risk: {
            ...game([]).content.rules.risk,
            steady: { chanceBp: 0, badFailureShareBp: 10_000 },
          },
        },
        quest,
      }),
    );
    expect(ofType(plain.events, 'wound.changed')[0]).toMatchObject({ from: 0, to: 1 });
    expect(ofType(bad.events, 'wound.changed')[0]).toMatchObject({ from: 0, to: 2 });
  });

  it('raises the alarm once, and the alarm makes foes harder to hit', () => {
    const roster = [adventurer('a', { stealth: 1 })];
    const quest = {
      scenes: [
        { id: 's1', kind: 'approach', difficulty: 20, testers: 'all', onFailure: 'alarm' },
        { id: 's2', kind: 'approach', difficulty: 20, testers: 'all', onFailure: 'alarm' },
      ],
    } as const;
    const { events } = run(game(roster, { rules: certain, quest }));
    expect(ofType(events, 'alarm.raised')).toHaveLength(1);
    const attack = ofType(events, 'check.rolled').find((e) => e.purpose === 'attack');
    expect(attack?.chance.parts).toContainEqual({ sourceId: 'quest.alarm', amount: -1000 });
  });
});

describe('the main fight (D-118, D-123)', () => {
  it('ends won when every foe group is down', () => {
    const roster = [adventurer('a', { might: 20, agility: 20 })];
    const { state, events } = run(
      game(roster, {
        rules: { baseChanceBp: 10_000, ...certain },
        quest: { scenes: [], foes: [{ id: 'f', attack: 1, defence: 1, speed: 10, hits: 3 }] },
      }),
    );
    expect(ofType(events, 'quest.ended')[0]?.outcome).toBe('won');
    expect(state.quest).toBeNull();
  });

  it('ends partial when the exchanges run out', () => {
    const roster = [adventurer('a', { might: 1, agility: 20 })];
    const { events } = run(
      game(roster, {
        rules: { ...certain, maxExchanges: 3 },
        quest: { scenes: [], foes: [{ id: 'f', attack: 1, defence: 20, speed: 10, hits: 3 }] },
      }),
    );
    expect(ofType(events, 'exchange.started')).toHaveLength(3);
    expect(ofType(events, 'quest.ended')[0]?.outcome).toBe('partial');
  });

  it('ends in a rout when no one is left standing', () => {
    const roster = [adventurer('a', { might: 1, agility: 1, toughness: 20, resolve: 20 })];
    const { events } = run(
      game(roster, {
        rules: { ...certain, deathRoll: { baseBp: 0, stepBp: 0, pivot: 10 } },
        quest: { scenes: [], foes: [{ id: 'f', attack: 20, defence: 20, speed: 10, hits: 3 }] },
      }),
    );
    expect(ofType(events, 'quest.ended')[0]?.outcome).toBe('routed');
  });
});

describe('wounds and death (D-120)', () => {
  it('makes a Dying member roll for death, with Toughness and Resolve as parts', () => {
    const roster = [adventurer('a', { agility: 1, toughness: 13, resolve: 12 })];
    const scene = {
      id: 's',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 20,
      testers: 'all',
      onFailure: 'wound',
    } as const;
    const risk = {
      ...game([]).content.rules.risk,
      steady: { chanceBp: 0, badFailureShareBp: 10_000 },
    };
    // Two bad failures take 'a' from Fit to Dying (2 + 2 steps).
    const { events } = run(
      game(roster, { rules: { ...certain, risk }, quest: { scenes: [scene, scene] } }),
    );
    const death = ofType(events, 'check.rolled').find((e) => e.purpose === 'death');
    expect(death?.chance.parts).toEqual([
      { sourceId: 'attribute.toughness', amount: -300 },
      { sourceId: 'attribute.resolve', amount: -200 },
    ]);
    expect(death?.chance.total).toBe(2000);
  });

  it('lets a standing cleric stabilise a Dying member back to Down', () => {
    const roster = [
      adventurer('a', { agility: 1 }),
      adventurer('h', { lore: 20, agility: 20 }, 'cleric'),
    ];
    const quest = {
      scenes: [
        {
          id: 's',
          kind: 'fixed',
          attribute: 'agility',
          difficulty: 20,
          testers: 'best-two',
          onFailure: 'wound',
        },
      ],
    } as const;
    const highRisk = {
      ...game([]).content.rules.risk,
      steady: { chanceBp: 0, badFailureShareBp: 10_000 },
    };
    const state = game(roster, {
      rules: { ...certain, risk: highRisk, stabilise: { attribute: 'lore', difficulty: 0 } },
      quest,
    });
    // Two bad failures take 'a' from Fit to Dying in one scene (2 + 2 steps).
    const twice = {
      ...state,
      content: {
        ...state.content,
        quests: [{ ...state.content.quests[0]!, scenes: [quest.scenes[0], quest.scenes[0]] }],
      },
    };
    const { events } = run(twice);
    expect(ofType(events, 'adventurer.stabilised')[0]?.subjectIds).toEqual(['a', 'h']);
  });

  it('rolls lasting injuries at the end for members Badly hurt or worse', () => {
    const roster = [adventurer('a', { agility: 1 })];
    const quest = {
      scenes: [
        {
          id: 's',
          kind: 'fixed',
          attribute: 'agility',
          difficulty: 20,
          testers: 'all',
          onFailure: 'wound',
        },
      ] as const,
      foes: [],
    };
    const risk = {
      ...game([]).content.rules.risk,
      steady: { chanceBp: 0, badFailureShareBp: 10_000 },
    };
    const { events } = run(
      game(roster, {
        rules: { ...certain, risk, injuryBp: { badlyHurt: 10_000, down: 0, dying: 0 } },
        quest,
      }),
    );
    expect(ofType(events, 'injury.gained')).toHaveLength(1);
  });
});

describe('retreat and key moments (D-121, D-032)', () => {
  const roster = () => [adventurer('a', { agility: 1 }), adventurer('b', { agility: 20 })];
  const quest = {
    scenes: [
      {
        id: 's',
        kind: 'fixed',
        attribute: 'agility',
        difficulty: 20,
        testers: 'all',
        onFailure: 'wound',
      },
      {
        id: 's2',
        kind: 'fixed',
        attribute: 'agility',
        difficulty: 1,
        testers: 'all',
        onFailure: 'wound',
      },
    ],
  } as const;
  const risk = {
    ...game([]).content.rules.risk,
    steady: { chanceBp: 0, badFailureShareBp: 10_000 },
  };
  const plan = { ...steadyPlan, retreat: 'badly-hurt' } as const;

  it('pulls an unwatched party out at the threshold', () => {
    const { events } = run(game(roster(), { rules: { ...certain, risk }, quest }), plan);
    expect(ofType(events, 'quest.retreated')).toHaveLength(1);
    expect(ofType(events, 'quest.ended')[0]?.outcome).toBe('retreated');
  });

  it('stops a watched party for the player, and pushing on carries on', () => {
    const paused = run(game(roster(), { rules: { ...certain, risk }, quest }), plan, true);
    expect(ofType(paused.events, 'moment.raised')).toHaveLength(1);
    expect(() => simulate(paused.state, { type: 'quest.step', id: 'x', day: 1 })).toThrow(/moment/);
    const chosen = simulate(paused.state, {
      type: 'quest.choose',
      id: 'c9',
      day: 1,
      choice: 'push-on',
    });
    expect(chosen.state.quest?.momentPending).toBe(false);
    const next = simulate(chosen.state, { type: 'quest.step', id: 'c10', day: 1 });
    expect(next.events.some((e) => e.type === 'moment.raised')).toBe(false);
  });
});

describe('the engine stays deterministic and sound (GAME-01, GAME-06)', () => {
  const party = () => [
    adventurer('a', { might: 14, agility: 11, stealth: 12 }),
    adventurer('b', { might: 9, agility: 15, stealth: 15, wits: 13 }, 'rogue'),
    adventurer('c', { lore: 14, resolve: 13, presence: 12 }, 'cleric'),
  ];

  it('gives the same events for the same seed and commands', () => {
    expect(run(game(party())).events).toEqual(run(game(party())).events);
  });

  it('never changes the state it is given, so a preview is safe', () => {
    const state = game(party());
    const before = structuredClone(state);
    run(state, { ...steadyPlan, retreat: 'down' });
    expect(state).toEqual(before);
  });

  // An invariant sweep, not a balance battery (GAME-06): many seeds reach more code paths.
  it('keeps the invariants over many seeded quests, and every quest ends', () => {
    const outcomes = new Set<string>();
    for (let seed = 0; seed < 200; seed += 1) {
      const plan = { ...steadyPlan, retreat: seed % 2 ? 'down' : 'never' } as const;
      const { state, events, commandIds } = run(game(party(), { seed: `s${seed}` }), plan);
      expect(checkInvariants(state, events, commandIds)).toEqual([]);
      expect(state.quest).toBeNull();
      outcomes.add(ofType(events, 'quest.ended')[0]?.outcome ?? 'none');
    }
    expect(outcomes.has('none')).toBe(false);
  });

  it('rejects a party with someone listed twice', () => {
    const state = game([adventurer('a')]);
    expect(() =>
      simulate(state, {
        type: 'quest.start',
        id: 'c',
        day: 1,
        questId: 'q',
        templateId: 'quest.test-barrow',
        partyIds: ['a', 'a'],
        plan: steadyPlan,
        watched: false,
      }),
    ).toThrow(/twice/);
  });
});

describe('start checks and rules the review asked to pin down', () => {
  const startCommand = (partyIds: string[]) =>
    ({
      type: 'quest.start',
      id: 'c',
      day: 1,
      questId: 'q',
      templateId: 'quest.test-barrow',
      partyIds,
      plan: steadyPlan,
      watched: false,
    }) as const;

  it('rejects a dead member, an unknown class and a second quest', () => {
    const dead = { ...adventurer('a'), dead: true };
    expect(() => simulate(game([dead]), startCommand(['a']))).toThrow(/dead/);
    expect(() => simulate(game([adventurer('a', {}, 'constructor')]), startCommand(['a']))).toThrow(
      /unknown class/,
    );
    const running = simulate(game([adventurer('a')]), startCommand(['a'])).state;
    expect(() => simulate(running, startCommand(['a']))).toThrow(/still running/);
  });

  it('tests the best one, the best two or everyone in a scene', () => {
    const roster = [
      adventurer('a', { wits: 5 }),
      adventurer('b', { wits: 15 }),
      adventurer('c', { wits: 10 }),
    ];
    for (const [testers, expected] of [
      ['best', ['b']],
      ['best-two', ['b', 'c']],
      ['all', ['b', 'c', 'a']],
    ] as const) {
      const quest = {
        scenes: [
          { id: 's', kind: 'fixed', attribute: 'wits', difficulty: 1, testers, onFailure: 'wound' },
        ],
      } as const;
      const { events } = run(game(roster, { rules: certain, quest }));
      const scene = ofType(events, 'check.rolled').filter((e) => e.purpose === 'scene');
      expect(scene.map((e) => e.subjectIds[0])).toEqual(expected);
    }
  });

  it('moves a stabilised member back to Down with a wound event', () => {
    const roster = [
      adventurer('a', { agility: 1 }),
      adventurer('h', { lore: 20, agility: 20 }, 'cleric'),
    ];
    const scene = {
      id: 's',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 20,
      testers: 'all',
      onFailure: 'wound',
    } as const;
    const risk = {
      ...game([]).content.rules.risk,
      steady: { chanceBp: 0, badFailureShareBp: 10_000 },
    };
    const { state, events, commandIds } = run(
      game(roster, {
        rules: { ...certain, risk, stabilise: { attribute: 'lore', difficulty: 0 } },
        quest: { scenes: [scene, scene] },
      }),
    );
    expect(ofType(events, 'wound.changed')).toContainEqual(
      expect.objectContaining({ subjectIds: ['a'], from: 4, to: 3 }),
    );
    expect(checkInvariants(state, events, commandIds)).toEqual([]);
  });

  it('pulls out when the player chooses to, with the retreat check', () => {
    const roster = [adventurer('a', { agility: 1 }), adventurer('b', { agility: 20 })];
    const scene = {
      id: 's',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 20,
      testers: 'all',
      onFailure: 'wound',
    } as const;
    const risk = {
      ...game([]).content.rules.risk,
      steady: { chanceBp: 0, badFailureShareBp: 10_000 },
    };
    const paused = run(
      game(roster, { rules: { ...certain, risk }, quest: { scenes: [scene, scene] } }),
      { ...steadyPlan, retreat: 'badly-hurt' },
      true,
    );
    const out = simulate(paused.state, {
      type: 'quest.choose',
      id: 'cx',
      day: 1,
      choice: 'pull-out',
    });
    expect(out.events.some((e) => e.type === 'check.rolled' && e.purpose === 'retreat')).toBe(true);
    // D-126: the retreat takes beats; the quest ends only after them.
    expect(out.state.quest?.phase).toBe('retreat');
    const rest = finish(out.state);
    expect(ofType(rest.events, 'retreat.beat').length).toBeGreaterThan(0);
    expect(ofType(rest.events, 'quest.ended')[0]?.outcome).toBe('retreated');
  });
});

describe('the fallen bleed out (D-124)', () => {
  it('lets an untended Down member slip to Dying, and death waits for the next beat', () => {
    const roster = [
      adventurer('a', { agility: 1, toughness: 12 }),
      adventurer('b', { agility: 20 }),
    ];
    const scene = {
      id: 's',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 20,
      testers: 'all',
      onFailure: 'wound',
    } as const;
    const pass = { ...scene, id: 'p', difficulty: 1 } as const;
    const risk = { ...game([]).content.rules.risk, steady: { chanceBp: 0, badFailureShareBp: 0 } };
    const bleed = { baseBp: 10_400, stepBp: 200, pivot: 10 };
    // Three plain failures take 'a' to Down; then bleeding is certain (104% - 4%).
    const { events } = run(
      game(roster, {
        rules: { ...certain, risk, bleed },
        quest: { scenes: [scene, scene, scene, pass] },
      }),
    );
    const rolls = ofType(events, 'check.rolled').filter(
      (e) => e.purpose === 'bleed' || e.purpose === 'death',
    );
    expect(rolls.map((e) => e.purpose).slice(0, 2)).toEqual(['bleed', 'death']);
    expect(rolls[0]?.chance.parts).toEqual([{ sourceId: 'attribute.toughness', amount: -400 }]);
  });

  it('keeps a Down member bleeding when the cleric fails to tend them', () => {
    const roster = [adventurer('a', { agility: 1 }), adventurer('h', { agility: 20 }, 'cleric')];
    const scene = {
      id: 's',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 20,
      testers: 'all',
      onFailure: 'wound',
    } as const;
    const risk = { ...game([]).content.rules.risk, steady: { chanceBp: 0, badFailureShareBp: 0 } };
    const rules = {
      ...certain,
      risk,
      stabilise: { attribute: 'lore', difficulty: 20 },
      bleed: { baseBp: 10_000, stepBp: 0, pivot: 10 },
    } as const;
    const { events } = run(game(roster, { rules, quest: { scenes: [scene, scene, scene] } }));
    const purposes = ofType(events, 'check.rolled')
      .map((e) => e.purpose)
      .filter((p) => p === 'stabilise' || p === 'bleed');
    expect(purposes.slice(0, 2)).toEqual(['stabilise', 'bleed']);
  });
});

describe('the leader reads the fight, and retreat takes time (D-125, D-126)', () => {
  const scene = {
    id: 's',
    kind: 'fixed',
    attribute: 'agility',
    difficulty: 20,
    testers: 'all',
    onFailure: 'wound',
  } as const;
  const bad = {
    ...game([]).content.rules.risk,
    steady: { chanceBp: 0, badFailureShareBp: 10_000 },
  };
  const leaderPlan = { ...steadyPlan, retreat: 'leader' } as const;

  it('pulls out when losing and the read succeeds', () => {
    // 'a' falls in a scene (losing: no foe down yet); wits 20 makes the read certain.
    const roster = [adventurer('a', { agility: 1 }), adventurer('b', { agility: 20, wits: 20 })];
    const rules = {
      ...certain,
      risk: bad,
      leaderCall: { attribute: 'wits', difficulty: 0, clarityStepBp: 2500 },
    } as const;
    const { events } = run(game(roster, { rules, quest: { scenes: [scene, scene] } }), leaderPlan);
    expect(ofType(events, 'leader.judged')[0]).toMatchObject({
      situation: 'losing',
      call: 'pull-out',
    });
    expect(ofType(events, 'quest.retreated')).toHaveLength(1);
  });

  it('makes the wrong call when the read fails', () => {
    const roster = [adventurer('a', { agility: 1 }), adventurer('b', { agility: 20, wits: 1 })];
    const rules = {
      ...certain,
      risk: bad,
      leaderCall: { attribute: 'wits', difficulty: 40, clarityStepBp: 2500 },
    } as const;
    const { events } = run(game(roster, { rules, quest: { scenes: [scene, scene] } }), leaderPlan);
    expect(ofType(events, 'leader.judged')[0]).toMatchObject({ situation: 'losing', call: 'hold' });
  });

  it('adds beats for a failed retreat check and for carrying the fallen', () => {
    const roster = [adventurer('a', { agility: 1 }), adventurer('b', { agility: 20, wits: 1 })];
    const rules = {
      ...certain,
      risk: bad,
      retreat: {
        ...game([]).content.rules.retreat,
        difficulty: { routine: 40, hazardous: 40, perilous: 40, deadly: 40 },
      },
    } as const;
    const { events } = run(game(roster, { rules, quest: { scenes: [scene, scene] } }), {
      ...steadyPlan,
      retreat: 'down',
    });
    // 1 base + 1 carrying 'a' (Down) + 1 failed check.
    expect(ofType(events, 'quest.retreated')[0]?.beats).toBe(3);
    expect(ofType(events, 'retreat.beat')).toHaveLength(3);
  });
});

describe('speed order and sturdier foes (D-129)', () => {
  it('lets a faster foe group strike before the party, and keeps it up until its hits are taken', () => {
    const roster = [adventurer('a', { agility: 5, might: 20 })];
    const foes = [{ id: 'f', attack: 1, defence: 1, speed: 20, hits: 4 }];
    const { events } = run(game(roster, { rules: certain, quest: { scenes: [], foes } }));
    const first = ofType(events, 'check.rolled')[0];
    expect(first?.purpose).toBe('defence');
    const wounds = ofType(events, 'foe.wounded');
    expect(wounds.at(-1)).toMatchObject({ to: 4, hits: 4 });
    expect(ofType(events, 'exchange.started').length).toBeGreaterThan(1);
  });
});

describe('class signature actions (D-130)', () => {
  const base = game([]).content.rules;
  const classes = {
    ...base.classes,
    warrior: {
      attackAttribute: 'might',
      canStabilise: false,
      actions: [
        { id: 'action.guard', kind: 'guard', chanceBp: 10_000 },
        { id: 'action.cleave', kind: 'cleave' },
      ],
    },
    rogue: {
      attackAttribute: 'agility',
      canStabilise: false,
      actions: [
        { id: 'action.scout', kind: 'scout', bonusBp: 1000 },
        { id: 'action.shadow-strike', kind: 'shadow-strike', bonusBp: 1500 },
      ],
    },
    cleric: {
      attackAttribute: 'lore',
      canStabilise: true,
      actions: [
        { id: 'action.mend', kind: 'mend', attribute: 'lore', difficulty: 0 },
        { id: 'action.ward', kind: 'ward', penaltyBp: 1000 },
      ],
    },
  } as const;

  it('scouts ahead in approach scenes and strikes from shadow at an engaged foe', () => {
    const roster = [adventurer('a', { might: 10 }), adventurer('r', { agility: 9 }, 'rogue')];
    const foes = [{ id: 'f', attack: 1, defence: 10, speed: 1, hits: 20 }];
    const { events } = run(game(roster, { rules: { classes }, quest: { foes } }));
    const used = ofType(events, 'action.used').map((e) => e.actionId);
    expect(used).toContain('action.scout');
    const rogueAttack = ofType(events, 'check.rolled').find(
      (e) => e.purpose === 'attack' && e.subjectIds[0] === 'r',
    );
    expect(rogueAttack?.chance.parts).toContainEqual({
      sourceId: 'action.shadow-strike',
      amount: 1500,
    });
  });

  it('guards a comrade, so the warrior takes the blow', () => {
    // The foe only aims at the front line, so every blow is meant for 'b'.
    const roster = [
      { ...adventurer('w', { agility: 20 }), position: 'back' as const },
      adventurer('b', { agility: 1 }),
    ];
    const foes = [{ id: 'f', attack: 20, defence: 20, speed: 30, hits: 20 }];
    const { events } = run(
      game(roster, {
        rules: { ...certain, classes, maxExchanges: 1 },
        quest: { scenes: [], foes },
      }),
    );
    const defence = ofType(events, 'check.rolled').filter((e) => e.purpose === 'defence');
    expect(defence.every((e) => e.subjectIds[0] === 'w')).toBe(true);
    expect(ofType(events, 'action.used').some((e) => e.actionId === 'action.guard')).toBe(true);
  });

  it('cleaves into the next group on a strong hit', () => {
    const roster = [adventurer('w', { might: 20 })];
    const foes = [
      { id: 'f1', attack: 1, defence: 1, speed: 1, hits: 10 },
      { id: 'f2', attack: 1, defence: 1, speed: 1, hits: 10 },
    ];
    const rules = { ...certain, classes, strongHitShareBp: 10_000, maxExchanges: 1 } as const;
    const { events } = run(game(roster, { rules, quest: { scenes: [], foes } }));
    expect(ofType(events, 'foe.wounded').map((e) => e.subjectIds[0])).toEqual(['f1', 'f2']);
  });

  it('wards the party against foe attacks and mends a hurt member', () => {
    const roster = [
      adventurer('a', { agility: 1 }),
      adventurer('c', { lore: 20, agility: 20 }, 'cleric'),
    ];
    const scene = {
      id: 's',
      kind: 'fixed',
      attribute: 'agility',
      difficulty: 20,
      testers: 'all',
      onFailure: 'wound',
    } as const;
    const foes = [{ id: 'f', attack: 10, defence: 1, speed: 1, hits: 1 }];
    const { events } = run(
      game(roster, { rules: { ...certain, classes }, quest: { scenes: [scene], foes } }),
    );
    expect(ofType(events, 'wound.changed')).toContainEqual(
      expect.objectContaining({ subjectIds: ['a'], from: 1, to: 0 }),
    );
    const foeAttack = ofType(events, 'check.rolled').find((e) => e.purpose === 'defence');
    if (foeAttack)
      expect(foeAttack.chance.parts).toContainEqual({ sourceId: 'action.ward', amount: -1000 });
    expect(ofType(events, 'action.used').some((e) => e.actionId === 'action.ward')).toBe(true);
  });
});

describe('the plan risk presses on, not tending or getting out (D-131)', () => {
  it('makes a foe strike back at once at an attacker who overreaches, past any guard', () => {
    const roster = [adventurer('a', { might: 1, agility: 20 }), adventurer('b', { agility: 19 })];
    const everyMissIsBad = {
      ...game([]).content.rules.risk,
      steady: { chanceBp: 0, badFailureShareBp: 10_000 },
    };
    const base = game([]).content.rules;
    const alwaysGuards = {
      ...base.classes,
      warrior: {
        attackAttribute: 'might',
        canStabilise: false,
        actions: [{ id: 'action.guard', kind: 'guard', chanceBp: 10_000 }],
      },
    } as const;
    const { events } = run(
      game(roster, {
        rules: { ...certain, maxExchanges: 1, risk: everyMissIsBad, classes: alwaysGuards },
        quest: { scenes: [], foes: [{ id: 'f', attack: 1, defence: 20, speed: 1, hits: 3 }] },
      }),
    );
    const attack = ofType(events, 'check.rolled').find(
      (e) => e.purpose === 'attack' && e.subjectIds[0] === 'a',
    );
    expect(attack?.outcome).toBe('bad-failure');
    const counter = ofType(events, 'check.rolled').find((e) => e.causeId === attack?.id);
    expect(counter).toMatchObject({ purpose: 'defence', subjectIds: ['a', 'f'] });
    expect(
      ofType(events, 'check.rolled').some((e) => e.purpose === 'guard' && e.causeId === attack?.id),
    ).toBe(false);
  });

  it('adds the risk only to the checks content names', () => {
    const roster = [adventurer('a', { might: 20, agility: 20, stealth: 14 })];
    const plan = { ...steadyPlan, risk: 'bold' } as const;
    const { events } = run(game(roster, { rules: { riskPurposes: ['scene'] } }), plan);
    const checks = ofType(events, 'check.rolled');
    const withRisk = (e: (typeof checks)[number]) =>
      e.chance.parts.some((p) => p.sourceId === 'plan.risk.bold');
    expect(checks.filter((e) => e.purpose === 'scene').length).toBeGreaterThan(0);
    expect(checks.filter((e) => e.purpose === 'scene').every(withRisk)).toBe(true);
    expect(checks.filter((e) => e.purpose === 'attack').length).toBeGreaterThan(0);
    expect(checks.some((e) => e.purpose !== 'scene' && withRisk(e))).toBe(false);
  });

  it('leaves tending, the leader and the way out untouched by a bold plan', () => {
    const roster = [
      adventurer('a', { might: 1, agility: 1 }),
      adventurer('b', { might: 1, agility: 1 }),
      adventurer('c', { lore: 14 }, 'cleric'),
    ];
    const foes = [{ id: 'f', attack: 20, defence: 20, speed: 20, hits: 9 }];
    const plan = { ...steadyPlan, risk: 'bold', retreat: 'leader' } as const;
    const purposes = new Set<string>();
    for (const seed of ['r1', 'r2', 'r3', 'r4']) {
      const { events } = run(game(roster, { seed, quest: { scenes: [], foes } }), plan);
      for (const e of ofType(events, 'check.rolled')) {
        purposes.add(e.purpose);
        const risky = e.chance.parts.some((p) => p.sourceId === 'plan.risk.bold');
        expect(risky).toBe(e.purpose === 'scene' || e.purpose === 'attack');
      }
    }
    expect([...purposes]).toEqual(expect.arrayContaining(['attack', 'stabilise', 'judgement']));
  });
});
