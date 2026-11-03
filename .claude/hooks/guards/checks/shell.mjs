// Shell checks. Each check: { id, rule, tools, mode?, test(input, facts) → message | null }.
import { parse } from '../parse.mjs';

/** True for -f, --full, or a short-flag group containing f (-fx). */
const fullMatch = (args) => args.some((a) => a === '--full' || /^-[A-Za-z0-9]*f[A-Za-z0-9]*$/.test(a));

export const checks = [
  {
    id: 'shell.pkill',
    rule: 'lesson adventure-manager :12',
    tools: ['Bash'],
    // Denied, not warned: a warning arrives after the command, and by then the shell is dead (D-023).
    mode: 'ask', // D-037
    test(input) {
      const command = input.tool_input?.command;
      if (typeof command !== 'string') return null;
      const hit = parse(command).some((c) => c.name === 'pkill' && fullMatch(c.args));
      return hit ? 'stop runs by PID from `ps -eo pid,args`' : null;
    },
  },
];
