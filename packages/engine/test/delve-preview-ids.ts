// Every action id the delve content names, plus the pack and swap actions.
import { PACK_ACTION, SWAP_ACTION, type GameState } from '../src/index.ts';

export function allActionIds(state: GameState): string[] {
  return [
    ...Object.keys(state.content.delve?.actions ?? {}),
    PACK_ACTION,
    SWAP_ACTION,
    'action.foe-strike',
  ];
}
