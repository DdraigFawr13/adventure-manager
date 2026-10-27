import { describe, expect, it } from 'vitest';
import type { FoundingRules, GuildRules, Plan, StandingRules } from '../src/index.ts';
import { checkGuildInvariants } from '../src/index.ts';
import { ofType, steadyPlan } from './fixture.ts';
import { advanceTo, foundedGuild, play, take, testCareer, type Run } from './guild-fixture.ts';

const boldPlan: Plan = { approach: 'assault', risk: 'bold', retreat: 'never' };
const standing: StandingRules = {
  names: ['party.reed', 'party.lantern', 'party.heron'],
  defaultPlan: steadyPlan,
};
const founding: FoundingRules = {
  purseCopper: 50_000,
  partySize: 3,
  characters: [
    {
      id: 'balanced',
      attributeShift: 0,
      age: { min: 25, max: 25 },
      potentialBonus: 0,
      feeBp: 10_000,
    },
  ],
  extras: { offered: 3, min: 2, max: 2 },
  feeWeeks: 1,
};

function picked(rules: Partial<GuildRules> = {}): Run {
  const run = foundedGuild(0, { founding, standing, ...rules }, 'standing-seed');
  const extras = run.state.guild!.draft!.extras.slice(0, 2).map((p) => p.adventurer.id); // non-null: the draft is pending.
  return play(run, { type: 'guild.pick', day: 1, partyIndex: 0, extraIds: extras });
}
const guildOf = (run: Run) => run.state.guild!; // non-null: founded.
const ids = (run: Run) => guildOf(run).members.map((m) => m.id);
const invariants = (run: Run) => checkGuildInvariants(run.state, run.events, run.commandIds);

describe('standing parties (guild SPEC.md, D-014)', () => {
  it('forms the picked starter party at the founding, with the default plan; extras wait', () => {
    const run = picked();
    const [party, ...rest] = guildOf(run).standing;
    expect(rest).toEqual([]);
    expect(party).toMatchObject({ id: 'sp.1', plan: steadyPlan, memberIds: ids(run).slice(0, 3) });
    expect(standing.names).toContain(party!.nameId);
    expect(ofType(run.events, 'party.formed')).toHaveLength(1);
    expect(ofType(run.events, 'party.assigned').map((e) => e.to)).toEqual(['sp.1', 'sp.1', 'sp.1']);
    expect(invariants(run)).toEqual([]);
  });

  it('forms, moves and plans; a party left empty is disbanded; names are never shared', () => {
    let run = picked();
    const [a, b, c, d, e] = ids(run);
    run = play(run, { type: 'party.form', day: 1, memberIds: [d!, e!], plan: boldPlan });
    const second = guildOf(run).standing[1]!; // non-null: just formed.
    expect(second.nameId).not.toBe(guildOf(run).standing[0]!.nameId);
    expect(second.plan).toEqual(boldPlan);
    run = play(run, { type: 'party.assign', day: 1, memberId: a!, standingId: second.id });
    expect(guildOf(run).standing.map((p) => p.memberIds)).toEqual([
      [b, c],
      [d, e, a],
    ]);
    run = play(run, { type: 'party.form', day: 1, memberIds: [b!, c!], plan: steadyPlan });
    expect(guildOf(run).standing.map((p) => p.id)).toEqual(['sp.2', 'sp.3']);
    expect(ofType(run.events, 'party.disbanded').map((x) => x.subjectIds)).toEqual([['sp.1']]);
    run = play(run, { type: 'party.assign', day: 1, memberId: d!, standingId: null });
    run = play(run, { type: 'party.plan', day: 1, standingId: 'sp.3', plan: boldPlan });
    expect(guildOf(run).standing[1]!.plan).toEqual(boldPlan);
    expect(ofType(run.events, 'party.planned')).toHaveLength(1);
    expect(invariants(run)).toEqual([]);
  });

  it('refuses what a standing party cannot be', () => {
    const run = picked();
    const [a, , , d] = ids(run);
    const refuse = (command: Parameters<typeof play>[1]) =>
      expect(() => play(run, command)).toThrow();
    refuse({ type: 'party.assign', day: 1, memberId: d!, standingId: 'sp.9' });
    refuse({ type: 'party.assign', day: 1, memberId: 'adv.99', standingId: 'sp.1' });
    refuse({ type: 'party.assign', day: 1, memberId: d!, standingId: 'sp.1' }); // the maximum is 3
    refuse({ type: 'party.form', day: 1, memberIds: [], plan: steadyPlan });
    refuse({ type: 'party.form', day: 1, memberIds: [a!, a!], plan: steadyPlan });
    refuse({ type: 'party.plan', day: 2, standingId: 'sp.1', plan: steadyPlan });
    expect(() =>
      play(foundedGuild(2), { type: 'party.form', day: 1, memberIds: ['adv.1'], plan: steadyPlan }),
    ).toThrow(/no standing parties/);
  });

  it('sends a standing party with a swap for one contract only', () => {
    let run = advanceTo(picked(), 8);
    const [a, b, , d] = ids(run);
    run = play(run, {
      type: 'contract.take',
      day: 8,
      offerId: guildOf(run).board[0]!.id,
      partyIds: [a!, b!, d!],
      plan: boldPlan,
      standingId: 'sp.1',
    });
    const [departed] = ofType(run.events, 'party.departed');
    expect(departed!.standingId).toBe('sp.1');
    expect(guildOf(run).parties[0]!.standingId).toBe('sp.1');
    expect(guildOf(run).standing[0]).toMatchObject({
      plan: steadyPlan,
      memberIds: ids(run).slice(0, 3),
    });
    expect(() => take(run, [ids(run)[2]!, ids(run)[4]!], undefined, steadyPlan)).not.toThrow();
    expect(() =>
      play(run, {
        type: 'contract.take',
        day: 8,
        offerId: guildOf(run).board[0]!.id,
        partyIds: [ids(run)[2]!, ids(run)[4]!],
        plan: steadyPlan,
        standingId: 'sp.7',
      }),
    ).toThrow(/no standing party/);
  });

  it('a member who retires leaves the standing party, and the empty party is disbanded', () => {
    const career = {
      ...testCareer,
      drawAge: { min: 40, max: 40 },
      retireStepBp: 10_000,
      retireMaxBp: 10_000,
    };
    const old = { ...founding.characters[0]!, age: { min: 40, max: 40 } };
    let run = picked({ career, founding: { ...founding, characters: [old] } });
    run = advanceTo(run, 48 * 7 + 1);
    expect(guildOf(run).standing).toEqual([]);
    const retired = ofType(run.events, 'adventurer.retired').map((e) => e.id);
    const [disbanded] = ofType(run.events, 'party.disbanded');
    expect(retired).toContain(disbanded!.causeId);
    expect(invariants(run)).toEqual([]);
  });
});

describe('backgrounds (guild SPEC.md, D-196)', () => {
  const backgrounds = { homes: ['home.a', 'home.b'], trades: ['trade.x', 'trade.y', 'trade.z'] };

  it('gives each drawn person a home and a trade without moving any other draw', () => {
    const plain = foundedGuild(4);
    const drawn = foundedGuild(4, { backgrounds });
    for (const [n, who] of drawn.state.roster.entries()) {
      expect(backgrounds.homes).toContain(who.background!.home);
      expect(backgrounds.trades).toContain(who.background!.trade);
      const { background: _, ...rest } = who;
      expect(rest).toEqual(plain.state.roster[n]);
    }
    expect(plain.state.roster.every((a) => a.background === undefined)).toBe(true);
  });
});
