import { describe, expect, it } from 'vitest';
import { isFree } from '@adventure-manager/engine';
import {
  LAST_DAY,
  act,
  blocking,
  canPull,
  fromStored,
  guildOf,
  newGame,
  pull,
  rules,
  toStored,
  type Save,
} from '../src/step4/game.ts';
import { buildReport } from '../src/step4/report.ts';

/** A plain player: answers letters the free way, takes grants, signs while beds allow, sends the first standing party with a bold plan. */
function playTurn(save: Save): void {
  const guild = guildOf(save);
  const day = save.state.calendar;
  for (const l of blocking(save)) {
    if (l.kind === 'incident' && guild.house?.letter)
      act(save, { type: 'incident.answer', day, answer: 'free' }, 'incident-free');
    if (l.kind === 'patron-offer' && guild.career?.emergencyOffer)
      act(save, { type: 'patron.grant', day }, 'grant');
    l.read = true;
  }
  const party = guild.standing[0];
  if (!party) return;
  const free = party.memberIds.filter((id) => {
    const m = guild.members.find((x) => x.id === id);
    return m && isFree(m, day);
  });
  const offer = guild.board[0];
  if (offer && free.length >= rules.partySize.min)
    act(
      save,
      {
        type: 'contract.take',
        day,
        offerId: offer.id,
        partyIds: free,
        plan: { approach: 'assault', risk: 'bold', retreat: 'never' },
        standingId: party.id,
      },
      'took',
    );
}

function founded(seed: string): Save {
  const save = newGame(seed);
  const extras = guildOf(save)
    .draft!.extras.slice(0, 2)
    .map((p) => p.adventurer.id); // non-null: the draft stands.
  act(save, { type: 'guild.pick', day: 1, partyIndex: 1, extraIds: extras }, 'founded');
  return save;
}

function playTo(save: Save, lastDay: number): void {
  while (save.state.calendar < lastDay && !guildOf(save).career?.ended) {
    playTurn(save);
    if (!canPull(save)) break;
    pull(save);
  }
}

describe('step 4 page game (D-195–D-199)', () => {
  it('plays two years: letters home on return, memorials, a full chronicle and a report', () => {
    const save = founded('page-a');
    expect(guildOf(save).draft).toBeUndefined();
    expect(Object.keys(save.draftFees)).toHaveLength(21);
    playTo(save, LAST_DAY);
    expect(save.state.calendar === LAST_DAY || guildOf(save).career?.ended).toBeTruthy();
    const home = save.letters.filter((l) => l.kind === 'home');
    expect(home.length).toBeGreaterThan(10);
    for (const l of home) expect(l.lines.join(' ')).not.toMatch(/[{}]/);
    const deaths = save.state.roster.filter((a) => a.dead);
    expect(save.letters.filter((l) => l.kind === 'memorial')).toHaveLength(deaths.length);
    expect(deaths.length).toBeGreaterThan(0);
    // The default player built something (D-195: the house runs on defaults).
    expect(save.planStep).toBeGreaterThan(0);
    save.sittings.push({
      no: 1,
      day: save.state.calendar,
      minutes: 20,
      answers: ['Kit, the mill'],
      skipped: false,
    });
    const report = buildReport(save);
    expect(report).toContain('Kit, the mill');
    for (const a of save.state.roster.filter((x) => x.name))
      expect(report).toContain(`${a.name!.given} ${a.name!.family}`); // non-null: filtered.
    expect(report).not.toMatch(/[{}]/);
  });

  it('continues a stored save exactly as the game in memory (GAME-05, GAME-06)', () => {
    const live = founded('page-b');
    playTo(live, 120);
    const stored = toStored(live);
    const loaded = fromStored(stored)!; // non-null: just stored.
    expect(toStored(loaded)).toBe(stored);
    playTo(live, 260);
    playTo(loaded, 260);
    expect(toStored(loaded)).toBe(toStored(live));
    expect(fromStored('{"version":0}')).toBeNull();
    expect(fromStored('not json')).toBeNull();
  });
});
