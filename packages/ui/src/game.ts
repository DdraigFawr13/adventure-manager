// Prototype session state: one guild state that carries the party from quest to quest, so the
// dead stay dead (R7 needs that later). Every change goes through simulate (GAME-02).
import {
  simulate,
  type Command,
  type GameEvent,
  type GameState,
  type Plan,
  type QuestRun,
} from '@adventure-manager/engine';
import { baseResolution, prototypeParty } from '@adventure-manager/content';

export interface Session {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
  readonly commandNo: number;
  readonly questNo: number;
  readonly day: number;
  /** The quest as the board last saw it; kept after the quest ends so the final board stays up. */
  readonly board: QuestRun | null;
  readonly boardEnded: boolean;
}

export function newSession(seed: string): Session {
  return {
    state: {
      seed,
      rng: {},
      nextEventNo: 1,
      content: baseResolution,
      roster: prototypeParty(),
      quest: null,
      calendar: 1,
      guild: null,
    },
    events: [],
    commandNo: 0,
    questNo: 0,
    day: 1,
    board: null,
    boardEnded: false,
  };
}

function apply(session: Session, command: Command): Session {
  const result = simulate(session.state, command);
  const ended = result.state.quest === null && session.state.quest !== null;
  return {
    ...session,
    state: result.state,
    events: [...session.events, ...result.events],
    commandNo: session.commandNo + 1,
    board:
      result.state.quest ??
      (ended ? finalBoard(session.state.quest, result.events) : session.board),
    boardEnded: result.state.quest === null,
  };
}

export function startQuest(session: Session, templateId: string, plan: Plan): Session {
  const partyIds = session.state.roster.filter((a) => !a.dead).map((a) => a.id);
  const questNo = session.questNo + 1;
  const started = apply(
    { ...session, events: [], questNo, day: session.day + 3 },
    {
      type: 'quest.start',
      id: `c${session.commandNo + 1}`,
      day: session.day + 3,
      questId: `quest-run.${questNo}`,
      templateId,
      partyIds,
      plan,
      watched: true,
    },
  );
  return started;
}

export function step(session: Session): Session {
  return apply(session, { type: 'quest.step', id: `c${session.commandNo + 1}`, day: session.day });
}

export function choose(session: Session, choice: 'push-on' | 'pull-out'): Session {
  return apply(session, {
    type: 'quest.choose',
    id: `c${session.commandNo + 1}`,
    day: session.day,
    choice,
  });
}

/** Steps until the quest ends or a moment needs the player (the auto-resolve comparison in R1). */
export function skip(session: Session): Session {
  let current = session;
  while (current.state.quest && !current.state.quest.momentPending) current = step(current);
  return current;
}

/** The last live quest with the ending command's wound events applied: a view of events. */
function finalBoard(quest: QuestRun | null, events: readonly GameEvent[]): QuestRun | null {
  if (!quest) return null;
  const steps = { ...quest.steps };
  const foes = quest.foes.map((f) => ({ ...f }));
  for (const e of events) {
    const [subject] = e.subjectIds;
    if (!subject) continue;
    if (e.type === 'wound.changed') steps[subject] = e.to;
    if (e.type === 'foe.wounded') {
      const foe = foes.find((f) => f.id === subject);
      if (foe) foe.step = e.to;
    }
  }
  return { ...quest, steps, foes };
}
