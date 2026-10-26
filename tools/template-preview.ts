// Template previewer and R8 writing test (PLAN §9a R8, §9d; D-113): plays N quests with drawn,
// named parties, writes each quest report, and counts repeated sentences and quest shapes.
// Usage: node tools/template-preview.ts [reports=200] [show=3]
// Sentences are counted with names and numbers masked (‹who›), so a repeat means the same
// sentence shape, not only the same words. Salutations and sign-offs are letter formulas and
// are left out of the count; their repeats are listed separately.
import {
  RngStream,
  checkInvariants,
  simulate,
  summariseQuest,
  writeQuestReport,
  type Command,
  type GameEvent,
  type GameState,
  type PersonSlot,
  type Plan,
} from '@adventure-manager/engine';
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

/** A command without its id; the tool numbers commands itself. */
type Bare = Command extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never;

interface Written {
  readonly shape: string;
  readonly lines: readonly { text: string; formula: boolean }[];
  readonly masked: readonly { text: string; formula: boolean }[];
}

function playReports(count: number): Written[] {
  const out: Written[] = [];
  const pick = RngStream.detached('template-preview', 'tool.picks');
  for (let guildNo = 0; out.length < count; guildNo += 1) {
    let state: GameState = {
      seed: `preview-${guildNo}`,
      rng: {},
      nextEventNo: 1,
      content: baseResolution,
      roster: [],
      quest: null,
      calendar: 1,
      guild: null,
    };
    const commandIds: string[] = [];
    const all: GameEvent[] = [];
    const run = (command: Bare): readonly GameEvent[] => {
      const id = `c${commandIds.length}`;
      commandIds.push(id);
      // cast-ok: the tool adds the id the caller left out; the union member is otherwise whole.
      const result = simulate(state, { ...command, id } as Command);
      state = result.state;
      all.push(...result.events);
      return result.events;
    };
    run({ type: 'guild.found', day: 1, size: 15 });
    // Ten quests per guild, each with five of the living, so the roster keeps changing.
    for (let q = 0; q < 10 && out.length < count; q += 1) {
      const living = state.roster.filter((a) => !a.dead).map((a) => a.id);
      if (living.length < 4) break;
      const party: string[] = [];
      while (party.length < Math.min(5, living.length)) {
        const id = pick.pick(living.filter((x) => !party.includes(x)));
        party.push(id);
      }
      const template = pick.pick(baseResolution.quests);
      const events: GameEvent[] = [
        ...run({
          type: 'quest.start',
          day: 1,
          questId: `quest.${guildNo}-${q}`,
          templateId: template.id,
          partyIds: party,
          plan: pick.pick(PLANS),
          watched: false,
        }),
      ];
      while (state.quest) events.push(...run({ type: 'quest.step', day: 1 }));
      const summary = summariseQuest(events, state.roster, baseResolution.quests);
      const personOf = (id: string): PersonSlot => {
        const a = state.roster.find((r) => r.id === id);
        const name = a?.name ? `${a.name.given} ${a.name.family}` : (names[id] ?? id);
        return { name, pronouns: a?.pronouns ?? 'they' };
      };
      const nameOf = (id: string) => names[id] ?? id;
      out.push({
        shape: template.id,
        lines: writeQuestReport(summary, reportText, { personOf, nameOf }),
        masked: writeQuestReport(summary, reportText, { personOf, nameOf, mask: true }),
      });
    }
    const problems = checkInvariants(state, all, commandIds);
    if (problems.length) throw new Error(`Guild ${guildNo}: ${problems.slice(0, 3).join(' ')}`);
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
console.log(
  '  A shape is site × monster × complication (PLAN §9d); content has only whole quest templates so far, so each template is one shape until quest templates are designed.',
);
