// The gate 1 play page (/play.html). S1: opens straight into the sample barrow fight, saves after
// every command, and starts a new fight on request (gate 1 spec, S1).
import { useState } from 'react';
import { FightScreen } from './fight/FightScreen.tsx';
import { newFight, play, withView, type Choice, type Game } from './game.ts';
import { nextSeed, readSave, writeSave, type Store } from './save.ts';
import { logLines, t } from './words.ts';

function storage(): Store | null {
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
  if (store) {
    const loaded = readSave(store, Date.now());
    if (loaded.state)
      return {
        game: withView(loaded.state),
        notice: loaded.note === 'older-rules' ? t('save.older') : '',
      };
    return {
      game: freshGame(store),
      notice: loaded.note === 'unreadable' ? t('save.unreadable') : '',
    };
  }
  return { game: freshGame(null), notice: '' };
}

export function Play() {
  const [start] = useState(firstLoad);
  const [game, setGame] = useState<Game>(start.game);
  const [notice, setNotice] = useState(start.notice);
  const [log, setLog] = useState<string[]>([]);

  const onAct = (choice: Choice): void => {
    const next = play(game, choice);
    const store = storage();
    if (store) writeSave(store, next.state, new Date().toISOString());
    setGame(next);
    setLog(next.view ? logLines(next.view, next.events) : []);
  };

  const onNewFight = (): void => {
    setGame(freshGame(storage()));
    setLog([]);
    setNotice('');
  };

  if (!game.view) return null;
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
