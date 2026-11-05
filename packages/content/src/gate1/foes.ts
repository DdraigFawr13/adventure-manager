// Gate 1 foes (docs/specs/gate1-one-delve.md "Barrow foes"): health, attack, defence, armour, speed,
// reach, damage, target rule, part. The mill cellar's and the chapel's foes arrive in S3.
import type { FoeKind } from '@adventure-manager/engine';

const list: readonly FoeKind[] = [
  {
    id: 'foe.hound',
    health: 10,
    attack: 12,
    defence: 9,
    armour: 0,
    speed: 14,
    reach: 'melee',
    damage: { min: 2, max: 4 },
    targetRule: 'front-most',
    partId: 'part.hound-fang',
    partRarity: 0,
    tag: 'beast',
  },
  {
    id: 'foe.barrow-archer',
    health: 8,
    attack: 12,
    defence: 8,
    armour: 0,
    speed: 11,
    reach: 'any',
    damage: { min: 2, max: 4 },
    targetRule: 'back-row-first',
    partId: 'part.grave-fletching',
    partRarity: 0,
    tag: 'undead',
  },
  {
    id: 'foe.restless-warden',
    health: 40,
    attack: 14,
    defence: 11,
    armour: 1,
    speed: 8,
    reach: 'melee',
    damage: { min: 4, max: 7 },
    targetRule: 'most-hurt',
    partId: 'part.warden-shroud',
    partRarity: 1,
    tag: 'undead',
    boss: true,
  },
];

export const gate1Foes: Readonly<Record<string, FoeKind>> = Object.fromEntries(
  list.map((f) => [f.id, f]),
);
