# Audit: <kind>, <YYYY-MM-DD>

- **Template:** audit v1
- **Kind:** <design | tests | repo | ux>
- **Commit:** <short sha>
- **Cost:** estimate $<n>; measured $<n> (agents at list price; main session not measured)

## Outcome

<"Pending" until the owner replies. Then one line per finding: "F<n> accepted", "F<n> rejected: <reason>", "F<n> fixed in <sha>" or "F<n> deliberate (<D-id>)". With no findings: "No findings.">

## Scope and method

<Areas, one per line, with the files or folders each covers. What was read and run. Findings dropped by the quote check: <n>. Assumptions.>

## Fix strongly recommended

<High findings, or "None.">

### F<n> <title>

- **Rework if left:** <high | medium | low>
- **Effort:** <S | M | L>
- **Evidence:** `<path>:<line>` "<verbatim quote>" (or `<path>` absent: searched <terms> in <paths>, or `<path>` protected)
- **Case:** <what goes wrong, and for whom>
- **Fix:** <the smallest fix>

## Other findings

<Medium and low findings, in the same block format, or "None.">

## Not checked

<One line per area or file left out, with why, or "Nothing left out of the listed areas.">

## Open items from the last audit

<Each open item from the previous report, and whether it is still open, or "No earlier audit.">
