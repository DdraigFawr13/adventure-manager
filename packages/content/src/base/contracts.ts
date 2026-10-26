// Contracts v0 (D-139): sites, monster kinds and twists the board composes into quests.
import type { ContractContent } from '@adventure-manager/engine';
import contracts from '../../data/contracts.json' with { type: 'json' };

// cast-ok: a fixed data file written to the ContractContent shape; content tests compose every fit.
export const baseContracts = contracts as unknown as ContractContent;
