// The S1–S2 start state (SPEC.md "Sample"): a game with the sample party as its roster and no
// guild, so the play page can open straight into a fight.
import type { Adventurer, GameState, ResolutionContent } from '../resolution/types.ts';
import type { DelveCommand } from './types.ts';

export function sampleDelveState(content: ResolutionContent, seed: string): GameState {
  if (!content.delve) throw new Error('This content has no delve pack.');
  const roster: readonly Adventurer[] = content.delve.sampleRoster;
  return {
    seed,
    rng: {},
    nextEventNo: 1,
    content,
    roster: roster.map((a) => ({ ...a, dead: false })),
    quest: null,
    calendar: 1,
    guild: null,
    delve: null,
  };
}

/** The sample start command: the sample loadouts and rows, the given site, Tactics and pack. */
export function sampleStart(
  content: ResolutionContent,
  options: {
    readonly id: string;
    readonly siteId: string;
    readonly tactics: number;
    readonly pack: Extract<DelveCommand, { type: 'delve.start' }>['pack'];
  },
): Extract<DelveCommand, { type: 'delve.start' }> {
  if (!content.delve) throw new Error('This content has no delve pack.');
  return {
    type: 'delve.start',
    id: options.id,
    day: 1,
    siteId: options.siteId,
    approach: 'assault',
    tactics: options.tactics,
    members: content.delve.sampleParty.map((m) => ({ ...m })),
    pack: options.pack,
    drillBp: 0,
  };
}
