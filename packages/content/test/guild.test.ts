import { describe, expect, it } from 'vitest';
import { simulate, type Command, type GameEvent, type GameState } from '@adventure-manager/engine';
import { baseGuildRules, baseResolution } from '@adventure-manager/content';

type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

const deepFreeze = (value: unknown): void => {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
};

describe('guild year content (guild SPEC.md)', () => {
  it('keeps every journey at least a day long, so a party always arrives before it comes home', () => {
    for (const d of baseGuildRules.dangers) expect(d.travelDays).toBeGreaterThanOrEqual(1);
  });

  it('keeps the guild party size inside the resolution rules, so a party sent out can always fight', () => {
    const { min, max } = baseResolution.rules.partySize;
    expect(baseGuildRules.partySize.min).toBeGreaterThanOrEqual(min);
    expect(baseGuildRules.partySize.max).toBeLessThanOrEqual(max);
  });

  it('has a quest template for every danger the board can post', () => {
    for (const d of baseGuildRules.dangers) {
      expect(baseResolution.quests.some((q) => q.danger === d.danger)).toBe(true);
    }
  });

  it('runs guild days on composed contracts without writing to the shared content', () => {
    // simulate shares content between states, so no engine path may write to it; frozen, a write throws.
    const content = structuredClone(baseResolution);
    deepFreeze(content);
    let state: GameState = {
      seed: 'content-frozen',
      rng: {},
      nextEventNo: 1,
      content,
      roster: [],
      quest: null,
      calendar: 1,
      guild: null,
    };
    const events: GameEvent[] = [];
    let n = 0;
    const run = (command: Bare) => {
      // cast-ok: the id the caller left out is added back, so the union member is whole.
      const result = simulate(state, { ...command, id: `c${(n += 1)}` } as Command);
      state = result.state;
      events.push(...result.events);
    };
    run({ type: 'guild.found', day: 1, size: 12 });
    while (state.calendar < 60) {
      run({ type: 'day.advance', day: state.calendar + 1 });
      const guild = state.guild!; // non-null: founded above.
      const free = guild.members.filter((m) => !m.away && m.outUntilDay <= state.calendar);
      const offer = guild.board[0];
      if (offer && free.length >= baseGuildRules.partySize.min)
        run({
          type: 'contract.take',
          day: state.calendar,
          offerId: offer.id,
          partyIds: free.slice(0, baseGuildRules.partySize.min).map((m) => m.id),
          plan: { approach: 'stealth', retreat: 'leader', risk: 'steady' },
        });
    }
    expect(state.content).toBe(content);
    const fixed = new Set(content.quests.map((q) => q.id));
    const started = events.flatMap((e) => (e.type === 'quest.started' ? [e.templateId] : []));
    expect(started.some((id) => !fixed.has(id))).toBe(true); // a composed contract ran.
  });
});
