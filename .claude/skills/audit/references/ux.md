# UX audit

Covers what a user sees and does: the main screens at 1440, 1100 and 412 px wide, keyboard reach, and the wording on screen.
Use it at the end of a UI phase or milestone, or when asked to review the app's screens or wording.

Sources in brackets: rule ids are the shared rules; D-045 is the master's decision to skip unsupported widths; "reviewer.md:5" is `core/agents/reviewer.md:5`, the reader agents' tool list; "test-design" is the node-web `test-design` skill; D-043 is the master's audit plan, which names wording as part of this kind.

1. Take the screenshots yourself, because reader agents have no browser [reviewer.md:5]: each screen in scope, as it opens, at 1440, 1100 and 412 px wide, named `ux-<width>.png` (add the screen's name when there are several). Save them in the scratchpad, never in the repo; put their paths in each reader's brief and link them from the reply page. If a screenshot can't be taken, report the error and list that width under Not checked. Skip a width the project's docs say it doesn't support (for example a laptop-only app at 412 px): list it under Not checked with the doc's `path:line`. [VER-06; D-045]
2. Flag text that overflows or is clipped, controls pushed off screen, and a page that scrolls sideways, at each width. Cite the element in the source and name the screenshot that shows it. [VER-06]
3. Check that every control can be reached and used with the keyboard alone, in a visible order. [test-design "Keyboard"] In web-app projects (the project's rules list APP-02), also check APP-02's baseline: scalable text, contrast, status not shown by colour alone, labelled controls, focus trapped and restored in dialogs, reduced motion, and the 412 px screen at 200% text, unless item 1 skipped 412 px. [APP-02]
4. Flag wording that uses two terms for one thing, passive voice where an action is meant, and error messages that don't say how to fix the problem. Quote the text and its source line. [D-043]
