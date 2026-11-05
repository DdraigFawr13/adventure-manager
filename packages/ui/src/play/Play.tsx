// The gate 1 play page (/play.html). S2: opens on the start card, plays one barrow delve screen by
// screen, saves after every command, and starts a new delve on request (gate 1 spec, S2).
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { FightScreen } from './fight/FightScreen.tsx';
import {
  AUTO_STEP_MS,
  autoDue,
  chooseWay,
  newDelve,
  nextRoom,
  play,
  previewStart,
  retreatNow,
  saved,
  scoutAhead,
  setAuto,
  setRows,
  startDelve,
  stepAuto,
  withView,
  type Game,
} from './game.ts';
import {
  BreatherScreen,
  ChoiceResult,
  ChoiceScreen,
  EndScreen,
  StartScreen,
  type ChoiceTry,
} from './delve/DelveScreens.tsx';
import { SAVE_KEY, keepAside, nextSeed, readSave, writeSave, type Store } from './save.ts';
import { logLines, t } from './words.ts';

/** Storage that drops every write: used once an unreadable save could not be kept aside (GAME-05). */
const READ_ONLY: Store = { getItem: () => null, setItem: () => undefined };

/** False once an unreadable save could not be copied aside: the page then plays without saving. */
let writable = true;

function storage(): Store | null {
  if (!writable) return READ_ONLY;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const today = (): string => new Date().toISOString().slice(0, 10);

function freshGame(store: Store | null): Game {
  const seed = store ? nextSeed(store, today()) : `${today()}-0`;
  const game = newDelve(seed);
  if (store) writeSave(store, game.state, new Date().toISOString());
  return game;
}

function firstLoad(): { game: Game; notice: string } {
  const store = storage();
  if (!store) return { game: freshGame(null), notice: '' };
  const loaded = readSave(store, Date.now());
  if (loaded.state) {
    const game = withView(loaded.state);
    if (game.delve || !loaded.state.delve)
      return { game, notice: loaded.note === 'older-rules' ? t('save.older') : '' };
  }
  if (!loaded.mayWrite) writable = false;
  return {
    game: freshGame(storage()),
    notice: loaded.note === 'unreadable' ? t('save.unreadable') : '',
  };
}

export function Play() {
  const [start] = useState(firstLoad);
  const [game, setGame] = useState<Game>(start.game);
  const [notice, setNotice] = useState(start.notice);
  const [log, setLog] = useState<string[]>([]);
  // Screen-only state: the choice result before "Go on", the closed room card, the Retreat card.
  const [attempt, setAttempt] = useState<ChoiceTry | null>(null);
  const [cardClosed, setCardClosed] = useState('');
  const [retreatOpen, setRetreatOpen] = useState(false);
  const latest = useRef(game);

  /** Shows a game after a command and saves it at once (gate 1 spec: a save after every command). */
  const show = (next: Game): void => {
    saved(next, storage(), new Date().toISOString());
    latest.current = next;
    setGame(next);
    setLog(next.view ? logLines(next.view, next.events) : []);
    setRetreatOpen(false);
  };

  const { delve, view } = game;
  const runId = game.state.delve?.id ?? '';
  const cardKey = `${runId}:${delve?.roomIndex ?? 0}`;
  const cardOpen =
    !!delve &&
    !!view &&
    delve.phase === 'fight' &&
    view.round === 1 &&
    cardClosed !== cardKey &&
    !view.order.some((o) => o.acted && view.fighters.find((f) => f.id === o.id)?.side === 'party');

  // Auto plays one adventurer turn (and the foes' turns after it) every 0.6 s while it is on.
  const stepKey = game.state.nextEventNo;
  useEffect(() => {
    if (cardOpen || !autoDue(latest.current)) return;
    const timer = window.setTimeout(() => {
      if (autoDue(latest.current)) show(stepAuto(latest.current));
    }, AUTO_STEP_MS);
    return () => window.clearTimeout(timer);
    // `show` only reads refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, cardOpen]);

  const dismiss = (): void => setNotice('');

  const onNewDelve = (): void => {
    const store = storage();
    const fresh = freshGame(store);
    latest.current = fresh;
    setGame(fresh);
    setLog([]);
    setNotice('');
    setAttempt(null);
    setRetreatOpen(false);
  };

  if (!delve) {
    const preview = previewStart(game);
    if (!preview) return <Broken />;
    return (
      <StartScreen
        key={game.state.seed}
        state={game.state}
        preview={preview}
        notice={notice}
        onDismissNotice={dismiss}
        onStart={(approach) => {
          setNotice('');
          show(startDelve(game, approach));
        }}
      />
    );
  }
  if (delve.phase === 'ended') {
    return <EndScreen delve={delve} notice={notice} onDismissNotice={dismiss} onNew={onNewDelve} />;
  }
  if (delve.phase === 'choice') {
    return (
      <ChoiceScreen
        key={game.state.nextEventNo}
        state={game.state}
        delve={delve}
        notice={notice}
        onDismissNotice={dismiss}
        onChoose={(option, tester, onFailure) => {
          setAttempt({ onFailure });
          show(chooseWay(game, option, tester));
        }}
      />
    );
  }
  if (delve.phase === 'breather') {
    if (attempt)
      return (
        <ChoiceResult
          delve={delve}
          attempt={attempt}
          notice={notice}
          onDismissNotice={dismiss}
          onGoOn={() => setAttempt(null)}
        />
      );
    const raised = game.events.flatMap((e) =>
      e.type === 'fighter.raised' ? [{ id: e.subjectIds[0] ?? '', health: e.health }] : [],
    );
    return (
      <BreatherScreen
        delve={delve}
        raised={raised}
        notice={notice}
        onDismissNotice={dismiss}
        onScout={() => show(scoutAhead(game))}
        onRow={(id, row) => show(setRows(game, { [id]: row }))}
        onNext={() => show(nextRoom(game))}
      />
    );
  }
  if (!view) return <Broken />;
  return (
    <FightScreen
      state={game.state}
      view={view}
      delve={delve}
      log={log}
      notice={notice}
      card={cardOpen}
      retreatOpen={retreatOpen}
      onAct={(choice) => show(play(game, choice))}
      onCardGo={() => setCardClosed(cardKey)}
      onAuto={(on) => show(setAuto(game, on))}
      onSaveSkills={(on) => show(setAuto(game, delve.auto.on, on))}
      onRetreatAsk={setRetreatOpen}
      onRetreat={() => show(retreatNow(game))}
      onDismissNotice={dismiss}
    />
  );
}

/** A page that failed: keep the save aside (never lost, GAME-05) and offer a new fight. */
function Broken() {
  const restart = (): void => {
    try {
      const text = window.localStorage.getItem(SAVE_KEY);
      if (text && keepAside(window.localStorage, text, Date.now()))
        window.localStorage.removeItem(SAVE_KEY);
    } catch {
      // Storage is blocked; the reload starts a fight in memory.
    }
    window.location.reload();
  };
  return (
    <div className="broken" role="alert">
      <p>{t('broken')}</p>
      <button className="btn" onClick={restart}>
        {t('new.fight')}
      </button>
    </div>
  );
}

export class PlayBoundary extends Component<{ readonly children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    return this.state.failed ? <Broken /> : this.props.children;
  }
}
