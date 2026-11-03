# UI style

<!-- Template from the `ui-style` skill. Fill each section from the taste board picks and the project's files; keep these prompt comments. Never write a value from memory (WS-06). -->

## Target devices
<!-- Devices and widths in px, and which width is first (mock-ups and checks start there). Write the minimums as `Minimum text: <n> px` and `Minimum tap: <n> px`; `ui-mockups` reads them for its lint. Take these from the project's docs; if none say, ask Morgan. -->

## Idea
<!-- The look in two sentences, from the taste board picks. -->

## Tokens
<!-- Colours and spacing as named tokens, for light and dark. Screens use the names, never literal values. -->

## Type
<!-- Faces, sizes and number settings (tabular figures, units). Copy settings from the accepted specimen, not from memory (adventure-manager LESSONS:10). -->

## Controls
<!-- Buttons, sheets, inputs: how each looks and how it answers a tap (done, waiting, or refused and why). -->

## Layout and sizes
<!-- Columns, gutters and spacing at each target width; what moves or hides at each width. -->

## Avoid
<!-- The master Avoid list is linked below. Add this project's own items under Project, each tagged (lint) or (look) and ending with its source in brackets. -->
Master list: `../.claude/skills/ui-style/references/avoid.md` (the path from `docs/`; from another folder, make it relative to that folder).
### Project

## Pitfalls
<!-- The master Pitfalls are linked below. A LESSONS `ui` entry at count 2 becomes a Project pitfall here, ending with its source in brackets (SRC-05). -->
Master list: `../.claude/skills/ui-style/references/avoid.md`.
### Project

## Where facts live
<!-- The files that hold the names, numbers and options screens show (content files, schemas, rules), plus docs/DECISIONS.md. Mock-ups take facts only from these. -->

## New-screen checklist
<!-- Run before calling a screen done. Add project items at the end. -->
1. Colours and faces come from Tokens and Type; no literal values.
2. Fits the first target width without sideways scroll; text and taps meet the minimums.
3. Every view state screenshotted (normal, empty, alert, loading).
4. New class names grepped against the CSS.
5. Every tap answers on the same screen (done, waiting, or refused and why).
6. Buttons, alerts and empty states worded on purpose; no Avoid-list copy.
7. The built screen screenshotted at the same width beside its approved mock-up; differences listed for Morgan.
