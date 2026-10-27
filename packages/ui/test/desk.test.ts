import { afterEach, describe, expect, it } from 'vitest';
import { continueToStop, load, newDesk, send, store, type Desk } from '../src/desk/session.ts';
import { digestOf, recordOf, stopsOf } from '../src/desk/view.ts';

// A small in-memory localStorage for the save tests.
const memory = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
  },
});
afterEach(() => memory.clear());

/** Plays a few stops, sending the first four ready members to the first offer each time. */
function played(stops: number): Desk {
  let desk = newDesk('desk-test', '2026-10-27');
  for (let n = 0; n < stops; n += 1) {
    const guild = desk.state.guild!; // non-null: founded.
    const ready = guild.members.filter((m) => !m.away && m.outUntilDay <= desk.state.calendar);
    if (guild.board[0] && ready.length >= 4)
      desk = send(desk, {
        type: 'contract.take',
        day: desk.state.calendar,
        offerId: guild.board[0].id,
        partyIds: ready.slice(0, 4).map((m) => m.id),
        plan: { approach: 'assault', risk: 'steady', retreat: 'leader' },
      });
    desk = continueToStop(desk);
  }
  return desk;
}

describe('Guild Desk session (D-150)', () => {
  it('stops at each stop day and keeps every decision as a command', () => {
    const desk = played(6);
    expect(stopsOf(desk.events, desk.todayFrom).length).toBeGreaterThan(0);
    expect(desk.save.commands[0]?.type).toBe('guild.found');
    expect(desk.save.commands.some((c) => c.type === 'contract.take')).toBe(true);
  });

  it('replays a saved guild exactly after a reload', () => {
    const desk = played(8);
    store(desk);
    const { desk: back, kept } = load();
    expect(kept).toBe(false);
    expect(back?.state).toEqual(desk.state);
    expect(back?.events).toEqual(desk.events);
  });

  it('keeps a save from another build aside instead of overwriting it', () => {
    memory.set('guild-desk.save', JSON.stringify({ version: 0, seed: 'old', commands: [] }));
    const { desk, kept } = load();
    expect([desk, kept]).toEqual([null, true]);
    expect(memory.get('guild-desk.save.kept')).toContain('"old"');
  });

  it('leaves the desk as it was when a command is refused', () => {
    const desk = played(1);
    expect(() =>
      send(desk, { type: 'recruit.sign', day: desk.state.calendar, prospectId: 'nobody' }),
    ).toThrow();
    expect(desk.save.commands.at(-1)?.type).toBe('day.advance');
  });
});

describe('Guild Desk view', () => {
  it('sums up the founding in one line and writes a letter home for every contract', () => {
    const start = newDesk('desk-test', '2026-10-27');
    expect(digestOf(start.state, start.events, 0)[0]).toMatch(/15 people signed on/);
    const desk = played(20);
    const record = recordOf(desk.state, desk.events);
    const quests = desk.events.filter((e) => e.type === 'quest.ended').length;
    const deaths = desk.state.roster.filter((a) => a.dead).length;
    expect(record.letters.length).toBe(quests + deaths);
    // Newest first.
    const days = record.letters.map((l) => l.day);
    expect([...days].sort((a, b) => b - a)).toEqual(days);
  });
});
