// Shapes for contracts v0 (SPEC.md). Content supplies them; the engine composes quests from them.
import type { Attribute, Danger, FoeGroupTemplate, SceneTemplate } from '../resolution/types.ts';

export interface SiteTemplate {
  readonly id: string;
  /** Approach tags (guarded, dark, open), as on quest templates. */
  readonly tags: readonly string[];
  /** Which monster kinds can live here: a kind fits when it shares one of these. */
  readonly homes: readonly string[];
  readonly dangers: readonly Danger[];
  /** Scenes at hazardous difficulty; the danger's shift is added to each. */
  readonly scenes: readonly SceneTemplate[];
}

export interface MonsterKind {
  readonly id: string;
  readonly family: string;
  readonly lives: readonly string[];
  /** Foe groups per danger rating the kind comes in (PLAN §7b). */
  readonly variants: Readonly<Partial<Record<Danger, readonly FoeGroupTemplate[]>>>;
}

/** One kind per engine rule (D-139); content chooses the numbers. */
export type Twist = {
  readonly id: string;
  readonly weight: number;
  /** Fee change in basis points (ignored for hidden twists). */
  readonly feeBp: number;
  /** Hidden twists are not named on the board; the report reveals them. */
  readonly hidden: boolean;
} & (
  | { readonly kind: 'scene-shift'; readonly attribute: Attribute; readonly amount: number }
  | { readonly kind: 'foe-shift'; readonly amount: number }
  | { readonly kind: 'extra-scene'; readonly scene: SceneTemplate }
  | { readonly kind: 'bleed'; readonly amountBp: number }
  | { readonly kind: 'hostage' }
  | { readonly kind: 'deadline'; readonly exchanges: number }
);

export interface ContractContent {
  readonly sites: readonly SiteTemplate[];
  readonly monsters: readonly MonsterKind[];
  readonly twists: readonly Twist[];
  /** Weight of a contract with no twist, against the twists' weights. */
  readonly plainWeight: number;
  /** Added to every site scene's difficulty, by danger. */
  readonly sceneShift: Readonly<Record<Danger, number>>;
  /** Shapes the board remembers and avoids reposting. */
  readonly recentShapes: number;
}

export interface Shape {
  readonly siteId: string;
  readonly monsterId: string;
  readonly twistId: string | null;
  readonly danger: Danger;
}
