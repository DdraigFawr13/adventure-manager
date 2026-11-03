# Avoid and pitfalls

The master lists for every project with a UI, read by `ui-style` and `ui-mockups` before any screen work. Don't copy them into a project: its style doc links here and adds its own items under `### Project` (SRC-01).

Each item ends with its source in brackets. "artifact-design guidance" is the Artifact tool's built-in design skill, not a repo file, so those items rest on Morgan's request (D-050).

## Avoid

Each item is tagged: `(lint)` items are flagged by `ui-mockups`' `mockup-lint.mjs`; `(look)` items are checked by eye in the fact check and by the fresh check.

- (look) Stock looks: a purple-to-blue gradient hero, warm cream with serif and terracotta, near-black with one neon accent [Morgan 2026-11-03, D-050; artifact-design guidance "Avoid AI-generated design"]
- (lint) A default face picked by habit (Inter, Space Grotesk, Roboto) instead of the style's faces [Morgan 2026-11-03, D-050; artifact-design guidance "Avoid AI-generated design"]
- (lint) Emoji as icons or section markers [Morgan 2026-11-03, D-050; artifact-design guidance "Avoid AI-generated design"]
- (look) The same radius and shadow on every block; everything centred [Morgan 2026-11-03, D-050; artifact-design guidance "Avoid AI-generated design"]
- (lint) Text below the style's minimum size [Vulcan LESSONS:24]
- (look) Tap targets below the style's minimum [Vulcan LESSONS:24]
- (lint) Placeholder copy (lorem ipsum, TODO) [adventure-manager LESSONS:15]
- (look) Invented example facts: a name, number or option not in the project's files [adventure-manager LESSONS:15]
- (look) Copy tics: em-dash asides, "not X but Y", "seamless", "unlock", filler intros [Morgan 2026-11-03, D-050; artifact-design guidance "Writing the copy"]
- (look) A control that gives no answer on the screen where it was used [Vulcan LESSONS:19]

## Pitfalls

Mistakes that happened more than once in real projects, with the habit that prevents each.

- An author `display` rule beats `[hidden]`; keep `[hidden] { display: none !important }` and screenshot every view state [terra LESSONS:17]
- Reusing a generic class name restyles old rules; grep the CSS before naming a class [terra LESSONS:18]
- Controls that come and go above a canvas move it; keep their space with `visibility` [terra LESSONS:25]
- Checked at desktop size with a keyboard; drive it at the first target width by tapping [Vulcan LESSONS:19, :27]
- A sheet's close button scrolls away; pin title and close [Vulcan UI_STYLE.md:79]
- Buttons rebuilt on every update can't be tapped; fill live views in place [Vulcan LESSONS:26]
