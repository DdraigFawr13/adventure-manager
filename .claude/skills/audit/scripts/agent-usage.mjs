#!/usr/bin/env node
// Sum API usage and list-price cost of Claude Code subagent transcripts (.jsonl). Used to measure agents before adoption (DEL-07).
//   node .claude/skills/audit/scripts/agent-usage.mjs <transcript.jsonl>...
// Prices: $/MTok input and output, claude-api skill list prices cached 2026-10-06. Cache writes are taken as 1.25x input and cache reads
// as 0.1x input (assumed). Haiku 5.5 prompts over 100k tokens cost 5x; this script does not apply that step, so check peakCtx.
import fs from 'node:fs';
const P = { haiku: [0.10, 0.50], sonnet: [2, 10], opus: [4, 20] };
for (const f of process.argv.slice(2)) {
  const seen = new Set(); const t = { in: 0, cw: 0, cr: 0, out: 0, calls: 0, model: '', maxCtx: 0 };
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue; let e; try { e = JSON.parse(line); } catch { continue; }
    const m = e.message; if (!m || !m.usage || m.role !== 'assistant') continue;
    if (m.id && seen.has(m.id)) continue; seen.add(m.id);
    const u = m.usage; t.calls++; t.model = m.model;
    t.in += u.input_tokens || 0; t.cw += u.cache_creation_input_tokens || 0; t.cr += u.cache_read_input_tokens || 0; t.out += u.output_tokens || 0;
    t.maxCtx = Math.max(t.maxCtx, (u.input_tokens||0)+(u.cache_creation_input_tokens||0)+(u.cache_read_input_tokens||0));
  }
  const k = Object.keys(P).find((x) => t.model.includes(x)) || 'opus'; const [pi, po] = P[k];
  const usd = (t.in * pi + t.cw * pi * 1.25 + t.cr * pi * 0.1 + t.out * po) / 1e6;
  console.log(`${f.split('/').pop()} model=${t.model} calls=${t.calls} in=${t.in} cacheW=${t.cw} cacheR=${t.cr} out=${t.out} peakCtx=${t.maxCtx} cost=$${usd.toFixed(4)}`);
}
