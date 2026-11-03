// Synced-file check (SRC-06): files listed in .ai-master.lock are changed in the master, not here.
import { operands } from '../parse.mjs';

const SYNC_SCRIPT = '.claude/master/sync.mjs';
const MESSAGE = (rel) => `\`${rel}\` is synced from AI-Master-Instructions: change the master, or override the rule by id in AGENTS.md`;

/** The synced path an argument names: the path itself, or one inside it when it is a folder. */
function namesSynced(rel, synced) {
  if (rel === null) return null;
  if (synced.has(rel)) return rel;
  return [...synced].find((p) => p.startsWith(`${rel}/`)) ?? null;
}

// Short options whose value follows in the same word (`-Mstrict`, `-e…`): letters after them are not flags.
const VALUE_LETTERS = { sed: 'efl', perl: 'MmIeExlC0dDV' };

/** True for -i, -i.bak, -pi or --in-place[=suffix], reading short groups only up to a value letter. */
function inPlace(c) {
  return c.args.some((a) => {
    if (/^--in-place(=|$)/.test(a)) return true;
    if (!/^-[A-Za-z0-9]/.test(a) || a.startsWith('--')) return false;
    for (const ch of a.slice(1)) {
      if (ch === 'i') return true;
      if (VALUE_LETTERS[c.name].includes(ch) || !/[A-Za-z]/.test(ch)) return false;
    }
    return false;
  });
}

/** `-t DIR` / `--target-directory=DIR` of mv or cp, or null. */
export function targetDir(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--') return null;
    if (args[i] === '-t' || args[i] === '--target-directory') return args[i + 1] ?? null;
    if (args[i].startsWith('--target-directory=')) return args[i].slice('--target-directory='.length);
    if (/^-[A-Za-z]*t.+/.test(args[i]) && !args[i].startsWith('--')) return args[i].slice(args[i].indexOf('t') + 1);
  }
  return null;
}
const MV_CP_VALUED = new Set(['-t', '--target-directory', '-S', '--suffix']);

/** The arguments a simple command writes, removes or moves. */
function written(c) {
  const ops = () => operands(c.args);
  switch (c.name) {
    case 'sed':
    case 'perl':
      return inPlace(c) ? ops() : [];
    case 'tee':
    case 'rm':
      return ops();
    case 'mv': {
      const t = targetDir(c.args);
      return t === null ? ops() : [...operands(c.args, MV_CP_VALUED), t];
    }
    case 'truncate':
      return operands(c.args, new Set(['-s', '--size', '-r', '--reference']));
    case 'cp': {
      const t = targetDir(c.args);
      return t === null ? ops().slice(-1) : [t];
    }
    default:
      return [];
  }
}

export const checks = [
  {
    id: 'synced.edit',
    rule: 'SRC-06',
    tools: ['Edit', 'Write', 'NotebookEdit', 'Bash'],
    mode: 'ask', // D-037
    test(input, facts) {
      const synced = facts.synced;
      if (!synced) return null;
      if (input.tool_name !== 'Bash') {
        const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
        const rel = typeof file === 'string' ? facts.rel(file) : null;
        return rel !== null && synced.has(rel) ? MESSAGE(rel) : null;
      }
      for (const c of facts.commands()) {
        // Sync itself rewrites synced files: exempt `node <…>/.claude/master/sync.mjs`, not other commands naming it.
        if (c.name === 'node' && operands(c.args).length && facts.rel(operands(c.args)[0], c.dir) === SYNC_SCRIPT) continue;
        for (const arg of [...c.redirects, ...written(c)]) {
          const hit = namesSynced(facts.rel(arg, c.dir), synced);
          if (hit) return MESSAGE(hit);
        }
      }
      return null;
    },
  },
];
