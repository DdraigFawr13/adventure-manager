# <Feature or project name>

- **Status:** Draft | Approved <YYYY-MM-DD> | Shipped <YYYY-MM-DD>
- **Planned in:** <form page links or chat date>. **Decisions:** <DECISIONS ids>.

<!-- Copy to docs/specs/<slug>.md. Delete these comments and any section that would only say "none".
     Once shipped this file is a snapshot: lasting facts live in DECISIONS and LESSONS, not here. -->

## Problem

<In Morgan's own words, from the open questions: who has the problem, how it is handled today, and why that fails.>

## Goals

- <An outcome and how we'll know it happened, with numbers and units where they decide it.>

## Non-goals

- <What this deliberately doesn't do, so no builder adds it.>

## Journeys and checks

<!-- Each check must be observable, and it must fail at the commit the build starts from. A check that already passes tests nothing. -->

### J1 <Journey title>

- **Given** <starting state>
- **When** <action or event>
- **Then** <observable result>. **Check:** <test name, command or screenshot that shows it>

## Decisions

- <Decision, one line> (D-<id>). The reason lives in DECISIONS.

## Alternatives rejected

- **<Option>**: rejected because <specific reason>. It would fail when <condition>.

## Risks

- <Risk> → <mitigation, or the decision that removes it>.

## Design

<!-- What a builder needs and no more: parts, data, interfaces and how data flows between them. Name existing code to reuse.
     Schemas and signatures are fine; implementation code is not. Label anything unchecked as an assumption. -->

## Slices

<!-- Each slice is a thin path through every layer that fits one fresh session, leaves the project working,
     and gives Morgan something to try. A builder must not have to make a design choice. -->

### S1 <Slice title>

- **Morgan tries:** <what to open, tap or run when it lands>
- **Checks that fail now:** <J1 check, new test names>
- **Files:** <path>: <what changes and why>. One line each.
- **Waits on:** none

## Verification

- Every push: `<local checks command>`
- End to end: `<command>`, or <device check and who runs it>

## Open questions

- <Question>. Move the answer to Decisions when settled.
