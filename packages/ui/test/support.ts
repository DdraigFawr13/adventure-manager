import { describeChance, narrate } from '../src/narrate.ts';
import { choose, newSession, startQuest, step } from '../src/game.ts';
import type { RetreatThreshold } from '@adventure-manager/engine';

export const RETREATS_FOR_TEST: readonly RetreatThreshold[] = ['leader', 'down', 'never'];

/** Plays one watched quest (pushing on at every moment) and returns every log line and breakdown. */
export function narrateAll(templateId: string, retreat: RetreatThreshold, seed: string): string[] {
  let session = startQuest(newSession(seed), templateId, {
    approach: 'assault',
    risk: 'bold',
    retreat,
  });
  while (session.state.quest) {
    session = session.state.quest.momentPending ? choose(session, 'push-on') : step(session);
  }
  const out: string[] = [];
  for (const event of session.events) {
    const line = narrate(event);
    if (!line) continue;
    out.push(line.text);
    if (line.chance) out.push(describeChance(line.chance, line.purpose ?? ''));
  }
  return out;
}
