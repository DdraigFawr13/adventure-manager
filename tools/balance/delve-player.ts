// Delve players for the balance runner (spec "Balance"): `careful`, the scripted careful player,
// and `auto`, which taps Auto for every fight. Both take the same choice rooms, scouting and rows,
// so a paired run differs only in who leads the fights. Plays through `simulate` like the page.
import {
  GATE1_SAMPLE_PACK,
  GATE1_SITE,
  GATE1_TACTICS,
  gate1Content,
} from '@adventure-manager/content';
import {
  delveView,
  fightView,
  previewAction,
  retreatRefusal,
  sampleDelveState,
  sampleStart,
  simulate,
  type DelveCommand,
  type GameEvent,
  type GameState,
  type ResolutionContent,
} from '@adventure-manager/engine';

export type DelvePolicy = 'careful' | 'auto';

/** What one delve records; every delve metric is computed from these. */
export interface DelveResult {
  readonly seed: string;
  /** `stalled` when the runner stopped a fight (the delve never ended). */
  readonly outcome: 'won' | 'retreated' | 'routed' | 'stalled';
  readonly deaths: number;
  readonly injuries: number;
  /** Party health left at the end as a share of the most, in basis points. */
  readonly healthBp: number;
  readonly skillUsesLeft: number;
  readonly rounds: readonly number[];
  readonly stalled: number;
  readonly rooms: number;
  readonly parts: number;
}

/** The runner (not the game) stops a fight after this many rounds and counts it stalled. */
export const STALL_ROUNDS = 30;

type Body<T extends DelveCommand['type']> = Omit<Extract<DelveCommand, { type: T }>, 'id' | 'day'>;

export function playDelve(
  seed: string,
  policy: DelvePolicy,
  content: ResolutionContent = gate1Content,
): DelveResult {
  let state: GameState = sampleDelveState(content, seed);
  let n = 0;
  const run = <T extends DelveCommand['type']>(body: Body<T> & { type: T }): GameEvent[] => {
    n += 1;
    // cast-ok: the body plus id and day is the command of its type.
    const command = { ...body, id: `cmd.${n}`, day: 1 } as unknown as DelveCommand;
    const result = simulate(state, command);
    state = result.state;
    return [...result.events];
  };
  run({
    ...sampleStart(content, {
      id: 'unused',
      siteId: GATE1_SITE,
      tactics: GATE1_TACTICS,
      pack: GATE1_SAMPLE_PACK.map((p) => ({ ...p })),
      approach: 'assault',
    }),
  });
  const rounds: number[] = [];
  let stalled = 0;
  let fightRound = 0;
  for (let guard = 0; guard < 5000; guard += 1) {
    const d = state.delve!;
    if (d.phase === 'ended') break;
    if (d.phase === 'choice') {
      const view = delveView(state)!;
      const best = view
        .choice!.options.flatMap((o, optionIndex) => o.testers.map((t) => ({ optionIndex, t })))
        // The best chance; ties by option order, then tester id (spec "Balance").
        .sort(
          (a, b) =>
            b.t.chance.total - a.t.chance.total ||
            a.optionIndex - b.optionIndex ||
            (a.t.id < b.t.id ? -1 : a.t.id > b.t.id ? 1 : 0),
        )[0]!;
      run({ type: 'delve.choose', optionIndex: best.optionIndex, testerId: best.t.id });
      continue;
    }
    if (d.phase === 'breather') {
      const view = delveView(state)!;
      if (view.scout?.open && !view.scouted) {
        run({ type: 'delve.scout' });
        continue;
      }
      if (fightRound) rounds.push(fightRound);
      fightRound = 0;
      run({ type: 'delve.next' });
      continue;
    }
    const fight = d.fight!;
    fightRound = fight.round;
    if (fight.round > STALL_ROUNDS) {
      stalled += 1;
      break;
    }
    if (policy === 'auto') {
      run({ type: 'fight.step' });
      continue;
    }
    const before = d.roomIndex;
    const bossNext = d.rooms[before]?.kind === 'fight' && d.rooms[before].boss;
    const fallen = d.fighters.filter((f) => f.status !== 'up' && f.status !== 'fled').length;
    if (!bossNext && fallen >= 2 && !retreatRefusal(state)) {
      run({ type: 'fight.retreat' });
      continue;
    }
    run({ type: 'fight.act', ...carefulTurn(state) });
  }
  const d = state.delve!;
  if (fightRound) rounds.push(fightRound);
  const party = d.fighters;
  const max = party.reduce((s, f) => s + f.maxHealth, 0);
  const left = party.reduce((s, f) => s + (f.status === 'dead' ? 0 : f.health), 0);
  return {
    seed,
    outcome: d.outcome ?? 'stalled',
    deaths: party.filter((f) => f.status === 'dead').length,
    injuries: (d.ends ?? []).filter((e) => e.injury).length,
    healthBp: max ? Math.floor((left * 10000) / max) : 0,
    skillUsesLeft: Object.values(d.skillUses).reduce(
      (s, u) => s + Object.values(u).reduce((a, b) => a + b, 0),
      0,
    ),
    rounds,
    stalled,
    rooms: d.roomIndex + 1,
    parts: d.loot.parts.length,
  };
}

/** The careful player's turn (spec "Balance", `delve-player.ts`). */
function carefulTurn(state: GameState): Omit<Body<'fight.act'>, 'type'> {
  const view = fightView(state)!;
  const actorId = view.actorId!;
  const fighters = new Map(view.fighters.map((f) => [f.id, f]));
  const action = (id: string) => view.actions.find((a) => a.actionId === id && a.usable);
  const share = (id: string) => {
    const f = fighters.get(id)!;
    return f.health / f.maxHealth;
  };
  const party = view.fighters.filter((f) => f.side === 'party');
  const pick = (actionId: string, targetId?: string) => ({
    actorId,
    actionId,
    ...(targetId ? { targetId } : {}),
  });
  const can = (actionId: string, targetId: string) => action(actionId)?.targets.includes(targetId);
  // 1. Raise a Dying ally: Mend, else a draught.
  const dying = party.find((f) => f.status === 'dying');
  if (dying) {
    if (can('action.mend', dying.id)) return pick('action.mend', dying.id);
    const pack = action('action.pack');
    const i = view.pack.findIndex(
      (p, idx) => p.kindId === 'item.draught' && pack?.packTargets[idx]?.includes(dying.id),
    );
    if (i >= 0) return { actorId, actionId: 'action.pack', targetId: dying.id, packIndex: i };
  }
  // 2. Mend an ally below a third.
  const low = party
    .filter((f) => f.status === 'up' && f.health * 3 < f.maxHealth)
    .sort((a, b) => share(a.id) - share(b.id))[0];
  if (low && can('action.mend', low.id)) return pick('action.mend', low.id);
  // 3. Ward when two or more foes intend to hit.
  const intents = Object.values(view.intents).filter(
    (i): i is { readonly actionId: string; readonly targetId: string } => i !== 'off-guard',
  );
  if (intents.length >= 2 && action('action.ward')) return pick('action.ward');
  // 4. Guard the most hurt back-row ally a foe means to hit.
  const aimed = new Set(intents.map((i) => i.targetId));
  const guardee = party
    .filter((f) => f.status === 'up' && f.row === 'back' && aimed.has(f.id))
    .sort((a, b) => share(a.id) - share(b.id))[0];
  if (guardee && can('action.guard', guardee.id)) return pick('action.guard', guardee.id);
  // 5. Firebolt or Strike from shadow on a foe that would then fall.
  for (const big of ['action.firebolt', 'action.shadow-strike']) {
    const a = action(big);
    if (!a) continue;
    const kill = a.targets.find((t) => {
      const p = previewAction(state, actorId, big, t);
      return p.damage.min.total >= fighters.get(t)!.health;
    });
    if (kill) return pick(big, kill);
  }
  // 6. Cleave when two front foes stand.
  const cleave = action('action.cleave');
  const front = view.fighters.filter(
    (f) => f.side === 'foe' && f.status === 'up' && f.row === 'front',
  );
  if (cleave && front.length >= 2) {
    const t = [...cleave.targets].sort((a, b) => share(a) - share(b))[0];
    if (t) return pick('action.cleave', t);
  }
  // 7. The plain attack on the most hurt reachable foe.
  const plain = view.actions[0]!;
  const t = [...plain.targets].sort((a, b) => share(a) - share(b))[0];
  if (t) return pick(plain.actionId, t);
  return pick('action.swap-row');
}
