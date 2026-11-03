// The PreToolUse check modules, as paths relative to this file. pre-tool-use.mjs runs them;
// Synced from AI-Master-Instructions (hook/guards); edit it there.
export const PRE_TOOL_USE = ['./checks/shell.mjs', './checks/secrets.mjs', './checks/git.mjs', './checks/synced.mjs', './checks/tests.mjs'];

export const urls = (list) => list.map((p) => new URL(p, import.meta.url).href);
