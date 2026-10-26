// Template previewer and R8 writing test (PLAN §9a R8, §9d; D-113): plays N quests with drawn,
// named parties, writes each quest report, and counts repeated sentences and quest shapes.
// Quests come from played guild years (tools/year-sim-play.ts), so shapes are the board's own.
// Usage: node tools/template-preview.ts [reports=200] [show=3]
// Sentences are counted with names and numbers masked (‹who›), so a repeat means the same
// sentence shape, not only the same words. Salutations and sign-offs are letter formulas and
// are left out of the count; their repeats are listed separately.
import {
  summariseQuest,
  writeQuestReport,
  type PersonSlot,
  type Plan,
} from '@adventure-manager/engine';
import { runYear } from './year-sim-play.ts';
import { baseResolution, names, reportText } from '@adventure-manager/content';

const total = Number(process.argv[2] ?? 200);
const show = Number(process.argv[3] ?? 3);
const BLOCK = 50;
const SHAPE_BLOCK = 100;
const PLANS: readonly Plan[] = [
  { approach: 'assault', risk: 'steady', retreat: 'leader' },
  { approach: 'stealth', risk: 'cautious', retreat: 'down' },
  { approach: 'assault', risk: 'bold', retreat: 'never' },
];

interface Written {
  readonly shape: string;
  readonly lines: readonly { text: string; formula: boolean }[];
  readonly masked: readonly { text: string; formula: boolean }[];
}

/** Plays guild years (the board composes contracts, D-139) and writes a letter for each quest. */
function playReports(count: number): Written[] {
  const out: Written[] = [];
  for (let yearNo = 0; out.length < count; yearNo += 1) {
    const plan = PLANS[yearNo % PLANS.length]!; // non-null: modulo the length.
    const seed = `preview-${yearNo}`;
    const { state, events } = runYear(seed, plan);
    const personOf = (id: string): PersonSlot => {
      const a = state.roster.find((r) => r.id === id);
      const name = a?.name ? `${a.name.given} ${a.name.family}` : (names[id] ?? id);
      return { name, pronouns: a?.pronouns ?? 'they' };
    };
    const nameOf = (id: string) => names[id] ?? id;
    // A quest resolves within one command, so its events run unbroken from start to end.
    let from = -1;
    events.forEach((e, at) => {
      if (e.type === 'quest.started') from = at;
      if (e.type !== 'quest.ended' || from < 0 || out.length >= count) return;
      const quest = events.slice(from, at + 1);
      const summary = summariseQuest(quest, state.roster, baseResolution);
      out.push({
        shape: summary.templateId,
        lines: writeQuestReport(summary, reportText, { personOf, nameOf, seed }),
        masked: writeQuestReport(summary, reportText, { personOf, nameOf, seed, mask: true }),
      });
    });
  }
  return out;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z‹])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function maxRepeats(blocks: readonly (readonly string[])[]): {
  worst: number;
  over: [string, number][];
} {
  let worst = 0;
  const over = new Map<string, number>();
  for (const block of blocks) {
    const counts = new Map<string, number>();
    for (const s of block) counts.set(s, (counts.get(s) ?? 0) + 1);
    for (const [s, n] of counts) {
      worst = Math.max(worst, n);
      if (n > 2) over.set(s, Math.max(over.get(s) ?? 0, n));
    }
  }
  return { worst, over: [...over].sort((a, b) => b[1] - a[1]) };
}

const reports = playReports(total);
for (const r of reports.slice(0, show)) {
  console.log('---');
  for (const l of r.lines) console.log(l.text);
}
console.log('---\n');

const gaps = reports.flatMap((r) => r.lines).filter((l) => /[{}]/.test(l.text));
console.log(`${reports.length} reports; lines with an unfilled slot: ${gaps.length}`);
for (const g of gaps.slice(0, 5)) console.log(`  GAP: ${g.text}`);

const blocks: string[][] = [];
const formulaBlocks: string[][] = [];
for (let from = 0; from + BLOCK <= reports.length; from += BLOCK) {
  const slice = reports.slice(from, from + BLOCK);
  blocks.push(
    slice.flatMap((r) => r.masked.filter((l) => !l.formula).flatMap((l) => sentences(l.text))),
  );
  formulaBlocks.push(slice.flatMap((r) => r.masked.filter((l) => l.formula).map((l) => l.text)));
}
const body = maxRepeats(blocks);
const sentenceCount = blocks.reduce((n, b) => n + b.length, 0);
const distinct = new Set(blocks.flat()).size;
console.log(
  `R8 sentences (masked, ${blocks.length} blocks of ${BLOCK} reports, ${sentenceCount} sentences, ${distinct} distinct): ` +
    `most uses of one sentence in a block ${body.worst} [pass: at most 2] ${body.worst <= 2 ? 'PASS' : 'FAIL'}`,
);
for (const [s, n] of body.over.slice(0, 10)) console.log(`  ×${n}: ${s}`);
const formula = maxRepeats(formulaBlocks);
console.log(`Letter formulas (not counted): most uses of one in a block ${formula.worst}`);

const shapeCounts = new Map<string, number>();
for (const r of reports.slice(0, SHAPE_BLOCK))
  shapeCounts.set(r.shape, (shapeCounts.get(r.shape) ?? 0) + 1);
const worstShape = Math.max(...shapeCounts.values());
console.log(
  `Quest shapes in the first ${Math.min(SHAPE_BLOCK, reports.length)} quests: ${shapeCounts.size} distinct, most repeats ${worstShape} [pass: at most 3] ${worstShape <= 3 ? 'PASS' : 'FAIL'}`,
);
console.log('  A shape is site × monster kind × twist at one danger (D-139, PLAN §9d).');
