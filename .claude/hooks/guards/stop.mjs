#!/usr/bin/env node
// Stop hook: the done-gate (gate.page, gate.handoff). Nudges once through additionalContext;
// never blocks. Fails open. Synced from AI-Master-Instructions (hook/guards).
const CHECKS = ['./checks/gates.mjs'];

try {
  const { main } = await import('./lib.mjs');
  await main('Stop', CHECKS.map((p) => new URL(p, import.meta.url).href));
} catch (err) {
  const line = String(err?.message ?? err).split('\n')[0];
  process.stdout.write(JSON.stringify({ systemMessage: `ai-master-guard error: ${line}; check skipped` }));
}
process.exitCode = 0;
