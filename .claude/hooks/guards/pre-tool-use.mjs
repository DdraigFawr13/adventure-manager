#!/usr/bin/env node
// PreToolUse hook: one process runs every tool check. Ask checks ask Morgan (D-037), the rest
// warn; a check marked deny would deny. Fails open. Synced from AI-Master-Instructions (hook/guards).
try {
  const { main } = await import('./lib.mjs');
  const { PRE_TOOL_USE, urls } = await import('./modules.mjs');
  await main('PreToolUse', urls(PRE_TOOL_USE));
} catch (err) {
  const line = String(err?.message ?? err).split('\n')[0];
  process.stdout.write(JSON.stringify({ systemMessage: `ai-master-guard error: ${line}; check skipped` }));
}
process.exitCode = 0;
