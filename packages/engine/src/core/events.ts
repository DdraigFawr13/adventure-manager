// Every state change is an event with a cause id (PLAN §11b, §11h). Event ids are numbered
// across the whole game, so a cause id always names one command or one earlier event.

/** Fields every event carries; the specific event types extend it. */
export interface EventBase {
  readonly id: string;
  readonly type: string;
  readonly day: number;
  /** The command or earlier event that led to this one. */
  readonly causeId: string;
  /** Adventurers, foes or quests this event touches. */
  readonly subjectIds: readonly string[];
}

/** Omit that keeps a union's members apart, so each event type keeps its own fields. */
export type EventInput<E extends EventBase> = E extends EventBase ? Omit<E, 'id' | 'day'> : never;

export class EventSink<E extends EventBase> {
  readonly events: E[] = [];

  constructor(
    private readonly counter: { nextEventNo: number },
    readonly day: number,
  ) {}

  /** Records an event and returns its id for use as the next cause. */
  emit(input: EventInput<E>): string {
    const id = `e${this.counter.nextEventNo}`;
    this.counter.nextEventNo += 1;
    // cast-ok: input is one member of E without id and day; adding both rebuilds that member.
    this.events.push({ ...input, id, day: this.day } as unknown as E);
    return id;
  }
}
