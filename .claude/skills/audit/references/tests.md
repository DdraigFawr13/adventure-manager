# Test suite audit

Covers a project's automated tests: what they prove, how long they take, and whether they can fail.
Use it at the end of a phase, when the suite is slow or flaky, or when asked to review the whole test suite.

Sources in brackets: rule ids are the shared rules; "terra audit" is project-terra's `docs/AUDIT-2026-10-28.md`.

1. If `.claude/skills/test-design/` exists (node-web projects), also use that skill's sections as checklist items: No hangs, same result in CI; Waits; Prove a test can fail; Properties, not one seed; Time budgets; Realistic data; Goldens and random ids; Keyboard. Read them there and name the section in each finding. [D-039]
2. Flag tests that can't fail: no assertion, an assertion on a value the test just set, or a check that a skip or try/catch hides. [VER-01]
3. Flag duplicate tests: two tests that assert the same behaviour on the same input. Keep the clearer one. [terra audit, "Fixed" item 4]
4. Compare the suite's time with the test time budget in AGENTS.md. Run the suite yourself and put the time in the reader's brief; if AGENTS.md names no budget, report that as a finding with an absent-form Evidence line. [test-design "Time budgets"; Vulcan:39]
5. Flag flaky reads: a test that reads state once where it should wait for it, or that passed only on retry. [terra audit, "Fixed" item 3; VER-04]
6. List pure logic with no test. Use the runner's coverage if it has one, run by you and given in the brief; otherwise name the untested functions with a searched absence. [terra audit, Tools section]
