// Watched-quest prototype data (D-127): the sample party and the English log text.
import type { Adventurer } from '@adventure-manager/engine';
import desk from '../../data/desk.en.json' with { type: 'json' };
import party from '../../data/prototype-party.json' with { type: 'json' };
import text from '../../data/text.en.json' with { type: 'json' };

/** Display names and labels, keyed by content id. */
export const names: Readonly<Record<string, string>> = text.names;

/** Log templates: each key lists variants; `{name}` slots are filled by the ui. */
export const logTemplates: Readonly<Record<string, readonly string[]>> = text.log;

/** Interface labels for the prototype screens. */
export const uiText: Readonly<Record<string, string>> = text.ui;

export function prototypeParty(): Adventurer[] {
  // cast-ok: a fixed data file written to the Adventurer shape; content tests start a quest with it.
  return party.party.map((a) => ({ ...a, dead: false }) as Adventurer);
}

/** Interface words for the Guild Desk, the step 4 text prototype (R7, D-150). */
export const deskText: Readonly<Record<string, string>> = desk;
