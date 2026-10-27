// Guild Desk (step 4, R7, D-150): the guild as text. Throwaway screens over the real engine;
// every decision is a command (GAME-02), every word from content text.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AREAS, ATTRIBUTES, type Area, type Plan } from '@adventure-manager/engine';
import {
  addTime,
  content,
  continueToStop,
  forget,
  load,
  newDesk,
  rules,
  send,
  store,
  withNotes,
  type Desk,
} from './session.ts';
import {
  ageOf,
  coins,
  dateOf,
  digestOf,
  historyLines,
  nameOf,
  offerParts,
  personName,
  playtestLog,
  recordOf,
  statusOf,
  stopsOf,
  t,
  yearAt,
  type Letter,
} from './view.ts';

const APPROACHES = ['stealth', 'assault', 'diplomacy'] as const;
const RISKS = ['cautious', 'steady', 'bold'] as const;
const RETREATS = ['badly-hurt', 'down', 'leader', 'dying', 'never'] as const;
/** Gaps longer than this between actions count as this much play (the rest was away). */
const IDLE_CAP_SECONDS = 180;
/** Names like "the Drowned Chapel" open a heading with a capital. */
const upper = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function start(): { desk: Desk; kept: boolean } {
  const loaded = load();
  if (loaded.desk) return { desk: loaded.desk, kept: false };
  return {
    desk: newDesk(`desk-${Date.now()}`, new Date().toISOString().slice(0, 10)),
    kept: loaded.kept,
  };
}

export function DeskApp() {
  const [{ desk: first, kept }] = useState(start);
  const [desk, setDesk] = useState<Desk>(first);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const lastAction = useRef(Date.now());

  useEffect(() => store(desk), [desk]);

  /** Every player action: count the time played, then apply it; a refused command shows why. */
  function act(change: (d: Desk) => Desk): void {
    const now = Date.now();
    const seconds = Math.min(IDLE_CAP_SECONDS, (now - lastAction.current) / 1000);
    lastAction.current = now;
    try {
      // Computed here, not inside a state updater, so a refused command is caught below.
      setDesk(change(addTime(desk, yearAt(desk.state.calendar), seconds)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const { state, events } = desk;
  const guild = state.guild;
  const career = guild?.career;
  const record = useMemo(() => recordOf(state, events), [state, events]);
  const stops = stopsOf(events, desk.todayFrom);
  const digest = digestOf(state, events, desk.todayFrom);
  const todayDay = events[desk.todayFrom]?.day ?? 1;

  if (!guild) return null;
  const ended = career?.ended ?? null;
  const year = yearAt(state.calendar);
  const standing = career ? t('standingNone', { tier: t(`tier.${career.tier}`) }) : '';

  return (
    <main className="desk gd">
      <header className="masthead">
        <h1>{t('title')}</h1>
        <p className="sub">{t('subtitle')}</p>
        <dl className="gd-stats">
          <div>
            <dt>{dateOf(state.calendar)}</dt>
            <dd>{standing}</dd>
          </div>
          <div>
            <dt>{t('chest')}</dt>
            <dd className={guild.chestCopper < 0 ? 'gd-bad' : ''}>{coins(guild.chestCopper)}</dd>
          </div>
          <div>
            <dt>{t('renown')}</dt>
            <dd>{guild.renown}</dd>
          </div>
          {career ? (
            <div>
              <dt>{t('patron', { confidence: career.confidence })}</dt>
              <dd>{t('target', { target: t(`target.${career.target}`) })}</dd>
            </div>
          ) : null}
          <div>
            <dt>{t('time', { minutes: Math.round((desk.save.seconds[year - 1] ?? 0) / 60) })}</dt>
          </div>
        </dl>
        {kept ? <p className="gd-note">{t('oldSave')}</p> : null}
      </header>

      <div className="gd-grid">
        <div className="gd-col gd-col-roster">
          <section className="sheet gd-roster" aria-labelledby="roster">
            <h2 id="roster">{t('roster')}</h2>
            <Roster desk={desk} record={record.histories} onOpen={setCard} />
          </section>
        </div>
        <div className="gd-col">
          <section className="sheet gd-today" aria-labelledby="today">
            <h2 id="today">
              {t('today')} · {dateOf(todayDay)}
            </h2>
            {stops.length ? (
              <ul className="gd-stops">
                {stops.map((s) => (
                  <li key={s}>{t(`stop.${s}`)}</li>
                ))}
              </ul>
            ) : (
              <p className="gd-muted">{t('quiet')}</p>
            )}
            {digest.length ? (
              <ul className="gd-digest">
                {digest.map((line, n) => (
                  <li key={n}>{line}</li>
                ))}
              </ul>
            ) : null}
            {ended ? (
              <p className="gd-note">{t('ended', { reason: t(`ended.${ended.reason}`) })}</p>
            ) : (
              <p>
                <button className="gd-primary" onClick={() => act(continueToStop)}>
                  {t('continue')}
                </button>{' '}
                <span className="gd-muted">{t('continueHint')}</span>
              </p>
            )}
            {error ? <p className="gd-bad">{error}</p> : null}
            {career?.emergencyOffer && guild.chestCopper < 0 ? (
              <p className="gd-grant">
                {t('grant', { money: coins(career.emergencyOffer.grantCopper) })}{' '}
                <button
                  onClick={() =>
                    act((d) => send(d, { type: 'patron.grant', day: d.state.calendar }))
                  }
                >
                  {t('take')}
                </button>
              </p>
            ) : null}
          </section>

          <section className="sheet gd-board" aria-labelledby="board">
            <h2 id="board">{t('board')}</h2>
            {guild.board.length === 0 ? <p className="gd-muted">{t('boardEmpty')}</p> : null}
            <ul className="gd-offers">
              {guild.board.map((offer) => {
                const parts = offerParts(offer.shownTemplateId);
                return (
                  <li key={offer.id}>
                    <div className="gd-offer-head">
                      <b>{upper(parts.site)}</b>
                      {parts.monster ? ` · ${parts.monster}` : ''}
                      {parts.twist ? <em> · {parts.twist}</em> : null}
                      {offer.crisis ? <span className="gd-tag">{t('crisisOffer')}</span> : null}
                    </div>
                    <div className="gd-muted">
                      {t('offer', {
                        danger: nameOf(`danger.${offer.danger}`),
                        fee: coins(offer.feeCopper),
                        travel: offer.travelDays,
                        week: ((offer.expiresWeek - 1) % rules.weeksPerYear) + 1,
                      })}
                    </div>
                    {sending !== offer.id ? (
                      <button
                        className="gd-send-btn"
                        onClick={() => setSending(offer.id)}
                        disabled={!!ended}
                      >
                        {t('send')}
                      </button>
                    ) : null}
                    {sending === offer.id ? (
                      <SendForm
                        desk={desk}
                        site={parts.site}
                        onCancel={() => setSending(null)}
                        onSend={(partyIds, plan) => {
                          act((d) =>
                            send(d, {
                              type: 'contract.take',
                              day: d.state.calendar,
                              offerId: offer.id,
                              partyIds,
                              plan,
                            }),
                          );
                          setSending(null);
                        }}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          {guild.prospects.length ? (
            <section className="sheet" aria-labelledby="recruits">
              <h2 id="recruits">{t('recruits')}</h2>
              <ul className="gd-list">
                {guild.prospects.map((p) => (
                  <li key={p.adventurer.id}>
                    <b>{personName(p.adventurer, p.adventurer.id)}</b>{' '}
                    <span className="gd-muted">
                      {t('recruit', {
                        class: nameOf(p.adventurer.classId),
                        wage: coins(p.wageCopper),
                      })}
                    </span>{' '}
                    <button
                      onClick={() =>
                        act((d) =>
                          send(d, {
                            type: 'recruit.sign',
                            day: d.state.calendar,
                            prospectId: p.adventurer.id,
                          }),
                        )
                      }
                    >
                      {t('sign')}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {guild.staff ? <StaffSheet desk={desk} act={act} /> : null}
        </div>
        <div className="gd-col">
          <section className="sheet gd-letters" aria-labelledby="letters">
            <h2 id="letters">{t('letters')}</h2>
            {record.letters.length === 0 ? <p className="gd-muted">{t('lettersNone')}</p> : null}
            <ul className="gd-letter-list">
              {record.letters.slice(0, 40).map((letter) => (
                <LetterItem
                  key={letter.id}
                  letter={letter}
                  fresh={letter.day >= todayDay}
                  onOpen={setCard}
                />
              ))}
            </ul>
          </section>

          <section className="sheet gd-log" aria-labelledby="log">
            <h2 id="log">{t('log')}</h2>
            <p className="gd-muted">{t('logHint')}</p>
            <label className="gd-notes">
              {t('notes')}
              <textarea
                id="gd-notes"
                value={desk.save.notes}
                onChange={(e) => setDesk((d) => withNotes(d, e.target.value))}
              />
            </label>
            <LogBox desk={desk} />
            {confirmNew ? (
              <p>
                {t('confirmNew')}{' '}
                <button
                  onClick={() => {
                    forget();
                    setDesk(newDesk(`desk-${Date.now()}`, new Date().toISOString().slice(0, 10)));
                    setConfirmNew(false);
                  }}
                >
                  {t('confirm')}
                </button>{' '}
                <button onClick={() => setConfirmNew(false)}>{t('cancel')}</button>
              </p>
            ) : (
              <button onClick={() => setConfirmNew(true)}>{t('newGuild')}</button>
            )}
          </section>
        </div>
      </div>

      {card ? (
        <PersonCard desk={desk} id={card} record={record} onClose={() => setCard(null)} />
      ) : null}
    </main>
  );
}

function SendForm(props: {
  desk: Desk;
  site: string;
  onSend: (partyIds: string[], plan: Plan) => void;
  onCancel: () => void;
}) {
  const { state } = props.desk;
  const free = state.roster.filter((a) => statusOf(state, a).status === 'ready');
  const [chosen, setChosen] = useState<string[]>([]);
  const [plan, setPlan] = useState<Plan>({
    approach: 'assault',
    risk: 'steady',
    retreat: 'leader',
  });
  const { min, max } = content.guild.partySize;
  const ok = chosen.length >= min && chosen.length <= max;
  return (
    <div className="gd-send">
      <p className="gd-muted">{t('choose', { min, max })}</p>
      <ul className="gd-pick">
        {free.map((a) => (
          <li key={a.id}>
            <label>
              <input
                type="checkbox"
                checked={chosen.includes(a.id)}
                onChange={(e) =>
                  setChosen((c) =>
                    e.target.checked ? [...c, a.id] : c.filter((id) => id !== a.id),
                  )
                }
              />{' '}
              {personName(a, a.id)} <span className="gd-muted">{nameOf(a.classId)}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="gd-plan">
        <Choice
          label={t('approach')}
          value={plan.approach}
          values={APPROACHES}
          prefix="approach"
          onChange={(approach) => setPlan({ ...plan, approach })}
        />
        <Choice
          label={t('risk')}
          value={plan.risk}
          values={RISKS}
          prefix="risk"
          onChange={(risk) => setPlan({ ...plan, risk })}
        />
        <Choice
          label={t('retreat')}
          value={plan.retreat}
          values={RETREATS}
          prefix="retreat"
          onChange={(retreat) => setPlan({ ...plan, retreat })}
        />
      </div>
      <p>
        <button className="gd-primary" disabled={!ok} onClick={() => props.onSend(chosen, plan)}>
          {t('sendTo', { site: props.site })}
        </button>{' '}
        <span className="gd-muted">{t('chosen', { count: chosen.length })}</span>{' '}
        <button onClick={props.onCancel}>{t('cancel')}</button>
      </p>
    </div>
  );
}

function Choice<T extends string>(props: {
  label: string;
  value: T;
  values: readonly T[];
  prefix: string;
  onChange: (value: T) => void;
}) {
  return (
    <label>
      {props.label}{' '}
      <select
        value={props.value}
        // cast-ok: the options below are exactly props.values.
        onChange={(e) => props.onChange(e.target.value as T)}
      >
        {props.values.map((v) => (
          <option key={v} value={v}>
            {nameOf(`${props.prefix}.${v}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

function StaffSheet(props: { desk: Desk; act: (change: (d: Desk) => Desk) => void }) {
  const { state } = props.desk;
  const staff = state.guild?.staff;
  if (!staff) return null;
  return (
    <section className="sheet" aria-labelledby="staff">
      <h2 id="staff">{t('staff')}</h2>
      <ul className="gd-list">
        {AREAS.map((area: Area) => {
          const hired = staff.staff[area];
          return (
            <li key={area}>
              <b>{t(`area.${area}`)}</b>{' '}
              <span className="gd-muted">
                {hired
                  ? t('runBy', {
                      who: t('candidate', {
                        quality: hired.quality,
                        wage: coins(hired.wageCopper),
                      }),
                    })
                  : t('runByYou', { skill: staff.skills[area] })}
              </span>{' '}
              {hired ? (
                <button
                  onClick={() =>
                    props.act((d) =>
                      send(d, { type: 'staff.release', day: d.state.calendar, area }),
                    )
                  }
                >
                  {t('release')}
                </button>
              ) : null}
              <ul className="gd-sublist">
                {staff.candidates
                  .filter((c) => c.area === area)
                  .map((c) => (
                    <li key={c.id}>
                      {t('candidate', { quality: c.quality, wage: coins(c.wageCopper) })}{' '}
                      <button
                        onClick={() =>
                          props.act((d) =>
                            send(d, {
                              type: 'staff.hire',
                              day: d.state.calendar,
                              candidateId: c.id,
                            }),
                          )
                        }
                      >
                        {t('hire')}
                      </button>
                    </li>
                  ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Roster(props: {
  desk: Desk;
  record: ReturnType<typeof recordOf>['histories'];
  onOpen: (id: string) => void;
}) {
  const { state } = props.desk;
  const [showGone, setShowGone] = useState(false);
  const people = state.roster.filter(
    (a) => showGone || ['ready', 'resting', 'away'].includes(statusOf(state, a).status),
  );
  return (
    <>
      <div className="gd-scroll">
        <table className="gd-table">
          <thead>
            <tr>
              <th>{t('col.name')}</th>
              <th>{t('col.class')}</th>
              <th>{t('col.age')}</th>
              <th>{t('col.status')}</th>
              <th>{t('col.contracts')}</th>
            </tr>
          </thead>
          <tbody>
            {people.map((a) => {
              const s = statusOf(state, a);
              return (
                <tr key={a.id} className={`gd-${s.status}`}>
                  <td>
                    <button className="gd-link" onClick={() => props.onOpen(a.id)}>
                      {personName(a, a.id)}
                    </button>
                  </td>
                  <td>{nameOf(a.classId)}</td>
                  <td>{ageOf(a, state.calendar) ?? ''}</td>
                  <td>{s.label}</td>
                  <td>{(props.record.get(a.id) ?? []).filter((e) => e.kind === 'quest').length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <label className="gd-muted">
        <input
          id="gd-gone"
          type="checkbox"
          checked={showGone}
          onChange={(e) => setShowGone(e.target.checked)}
        />{' '}
        {t('showGone')}
      </label>
    </>
  );
}

function LetterItem(props: { letter: Letter; fresh: boolean; onOpen: (id: string) => void }) {
  const { letter } = props;
  const [open, setOpen] = useState(props.fresh || letter.kind === 'memorial');
  return (
    <li className={`gd-letter gd-${letter.kind}${props.fresh ? ' gd-fresh' : ''}`}>
      <button className="gd-letter-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{upper(letter.title)}</span>
        <span className="gd-muted">{dateOf(letter.day)}</span>
      </button>
      {open ? (
        <div className="gd-letter-body">
          {letter.lines.map((line, n) => (
            <p key={n} className={line.formula ? 'gd-formula' : ''}>
              {line.text}
            </p>
          ))}
          {letter.about ? (
            <button className="gd-link" onClick={() => props.onOpen(letter.about!)}>
              {t('card.history')}
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function PersonCard(props: {
  desk: Desk;
  id: string;
  record: ReturnType<typeof recordOf>;
  onClose: () => void;
}) {
  const { state } = props.desk;
  const a = state.roster.find((r) => r.id === props.id);
  const [all, setAll] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => closeRef.current?.focus(), []);
  if (!a) return null;
  const entries = props.record.histories.get(a.id) ?? [];
  const lines = historyLines(state, a.id, entries).filter((l) => all || l.notable);
  const memorial = props.record.letters.find((l) => l.kind === 'memorial' && l.about === a.id);
  const age = ageOf(a, state.calendar);
  return (
    <div
      className="gd-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-name"
      onKeyDown={(e) => e.key === 'Escape' && props.onClose()}
    >
      <div className="sheet gd-card">
        <h2 id="card-name">{personName(a, a.id)}</h2>
        <p className="gd-muted">
          {t('card.age', { class: nameOf(a.classId), age: age ?? '' })} · {statusOf(state, a).label}
        </p>
        <h3>{t('card.attributes')}</h3>
        <dl className="gd-attrs">
          {ATTRIBUTES.map((k) => (
            <div key={k}>
              <dt>{nameOf(`attribute.${k}`)}</dt>
              <dd>{a.attributes[k]}</dd>
            </div>
          ))}
        </dl>
        <h3>{t('card.history')}</h3>
        <label className="gd-muted">
          <input
            id="gd-all"
            type="checkbox"
            checked={all}
            onChange={(e) => setAll(e.target.checked)}
          />{' '}
          {t('card.all')}
        </label>
        <ul className="gd-history">
          {lines.map((line, n) => (
            <li key={n}>
              <span className="gd-muted">{dateOf(line.day)}</span> {line.text}
            </li>
          ))}
        </ul>
        {memorial ? (
          <>
            <h3>{t('card.memorial')}</h3>
            <div className="gd-letter-body">
              {memorial.lines.map((line, n) => (
                <p key={n} className={line.formula ? 'gd-formula' : ''}>
                  {line.text}
                </p>
              ))}
            </div>
          </>
        ) : null}
        <p>
          <button ref={closeRef} onClick={props.onClose}>
            {t('card.close')}
          </button>
        </p>
      </div>
    </div>
  );
}

function LogBox(props: { desk: Desk }) {
  const { desk } = props;
  const [note, setNote] = useState<string | null>(null);
  const text = playtestLog(desk.state, desk.events, desk.save.seconds, desk.save.notes, desk.save);
  return (
    <>
      <p>
        <button
          onClick={() =>
            navigator.clipboard.writeText(text).then(
              () => setNote(t('copied')),
              () => setNote(t('copyFailed')),
            )
          }
        >
          {t('copy')}
        </button>{' '}
        {note ? <span className="gd-muted">{note}</span> : null}
      </p>
      <pre className="gd-logtext">{text}</pre>
    </>
  );
}
