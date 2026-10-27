// Step 4 text prototype page (D-195–D-200): its labels and the names of rooms and house work.
import text from '../../data/step4.en.json' with { type: 'json' };

/** Interface labels for the step 4 page, with `{slot}`s the page fills. */
export const step4Text: Readonly<Record<string, string>> = text.ui;

/** Display names the page adds: rooms, house work and incidents, keyed by content id. */
export const step4Names: Readonly<Record<string, string>> = text.names;
