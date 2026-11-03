# Design or spec audit

Covers a design, spec or plan document and the decisions behind it, not the code built from it.
Use it before building a spec or plan, or at the end of a design phase.

Sources in brackets: rule ids are the shared rules; "Pantheon pre-M0" and "Pantheon repo audit" are Pantheon's `docs/audit/2026-10-30-pre-m0.md` and `docs/audit/2026-10-30-repo-audit.md`.

1. List the design's stated goals and principles, then flag each part of the design that contradicts one. Quote both sides. [Pantheon pre-M0 item 1]
2. For each piece of state the design says a part owns, find the interface, schema or message that carries it. Flag state that no interface carries. [Pantheon pre-M0 items 4, 5]
3. Flag each fact stated in two places, such as a value in the spec and again in a doc or agent, and name the one home it should keep. [SRC-01; Pantheon repo audit section B]
4. Flag each design choice that has no DECISIONS entry, and each entry still marked Proposed that the design treats as settled. [SRC-04]
5. List gaps in canon or domain facts as gaps, with the question to ask. Never fill one with an invented mechanism or fact. Use the absent form with the search you ran (REP-03). [WS-06]
