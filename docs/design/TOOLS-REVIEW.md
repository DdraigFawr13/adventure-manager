# Tools and skills review

Owner's request (2026-10-26, HANDOFF): look into tools, skills and connectors that improve the development process. Placed after PLAN §11 (D-090, D-091) and before §15. Rule: adopt a tool only when it is measured cheaper or equal at the same quality (DEL-07). Status: accepted 2026-10-26: items 1–3 adopted (D-092); the rest of the list accepted (D-094); audit findings applied (D-095, D-096). Owner's rule from this review: adversarial review before every PR (D-093).

What is measured below was run on this repo on 2026-10-26; everything else is labelled as judgement or estimate (REP-01).

## 1. Ripgrep (owner's question)

**Verdict: useful, already in use, nothing to install.**

- Installed: ripgrep 14.1.0. Claude Code's own search tool is built on ripgrep, so every search in these sessions already uses it.
- **Speed does not matter at this size.** Measured, 10 searches of `docs/`: GNU grep 27 ms, ripgrep 62 ms in total. Both are instant.
- **The saving is searching instead of reading.** Measured on this repo (bytes ÷ 4 ≈ tokens):
  - Reading `docs/DECISIONS.md` whole: 43,575 bytes ≈ 10,900 tokens.
  - The decision index (`grep "^## D-"`): 4,403 bytes ≈ 1,100 tokens, about 10× cheaper.
  - A topic search in DECISIONS: 1,976 bytes ≈ 500 tokens, about 22× cheaper.
- Where ripgrep's speed will matter: once there is code. It skips files in `.gitignore` (such as `node_modules` or Godot's `.godot` cache) by default, where `grep -r` would crawl tens of thousands of files.
- The habit is already a rule (CTX-01, DEL-02). No change needed.

## 2. What is already set up

From AI-Master-Instructions (synced; not hand-edited, SRC-06):

- **Agents:** `reader` (Haiku, large reads), `implementer` (Sonnet, specified coding), `test-runner` (Haiku, long check runs), `reviewer` (Sonnet, diffs and documents), `ci-fixer` (Sonnet, red CI).
- **Skill:** `efficient-github-actions` (CI budget).
- **Session-start hook:** installs the pinned Node and dependencies in cloud sessions; a project file `.claude/hooks/session-start.local.sh` can add more.
- **Workflows:** CI drift check (`ci.yml`), branch pruning after merge.
- **Permissions:** read-only git and search commands, plus future `npm` check commands, run without prompts.

## 3. Recommendations

### Adopt now (design phase, free) — adopted 2026-10-26, D-092

1. **Docs checker** (`tools/docs-check.mjs`, run before every push with the drift check). A prototype ran in 0.06 s on this repo and checks (a) every decision number cited in `docs/` exists in DECISIONS, and (b) accepted PLAN sections have no leftover "Draft", "(Proposed)" or "open question". Tested on a copy with two planted mistakes: caught both. Honest limit: of today's four lessons it would have caught one (the leftover "Draft" after a failed edit); it cannot catch a wrong number that exists (D-037 cited for D-034).
2. **Mock-up screenshot script** (`tools/mockup-shot.mjs`): the Playwright render used for every mock-up this session (desktop and phone width, fonts loaded, no sideways scroll) moved from a scratch file into the repo, so any session can run the VER-06 check in one command.
3. **`setup-audit` skill, run once:** audits this repo's Claude Code setup (permissions, hooks, agents) against current docs and proposes changes; read-only until approved. Judgement: worth one run now; low cost.

### At build start (after the engine test, D-090)

4. **Engine tooling in cloud sessions:** extend `session-start.local.sh` to install the .NET SDK and a headless Godot for the engine test; Node is already handled.
5. **Checks per stack** (decided with the engine):
   - Web: TypeScript strict, Vitest (engine tests), Playwright (screen tests and screenshots), Biome or ESLint, Ajv (content schemas), PixiJS (map and board), Electron with steamworks.js.
   - Godot: .NET with xUnit (engine tests), GdUnit4 (scene tests), GodotSteam.
   - Both: the determinism test (GAME-06), the content validator and the headless simulator (D-091).
6. **Review skills on pull requests:** `code-review` and `security-review` before merge; `simplify` for cleanups; the `reviewer` agent for large diffs.
7. **`run` skill:** launch the game and screenshot it to confirm a change works (VER-06).
8. **CI:** add the project's checks through the `efficient-github-actions` skill with path filters, so docs-only pushes stay free (CI-01..CI-06). Add the AI-Master `stacks/` layer for the chosen engine (HANDOFF).

### For art and design (§12)

9. **OpenArt connector (image and video generation): for exploration only.** Useful for mood boards and quick variations when workshopping the kingdom map (D-087) and art direction. Not for shipped art until two things are checked: the licence of generated images for commercial use (SAFE-05) and Steam's disclosure rules for AI-generated content (to verify at the time). Each use costs credits, estimated and approved first (SAFE-04).
10. **Figma connector:** worth it if an artist or UI designer joins (shared designs, hand-off specs, design tokens). Until then the HTML mock-ups do the job.
11. **tldraw connector:** optional quick sketch boards (map layouts, flow diagrams).
12. **Canva connector:** later, for store art and marketing (Steam capsule images, demo announcements).

### Not needed now

- **Supabase, Vercel:** backend and hosting; the game sends nothing (D-088). Vercel could host a devlog page later.
- **Stripe:** payments; Steam handles sales (D-040).
- **Mobbin:** mobile and web app UI references; little that transfers to a fantasy management game.
- **Claude Docs:** design docs live in the repo (SRC-01).
- **Gmail, Google Drive:** maybe later for playtest invites and feedback forms (outward-facing, SAFE-01).
- **Linear, Asana, Notion, Slack** (failed to connect this session anyway): GitHub issues and PRs are enough for one owner.
- **Datadog, BigQuery, Amplitude, Economic Index:** no telemetry (D-088); not relevant.
- **Multi-agent workflows:** expensive; consider only for large parallel jobs such as drafting the 60 key-moment templates or 6,000 text lines (D-080), with the owner's opt-in each time.

## 4. Caveman skill (owner's question)

**Verdict: not worth adopting.**

- What it is: a community skill that makes Claude answer in clipped, telegraphic English to cut output tokens.
- Claimed saving: about 75% of output tokens. Independent tests found 15–25%; its author has said 20–30% in real use.
- Why it barely moves the bill: output is about 0.6–2.5% of a typical Claude Code session's tokens; the rest is input (context re-read every turn). Estimated effect on the bill: about 1–3%.
- Cost to quality: terse prose works against WS-08 and the owner's request for clear explanations and visual examples.
- What actually cuts cost here is shorter sessions (§5, finding 1).

Sources: [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/846/claude-code-caveman-mode-token-saving), [implicator.ai](https://www.implicator.ai/caveman-claude-code-skill-cuts-output-20-your-bill-barely-notices-2/), [project docs](https://docsearch.algolia.com/mcp/docs/repo/juliusbrussee/caveman).

## 5. Setup audit (run 2026-10-26, report only)

Run with the `setup-audit` skill: scope this repo, quick depth (docs not fetched), one session measured. Report kept outside the repo (session scratch); findings summarised here.

- Clean: one SessionStart hook that exists; 19 read-only allow rules, none risky; no duplicate hooks; prompt cache hit ratio 99.3% (measured).
- **Finding 1 (cost, medium): marathon sessions.** This one session re-read 58.2 million cached tokens (measured). Cached reads cost a tenth of normal input but dominate at that size. Fix: a fresh session per merged PR or finished plan section, resuming from HANDOFF (CTX-02). No setting needed.
- **Finding 2 (security, low): no deny rules.** `.claude/settings.json` has 19 allow, 0 deny (measured). Fix: add deny rules for reading `.env` files and `secrets/`, and for force-push, via a reviewed PR (shared file).
- Parked: 84 skills listed per session (29,871 characters, about 7,500 tokens, estimated), many unrelated (data, Canva, plugin management); optional to disable at account level. No toolchain pins, lockfile or tests yet; handled at build start (items 4–5).
- First-turn context measured at 83,875 tokens.
