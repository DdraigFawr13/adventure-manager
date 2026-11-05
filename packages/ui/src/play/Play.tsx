// The gate 1 play page (/play.html). S1: opens straight into the sample barrow fight, saves after
// every command, and starts a new fight on request (gate 1 spec, S1).
import { Component, useState, type ReactNode } from 'react';
import { FightScreen } from './fight/FightScreen.tsx';
import { commit, newFight, withView, type Choice, type Game } from './game.ts';
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
  const game = newFight(seed);
  if (store) writeSave(store, game.state, new Date().toISOString());
  return game;
}

function firstLoad(): { game: Game; notice: string } {
  const store = storage();
  if (!store) return { game: freshGame(null), notice: '' };
  const loaded = readSave(store, Date.now());
  if (loaded.state) {
    const game = withView(loaded.state);
    if (game.view) return { game, notice: loaded.note === 'older-rules' ? t('save.older') : '' };
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

  const onAct = (choice: Choice): void => {
    const next = commit(game, choice, storage(), new Date().toISOString());
    setGame(next);
    setLog(next.view ? logLines(next.view, next.events) : []);
  };

  const onNewFight = (): void => {
    setGame(freshGame(storage()));
    setLog([]);
    setNotice('');
  };

  if (!game.view) return <Broken />;
  return (
    <FightScreen
      state={game.state}
      view={game.view}
      log={log}
      notice={notice}
      onAct={onAct}
      onNewFight={onNewFight}
      onDismissNotice={() => setNotice('')}
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
