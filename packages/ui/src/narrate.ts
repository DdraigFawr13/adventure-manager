// Turns engine events into log lines. Wording comes from content text; numbers come from the
// event's own Value parts, so the ui never recomputes a rule (GAME-02).
import { fillTemplate, pickVariant, type GameEvent, type Value } from '@adventure-manager/engine';
import { logTemplates, names } from '@adventure-manager/content';

export type LineKind = 'title' | 'scene' | 'roll' | 'harm' | 'death' | 'moment' | 'end' | 'info';

export interface LogLine {
  readonly id: string;
  readonly kind: LineKind;
  readonly text: string;
  readonly chance?: Value;
  readonly roll?: number;
  /** What the roll was for, e.g. "to hit", from content text. */
  readonly purpose?: string;
}

export function nameOf(id: string): string {
  return names[id] ?? id;
}

function line(key: string, eventId: string, vars: Record<string, string>): string {
  const variants = logTemplates[key];
  return variants ? fillTemplate(pickVariant(variants, eventId), vars) : key;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function narrate(event: GameEvent): LogLine | null {
  const [first = '', second = ''] = event.subjectIds;
  const id = event.id;
  switch (event.type) {
    case 'quest.started':
      return {
        id,
        kind: 'title',
        text: line('quest.started', id, { quest: nameOf(event.templateId) }),
      };
    case 'scene.started':
      return {
        id,
        kind: 'scene',
        text: line('scene.started', id, { scene: nameOf(event.sceneId) }),
      };
    case 'exchange.started':
      return {
        id,
        kind: 'scene',
        text: line('exchange.started', id, { exchange: String(event.exchange) }),
      };
    case 'check.rolled': {
      const base = {
        id,
        chance: event.chance,
        roll: event.roll,
        purpose: nameOf(`purpose.${event.purpose}`),
      } as const;
      if (event.purpose === 'scene' || event.purpose === 'attack') {
        const key = `${event.purpose}.${event.outcome}`;
        return {
          ...base,
          kind: 'roll',
          text: line(key, id, { actor: nameOf(first), foe: nameOf(second) }),
        };
      }
      if (event.purpose === 'defence') {
        const key = `defence.${event.outcome}`;
        const foe = capitalise(nameOf(second));
        return { ...base, kind: 'roll', text: line(key, id, { actor: nameOf(first), foe }) };
      }
      if (event.purpose === 'stabilise') {
        const key = `stabilise.${event.outcome === 'strong-success' ? 'success' : event.outcome}`;
        return {
          ...base,
          kind: 'roll',
          text: line(key, id, { healer: nameOf(first), actor: nameOf(second) }),
        };
      }
      return null;
    }
    case 'wound.changed': {
      if (event.to < event.from) return null;
      const key = event.to === 3 ? 'wound.down' : event.to === 4 ? 'wound.dying' : 'wound.changed';
      const step = nameOf(`wound.${event.to}`);
      return { id, kind: 'harm', text: line(key, id, { actor: nameOf(first), step }) };
    }
    case 'foe.wounded':
      return {
        id,
        kind: 'roll',
        text: line('foe.wounded', id, {
          foe: capitalise(nameOf(first)),
          step: nameOf(`foe.wound.${event.to}`),
        }),
      };
    case 'alarm.raised':
      return { id, kind: 'harm', text: line('alarm.raised', id, {}) };
    case 'adventurer.died':
      return { id, kind: 'death', text: line('adventurer.died', id, { actor: nameOf(first) }) };
    case 'leader.judged':
      return {
        id,
        kind: 'moment',
        text: line(`leader.judged.${event.call}`, id, { actor: nameOf(first) }),
      };
    case 'moment.raised':
      return { id, kind: 'moment', text: line('moment.raised', id, {}) };
    case 'moment.resolved':
      return { id, kind: 'moment', text: line(`moment.${event.choice}`, id, {}) };
    case 'quest.retreated':
      return {
        id,
        kind: 'moment',
        text: line('quest.retreated', id, { beats: String(event.beats) }),
      };
    case 'retreat.beat':
      return { id, kind: 'info', text: line('retreat.beat', id, {}) };
    case 'injury.gained':
      return { id, kind: 'harm', text: line('injury.gained', id, { actor: nameOf(first) }) };
    case 'quest.ended':
      return {
        id,
        kind: 'end',
        text: line('quest.ended', id, { outcome: nameOf(`outcome.${event.outcome}`) }),
      };
    default:
      return null;
  }
}

/** "62% to hit: Might +1500, Weapon +400 …" from the event's own parts. */
export function describeChance(chance: Value, purposeLabel: string): string {
  const parts = chance.parts
    .map((p) => `${nameOf(p.sourceId)} ${p.amount >= 0 ? '+' : '−'}${Math.abs(p.amount) / 100}%`)
    .join(', ');
  return `${chance.total / 100}% ${purposeLabel}: ${nameOf('rule.base')} ${chance.base / 100}%${parts ? `, ${parts}` : ''}.`;
}
