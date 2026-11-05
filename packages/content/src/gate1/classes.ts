// Gate 1 classes and their actions (D-219, D-226; docs/specs/gate1-one-delve.md "Starting numbers").
// Starting numbers, tuned only by the balance runner (D-229).
import type { DelveAction, DelveClass } from '@adventure-manager/engine';

export const gate1Classes: Readonly<Record<string, DelveClass>> = {
  'class.warrior': {
    health: 24,
    attackAttribute: 'might',
    plain: 'action.strike',
    skills: ['action.guard', 'action.cleave'],
  },
  'class.rogue': {
    health: 18,
    attackAttribute: 'agility',
    plain: 'action.throw-knife',
    skills: ['action.shadow-strike', 'action.hamstring'],
  },
  'class.cleric': {
    health: 18,
    attackAttribute: 'lore',
    plain: 'action.mace',
    skills: ['action.mend', 'action.ward'],
  },
  'class.wizard': {
    health: 14,
    attackAttribute: 'lore',
    plain: 'action.spark',
    skills: ['action.firebolt', 'action.haste'],
  },
};

const list: readonly DelveAction[] = [
  {
    id: 'action.strike',
    kind: 'strike',
    reach: 'melee',
    damage: { min: 3, max: 6 },
    knockback: true,
  },
  { id: 'action.guard', kind: 'guard' },
  { id: 'action.cleave', kind: 'cleave', damage: { min: 3, max: 5 } },
  { id: 'action.throw-knife', kind: 'strike', reach: 'any', damage: { min: 2, max: 4 } },
  {
    id: 'action.shadow-strike',
    kind: 'strike',
    reach: 'melee',
    damage: { min: 3, max: 6 },
    doubleIfHit: true,
  },
  {
    id: 'action.hamstring',
    kind: 'strike',
    reach: 'melee',
    damage: { min: 2, max: 4 },
    toLast: true,
  },
  {
    id: 'action.mace',
    kind: 'strike',
    reach: 'melee',
    damage: { min: 2, max: 4 },
    healMostHurt: 1,
  },
  { id: 'action.mend', kind: 'heal', amount: 6, raiseTo: 4 },
  { id: 'action.ward', kind: 'ward' },
  { id: 'action.spark', kind: 'strike', reach: 'any', damage: { min: 1, max: 3 }, mark: true },
  { id: 'action.firebolt', kind: 'strike', reach: 'any', damage: { min: 6, max: 10 } },
  { id: 'action.haste', kind: 'haste' },
];

export const gate1Actions: Readonly<Record<string, DelveAction>> = Object.fromEntries(
  list.map((a) => [a.id, a]),
);
