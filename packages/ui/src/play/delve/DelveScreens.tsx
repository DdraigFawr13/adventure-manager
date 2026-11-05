// The delve's screens between the fights (D-232, mock-up docs/design/mockups/delve-screens.html):
// start card, choice room, breather (with Scout ahead), and the delve's end. They show the
// engine's views; no rule is computed here (GAME-02).
import { useState, type ReactNode } from 'react';
import {
  approachChances,
  type Approach,
  type DelveView,
  type GameState,
  type MemberView,
  type Row,
} from '@adventure-manager/engine';
import { GATE1_SITE, gate1Delve } from '@adventure-manager/content';
import { BACKDROP } from '../fight/FightScreen.tsx';
import { actionName, memberLabel, nameOf, roomWords, t, wayWords } from '../words.ts';

const pct = (bp: number): number => Math.floor(bp / 100);

/** The picked try of a choice room, shown as its result until "Go on". */
export interface ChoiceTry {
  readonly onFailure: 'hurt' | 'alert';
}

interface FrameProps {
  readonly id: string;
  readonly sub: string;
  readonly delve?: DelveView;
  readonly title: string;
  readonly small?: ReactNode;
  readonly notice: string;
  readonly onDismissNotice: () => void;
  readonly children: ReactNode;
  readonly acts: ReactNode;
}

/** Band, optional track, the room's picture with its name, the paper sheet, the buttons. */
function Frame(props: FrameProps) {
  return (
    <div id={props.id} className="fight">
      <div className="band">
        <div>
          <div className="t">{nameOf(GATE1_SITE)}</div>
          <div className="s">{props.sub}</div>
        </div>
      </div>
      {props.delve ? <Track delve={props.delve} /> : null}
      <div className="stage scene">
        <div className="wall" style={{ backgroundImage: `url(${BACKDROP})` }} aria-hidden="true" />
        <div className="haze" aria-hidden="true" />
        <div className="rname">
          {props.title}
          {props.small ? <small>{props.small}</small> : null}
        </div>
      </div>
      <div className="sheet">{props.children}</div>
      <div className="acts">{props.acts}</div>
      {props.notice ? (
        <button className="notice" onClick={props.onDismissNotice}>
          {props.notice}
        </button>
      ) : null}
    </div>
  );
}

/** One chip per room: its kind, "?" while unseen, the boss last (D-232). */
export function Track({ delve }: { readonly delve: DelveView }) {
  const between = delve.phase === 'breather';
  return (
    <div className="track" aria-label={t('rooms')}>
      {delve.rooms.map((r) => {
        const here =
          delve.phase !== 'ended' && (between ? r.index === delve.roomIndex + 1 : r.current);
        const stop = delve.phase === 'ended' && r.current && !r.done;
        const cls = [
          r.done ? 'done' : '',
          stop ? 'stop' : '',
          here && !r.done ? 'here' : '',
          r.kind === 'boss' && !r.done ? 'boss' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <span key={r.index} className={cls || undefined}>
            {t(`room.kind.${r.kind ?? 'unknown'}`)}
          </span>
        );
      })}
    </div>
  );
}

/** "Hurt 9/17", a Down member's band alone; `plain` leaves an unhurt member's word out. */
function healthText(m: MemberView, plain: boolean): string {
  if (m.status !== 'up') return t(`band.${m.band}`);
  const numbers = `${m.health}/${m.maxHealth}`;
  return plain && m.band === 'unhurt' ? numbers : `${t(`band.${m.band}`)} ${numbers}`;
}

function Bar({ m }: { readonly m: MemberView }) {
  const width = m.maxHealth ? Math.round((100 * m.health) / m.maxHealth) : 0;
  const cls = m.band === 'hurt' ? 'hp hurt' : m.band === 'unhurt' ? 'hp' : 'hp bad';
  return (
    <span className={cls}>
      <i style={{ width: `${width}%` }} />
    </span>
  );
}

/** "Draught 2 · Firebomb 2": the pack's items by kind. */
function packText(delve: DelveView): string {
  const counts = new Map<string, number>();
  for (const p of delve.pack) counts.set(p.kindId, (counts.get(p.kindId) ?? 0) + 1);
  return [...counts].map(([kind, n]) => `${nameOf(kind)} ${n}`).join(' · ') || t('parts.none');
}

/** Parts grouped by part and rarity, with counts. */
function partRows(delve: DelveView): { key: string; name: string; rarity: string; n: number }[] {
  const groups = new Map<string, { key: string; name: string; rarity: string; n: number }>();
  for (const p of delve.parts) {
    const key = `${p.partId}/${p.rarity}`;
    const g = groups.get(key) ?? {
      key,
      name: nameOf(p.partId),
      rarity: nameOf(`rarity.${p.rarity}`),
      n: 0,
    };
    groups.set(key, { ...g, n: g.n + 1 });
  }
  return [...groups.values()];
}

function partsText(delve: DelveView): string {
  return partRows(delve)
    .map((p) => `${p.name} ${p.n}`)
    .join(' · ');
}

// ---- Start card ----

interface StartProps {
  readonly state: GameState;
  /** The throwaway start's view: the party, rows and pack as the delve would begin. */
  readonly preview: DelveView;
  readonly notice: string;
  readonly onDismissNotice: () => void;
  readonly onStart: (approach: Approach) => void;
}

export function StartScreen(props: StartProps) {
  const [approach, setApproach] = useState<Approach>('assault');
  const { preview } = props;
  const chances = approachChances(
    props.state,
    GATE1_SITE,
    preview.members.map((m) => m.id),
  );
  const danger = gate1Delve.sites[GATE1_SITE]?.danger ?? '';
  return (
    <Frame
      id="start"
      sub={nameOf(`danger.${danger}`)}
      title={t('start.title')}
      small={t('start.sub')}
      notice={props.notice}
      onDismissNotice={props.onDismissNotice}
      acts={
        <button className="btn2 go" onClick={() => props.onStart(approach)}>
          {t('start.go')}
        </button>
      }
    >
      <p className="say">{t('start.ask')}</p>
      <div className="appr" role="group" aria-label={t('start.approach')}>
        {chances.map((c) => (
          <button
            key={c.approach}
            className={approach === c.approach ? 'on' : undefined}
            aria-pressed={approach === c.approach}
            onClick={() => setApproach(c.approach)}
          >
            {nameOf(`approach.${c.approach}`)}
            <span className="num">
              {memberLabel(c.bestId)} {pct(c.chance.total)}%
            </span>
          </button>
        ))}
      </div>
      <p className="note">{t('start.note')}</p>
      <div className="mems">
        {preview.members.map((m) => (
          <div key={m.id} className="mem">
            <span className="tn">{nameOf(m.id)}</span>
            <span className="num">
              {m.health}/{m.maxHealth}
            </span>
            <span className="sk">
              {nameOf(m.kindId)} · {t(`row.${m.row}`)}
            </span>
          </div>
        ))}
      </div>
      <div className="kit num">
        <span>
          <b>{t('start.pack')}</b> {packText(preview)}
        </span>
      </div>
    </Frame>
  );
}

// ---- Choice room ----

interface ChoiceProps {
  readonly state: GameState;
  readonly delve: DelveView;
  readonly notice: string;
  readonly onDismissNotice: () => void;
  readonly onChoose: (optionIndex: number, testerId: string, onFailure: 'hurt' | 'alert') => void;
}

export function ChoiceScreen(props: ChoiceProps) {
  const { delve } = props;
  const [picked, setPicked] = useState<{ option: number; tester: string } | null>(null);
  const choice = delve.choice;
  const words = roomWords(delve.roomId);
  const approach = props.state.delve?.approach ?? '';
  const tap = (option: number, tester: string, onFailure: 'hurt' | 'alert'): void => {
    if (picked?.option === option && picked.tester === tester) {
      props.onChoose(option, tester, onFailure);
      return;
    }
    setPicked({ option, tester });
  };
  const pickedChance = choice
    ? choice.options[picked?.option ?? -1]?.testers.find((x) => x.id === picked?.tester)?.chance
    : undefined;
  return (
    <Frame
      id="choice"
      sub={t('room.of', { n: delve.roomIndex + 1, total: delve.rooms.length })}
      delve={delve}
      title={words.name}
      notice={props.notice}
      onDismissNotice={props.onDismissNotice}
      acts={null}
    >
      <p className="say">{words.line}</p>
      {choice?.options.map((o, i) => (
        <div key={i} className="opt">
          <div className="oh">
            <span className="tn">{wayWords(choice.roomId, i, approach)}</span>
            <span>{nameOf(`attr.${o.attribute}`)}</span>
          </div>
          <div className="fail">
            {o.onFailure === 'hurt'
              ? t('choice.fail.hurt', { n: delve.choiceHurt })
              : t('choice.fail.alert')}
          </div>
          <div className="testers" role="group" aria-label={t('choice.who')}>
            {o.testers.map((x) => (
              <button
                key={x.id}
                className={picked?.option === i && picked.tester === x.id ? 'tester on' : 'tester'}
                aria-pressed={picked?.option === i && picked.tester === x.id}
                onClick={() => tap(i, x.id, o.onFailure)}
              >
                {memberLabel(x.id)}
                <span className="num">{pct(x.chance.total)}%</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {picked && pickedChance ? (
        <div className="picked num" aria-live="polite">
          {t('choice.picked', {
            name: memberLabel(picked.tester),
            chance: pct(pickedChance.total),
          })}
        </div>
      ) : null}
    </Frame>
  );
}

/** The try's result, after the engine has rolled it; "Go on" leads to the breather. */
export function ChoiceResult(props: {
  readonly delve: DelveView;
  readonly attempt: ChoiceTry;
  readonly notice: string;
  readonly onDismissNotice: () => void;
  readonly onGoOn: () => void;
}) {
  const { delve } = props;
  const last = delve.lastChoice;
  const words = roomWords(delve.roomId);
  const name = last ? memberLabel(last.testerId) : '';
  let line = '';
  if (last)
    line = last.success
      ? t(delve.offGuard ? 'choice.ok.entry' : 'choice.ok', { name })
      : props.attempt.onFailure === 'hurt'
        ? t('choice.failed.hurt', { name, n: delve.choiceHurt })
        : t('choice.failed.alert', { name });
  return (
    <Frame
      id="choice-result"
      sub={t('room.of', { n: delve.roomIndex + 1, total: delve.rooms.length })}
      delve={{ ...delve, phase: 'choice' }}
      title={words.name}
      notice={props.notice}
      onDismissNotice={props.onDismissNotice}
      acts={
        <button className="btn2 go" onClick={props.onGoOn}>
          {t('choice.on')}
        </button>
      }
    >
      <p className={last?.success === false ? 'note bad' : 'note'}>{line}</p>
    </Frame>
  );
}

// ---- Breather ----

interface BreatherProps {
  readonly delve: DelveView;
  /** Who rose at the end of the last fight (from its events), by short name. */
  readonly raised: readonly { readonly id: string; readonly health: number }[];
  readonly notice: string;
  readonly onDismissNotice: () => void;
  readonly onScout: () => void;
  readonly onRow: (id: string, row: Row) => void;
  readonly onNext: () => void;
}

export function BreatherScreen(props: BreatherProps) {
  const { delve } = props;
  const total = delve.rooms.length;
  const here = delve.rooms[delve.roomIndex];
  const words = roomWords(delve.roomId);
  const wasChoice = here?.kind === 'choice';
  const scoutName = delve.scout ? memberLabel(delve.scout.scoutId) : '';
  const next = delve.next;
  const heard = delve.scouted && !next;
  const nextWords = next ? roomWords(next.roomId) : null;

  let title = t(wasChoice ? 'breather.choice' : 'breather.won', { room: words.name });
  let small: ReactNode = null;
  if (next && nextWords) {
    title = t('scout.seen', { name: scoutName || nameOf('class.rogue') });
    small = `${t('next.room', { n: delve.roomIndex + 2 })}: ${nextWords.name}`;
  } else if (heard) title = t('scout.heard', { name: scoutName || nameOf('class.rogue') });

  const names = (ids: readonly string[]): string => ids.map(memberLabel).join(', ');
  const stays = delve.members.filter((m) => m.status === 'down').map((m) => m.id);

  const members = (full: boolean): ReactNode => (
    <div className="mems">
      {delve.members.map((m) => (
        <div key={m.id} className={m.status === 'up' ? 'mem' : 'mem down'}>
          <span className="tn">{nameOf(m.id)}</span>
          <span className="num st">{healthText(m, true)}</span>
          <Bar m={m} />
          {full ? (
            <span className="sk num">
              {m.skills.map((s) => `${actionName(s.actionId)} ${s.usesLeft}`).join(' · ')}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );

  let body: ReactNode;
  if (next && nextWords) {
    const side = (row: Row): string =>
      [...new Set(next.foes.filter((f) => f.row === row).map((f) => f.kindId))]
        .map(
          (k) =>
            `${nameOf(k)} × ${next.foes.filter((f) => f.row === row && f.kindId === k).length}`,
        )
        .join(', ');
    body = (
      <>
        <h3>
          {t(
            next.kind === 'boss'
              ? 'scout.next.boss'
              : next.kind === 'fight'
                ? 'scout.next.fight'
                : 'scout.next.choice',
            {
              n: next.foes.length,
            },
          )}
        </h3>
        {next.foes.length ? (
          <div className="foeline num">
            {(['front', 'back'] as const)
              .filter((row) => side(row))
              .map((row) => (
                <span key={row}>
                  {t(`scout.${row}`)}: {side(row)}
                </span>
              ))}
          </div>
        ) : null}
        {next.foes.length ? <p className="note">{t('scout.rules')}</p> : null}
        {next.kind === 'choice' ? null : (
          <div className="rows" role="group" aria-label={t('scout.rows')}>
            {delve.members
              .filter((m) => m.status !== 'dead')
              .map((m) => (
                <div key={m.id} className="rowset">
                  <span className="tn num">
                    {memberLabel(m.id)}
                    {m.health < m.maxHealth ? ` ${m.health}/${m.maxHealth}` : ''}
                  </span>
                  {(['front', 'back'] as const).map((row) => (
                    <button
                      key={row}
                      className={m.row === row ? 'on' : undefined}
                      aria-pressed={m.row === row}
                      onClick={() => m.row !== row && props.onRow(m.id, row)}
                    >
                      {t(`scout.${row}`)}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        )}
      </>
    );
  } else if (heard) {
    body = (
      <>
        <p className="say">{t('scout.heard.line')}</p>
        <p className="note bad">{t('room.alerted')}</p>
        {members(false)}
      </>
    );
  } else {
    body = (
      <>
        {props.raised.length ? (
          <p className="note">
            {t('breather.raised', {
              names: names(props.raised.map((r) => r.id)),
              n: props.raised[0]?.health ?? 0,
            })}
          </p>
        ) : null}
        {stays.length ? <p className="note">{t('breather.out', { names: names(stays) })}</p> : null}
        {members(true)}
        <div className="kit num">
          <span>
            <b>{t('start.pack')}</b> {packText(delve)}
          </span>
          <span>
            <b>{t('parts')}</b> {partsText(delve) || t('parts.none')}
          </span>
        </div>
      </>
    );
  }

  return (
    <Frame
      id="breather"
      sub={t('breather', { n: delve.roomIndex + 1, total })}
      delve={delve}
      title={title}
      small={small}
      notice={props.notice}
      onDismissNotice={props.onDismissNotice}
      acts={
        <>
          {delve.scout && !delve.scouted ? (
            <button className="btn2" disabled={!delve.scout.open} onClick={props.onScout}>
              {t('scout')}
              <small className="num">
                {scoutName} {pct(delve.scout.chance.total)}%
              </small>
            </button>
          ) : null}
          <button className="btn2 go" onClick={props.onNext}>
            {t('next')}
            <small>{t('next.room', { n: delve.roomIndex + 2 })}</small>
          </button>
        </>
      }
    >
      {body}
    </Frame>
  );
}

// ---- The delve's end ----

export function EndScreen(props: {
  readonly delve: DelveView;
  readonly notice: string;
  readonly onDismissNotice: () => void;
  readonly onNew: () => void;
}) {
  const { delve } = props;
  const outcome = delve.outcome ?? 'routed';
  const parts = partRows(delve);
  return (
    <Frame
      id="end"
      sub={t('end.over')}
      delve={delve}
      title={t(`end.delve.${outcome}`)}
      small={t(`end.delve.${outcome}.line`)}
      notice={props.notice}
      onDismissNotice={props.onDismissNotice}
      acts={
        <button className="btn2 go" onClick={props.onNew}>
          {t('end.new')}
        </button>
      }
    >
      <ul className="res num">
        {delve.members.map((m) => {
          const injured = delve.ends.find((e) => e.adventurerId === m.id)?.injury ?? false;
          return (
            <li key={m.id} className={m.status === 'up' ? undefined : 'bad'}>
              <span className="tn">{nameOf(m.id)}</span>
              <span>
                {healthText(m, false)}
                {injured ? ` · ${t('end.injury')}` : ''}
              </span>
            </li>
          );
        })}
      </ul>
      <span className="lbl">{t(outcome === 'won' ? 'parts' : 'parts.kept')}</span>
      <ul className="res num">
        {parts.length ? (
          parts.map((p) => (
            <li key={p.key}>
              <span>{p.name}</span>
              <span>
                {p.rarity} · {p.n}
              </span>
            </li>
          ))
        ) : (
          <li>
            <span>{t('parts.none')}</span>
          </li>
        )}
      </ul>
    </Frame>
  );
}
