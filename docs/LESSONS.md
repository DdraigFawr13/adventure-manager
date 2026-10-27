# Lessons

One line per mistake. Read the entries for an area before working in it. When a mistake repeats, bump its count; at ×2 it also becomes a rule (in DECISIONS, AGENTS.md, or proposed to AI-Master-Instructions). Mark retired entries SUPERSEDED; never delete them.

Format: `- <area> · <mistake> · <root cause> · <rule> · ×<n> (<YYYY-MM-DD>)`

- docs · cited decision ids from memory (D-037 for careers, D-034 for party leaders) · recalled numbers instead of checking the index · grep `^## D-` for the title before citing an id · ×1 (2026-10-26)
- design · told the owner merges would cut 15 systems to 12 (true figure 13) · counted a reshuffle (scouting + knowledge) as a merge · count the resulting list before stating a number · ×1 (2026-10-26)
- git · committed after an edit script failed · chained the edit and the commit with ';' so the commit ran anyway · chain edit, check and commit with '&&', and grep the result before committing · ×2 (2026-10-27: a failing docs check, then commit and push after ';'; now an AGENTS.md rule)
- mock-ups · showed the old-press ledger with old-style proportional figures and drew a conclusion from it · set only `tabular-nums`, which this face ignores; the earlier specimen used `lining-nums` · copy number settings from the accepted specimen and measure glyph widths before comparing faces · ×1 (2026-10-26)
- git · opened PR #11 with its second commit reviewed only by the main session · treated the earlier review of commit 1 as covering the branch, and opened the PR as the session default says · review the whole branch diff after the last commit, then ask the owner before any PR (D-133) · ×1 (2026-10-26)
- shell · `pkill -f <pattern>` killed the session's own shell three times while stopping simulator runs · the pattern also matched the bash command line that ran pkill · stop background runs by PID from `ps -eo pid,args`, never `pkill -f` (now an AGENTS.md rule) · ×3 (2026-10-27)
- tools · a baseline run in a git worktree that symlinked the main tree's `node_modules` would have loaded the main tree's new engine code · workspace packages resolve through `node_modules/@adventure-manager` to the main checkout · give the worktree its own `node_modules/@adventure-manager` links to its own packages, and check an export that only the new code has · ×1 (2026-10-27)
