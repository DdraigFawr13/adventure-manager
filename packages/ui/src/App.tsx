// Watched-quest prototype (D-127, PLAN §9b step 1). Throwaway screen over the real engine.
import { useEffect, useMemo, useRef, useState } from 'react';
import { WOUND, type Plan, type QuestRun } from '@adventure-manager/engine';
import { baseResolution, uiText } from '@adventure-manager/content';
import { choose, newSession, skip, startQuest, step, type Session } from './game.ts';
import { describeChance, narrate, nameOf, type LogLine } from './narrate.ts';

const t = (key: string, vars: Record<string, string> = {}): string =>
  (uiText[key] ?? key).replace(/\{(\w+)\}/g, (slot, k: string) => vars[k] ?? slot);

const APPROACHES = ['stealth', 'assault', 'diplomacy'] as const;
const RISKS = ['cautious', 'steady', 'bold'] as const;
const RETREATS = ['badly-hurt', 'down', 'leader', 'dying', 'never'] as const;

/** What the board shows: the live quest, or the last one as it ended. */
interface BoardView {
  readonly quest: QuestRun;
  readonly ended: boolean;
}

function readWatched(): number {
  try {
    return Number(localStorage.getItem('quest-watch.watched') ?? '0') || 0;
  } catch {
    return 0;
  }
}

function writeWatched(n: number): void {
  try {
    localStorage.setItem('quest-watch.watched', String(n));
  } catch {
    // Storage can be blocked; the counter is only a convenience.
  }
}

export function App() {
  const [templateId, setTemplateId] = useState('quest.barrow-delve');
  const [plan, setPlan] = useState<Plan>({
    approach: 'stealth',
    risk: 'steady',
    retreat: 'leader',
  });
  // The page opens with the first party already on the road, so the board is never empty.
  const [session, setSession] = useState<Session>(() =>
    startQuest(newSession(`watch-${Date.now()}`), 'quest.barrow-delve', plan),
  );

  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(readWatched);
  const [openChance, setOpenChance] = useState<string | null>(null);
  const [skippedThisQuest, setSkippedThisQuest] = useState(false);
  const logEnd = useRef<HTMLLIElement | null>(null);

  const quest = session.state.quest;
  const running = quest !== null;
  const moment = quest?.momentPending ?? false;
  const alive = session.state.roster.filter((a) => !a.dead).length;
  const tooFew = !running && alive < baseResolution.rules.partySize.min;

  const lines = useMemo(
    () => session.events.map(narrate).filter((l): l is LogLine => l !== null),
    [session.events],
  );

  const view: BoardView | null = session.board
    ? { quest: session.board, ended: session.boardEnded }
    : null;

  const endedOutcome = session.events
    .flatMap((e) => (e.type === 'quest.ended' ? [e.outcome] : []))
    .at(-1);

  /** A skipped quest is not a watched one (R1 compares the two). */
  function advance(next: Session, skipped = false): void {
    setSession(next);
    if (skipped) setSkippedThisQuest(true);
    if (!next.state.quest && session.state.quest) {
      setPlaying(false);
      if (!skipped && !skippedThisQuest) setWatched((n) => n + 1);
    }
    if (!session.state.quest && next.state.quest) setSkippedThisQuest(false);
  }

  useEffect(() => writeWatched(watched), [watched]);

  useEffect(() => {
    if (!playing || !running || moment) return;
    const timer = setTimeout(() => advance(step(session)), 900);
    return () => clearTimeout(timer);
    // advance reads the same session; the timer restarts only when the quest moves on.
  }, [playing, session, moment]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [lines.length]);

  useEffect(() => {
    if (moment) setPlaying(false);
  }, [moment]);

  const template = baseResolution.quests.find(
    (q) => q.id === (view?.quest.templateId ?? templateId),
  );

  return (
    <div className="desk">
      <header className="masthead">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
        <p className="tally">{t('watched', { n: String(Math.min(watched, 10)) })}</p>
        <p className="seed">{t('seed', { seed: session.state.seed })}</p>
      </header>

      <main className="layout">
        <section className="sheet side" aria-labelledby="party-h">
          <h2 id="party-h">{t('party')}</h2>
          <ul className="roster">
            {session.state.roster.map((a) => {
              const stepNo = view?.quest.steps[a.id] ?? WOUND.fit;
              return (
                <li key={a.id} className={a.dead ? 'is-dead' : ''}>
                  <span className="who">{nameOf(a.id)}</span>
                  <span className="cls">{nameOf(a.classId)}</span>
                  <span className={`state s${a.dead ? 'x' : stepNo}`}>
                    {a.dead ? t('dead') : nameOf(`wound.${stepNo}`)}
                  </span>
                </li>
              );
            })}
          </ul>

          <h2>{t('plan')}</h2>
          <form className="plan" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="contract">{t('contract')}</label>
            <select
              id="contract"
              value={templateId}
              disabled={running}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {baseResolution.quests.map((q) => (
                <option key={q.id} value={q.id}>
                  {nameOf(q.id)} ({nameOf(`danger.${q.danger}`)})
                </option>
              ))}
            </select>
            <label htmlFor="approach">{t('approach')}</label>
            <select
              id="approach"
              value={plan.approach}
              disabled={running}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  approach: APPROACHES.find((v) => v === e.target.value) ?? 'stealth',
                })
              }
            >
              {APPROACHES.map((v) => (
                <option key={v} value={v}>
                  {nameOf(`approach.${v}`)}
                </option>
              ))}
            </select>
            <label htmlFor="risk">{t('risk')}</label>
            <select
              id="risk"
              value={plan.risk}
              disabled={running}
              onChange={(e) =>
                setPlan({ ...plan, risk: RISKS.find((v) => v === e.target.value) ?? 'steady' })
              }
            >
              {RISKS.map((v) => (
                <option key={v} value={v}>
                  {nameOf(`risk.${v}`)}
                </option>
              ))}
            </select>
            <label htmlFor="retreat">{t('retreat')}</label>
            <select
              id="retreat"
              value={plan.retreat}
              disabled={running}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  retreat: RETREATS.find((v) => v === e.target.value) ?? 'leader',
                })
              }
            >
              {RETREATS.map((v) => (
                <option key={v} value={v}>
                  {nameOf(`retreat.${v}`)}
                </option>
              ))}
            </select>
          </form>
          {tooFew ? (
            <div className="notice">
              <p>{t('tooFew')}</p>
              <button
                type="button"
                onClick={() => {
                  setSession(newSession(`watch-${Date.now()}`));
                }}
              >
                {t('newGuild')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={running}
              onClick={() => advance(startQuest(session, templateId, plan))}
            >
              {t('setOut')}
            </button>
          )}
        </section>

        <section className="sheet board-sheet" aria-labelledby="board-h">
          <h2 id="board-h">
            {t('board')}
            {template ? <span className="where"> · {nameOf(template.id)}</span> : null}
          </h2>
          {view && template ? (
            <Board
              view={view}
              dead={new Set(session.state.roster.filter((a) => a.dead).map((a) => a.id))}
            />
          ) : (
            <p className="hint">{t('waiting')}</p>
          )}

          {view?.ended && endedOutcome ? (
            <p className="tag ended">
              {t('ended', { outcome: nameOf(`outcome.${endedOutcome}`) })}
            </p>
          ) : null}
          {moment ? (
            <div className="seal" role="group" aria-label={t('moment')}>
              <span className="wax" aria-hidden="true" />
              <p>{t('moment')}</p>
              <div className="row">
                <button
                  type="button"
                  className="primary"
                  onClick={() => advance(choose(session, 'push-on'))}
                >
                  {t('pushOn')}
                </button>
                <button type="button" onClick={() => advance(choose(session, 'pull-out'))}>
                  {t('pullOut')}
                </button>
              </div>
            </div>
          ) : null}

          <div className="controls">
            <button
              type="button"
              disabled={!running || moment}
              onClick={() => advance(step(session))}
            >
              {t('next')}
            </button>
            <button
              type="button"
              disabled={!running || moment}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? t('pause') : t('play')}
            </button>
            <button
              type="button"
              disabled={!running || moment}
              onClick={() => advance(skip(session), true)}
            >
              {t('skip')}
            </button>
          </div>
        </section>

        <section className="sheet log-sheet" aria-labelledby="log-h">
          <h2 id="log-h">{t('log')}</h2>
          <p className="hint">{t('chanceHint')}</p>
          <ol className="log">
            {lines.map((l) => (
              <li key={l.id} className={`k-${l.kind}`}>
                <span>{l.text}</span>
                {l.chance ? (
                  <button
                    type="button"
                    className="pct"
                    aria-expanded={openChance === l.id}
                    onClick={() => setOpenChance(openChance === l.id ? null : l.id)}
                  >
                    {l.chance.total / 100}%
                  </button>
                ) : null}
                {l.chance && openChance === l.id ? (
                  <span className="why">{describeChance(l.chance, l.purpose ?? '')}</span>
                ) : null}
              </li>
            ))}
            <li ref={logEnd} aria-hidden="true" className="end-marker" />
          </ol>
          <p className="hint notes">{t('notes')}</p>
        </section>
      </main>
    </div>
  );
}

function Board({ view, dead }: { view: BoardView; dead: ReadonlySet<string> }) {
  const { quest } = view;
  const template = baseResolution.quests.find((q) => q.id === quest.templateId);
  if (!template) return null;
  const stops = ['start', ...template.scenes.map((s) => s.id), 'lair'];
  const at =
    quest.phase === 'fight' || (quest.phase === 'retreat' && quest.fledFight)
      ? stops.length - 1
      : Math.min(quest.sceneIndex, stops.length - 2);
  return (
    <div className="board">
      <ol className="path">
        {stops.map((stop, i) => (
          <li key={stop} className={i < at ? 'done' : i === at ? 'here' : 'ahead'}>
            <span className="stop-name">
              {stop === 'start' ? t('start') : stop === 'lair' ? t('lair') : nameOf(stop)}
            </span>
            {i === at ? (
              <div className="standees">
                {quest.partyIds.map((id) => {
                  const s = quest.steps[id] ?? 0;
                  return (
                    <span
                      key={id}
                      className={`standee s${dead.has(id) ? 'x' : s}`}
                      title={`${nameOf(id)}: ${dead.has(id) ? t('dead') : nameOf(`wound.${s}`)}`}
                    >
                      {initials(nameOf(id))}
                    </span>
                  );
                })}
                {quest.phase === 'retreat' ? <span className="tag">{t('withdrawing')}</span> : null}
              </div>
            ) : null}
            {stop === 'lair' ? (
              <div className="standees foes">
                {quest.foes.map((f) => (
                  <span key={f.id} className={`standee foe s${f.step}`} title={nameOf(f.id)}>
                    {initials(nameOf(f.id))}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function initials(name: string): string {
  return name
    .replace(/^the /i, '')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}
