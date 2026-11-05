// Words for the play page, all from content (packages/content/data/gate1.en.json).
import type { FightView, GameEvent } from '@adventure-manager/engine';
import { gate1Text } from '@adventure-manager/content';

const lookup = (table: Readonly<Record<string, string>>, key: string): string => table[key] ?? key;

export function t(key: string, slots: Readonly<Record<string, string | number>> = {}): string {
  let text = lookup(gate1Text.ui, key);
  for (const [slot, value] of Object.entries(slots))
    text = text.replaceAll(`{${slot}}`, String(value));
  return text;
}

export const nameOf = (id: string): string => lookup(gate1Text.names, id);
export const actionName = (id: string): string => lookup(gate1Text.actions, id);
export const intentVerb = (kindId: string): string => lookup(gate1Text.intents, kindId);

/** A fighter's short label: an adventurer's first name, a foe's kind with its number among its kind. */
export function labelOf(view: FightView, id: string): string {
  const shortNames: Readonly<Record<string, string>> = gate1Text.short;
  if (shortNames[id]) return shortNames[id];
  const f = view.fighters.find((x) => x.id === id);
  if (!f) return id;
  const same = view.fighters.filter((x) => x.side === 'foe' && x.kindId === f.kindId);
  const kind = nameOf(f.kindId);
  return same.length > 1 ? `${kind} ${same.indexOf(f) + 1}` : kind;
}

function line(key: string, slots: Readonly<Record<string, string | number>>): string {
  let text = lookup(gate1Text.log, key);
  for (const [slot, value] of Object.entries(slots))
    text = text.replaceAll(`{${slot}}`, String(value));
  return text;
}

/** One short line per event that the player should see, oldest first. */
export function logLines(view: FightView, events: readonly GameEvent[]): string[] {
  const label = (id: string | null | undefined): string => (id ? labelOf(view, id) : '');
  const out: string[] = [];
  for (const e of events) {
    const actor = label(e.subjectIds[0]);
    switch (e.type) {
      case 'fight.acted': {
        const target = label(e.targetId);
        if (e.actionId.startsWith('item.'))
          out.push(line('item', { actor, item: nameOf(e.actionId) }));
        else if (e.actionId === 'action.swap-row') continue;
        else if (e.roll === null) {
          if (e.actionId === 'action.guard') out.push(line('guard', { actor, target }));
          else if (e.actionId === 'action.ward') out.push(line('ward', { actor }));
          else if (e.actionId === 'action.haste') out.push(line('haste', { actor, target }));
        } else if (e.damage > 0) out.push(line('hit', { actor, target, damage: e.damage }));
        else out.push(line('miss', { actor, target }));
        break;
      }
      case 'fighter.raised':
        out.push(line('raise', { target: actor }));
        break;
      case 'rows.set':
        out.push(line('swap', { actor, row: t(`row.word.${e.row}`) }));
        break;
      case 'fighter.down':
        out.push(line('down', { target: actor }));
        break;
      case 'fighter.dying':
        out.push(line('dying', { target: actor }));
        break;
      case 'fighter.died':
        out.push(line('died', { target: actor }));
        break;
      case 'band.fled':
        out.push(line('fled', {}));
        break;
    }
  }
  return out;
}

/** An adventurer's first name. */
export const memberLabel = (id: string): string => {
  const shortNames: Readonly<Record<string, string>> = gate1Text.short;
  return shortNames[id] ?? nameOf(id);
};

/** A room's name and line from the barrow's words (empty when a room has none). */
export function roomWords(roomId: string): { name: string; line: string } {
  const rooms: Readonly<Record<string, { name?: string; line?: string }>> = gate1Text.rooms;
  return { name: rooms[roomId]?.name ?? roomId, line: rooms[roomId]?.line ?? '' };
}

/** The words for a choice room's way: the entry's first way takes the approach's words. */
export function wayWords(roomId: string, optionIndex: number, approach: string): string {
  const rooms: Readonly<
    Record<
      string,
      {
        name?: string;
        options?: readonly string[];
        approach?: Readonly<Record<string, string>>;
      }
    >
  > = gate1Text.rooms;
  const room = rooms[roomId];
  return room?.options?.[optionIndex] || room?.approach?.[approach] || roomId;
}
