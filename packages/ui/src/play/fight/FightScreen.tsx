// The fight screen (D-225 option C as fitted in D-231, mock-up docs/design/mockups/fight-fit.html):
// band, turn strip, side-on stage, command panel. Shows the engine's view; computes no rule.
import { useState } from 'react';
import {
  PACK_ACTION,
  SWAP_ACTION,
  previewAction,
  type FightView,
  type FighterView,
  type GameState,
} from '@adventure-manager/engine';
import { gate1Delve } from '@adventure-manager/content';
import { actionName, intentVerb, labelOf, nameOf, t } from '../words.ts';
import type { Choice } from '../game.ts';

const STANDEES: Readonly<Record<string, string>> = {
  'adv.odric-hale': 'standee-warrior-odric.webp',
  'adv.wenna-cray': 'standee-rogue-wenna.webp',
  'adv.brother-amis': 'standee-cleric-amis.webp',
  'adv.maud-fenwick': 'standee-wizard-maud.webp',
  'foe.hound': 'standee-barrow-hound.webp',
  // No archer painting yet: the warden's standee stands in (D-231's mock-up, marked there).
  'foe.barrow-archer': 'standee-restless-warden.webp',
  'foe.restless-warden': 'standee-restless-warden.webp',
};

/** The Hollow Barrow's burial hall (docs/design/art), reshaped into wall and floor as in D-231. */
const BACKDROP = 'play/backdrop-burial-hall.jpg';

/** Paintings that face left and are turned to face the foes. */
const FACING_LEFT = new Set(['adv.wenna-cray', 'adv.maud-fenwick']);

/** Lanes on the stage, far to near (bottom offset in % of the stage), by how many share a row. */
const LANES: Readonly<Record<number, readonly number[]>> = {
  1: [28],
  2: [47, 3],
  3: [56, 30, 3],
  4: [62, 42, 22, 3],
  5: [66, 50, 34, 18, 3],
};

/** The foes' back row stands between the front row's lanes, so intent marks don't collide. */
const BACK_FOE_LANES: Readonly<Record<number, readonly number[]>> = {
  ...LANES,
  1: [40],
  2: [52, 16],
};

interface Selection {
  readonly key: number;
  readonly picked: Picked | null;
  readonly packOpen: boolean;
}

interface Picked {
  readonly actionId: string;
  readonly packIndex?: number;
  readonly targetId?: string;
}

interface Props {
  readonly state: GameState;
  readonly view: FightView;
  readonly log: readonly string[];
  readonly notice: string;
  readonly onAct: (choice: Choice) => void;
  readonly onNewFight: () => void;
  readonly onDismissNotice: () => void;
}

const pct = (bp: number): number => Math.floor(bp / 100);

function bandWord(f: FighterView): string {
  return f.band === 'unhurt' ? '' : t(`band.${f.band}`);
}

function barClass(f: FighterView): string {
  if (f.band === 'hurt') return 'hp hurt';
  if (f.band === 'unhurt') return 'hp';
  return 'hp bad';
}

function Bar({ f }: { readonly f: FighterView }) {
  const width = f.maxHealth ? Math.round((100 * f.health) / f.maxHealth) : 0;
  return (
    <span className={barClass(f)}>
      <i style={{ width: `${width}%` }} />
    </span>
  );
}

export function FightScreen(props: Props) {
  const { state, view, log } = props;
  const actorId = view.actorId;
  const actions = view.actions;
  const plain = actions[0]?.actionId;
  // A choice belongs to the state it was made on: after any command (state.nextEventNo moves) the
  // screen starts again from the plain attack, in the same render, so a stale pick (an item that
  // has left the pack, a target that fell) is never previewed.
  const turnKey = state.nextEventNo;
  const fresh: Selection = {
    key: turnKey,
    picked: plain ? { actionId: plain } : null,
    packOpen: false,
  };
  const [selection, setSelection] = useState<Selection>(fresh);
  const current = selection.key === turnKey ? selection : fresh;
  const picked = current.picked;
  const packOpen = current.packOpen;
  const setPicked = (next: Picked | null): void =>
    setSelection({ key: turnKey, picked: next, packOpen: current.packOpen });
  const setPackOpen = (open: boolean): void =>
    setSelection({ key: turnKey, picked: current.picked, packOpen: open });

  const actionView = picked ? actions.find((a) => a.actionId === picked.actionId) : undefined;
  const targets =
    picked && actionView
      ? picked.actionId === PACK_ACTION
        ? picked.packIndex === undefined
          ? []
          : (actionView.packTargets[picked.packIndex] ?? [])
        : actionView.targets
      : [];
  const packKind =
    picked?.packIndex === undefined ? undefined : view.pack[picked.packIndex]?.kindId;

  const tapFighter = (id: string): void => {
    if (!actorId || !picked || !targets.includes(id)) return;
    if (picked.targetId === id) {
      props.onAct({
        actorId,
        actionId: picked.actionId,
        targetId: id,
        ...(picked.packIndex === undefined ? {} : { packIndex: picked.packIndex }),
      });
      return;
    }
    setPicked({ ...picked, targetId: id });
  };

  const tapAction = (actionId: string): void => {
    if (!actorId) return;
    const a = actions.find((x) => x.actionId === actionId);
    if (!a?.usable) return;
    if (actionId === PACK_ACTION) {
      setPackOpen(true);
      return;
    }
    if (!a.needsTarget && picked?.actionId === actionId) {
      props.onAct({ actorId, actionId });
      return;
    }
    setPicked({ actionId });
  };

  const preview =
    actorId && picked?.targetId && targets.includes(picked.targetId)
      ? previewAction(state, actorId, picked.actionId, picked.targetId, picked.packIndex)
      : null;
  const target = picked?.targetId ? view.fighters.find((f) => f.id === picked.targetId) : undefined;
  const verb = picked
    ? (picked.actionId === PACK_ACTION && packKind
        ? nameOf(packKind)
        : actionName(picked.actionId)
      ).toLowerCase()
    : '';
  let targetLine = log.slice(-2).join(' · ') || t('pick.action');
  if (preview && target && picked) {
    const name = labelOf(view, target.id);
    if (preview.effect === 'heal' || preview.effect === 'raise')
      targetLine =
        preview.effect === 'raise'
          ? t('pick.raise', {
              target: name,
              band: t(`band.${target.band}`),
              amount: preview.damage.min.total,
            })
          : t('pick.heal', { target: name, amount: preview.damage.min.total, verb });
    else if (preview.effect === 'other') targetLine = `${name}. ${t('pick.self', { verb })}`;
    else
      targetLine = t('pick.target', {
        target: name,
        hit: pct(preview.hit.total),
        min: preview.damage.min.total,
        max: preview.damage.max.total,
        verb,
      });
  } else if (picked && actionView && !actionView.needsTarget) targetLine = t('pick.self', { verb });
  else if (packOpen) targetLine = t('pick.pack');

  // ---- Stage ----
  const pieces = layout(view);
  const actorView = view.fighters.find((f) => f.id === actorId);

  return (
    <div id="fight" className="fight">
      <div className="band">
        <div>
          <div className="t">{nameOf(state.delve?.siteId ?? '')}</div>
          <div className="s">{t('round', { n: view.round })}</div>
        </div>
        <div className="end">
          <button className="chipbtn" disabled title={t('later')}>
            {t('auto')}
          </button>
          <button className="chipbtn danger" disabled title={t('later')}>
            {t('retreat')}
          </button>
        </div>
      </div>
      <div className="turns" role="group" aria-label={t('order')}>
        {view.order.map((o) => {
          const f = view.fighters.find((x) => x.id === o.id);
          if (!f || f.status === 'fled') return null;
          const fallen = f.side === 'party' && f.status !== 'up';
          const cls = [
            f.side === 'foe' ? 'tf' : '',
            o.id === actorId ? 'now' : '',
            fallen ? 'down' : f.status !== 'up' ? 'out' : o.acted ? 'done' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <span
              key={o.id}
              className={cls}
              aria-label={fallen ? `${labelOf(view, o.id)}, ${bandWord(f)}` : undefined}
            >
              {labelOf(view, o.id)}
            </span>
          );
        })}
      </div>
      <div className="stage">
        <div className="wall" style={{ backgroundImage: `url(${BACKDROP})` }} aria-hidden="true" />
        <div className="floor" style={{ backgroundImage: `url(${BACKDROP})` }} aria-hidden="true" />
        <div className="haze" aria-hidden="true" />
        <span className="rowchip" style={{ left: '4%' }}>
          {t('row.back')}
        </span>
        <span className="rowchip" style={{ left: '26%' }}>
          {t('row.front')}
        </span>
        {pieces.map(({ f, left, bottom, scale }) => {
          if (f.status === 'fled') return null;
          const isActor = f.id === actorId;
          const isTarget = f.id === picked?.targetId;
          const tappable = targets.includes(f.id);
          const intent = view.intents[f.id];
          const acted = view.order.find((o) => o.id === f.id)?.acted ?? false;
          const mark =
            f.side === 'foe' && f.status === 'up'
              ? intent === 'off-guard'
                ? t('off-guard')
                : acted
                  ? t('done')
                  : intent
                    ? `${intentVerb(f.kindId)} → ${labelOf(view, intent.targetId)}`
                    : ''
              : '';
          const art = STANDEES[f.side === 'party' ? f.id : f.kindId] ?? '';
          const base = f.side === 'party' ? 88 : f.kindId === 'foe.hound' ? 52 : 76;
          const height = Math.round(base * scale);
          const showTag = isActor || isTarget;
          const number = f.side === 'foe' ? labelOf(view, f.id).split(' ')[1] : undefined;
          const classes = [
            f.side === 'party' ? 'pc' : 'fc',
            f.status !== 'up' ? 'down' : '',
            isActor ? 'now' : '',
            isTarget ? 'pick' : '',
            tappable ? 'can' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const tag = showTag ? (
            <span className="tg">
              <span className="tn">{labelOf(view, f.id)}</span>
              {f.side === 'foe' && mark ? <span className="it">{mark}</span> : null}
              {f.status === 'up' ? <Bar f={f} /> : <span>{bandWord(f)}</span>}
              {isTarget && preview ? (
                <span className="odds num">
                  {preview.effect === 'heal' || preview.effect === 'raise'
                    ? `+${preview.damage.min.total}`
                    : preview.effect === 'other'
                      ? actionName(picked?.actionId ?? '')
                      : `${pct(preview.hit.total)}% · ${preview.damage.min.total}–${preview.damage.max.total}`}
                </span>
              ) : (
                <span className="num">
                  {f.health}/{f.maxHealth}
                </span>
              )}
            </span>
          ) : null;
          // A foe's tag stands above it in place of its intent mark, so it never covers the piece
          // below; an adventurer's tag stands under it, as in the mock-up.
          const body = (
            <>
              {f.side === 'foe' && tag ? (
                tag
              ) : mark ? (
                <span className={acted ? 'mark done' : 'mark'}>{mark}</span>
              ) : null}
              <span
                className={FACING_LEFT.has(f.id) ? 'sd flip' : 'sd'}
                style={{
                  height,
                  width: Math.round(height * (f.kindId === 'foe.hound' ? 1.1 : 0.62)),
                  backgroundImage: `url(play/${art})`,
                }}
                aria-hidden="true"
              />
              {f.side === 'party' && tag ? (
                tag
              ) : f.side === 'foe' && tag ? null : (
                <span className="bar1">
                  {number ? <span className="n">{number}</span> : null}
                  <Bar f={f} />
                </span>
              )}
            </>
          );
          const style = { left: `${left}%`, bottom: `${bottom}%` };
          const label = `${labelOf(view, f.id)}, ${f.health} of ${f.maxHealth}${bandWord(f) ? `, ${bandWord(f)}` : ''}${mark ? `, ${mark}` : ''}`;
          return tappable ? (
            <button
              key={f.id}
              className={classes}
              style={style}
              onClick={() => tapFighter(f.id)}
              aria-label={label}
              aria-pressed={isTarget}
            >
              {body}
            </button>
          ) : (
            <div key={f.id} className={classes} style={style} aria-label={label} role="img">
              {body}
            </div>
          );
        })}
        {props.notice ? (
          <button className="notice" onClick={props.onDismissNotice}>
            {props.notice}
          </button>
        ) : null}
      </div>
      <div className="panel">
        <div
          className="cmds"
          role="group"
          aria-label={actorView ? labelOf(view, actorView.id) : ''}
        >
          <span className="ph-title">{actorView ? labelOf(view, actorView.id) : ''}</span>
          {packOpen ? (
            <>
              {view.pack.map((item, i) => {
                const usable =
                  (actions.find((a) => a.actionId === PACK_ACTION)?.packTargets[i] ?? []).length >
                  0;
                return (
                  <button
                    key={i}
                    className={
                      picked?.actionId === PACK_ACTION && picked.packIndex === i
                        ? 'cmd on wide'
                        : 'cmd wide'
                    }
                    disabled={!usable}
                    onClick={() => setPicked({ actionId: PACK_ACTION, packIndex: i })}
                  >
                    {nameOf(item.kindId)}
                  </button>
                );
              })}
              <button
                className="cmd wide"
                onClick={() => {
                  setSelection({
                    key: turnKey,
                    picked: plain ? { actionId: plain } : null,
                    packOpen: false,
                  });
                }}
              >
                {t('pack.close')}
              </button>
            </>
          ) : (
            actions.map((a) => {
              const half = a.actionId === PACK_ACTION || a.actionId === SWAP_ACTION;
              const on = picked?.actionId === a.actionId;
              return (
                <button
                  key={a.actionId}
                  className={['cmd', half ? 'half' : 'wide', on ? 'on' : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={on}
                  disabled={!a.usable}
                  onClick={() => tapAction(a.actionId)}
                >
                  {actionName(a.actionId)}
                  {a.actionId === PACK_ACTION ? (
                    <span className="num">{view.pack.length}</span>
                  ) : a.usesLeft !== null ? (
                    <span className="num">
                      {a.usesLeft}/{gate1Delve.rules.skillUses}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
        <div className="side">
          <div className="plist">
            {view.fighters
              .filter((f) => f.side === 'party')
              .map((f) => {
                const tappable = targets.includes(f.id);
                const content = (
                  <>
                    <span className="tn">{nameOf(f.id)}</span>
                    <span className="num">
                      {f.status === 'up' ? `${f.health}/${f.maxHealth}` : bandWord(f)}
                    </span>
                    <Bar f={f} />
                  </>
                );
                const cls = [
                  'pl',
                  f.id === actorId ? 'now' : '',
                  f.status !== 'up' ? 'down' : '',
                  f.id === picked?.targetId ? 'pick' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return tappable ? (
                  <button key={f.id} className={cls} onClick={() => tapFighter(f.id)}>
                    {content}
                  </button>
                ) : (
                  <div key={f.id} className={cls}>
                    {content}
                  </div>
                );
              })}
          </div>
          <div className="target num" aria-live="polite">
            {targetLine}
          </div>
        </div>
      </div>
      {view.phase === 'ended' ? <EndCard view={view} onNewFight={props.onNewFight} /> : null}
    </div>
  );
}

function EndCard({
  view,
  onNewFight,
}: {
  readonly view: FightView;
  readonly onNewFight: () => void;
}) {
  const won = view.outcome === 'won';
  return (
    <>
      <div className="dim" aria-hidden="true" />
      <div className="endcard" role="dialog" aria-label={t(won ? 'end.won' : 'end.routed')}>
        <h3>{t(won ? 'end.won' : 'end.routed')}</h3>
        <p>{t(won ? 'end.won.line' : 'end.routed.line')}</p>
        <ul className="num">
          {view.fighters
            .filter((f) => f.side === 'party')
            .map((f) => (
              <li key={f.id}>
                <span>{nameOf(f.id)}</span>
                <span>
                  {f.health === f.maxHealth ? t('band.unhurt') : bandWord(f)}
                  {f.status === 'up' && f.health < f.maxHealth ? ` ${f.health}/${f.maxHealth}` : ''}
                </span>
              </li>
            ))}
        </ul>
        <button className="btn" onClick={onNewFight}>
          {t('end.new')}
        </button>
      </div>
    </>
  );
}

interface Piece {
  readonly f: FighterView;
  readonly left: number;
  readonly bottom: number;
  readonly scale: number;
}

/** Where each piece stands: party left (back row furthest left), foes right (back row furthest right). */
function layout(view: FightView): Piece[] {
  const out: Piece[] = [];
  const place = (
    side: 'party' | 'foe',
    row: 'front' | 'back',
    xs: readonly [number, number],
    table: Readonly<Record<number, readonly number[]>> = LANES,
  ): void => {
    const group = view.fighters.filter(
      (f) => f.side === side && f.row === row && f.status !== 'fled',
    );
    const lanes = table[Math.min(group.length, 5)] ?? [];
    group.forEach((f, i) => {
      const bottom = lanes[Math.min(i, lanes.length - 1)] ?? 3;
      out.push({ f, left: xs[i % 2]!, bottom, scale: 0.78 + (0.22 * (66 - bottom)) / 63 });
    });
  };
  place('party', 'back', [12, 13]);
  place('party', 'front', [35, 36]);
  place('foe', 'front', [60, 66]);
  place('foe', 'back', [86, 80], BACK_FOE_LANES);
  return out;
}
