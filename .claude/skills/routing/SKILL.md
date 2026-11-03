---
name: routing
description: Decide whether to do a job in the main session or hand it to a subagent, and which agent to pick, using measured costs. Use when DEL-08 leaves you unsure, before briefing a reader, implementer, reviewer, test-runner or ci-fixer on a job you could do yourself, or when asked what delegating costs. Not for choosing the main session's own model or effort.
---

# Routing

DEL-08 is the rule: work in the main session by default. Delegate independent work only when it needs restricted tools, is larger than one context, or is a long read or run whose output you won't keep. Keep dependent chains and small tasks in the main session. This skill holds the evidence behind it and the costs per agent kind.

## When to read this

- You are about to brief a subagent for a job you could do yourself.
- A job is big and you can't tell if it fits in one context.
- Someone asks what delegating costs.

## How to decide

1. Is the job independent of what you are doing? If each step needs the last one's result, keep it.
2. Is it small (one file, one fix, one short answer)? Keep it. A subagent's start and your review cost more than the work.
3. Does it need tools the main session must not have, or more context than one session holds? Delegate.
4. Is it a long read or run (many files, long logs, a long check run) whose detail you won't keep? Delegate to the agent whose description matches; `reader` for facts, `test-runner` for checks, `ci-fixer` for red CI. "Long" means longer than the pilot's reads: a 9-file and a 15-file read both cost less inline.
5. Otherwise keep it. On the pilot, tasks this size cost less inline.

When you delegate, write a DEL-04 brief and review the result (DEL-05). When you start a headless run (`claude -p` from a script), set `AI_MASTER_HEADLESS=1` in its environment so the page gate doesn't nudge a reply no one reads on a phone.

## Measured costs

All costs are at list price, from the tool's reported cost (REP-01). A delegated run's cost is the whole run: the main session's brief and review plus the subagent.

| Kind | Measured | Source |
| --- | --- | --- |
| inline (main session alone, Opus) | median $0.07-0.74 per task, 7-162 s, on 6 pilot tasks | [routing pilot](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/9f3387e/decisions/benchmarks/evals/2026-11-02-routing-pilot.md) |
| `reader` (Haiku) | the reader alone: $0.0024-0.0058 per run, peak context 15.7-29.0k tokens, start ~15.7k | [reader cold start](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/9f3387e/decisions/benchmarks/2026-11-02-reader-cold-start.md) |
| `reader`, delegated | whole run $0.21 vs $0.17 inline (cite sources); $0.15 vs $0.10 (trace) | [routing pilot](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/9f3387e/decisions/benchmarks/evals/2026-11-02-routing-pilot.md) |
| `implementer` (Sonnet), delegated | whole run $0.16 vs $0.07 inline (one-line fix); $0.29 vs $0.31 (pins in 4 files); $0.65 vs $0.74 (guard fix, a dependent chain) | [routing pilot](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/9f3387e/decisions/benchmarks/evals/2026-11-02-routing-pilot.md) |
| `implementer` (Sonnet), larger builds | 110-280k tokens per builder | step 4 usage reports, [HANDOFF at 9f3387e](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/9f3387e/HANDOFF.md) |
| `reviewer` (Sonnet), delegated | whole run $0.76 vs $0.65 inline (guard review) | [routing pilot](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/9f3387e/decisions/benchmarks/evals/2026-11-02-routing-pilot.md) |
| `reviewer` (Sonnet), diff reviews | 133-145k tokens per review | step 4 usage reports, [HANDOFF at 9f3387e](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/9f3387e/HANDOFF.md) |
| fork | $0.40 vs $0.17 inline (cite sources) | [routing pilot](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/9f3387e/decisions/benchmarks/evals/2026-11-02-routing-pilot.md) |
| `test-runner` (Haiku) | not measured yet | |
| `ci-fixer` (Sonnet) | not measured yet | |

Every pilot arm passed every task 3 of 3, so these compare cost at equal quality. Every pilot task's median inline run was under $0.80 and 3 minutes; larger jobs are not measured yet.

## The graded table

The table below was fixed before the pilot and graded as written ([grade](https://github.com/DdraigFawr13/AI-Master-Instructions/blob/main/decisions/benchmarks/evals/2026-11-02-routing-pilot-notes.md), D-033). Don't route by it: it **failed**. Its route matched the label on 1 of 6 tasks, and routing by it cost $2.21 against $2.03 all-inline (109%; the bar was 80%). No task was lost. It is kept unchanged as the record of what was tested; `scripts/eval/routing-grade.mjs` grades it.

## Decision table

| shape | route | why |
| --- | --- | --- |
| `dependent-chain` | inline | each step needs the last one's result; the cost guide found the orchestrator alone ahead |
| `small` | inline | a subagent's cold start costs more than the work |
| `restricted-tools` | delegated | a narrower tool set is the point |
| `over-context` | delegated | it doesn't fit in one context |
| `verbose-read` | delegated | the reading would fill the main context |
| `long-tail` | delegated | rare, slow runs shouldn't hold the main session |
| `mechanical-multi-file` | delegated | spec'd edits a cheaper model does well |
| `review-large` | delegated | a fresh reviewer, outside the main context |
