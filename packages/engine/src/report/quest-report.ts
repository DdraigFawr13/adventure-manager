// The quest report (R8, PLAN §9a): a letter home built from one quest's events (SPEC.md). The
// summary reads only events; the words come from content templates through the text grammar.
import type { PersonSlot, SlotValue, TemplateLibrary, TextContext } from '../core/text.ts';
import { renderFamily, type PronounForms, type PronounKey } from '../core/text.ts';
import { shapeOf } from '../contract/compose.ts';
import { templateFor } from '../resolution/turn.ts';
import { WOUND } from '../resolution/types.ts';
import type {
  Adventurer,
  GameEvent,
  QuestOutcome,
  ResolutionContent,
} from '../resolution/types.ts';

export interface DeathNote {
  readonly id: string;
  /** The foe group whose blow knocked them down; null when a scene did. */
  readonly foeId: string | null;
  /** What knocked them down: a foe in the fight, a foe while retreating, or a scene on the way in. */
  readonly cause: 'foe' | 'scene' | 'retreat';
}

export interface QuestSummary {
  readonly questId: string;
  readonly templateId: string;
  readonly outcome: QuestOutcome;
  readonly partyIds: readonly string[];
  /** Survivor with the best Wits writes home; null if nobody came back. */
  readonly writerId: string | null;
  /** The contract's foe groups, from its template, in fighting order. */
  readonly foeIds: readonly string[];
  readonly foesBeaten: number;
  readonly exchanges: number;
  readonly alarm: boolean;
  readonly retreated: boolean;
  /** Blows that landed on a foe group, per adventurer (a cleave's second blow counts too). */
  readonly hits: Readonly<Record<string, number>>;
  /** Signature actions used, per adventurer and action id. */
  readonly actions: Readonly<Record<string, Readonly<Record<string, number>>>>;
  /** [healer, patient] for each life held back from Dying. */
  readonly saves: readonly (readonly [string, string])[];
  readonly deaths: readonly DeathNote[];
  readonly injuries: readonly string[];
  /** Worst wound step each member reached. */
  readonly worst: Readonly<Record<string, number>>;
}

/** Summarises the events of one quest, from its `quest.started` to its `quest.ended`. */
export function summariseQuest(
  events: readonly GameEvent[],
  roster: readonly Adventurer[],
  content: ResolutionContent,
): QuestSummary {
  const byId = new Map(events.map((e) => [e.id, e]));
  const start = events.find((e) => e.type === 'quest.started');
  const end = events.find((e) => e.type === 'quest.ended');
  if (start?.type !== 'quest.started' || end?.type !== 'quest.ended')
    throw new Error('A quest report needs the quest from start to end.');
  const [questId = '', ...partyIds] = start.subjectIds;
  const hits: Record<string, number> = {};
  const actions: Record<string, Record<string, number>> = {};
  const worst: Record<string, number> = Object.fromEntries(partyIds.map((id) => [id, 0]));
  const saves: [string, string][] = [];
  const deaths: DeathNote[] = [];
  const injuries: string[] = [];
  const template = templateFor(content, start.templateId);
  let foesBeaten = 0;
  let exchanges = 0;
  let alarm = false;
  let retreated = false;
  const causeOf = (e: GameEvent) => byId.get(e.causeId);
  // The blow that last knocked each member down: a death traces back to it, not to the beat's
  // death roll, whose cause is only the step (review of D-139 branch).
  const knockedDown = new Map<string, GameEvent>();
  for (const e of events) {
    switch (e.type) {
      case 'foe.wounded': {
        if (e.to >= e.hits && e.from < e.hits) foesBeaten += 1;
        const attacker = attackerOf(e, causeOf);
        if (attacker) hits[attacker] = (hits[attacker] ?? 0) + 1;
        break;
      }
      case 'action.used': {
        const [who = ''] = e.subjectIds;
        const mine = (actions[who] ??= {});
        mine[e.actionId] = (mine[e.actionId] ?? 0) + 1;
        break;
      }
      case 'wound.changed': {
        const [who = ''] = e.subjectIds;
        worst[who] = Math.max(worst[who] ?? 0, e.to);
        if (e.from < WOUND.down && e.to >= WOUND.down) knockedDown.set(who, e);
        break;
      }
      case 'adventurer.stabilised': {
        const [patient = '', healer = ''] = e.subjectIds;
        if ((worst[patient] ?? 0) >= WOUND.dying && !saves.some(([, p]) => p === patient))
          saves.push([healer, patient]);
        break;
      }
      case 'adventurer.died': {
        const [who = ''] = e.subjectIds;
        const fall = knockedDown.get(who);
        deaths.push({
          id: who,
          ...(fall ? fallCause(fall, causeOf) : { foeId: null, cause: 'scene' }),
        });
        break;
      }
      case 'injury.gained':
        injuries.push(e.subjectIds[0] ?? '');
        break;
      case 'exchange.started':
        exchanges = Math.max(exchanges, e.exchange);
        break;
      case 'alarm.raised':
        alarm = true;
        break;
      case 'quest.retreated':
        retreated = true;
        break;
      default:
        break;
    }
  }
  const dead = new Set(deaths.map((d) => d.id));
  const writer = roster
    .filter((a) => partyIds.includes(a.id) && !dead.has(a.id))
    .sort((a, b) => b.attributes.wits - a.attributes.wits || (a.id < b.id ? -1 : 1))[0];
  // Saves only count for those who lived.
  const kept = saves.filter(([, patient]) => !dead.has(patient));
  return {
    questId,
    templateId: start.templateId,
    outcome: end.outcome,
    partyIds,
    writerId: writer?.id ?? null,
    foeIds: template.foes.map((f) => f.id),
    foesBeaten,
    exchanges,
    alarm,
    retreated,
    hits,
    actions,
    saves: kept,
    deaths,
    injuries,
    worst,
  };
}

/** The adventurer whose attack check caused this foe wound (directly or through a cleave). */
function attackerOf(e: GameEvent, causeOf: (e: GameEvent) => GameEvent | undefined): string | null {
  for (let at = causeOf(e), n = 0; at && n < 6; at = causeOf(at), n += 1) {
    if (at.type === 'check.rolled' && at.purpose === 'attack') return at.subjectIds[0] ?? null;
    if (at.type === 'action.used') return at.subjectIds[0] ?? null;
  }
  return null;
}

/**
 * What lay behind a knock-down: a foe's blow (its defence check names the foe, and an overreach's
 * counter-blow is a defence check too), struck on a retreat beat, or a scene's failed test.
 */
function fallCause(
  fall: GameEvent,
  causeOf: (e: GameEvent) => GameEvent | undefined,
): Pick<DeathNote, 'foeId' | 'cause'> {
  const check = causeOf(fall);
  if (check?.type !== 'check.rolled' || check.purpose !== 'defence')
    return { foeId: null, cause: 'scene' };
  const foeId = check.subjectIds[1] ?? null;
  const onTheWayOut = causeOf(check)?.type === 'retreat.beat';
  return { foeId, cause: onTheWayOut ? 'retreat' : 'foe' };
}

/** One section of the letter, in content (SPEC.md). */
export interface ReportSection {
  /** A fixed family, or a list of items each naming its own family. */
  readonly family?: string;
  readonly list?: 'deeds' | 'deaths' | 'injuries';
  readonly max?: number;
  /** Salutations and sign-offs: letter formulas, left out of the repetition count. */
  readonly formula?: boolean;
}

export interface ReportText {
  readonly sections: readonly ReportSection[];
  readonly library: TemplateLibrary;
  readonly pronouns: Readonly<Record<PronounKey, PronounForms>>;
  /** Deeds worth a line, in order of preference, with the least count that earns one. */
  readonly deeds: readonly {
    readonly kind: DeedKind;
    readonly family: string;
    readonly min: number;
  }[];
}

export type DeedKind = 'striker' | 'saved' | `action:${string}`;

export interface ReportLine {
  readonly text: string;
  readonly formula: boolean;
}

interface Item {
  readonly family: string;
  readonly vars: Readonly<Record<string, SlotValue>>;
  readonly facts: readonly string[];
}

export interface ReportOptions {
  readonly personOf: (id: string) => PersonSlot;
  readonly nameOf: (id: string) => string;
  /** Replaces names and numbers with their slot names, so repeated sentences can be counted. */
  readonly mask?: boolean;
  /** The save's seed: picks are keyed by it and the quest id, so two saves write different letters. */
  readonly seed: string;
}

/** Writes the letter: one line per section that has something to say. */
export function writeQuestReport(
  summary: QuestSummary,
  text: ReportText,
  options: ReportOptions,
): ReportLine[] {
  const person = (id: string): PersonSlot => options.personOf(id);
  const dead = summary.deaths.length;
  const party = summary.partyIds.length;
  const worstStep = Math.max(0, ...Object.values(summary.worst));
  const facts = new Set<string>([
    `outcome.${summary.outcome}`,
    dead === 0 ? 'no-deaths' : dead === 1 ? 'one-death' : 'deaths',
    summary.injuries.length > 0 ? 'injuries' : 'no-injuries',
    worstStep <= 1 && dead === 0 ? 'unhurt' : 'hurt',
    summary.writerId ? 'writer' : 'no-writer',
  ]);
  if (summary.alarm) facts.add('alarm');
  if (summary.retreated) facts.add('retreated');
  facts.add(summary.exchanges > 0 ? 'fight' : 'no-fight');
  if (summary.exchanges >= 4) facts.add('long-fight');
  if (summary.exchanges > 0 && summary.exchanges <= 2) facts.add('short-fight');
  if (summary.foeIds.length > 1) facts.add('many-foes');
  const shape = shapeOf(summary.templateId);
  if (shape?.twistId) facts.add(shape.twistId);
  const mainFoe = summary.foeIds[summary.foeIds.length - 1];
  const vars: Record<string, SlotValue> = {
    quest: options.nameOf(shape ? shape.siteId : summary.templateId),
    foe: mainFoe ? options.nameOf(mainFoe) : '',
    party,
    dead,
  };
  if (summary.writerId) vars.writer = person(summary.writerId);
  const items = {
    deeds: deedItems(summary, text, person),
    deaths: summary.deaths.map((d): Item => ({
      family: 'report.death',
      vars: {
        who: person(d.id),
        killer: d.foeId ? options.nameOf(d.foeId) : '',
      },
      facts: [d.cause === 'foe' ? 'struck' : d.cause],
    })),
    injuries: summary.injuries.map((id): Item => ({
      family: 'report.injury',
      vars: { who: person(id) },
      facts: [
        ...(summary.deaths.length > 0 ? ['after-loss'] : []),
        ...(id === summary.writerId ? ['self'] : []),
      ],
    })),
  };
  const lines: ReportLine[] = [];
  text.sections.forEach((section, at) => {
    const key = `${options.seed}/${summary.questId}/${at}`;
    const formula = section.formula ?? false;
    const base = {
      library: text.library,
      pronouns: text.pronouns,
      ...(options.mask ? { mask: true } : {}),
    };
    if (section.family) {
      const line = renderFamily({ ...base, vars, facts }, section.family, key);
      if (line) lines.push({ text: capitalise(line), formula });
    }
    if (section.list) {
      const opened = new Set<string>();
      items[section.list].slice(0, section.max ?? Infinity).forEach((item, n) => {
        const ctx: TextContext = {
          ...base,
          vars: { ...vars, ...item.vars },
          facts: new Set([...facts, ...item.facts]),
        };
        const line = freshLine(ctx, item.family, `${key}/${n}`, opened);
        if (line) lines.push({ text: capitalise(line), formula });
      });
    }
  });
  return lines;
}

const REPICKS = 4;

/**
 * Items in one list should not open alike ("We lost … We lost …"): re-pick, a few times at most.
 * The choice is made on the unmasked text, so a masked run picks exactly what the player reads.
 */
function freshLine(ctx: TextContext, family: string, key: string, opened: Set<string>): string {
  const plain: TextContext = { ...ctx, mask: false };
  let chosen = key;
  for (let n = 0; n < REPICKS; n += 1) {
    chosen = n === 0 ? key : `${key}/again${n}`;
    const opening = renderFamily(plain, family, chosen)
      .split(' ')
      .slice(0, 3)
      .join(' ')
      .toLowerCase();
    if (!opened.has(opening)) {
      opened.add(opening);
      break;
    }
  }
  return renderFamily(ctx, family, chosen);
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The living members' best deeds, one per person, in the content's order of preference. */
function deedItems(
  summary: QuestSummary,
  text: ReportText,
  person: (id: string) => PersonSlot,
): Item[] {
  const dead = new Set(summary.deaths.map((d) => d.id));
  const items: Item[] = [];
  // The writer does not praise themself; their deeds go unwritten.
  const used = new Set<string>(summary.writerId ? [summary.writerId] : []);
  for (const deed of text.deeds) {
    if (deed.kind === 'saved') {
      const save = summary.saves.find(([healer]) => !used.has(healer));
      if (!save) continue;
      const [healer, patient] = save;
      used.add(healer);
      if (dead.has(healer)) continue;
      items.push({
        family: deed.family,
        vars: { who: person(healer), patient: person(patient) },
        facts: [],
      });
      continue;
    }
    const count = (id: string) =>
      deed.kind === 'striker'
        ? (summary.hits[id] ?? 0)
        : (summary.actions[id]?.[deed.kind.slice('action:'.length)] ?? 0);
    const best = summary.partyIds
      .filter((id) => !used.has(id) && !dead.has(id) && count(id) >= deed.min)
      .sort((a, b) => count(b) - count(a) || (a < b ? -1 : 1))[0];
    if (!best) continue;
    used.add(best);
    items.push({
      family: deed.family,
      vars: { who: person(best), count: count(best) },
      facts: [count(best) === 1 ? 'once' : 'many'],
    });
  }
  return items;
}
