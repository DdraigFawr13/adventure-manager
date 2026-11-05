// Gate 1 pack items (D-219, D-222): a draught heals or raises an ally, a firebomb hits a foe's row.
import type { PackKind, PackKindId } from '@adventure-manager/engine';

export const gate1Pack: Readonly<Record<PackKindId, PackKind>> = {
  'item.draught': { kind: 'heal', amount: 8, raiseTo: 6 },
  'item.firebomb': { kind: 'bomb', damage: { min: 3, max: 5 } },
};
