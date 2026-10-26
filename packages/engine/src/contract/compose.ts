// Puts a quest together from a shape (SPEC.md): the site's scenes at the danger's difficulty, the
// monster kind's foe groups for that danger, and the twist's one change.
import type { Danger, QuestTemplate, SceneTemplate } from '../resolution/types.ts';
import type { ContractContent, MonsterKind, Shape, SiteTemplate } from './types.ts';

const PREFIX = 'shape:';
const PLAIN = 'plain';
const DANGERS: readonly Danger[] = ['routine', 'hazardous', 'perilous', 'deadly'];

export function shapeId(shape: Shape): string {
  return `${PREFIX}${shape.siteId}+${shape.monsterId}+${shape.twistId ?? PLAIN}+${shape.danger}`;
}

/** The shape a composed template id names, or null for a fixed quest template. */
export function shapeOf(templateId: string): Shape | null {
  if (!templateId.startsWith(PREFIX)) return null;
  const [siteId, monsterId, twist, danger] = templateId.slice(PREFIX.length).split('+');
  const known = DANGERS.find((d) => d === danger);
  if (!siteId || !monsterId || !twist || !known) throw new Error(`Bad shape id ${templateId}.`);
  return { siteId, monsterId, twistId: twist === PLAIN ? null : twist, danger: known };
}

export function fits(site: SiteTemplate, monster: MonsterKind, danger: Danger): boolean {
  return (
    site.dangers.includes(danger) &&
    monster.variants[danger] !== undefined &&
    monster.lives.some((home) => site.homes.includes(home))
  );
}

export function composeQuest(content: ContractContent, shape: Shape): QuestTemplate {
  const site = content.sites.find((s) => s.id === shape.siteId);
  const monster = content.monsters.find((m) => m.id === shape.monsterId);
  if (!site) throw new Error(`Unknown site ${shape.siteId}.`);
  if (!monster) throw new Error(`Unknown monster kind ${shape.monsterId}.`);
  if (!fits(site, monster, shape.danger))
    throw new Error(`${monster.id} does not live at ${site.id} at ${shape.danger}.`);
  const twist = shape.twistId ? content.twists.find((t) => t.id === shape.twistId) : undefined;
  if (shape.twistId && !twist) throw new Error(`Unknown twist ${shape.twistId}.`);
  const shift = content.sceneShift[shape.danger];
  let scenes: SceneTemplate[] = site.scenes.map((s) => ({
    ...s,
    difficulty: s.difficulty + shift,
  }));
  if (twist?.kind === 'scene-shift')
    scenes = scenes.map((s) =>
      s.kind === 'fixed' && s.attribute === twist.attribute
        ? { ...s, difficulty: s.difficulty + twist.amount }
        : s,
    );
  if (twist?.kind === 'extra-scene') {
    const extra = { ...twist.scene, difficulty: twist.scene.difficulty + shift };
    scenes = [...scenes.slice(0, -1), extra, ...scenes.slice(-1)];
  }
  // non-null: fits() checked the variant exists.
  const groups = monster.variants[shape.danger]!;
  const foes =
    twist?.kind === 'foe-shift'
      ? groups.map((f) => ({
          ...f,
          attack: f.attack + twist.amount,
          defence: f.defence + twist.amount,
        }))
      : groups;
  return {
    id: shapeId(shape),
    danger: shape.danger,
    tags: site.tags,
    scenes,
    foes,
    ...(twist ? { twist } : {}),
  };
}
