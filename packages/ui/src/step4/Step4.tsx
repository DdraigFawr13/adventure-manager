// Step 4 text prototype (D-195–D-200): the eight screens of docs/design/mockups/step4-prototype.html
// over the real engine, plus the founding draft. Throwaway screens; words from content.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  bedsOf,
  isFree,
  shapeOf,
  sickbedsOf,
  trainingPlacesOf,
  upkeepOf,
  weekInYear,
  yearOf,
  type Adventurer,
  type Attribute,
  type Offer,
  type Place,
  type Plan,
} from '@adventure-manager/engine';
import { baseStandingRules } from '@adventure-manager/content';
import {
  LAST_DAY,
  act,
  blocking,
  canPull,
  fromStored,
  guildOf,
  newGame,
  pull,
  rules,
  run,
  toStored,
  type Letter,
  type Save,
} from './game.ts';
import { backgroundLine, buildReport, historyLines } from './report.ts';
import { date, money, nameOf, personOf, shortDate, t, title, weekday } from './words.ts';

const KEY = 'step4.save';
const APPROACHES = ['stealth', 'assault', 'diplomacy'] as const;
const RISKS = ['cautious', 'steady', 'bold'] as const;
const RETREATS = ['leader', 'badly-hurt', 'down', 'dying', 'never'] as const;
const ATTRIBUTES: readonly Attribute[] = ['might', 'agility', 'toughness', 'wits'];

type Tab = 'hall' | 'march' | 'desk' | 'ask';
type DeskPart = 'letters' | 'contracts' | 'roster' | 'year';
type Sheet =
  | { readonly kind: 'letter'; readonly id: string }
  | { readonly kind: 'person'; readonly id: string }
  | { readonly kind: 'send'; readonly offerId: string }
  | { readonly kind: 'party'; readonly id: string }
  | { readonly kind: 'pause' };

function loadSave(): { save: Save | null; unreadable: boolean } {
  try {
    const text = localStorage.getItem(KEY);
    if (!text) return { save: null, unreadable: false };
    const save = fromStored(text);
    if (save) return { save, unreadable: false };
    // GAME-05: an unreadable save is kept aside, never overwritten silently.
    localStorage.setItem(`${KEY}.unreadable.${Date.now()}`, text);
    return { save: null, unreadable: true };
  } catch {
    return { save: null, unreadable: false };
  }
}

function store(save: Save): void {
  try {
    localStorage.setItem(KEY, toStored(save));
  } catch {
    // Storage can be blocked or full; the game goes on in memory.
  }
}

export function Step4() {
  const [{ save: loaded, unreadable }] = useState(loadSave);
  const [save, setSave] = useState<Save>(() => loaded ?? newGame(`step4-${Date.now()}`));
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<Tab>('hall');
  const [part, setPart] = useState<DeskPart>('letters');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [notice, setNotice] = useState<string>(unreadable ? t('save.unreadable') : '');
  const started = useRef(Date.now());

  /** After any change: draw again and save (daily autosave, Ironman, D-033). */
  const changed = () => {
    store(save);
    setTick((n) => n + 1);
  };
  const open = (sheet: Sheet) => {
    setNotice('');
    setSheets((s) => [...s, sheet]);
  };
  const close = () => setSheets((s) => s.slice(0, -1));
  /** A player's command; a refusal shows the engine's reason. */
  const tryAct = (fn: () => void): boolean => {
    try {
      fn();
      setNotice('');
      changed();
      return true;
    } catch (error) {
      setNotice(t('refused', { reason: error instanceof Error ? error.message : String(error) }));
      return false;
    }
  };

  useEffect(() => store(save), [save]);

  const guild = save.state.guild;
  if (!guild) return null;
  const today = save.state.calendar;
  const roster = save.state.roster;
  const who = (id: string) => personOf(roster, id).name;
  const name = (id: string): ReactNode => (
    <button type="button" className="name" onClick={() => open({ kind: 'person', id })}>
      {who(id)}
    </button>
  );

  const startOver = () => {
    if (!window.confirm(t('new.confirm'))) return;
    const fresh = newGame(`step4-${Date.now()}`);
    started.current = Date.now();
    setSheets([]);
    setTab('hall');
    setNotice('');
    setSave(fresh);
  };

  const doPull = () => {
    const before = save.letters.filter((l) => !l.read).length;
    const days = pull(save);
    changed();
    const unread = save.letters.filter((l) => !l.read).length;
    setNotice(t('pulled', { days }));
    if (unread > before) {
      setTab('desk');
      setPart('letters');
    }
  };

  const top = sheets[sheets.length - 1];
  const header = (left: string, right: string) => (
    <header className="top">
      <span className="g">{left}</span>
      <span className="d">{right}</span>
    </header>
  );
  const guildLine = `${date(today)} · ${money(guild.chestCopper)}`;

  if (guild.draft) return <Draft save={save} onPick={(fn) => tryAct(fn)} notice={notice} />;

  if (top)
    return (
      <div className="device">
        {top.kind === 'letter' && (
          <LetterSheet
            save={save}
            id={top.id}
            header={header}
            name={name}
            tryAct={tryAct}
            close={close}
            changed={changed}
            openPerson={(id) => open({ kind: 'person', id })}
            toRoster={() => {
              setSheets([]);
              setTab('desk');
              setPart('roster');
            }}
          />
        )}
        {top.kind === 'person' && (
          <PersonSheet
            save={save}
            id={top.id}
            header={header}
            name={name}
            tryAct={tryAct}
            close={close}
          />
        )}
        {top.kind === 'send' && (
          <SendSheet
            save={save}
            offerId={top.offerId}
            header={header}
            name={name}
            tryAct={tryAct}
            close={close}
          />
        )}
        {top.kind === 'party' && (
          <PartySheet
            save={save}
            id={top.id}
            header={header}
            name={name}
            tryAct={tryAct}
            close={close}
          />
        )}
        {top.kind === 'pause' && (
          <PauseSheet
            save={save}
            header={header}
            minutes={Math.max(1, Math.round((Date.now() - started.current) / 60000))}
            done={() => {
              started.current = Date.now();
              changed();
            }}
            close={close}
          />
        )}
        {notice && <p className="notice">{notice}</p>}
      </div>
    );

  const unread = save.letters.filter((l) => !l.read).length;
  const blockers = blocking(save);
  const nextAway = [...guild.parties].sort(
    (a, b) => Math.min(a.arriveDay, a.homeDay) - Math.min(b.arriveDay, b.homeDay),
  )[0];

  return (
    <div className="device">
      {header(t('guild'), guildLine)}
      <main className="body">
        {notice && <p className="notice">{notice}</p>}
        {tab === 'hall' && <Hall save={save} name={name} />}
        {tab === 'march' && (
          <March save={save} name={name} openParty={(id) => open({ kind: 'party', id })} />
        )}
        {tab === 'desk' && (
          <>
            <h2>{t('desk')}</h2>
            <div className="seg" role="tablist">
              {(['letters', 'contracts', 'roster', 'year'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={part === p}
                  className={part === p ? 'on' : ''}
                  onClick={() => setPart(p)}
                >
                  {t(`desk.${p}`, {
                    n: p === 'letters' ? unread : p === 'contracts' ? guild.board.length : '',
                  }).trim()}
                </button>
              ))}
            </div>
            {part === 'letters' && (
              <Letters save={save} openLetter={(id) => open({ kind: 'letter', id })} />
            )}
            {part === 'contracts' && (
              <Contracts save={save} send={(offerId) => open({ kind: 'send', offerId })} />
            )}
            {part === 'roster' && <Roster save={save} name={name} tryAct={tryAct} />}
            {part === 'year' && <Year save={save} />}
          </>
        )}
        {tab === 'ask' && (
          <Ask
            save={save}
            name={name}
            pause={() => open({ kind: 'pause' })}
            startOver={startOver}
          />
        )}
      </main>
      <button type="button" className="pull" disabled={!canPull(save)} onClick={doPull}>
        {t('pull')}
        <small>
          {guild.career?.ended || today >= LAST_DAY
            ? t('pull.end')
            : blockers.length > 0
              ? t('pull.blocked', { n: blockers.length })
              : nextAway
                ? t('pull.next', {
                    date: date(Math.min(nextAway.arriveDay, nextAway.homeDay)),
                    day: weekday(Math.min(nextAway.arriveDay, nextAway.homeDay)),
                  })
                : t('pull.quiet')}
        </small>
      </button>
      <nav className="tabs">
        {(['hall', 'march', 'desk', 'ask'] as const).map((x) => (
          <button
            key={x}
            type="button"
            className={tab === x ? 'on' : ''}
            aria-current={tab === x ? 'page' : undefined}
            onClick={() => setTab(x)}
          >
            {t(`tab.${x}`)}
            {x === 'desk' && unread > 0 ? ` · ${unread}` : ''}
          </button>
        ))}
      </nav>
    </div>
  );
}

type Header = (left: string, right: string) => ReactNode;
type NameButton = (id: string) => ReactNode;
type TryAct = (fn: () => void) => boolean;

/** The founding draft (D-188, D-199): one starter party and the extras, from one purse. */
function Draft({ save, onPick, notice }: { save: Save; onPick: TryAct; notice: string }) {
  const guild = guildOf(save);
  const draft = guild.draft!; // non-null: the caller shows this only while the draft stands.
  const founding = rules.founding!; // non-null: the prototype's rules have the draft.
  const [party, setParty] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const fee = (id: string) => save.draftFees[id] ?? 0;
  const partyFee = (n: number) =>
    (draft.parties[n] ?? []).reduce((sum, p) => sum + fee(p.adventurer.id), 0);
  const total = partyFee(party) + extras.reduce((sum, id) => sum + fee(id), 0);
  const roster = draft.parties
    .flat()
    .concat(draft.extras)
    .map((p) => p.adventurer);
  const line = (a: Adventurer, wage: number) => (
    <span>
      {personOf(roster, a.id).name} · {nameOf(a.classId)} · {t('wage', { wage: money(wage) })}
      <br />
      <span className="muted">
        {ATTRIBUTES.map((x) => `${nameOf(`attribute.${x}`)} ${a.attributes[x]}`).join(' · ')}
      </span>
    </span>
  );
  const ok = extras.length >= founding.extras.min && extras.length <= founding.extras.max;
  return (
    <div className="device">
      <header className="top">
        <span className="g">{t('draft.title')}</span>
        <span className="d">{money(guild.chestCopper)}</span>
      </header>
      <main className="body">
        <p className="letter">
          {t('draft.intro', { min: founding.extras.min, max: founding.extras.max })}
        </p>
        {draft.parties.map((members, n) => (
          <section key={n} className={`choice${party === n ? ' on' : ''}`}>
            <button
              type="button"
              className="choice-head"
              onClick={() => setParty(n)}
              aria-pressed={party === n}
            >
              <span>{t(`draft.party.${founding.characters[n]?.id ?? n}`)}</span>
              <span className="n">{money(partyFee(n))}</span>
            </button>
            {members.map((p) => (
              <div key={p.adventurer.id} className="row">
                {line(p.adventurer, p.wageCopper)}
              </div>
            ))}
          </section>
        ))}
        <div className="k">{t('draft.extras')}</div>
        {draft.extras.map((p) => {
          const id = p.adventurer.id;
          const on = extras.includes(id);
          return (
            <label key={id} className="row check">
              {line(p.adventurer, p.wageCopper)}
              <span className="n">
                {money(fee(id))}{' '}
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => setExtras(on ? extras.filter((x) => x !== id) : [...extras, id])}
                />
              </span>
            </label>
          );
        })}
        <div className="foot">
          <p className="muted">
            {t(ok ? 'draft.total' : 'draft.choose', {
              fee: money(total),
              chest: money(guild.chestCopper),
              min: founding.extras.min,
              max: founding.extras.max,
            })}
          </p>
          {notice && <p className="notice">{notice}</p>}
          <button
            type="button"
            className="btn main"
            disabled={!ok}
            onClick={() =>
              onPick(() => {
                run(save, { type: 'guild.pick', day: 1, partyIndex: party, extraIds: extras });
                save.log.push({
                  sitting: save.sitting,
                  day: 1,
                  what: 'founded',
                  ids: [guildOf(save).standing[0]?.nameId ?? 'party.none'],
                });
              })
            }
          >
            {t('draft.found')}
          </button>
        </div>
      </main>
    </div>
  );
}

/** The house as rooms in text, with who is in each (screen 1). */
function Hall({ save, name }: { save: Save; name: NameButton }) {
  const guild = guildOf(save);
  const house = guild.house;
  const houseRules = rules.house;
  if (!house || !houseRules) return null;
  const today = save.state.calendar;
  const atHome = guild.members.filter((m) => isFree(m, today));
  const resting = guild.members.filter((m) => !m.away && !isFree(m, today));
  const sick = new Set(house.sickbeds.map((s) => s.memberId));
  const beds = bedsOf(house, houseRules);
  const working = (p: Place) =>
    house.work.some((w) => {
      const j = w.job;
      const places = j.kind === 'upgrade' ? j.places : j.kind === 'extend' ? [] : [j.place];
      return places.some((q) => JSON.stringify(q) === JSON.stringify(p));
    });
  let bedsShown = false;
  const cellRow = (key: string, place: Place, cell: { kindId: string; level: number } | null) => {
    const study =
      place.area === 'hall' &&
      houseRules.studyPlace.area === 'hall' &&
      place.floor === houseRules.studyPlace.floor &&
      place.cell === houseRules.studyPlace.cell;
    let label = cell ? nameOf(cell.kindId) : study ? t('room.study') : t('room.empty');
    let note: ReactNode = cell ? t('level', { n: cell.level }) : '';
    if (cell?.kindId === 'room.barracks' && !bedsShown) {
      bedsShown = true;
      label = t('room.barracks.beds', { n: guild.members.length, beds });
    }
    if (cell?.kindId === 'room.tavern') label = t('room.tavern.at', { n: atHome.length });
    if (cell?.kindId === 'room.training-yard')
      label = t('room.yard.at', {
        n: Math.min(atHome.length, trainingPlacesOf(house, houseRules)),
      });
    if (working(place)) note = <span className="pill warn">{t('room.work')}</span>;
    return (
      <div key={key} className="row">
        <span className={cell || study ? '' : 'muted'}>{label}</span>
        <span className="muted">{note}</span>
      </div>
    );
  };
  const floors: number[] = [];
  for (let f = house.highestFloor; f >= house.lowestFloor; f -= 1) floors.push(f);
  return (
    <>
      <h2>{t('hall')}</h2>
      {beds < guild.members.length && (
        <p className="pill bad">{t('hall.lodgers', { n: guild.members.length - beds })}</p>
      )}
      {floors.map((f) => (
        <section key={f}>
          <div className="k">
            {f === 0
              ? t('floor.ground')
              : f > 0
                ? t('floor.up', { n: f })
                : t('floor.cellar', { n: -f })}
          </div>
          {(house.floors[f] ?? []).map((cell, c) =>
            cellRow(`${f}.${c}`, { area: 'hall', floor: f, cell: c }, cell),
          )}
        </section>
      ))}
      {(['west', 'east'] as const).map((side) => (
        <section key={side}>
          <div className="k">{t(`compound.${side}`)}</div>
          {house.compound[side].map((cell, n) =>
            cellRow(`${side}.${n}`, { area: 'compound', side, plot: n }, cell),
          )}
        </section>
      ))}
      <div className="k">
        {t('hall.infirmary', { n: sick.size, of: sickbedsOf(house, houseRules) })}
      </div>
      {resting.length === 0 && <p className="muted">{t('hall.nobody')}</p>}
      {resting.map((m) => (
        <div key={m.id} className="row">
          <span>
            {name(m.id)}
            {sick.has(m.id) ? ` · ${t('hall.sickbed')}` : ''}
          </span>
          <span className="n muted">{t('until', { date: date(m.outUntilDay) })}</span>
        </div>
      ))}
      {house.work.map((w) => (
        <p key={w.id} className="muted">
          {t(`work.${w.job.kind}`, {
            room:
              w.job.kind === 'extend' ? nameOf(`extend.${w.job.direction}`) : nameOf(w.job.kindId),
            week: ((w.doneWeek - 1) % rules.weeksPerYear) + 1,
          })}
        </p>
      ))}
      <p className="muted">{t('hall.defaults')}</p>
    </>
  );
}

/** Parties on the road and at home, and places (screen 7). */
function March({
  save,
  name,
  openParty,
}: {
  save: Save;
  name: NameButton;
  openParty: (id: string) => void;
}) {
  const guild = guildOf(save);
  const today = save.state.calendar;
  const partyName = (standingId: string | null) =>
    standingId
      ? title(nameOf(save.chronicle.partyNames[standingId] ?? standingId))
      : t('party.adhoc');
  const assigned = new Set(guild.standing.flatMap((s) => s.memberIds));
  const unassigned = guild.members.filter((m) => !assigned.has(m.id));
  const places = Object.entries(save.chronicle.places).sort((a, b) => b[1].day - a[1].day);
  return (
    <>
      <h2>{t('march.road')}</h2>
      {guild.parties.length === 0 && <p className="muted">{t('march.none')}</p>}
      {guild.parties.map((p) => (
        <div key={p.id} className="row">
          <span>
            {partyName(p.standingId)} → {title(nameOf(siteOf(p.offer)))}
            <br />
            <span className="muted">
              {p.arriveDay > today
                ? t('march.arrive', { date: date(p.arriveDay), home: date(p.homeDay) })
                : t('march.home', { home: date(p.homeDay) })}
            </span>
          </span>
          <span className={`pill ${dangerPill(p.offer.danger)}`}>
            {nameOf(`danger.${p.offer.danger}`)}
          </span>
        </div>
      ))}
      <div className="k">{t('march.parties')}</div>
      {guild.standing.map((s) => {
        const members = s.memberIds.map((id) => guild.members.find((m) => m.id === id));
        const away = members.some((m) => m?.away);
        const hurt = members.filter((m) => m && !m.away && !isFree(m, today)).length;
        return (
          <button key={s.id} type="button" className="row" onClick={() => openParty(s.id)}>
            <span>
              {title(nameOf(s.nameId))} · {s.memberIds.length}
            </span>
            <span className="muted">
              {away
                ? t('march.away')
                : hurt > 0
                  ? t('march.resting', { n: hurt })
                  : t('march.ready')}
            </span>
          </button>
        );
      })}
      <div className="row">
        <span>{t('march.unassigned', { n: unassigned.length })}</span>
        <span className="muted names">
          {unassigned.map((m) => (
            <span key={m.id}>{name(m.id)} </span>
          ))}
        </span>
      </div>
      <div className="k">{t('march.places')}</div>
      {places.length === 0 && <p className="muted">{t('march.noplaces')}</p>}
      {places.map(([site, last]) => (
        <div key={site} className="row">
          <span>{title(nameOf(site))}</span>
          <span className="muted">
            {t(`march.last.${last.outcome}`, { date: shortDate(last.day) })}
          </span>
        </div>
      ))}
      <p className="muted">{t('march.note')}</p>
    </>
  );
}

function siteOf(offer: Offer): string {
  return shapeOf(offer.shownTemplateId)?.siteId ?? offer.shownTemplateId;
}

function dangerPill(danger: string): string {
  return danger === 'routine' ? 'good' : danger === 'hazardous' ? 'warn' : 'bad';
}

function Letters({ save, openLetter }: { save: Save; openLetter: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const letters = [...save.letters].reverse();
  const shown = all ? letters : letters.slice(0, 40);
  if (letters.length === 0) return <p className="muted">{t('letters.none')}</p>;
  return (
    <>
      {shown.map((l) => (
        <button key={l.id} type="button" className="row" onClick={() => openLetter(l.id)}>
          <span>
            <b className={l.read ? 'title read' : 'title'}>
              {l.read ? '' : '● '}
              {letterTitle(save, l)}
            </b>
            <br />
            <span className="muted">{letterPreview(save, l)}</span>
          </span>
          <span className="n muted">{shortDate(l.day)}</span>
        </button>
      ))}
      {!all && letters.length > shown.length && (
        <button type="button" className="btn" onClick={() => setAll(true)}>
          {t('letters.older', { n: letters.length - shown.length })}
        </button>
      )}
      <p className="muted">{t('letters.note')}</p>
    </>
  );
}

function letterTitle(save: Save, l: Letter): string {
  const f = l.facts;
  const p = (id: unknown) => personOf(save.state.roster, String(id)).name;
  switch (l.kind) {
    case 'home':
      return f.writer ? t('letter.home.from', { who: p(f.writer) }) : t('letter.home.none');
    case 'memorial':
      return t('letter.memorial.title', { who: p(f.who) });
    case 'retired':
      return t('letter.retired.title', { who: p(f.who) });
    default:
      return t(`letter.${l.kind}.title`, { year: f.year ?? '' });
  }
}

function letterPreview(save: Save, l: Letter): string {
  if (l.lines.length > 1) return `${l.lines[1]!.slice(0, 60)}…`; // non-null: length checked.
  const body = letterBody(save, l)[0] ?? '';
  return body.length > 60 ? `${body.slice(0, 60)}…` : body;
}

/** The wording of letters the engine doesn't write (the page's own, from content labels). */
function letterBody(save: Save, l: Letter): string[] {
  const f = l.facts;
  const p = (id: unknown) => personOf(save.state.roster, String(id)).name;
  switch (l.kind) {
    case 'home':
    case 'memorial':
      return [...l.lines];
    case 'incident': {
      const kind = String(f.kind).replace(/^incident\./, '');
      return [
        t(`incident.${kind}.body`, {
          room: nameOf(String(f.room)),
          stolen: money(Number(f.stolen)),
        }),
      ];
    }
    case 'patron-offer':
      return [t('letter.patron-offer.body', { grant: money(Number(f.grant)) })];
    case 'assembly':
      return [
        t('letter.assembly.body', { year: f.year ?? '', place: f.place ?? '', of: f.of ?? '' }),
        t(`target.${f.target}`),
        t('letter.assembly.confidence', { n: f.confidence ?? '' }),
      ];
    case 'signing':
      return [t('letter.signing.body', { n: f.count ?? 0 })];
    case 'retired':
      return [t('letter.retired.body', { who: p(f.who), age: f.age ?? '' })];
    case 'built':
      return [t('letter.built.body', { room: nameOf(String(f.kind)), level: f.level ?? 1 })];
    case 'week':
      return [
        t('letter.week.body', {
          wages: money(Number(f.wages)),
          other: money(Number(f.other)),
          chest: money(Number(f.chest)),
        }),
      ];
    case 'career-ended':
      return [t(`letter.career-ended.${f.reason}`)];
  }
}

/** A letter home, a memorial, or a letter that wants an answer (screens 4 and 6). */
function LetterSheet({
  save,
  id,
  header,
  name,
  tryAct,
  close,
  changed,
  openPerson,
  toRoster,
}: {
  save: Save;
  id: string;
  header: Header;
  name: NameButton;
  tryAct: TryAct;
  close: () => void;
  changed: () => void;
  openPerson: (id: string) => void;
  toRoster: () => void;
}) {
  const l = save.letters.find((x) => x.id === id);
  const answers = l?.kind === 'incident' || l?.kind === 'patron-offer';
  useEffect(() => {
    if (l && !l.read && !answers) {
      l.read = true;
      changed();
    }
  }, [l, answers, changed]);
  if (!l) return null;
  const guild = guildOf(save);
  const today = save.state.calendar;
  const body = letterBody(save, l);
  // An incident letter stands until answered or the next week start (house/SPEC.md).
  const incidentOpen = l.kind === 'incident' && !l.answer && guild.house?.letter != null;
  const offerOpen = l.kind === 'patron-offer' && !l.answer && guild.career?.emergencyOffer != null;
  const answer = (choice: string, fn: () => void) =>
    tryAct(() => {
      fn();
      l.answer = choice;
      l.read = true;
    });
  const kind = String(l.facts.kind ?? '').replace(/^incident\./, '');
  return (
    <>
      {header(t(`sheet.${l.kind}`), date(l.day))}
      <main className="body">
        {l.kind === 'memorial' && <p className="bell">{t('memorial.bell')}</p>}
        <div className="letter">
          {(l.kind === 'home' || l.kind === 'memorial') && l.lines.length === 0 && (
            <p>{t('letter.empty')}</p>
          )}
          {body.map((line, n) => (
            <p
              key={n}
              className={
                n === body.length - 1 && (l.kind === 'home' || l.kind === 'memorial') ? 'sign' : ''
              }
            >
              {line}
            </p>
          ))}
        </div>
        {l.people.length > 0 && (
          <>
            <div className="k">{t(l.kind === 'home' ? 'letter.party' : 'letter.named')}</div>
            <p className="names">
              {l.people.map((p) => (
                <span key={p}>{name(p)} </span>
              ))}
            </p>
          </>
        )}
        {l.kind === 'incident' && (
          <div className="btns">
            {incidentOpen ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    answer('free', () =>
                      act(
                        save,
                        { type: 'incident.answer', day: today, answer: 'free' },
                        'incident-free',
                        [String(l.facts.kind)],
                      ),
                    )
                  }
                >
                  {t(`incident.${kind}.free`)}
                </button>
                <button
                  type="button"
                  className="btn main"
                  onClick={() =>
                    answer('paid', () =>
                      act(
                        save,
                        { type: 'incident.answer', day: today, answer: 'paid' },
                        'incident-paid',
                        [String(l.facts.kind)],
                      ),
                    )
                  }
                >
                  {t(`incident.${kind}.paid`, { fee: money(Number(l.facts.fee)) })}
                </button>
              </>
            ) : (
              <p className="muted">{t(l.answer ? `answered.${l.answer}` : 'answered.late')}</p>
            )}
          </div>
        )}
        {l.kind === 'patron-offer' && (
          <div className="btns">
            {offerOpen ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => answer('declined', () => undefined)}
                >
                  {t('patron.decline')}
                </button>
                <button
                  type="button"
                  className="btn main"
                  onClick={() =>
                    answer('taken', () => act(save, { type: 'patron.grant', day: today }, 'grant'))
                  }
                >
                  {t('patron.take')}
                </button>
              </>
            ) : (
              <p className="muted">{t(l.answer ? `answered.${l.answer}` : 'answered.late')}</p>
            )}
          </div>
        )}
        {(l.kind === 'incident' || l.kind === 'patron-offer') &&
          !l.read &&
          !incidentOpen &&
          !offerOpen && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                l.read = true;
                changed();
              }}
            >
              {t('file')}
            </button>
          )}
        <div className="btns end">
          {l.kind === 'memorial' && (
            <button type="button" className="btn" onClick={() => openPerson(String(l.facts.who))}>
              {t('memorial.card', { who: personOf(save.state.roster, String(l.facts.who)).name })}
            </button>
          )}
          {l.kind === 'signing' && (
            <button type="button" className="btn" onClick={toRoster}>
              {t('signing.see')}
            </button>
          )}
          <button type="button" className="btn main" onClick={close}>
            {t(l.kind === 'home' ? 'file' : 'close')}
          </button>
        </div>
      </main>
    </>
  );
}

/** Background line, numbers, friends and a dated history (screen 5). */
function PersonSheet({
  save,
  id,
  header,
  name,
  tryAct,
  close,
}: {
  save: Save;
  id: string;
  header: Header;
  name: NameButton;
  tryAct: TryAct;
  close: () => void;
}) {
  const a = save.state.roster.find((r) => r.id === id);
  if (!a) return null;
  const guild = guildOf(save);
  const today = save.state.calendar;
  const history = save.chronicle.people[id];
  const member = guild.members.find((m) => m.id === id);
  const year = yearOf(today, rules);
  const age = a.birthYear === undefined ? '' : String(year - a.birthYear);
  const standing = guild.standing.find((s) => s.memberIds.includes(id));
  const friends = (history?.friends ?? []).map((f) => ({
    id: f,
    n: save.chronicle.together[f < id ? `${f}|${id}` : `${id}|${f}`] ?? 0,
  }));
  const lines = historyLines(save, id).reverse();
  const status = a.dead
    ? t('status.dead')
    : a.retiredYear !== undefined
      ? t('status.retired')
      : member?.away
        ? t('status.away')
        : member && !isFree(member, today)
          ? t('until', { date: date(member.outUntilDay) })
          : t('status.fit');
  const assign = (value: string) =>
    tryAct(() => {
      if (value === 'new')
        act(
          save,
          { type: 'party.form', day: today, memberIds: [id], plan: baseStandingRules.defaultPlan },
          'formed',
          [id],
        );
      else
        act(
          save,
          {
            type: 'party.assign',
            day: today,
            memberId: id,
            standingId: value === 'none' ? null : value,
          },
          value === 'none' ? 'unassigned' : 'assigned',
          [id, guild.standing.find((s) => s.id === value)?.nameId ?? ''],
        );
    });
  return (
    <>
      {header(
        personOf(save.state.roster, id).name,
        `${nameOf(a.classId)}${age ? ` · ${age}` : ''}`,
      )}
      <main className="body">
        <p className="letter small">{backgroundLine(save, id)}</p>
        <div className="hist">
          <div>
            <span className="when">{t('card.numbers')}</span>
            <span className="n">
              {ATTRIBUTES.map((x) => `${nameOf(`attribute.${x}`)} ${a.attributes[x]}`).join(' · ')}
            </span>
          </div>
          <div>
            <span className="when">{t('card.record')}</span>
            <span>
              {t('card.record.line', {
                quests: history?.quests ?? 0,
                won: history?.won ?? 0,
                injuries: history?.injuries ?? 0,
              })}
              {member ? ` · ${t('wage', { wage: money(member.wageCopper) })}` : ''}
            </span>
          </div>
          <div>
            <span className="when">{t('card.now')}</span>
            <span>{status}</span>
          </div>
        </div>
        {member && (
          <label className="field-row">
            <span className="k">{t('card.party')}</span>
            <select
              value={standing?.id ?? 'none'}
              disabled={member.away}
              onChange={(e) => assign(e.target.value)}
            >
              <option value="none">{t('card.party.none')}</option>
              {guild.standing.map((s) => (
                <option key={s.id} value={s.id}>
                  {title(nameOf(s.nameId))}
                </option>
              ))}
              <option value="new">{t('card.party.new')}</option>
            </select>
          </label>
        )}
        <div className="k">{t('card.friends')}</div>
        <p>
          {friends.length === 0
            ? t('card.nofriends')
            : friends.map((f) => (
                <span key={f.id}>
                  {name(f.id)} ({f.n}){' '}
                </span>
              ))}
        </p>
        <div className="k">{t('card.history')}</div>
        <div className="hist">
          {lines.map((line, n) => (
            <div key={n}>
              <span className="when">{shortDate(line.day)}</span>
              <span>{line.text}</span>
            </div>
          ))}
        </div>
        <button type="button" className="btn main" onClick={close}>
          {t('back')}
        </button>
      </main>
    </>
  );
}

function PlanPicker({ plan, setPlan }: { plan: Plan; setPlan: (p: Plan) => void }) {
  const seg = <K extends keyof Plan>(
    key: K,
    values: readonly Plan[K][],
    label: (v: Plan[K]) => string,
  ) => (
    <div className="seg" role="radiogroup" aria-label={t(`plan.${key}`)}>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={plan[key] === v}
          className={plan[key] === v ? 'on' : ''}
          onClick={() => setPlan({ ...plan, [key]: v })}
        >
          {label(v)}
        </button>
      ))}
    </div>
  );
  return (
    <>
      {seg('approach', APPROACHES, (v) => nameOf(`approach.${v}`))}
      {seg('risk', RISKS, (v) => nameOf(`risk.${v}`))}
      {seg('retreat', RETREATS, (v) => t(`retreat.${v}`))}
    </>
  );
}

/** A contract from the Desk: the standing party, swaps for this contract only, the plan (screen 3). */
function SendSheet({
  save,
  offerId,
  header,
  name,
  tryAct,
  close,
}: {
  save: Save;
  offerId: string;
  header: Header;
  name: NameButton;
  tryAct: TryAct;
  close: () => void;
}) {
  const guild = guildOf(save);
  const today = save.state.calendar;
  const offer = guild.board.find((o) => o.id === offerId);
  const free = guild.members.filter((m) => isFree(m, today)).map((m) => m.id);
  const ready = guild.standing.find((s) => s.memberIds.some((id) => free.includes(id)));
  const [standingId, setStandingId] = useState<string | null>(ready?.id ?? null);
  const standing = guild.standing.find((s) => s.id === standingId);
  const [members, setMembers] = useState<string[]>(
    standing ? standing.memberIds.filter((id) => free.includes(id)) : [],
  );
  const [plan, setPlan] = useState<Plan>(standing?.plan ?? baseStandingRules.defaultPlan);
  if (!offer) {
    return (
      <>
        {header(t('sheet.send'), date(today))}
        <main className="body">
          <p>{t('send.gone')}</p>
          <button type="button" className="btn main" onClick={close}>
            {t('back')}
          </button>
        </main>
      </>
    );
  }
  const shape = shapeOf(offer.shownTemplateId);
  const roster = save.state.roster;
  const position = (id: string) => roster.find((a) => a.id === id)?.position ?? 'front';
  const choose = (id: string | null) => {
    setStandingId(id);
    const s = guild.standing.find((x) => x.id === id);
    setMembers(s ? s.memberIds.filter((m) => free.includes(m)) : []);
    setPlan(s?.plan ?? baseStandingRules.defaultPlan);
  };
  const toggle = (id: string) =>
    setMembers(members.includes(id) ? members.filter((m) => m !== id) : [...members, id]);
  const others = free.filter((id) => !members.includes(id));
  const size = rules.partySize;
  const ok = members.length >= size.min && members.length <= size.max;
  const send = () => {
    if (
      tryAct(() =>
        act(
          save,
          {
            type: 'contract.take',
            day: today,
            offerId,
            partyIds: members,
            plan,
            ...(standingId ? { standingId } : {}),
          },
          'took',
          [standing?.nameId ?? 'party.none', siteOf(offer)],
        ),
      )
    )
      close();
  };
  return (
    <>
      {header(
        t('sheet.send'),
        t('send.expires', { week: ((offer.expiresWeek - 1) % rules.weeksPerYear) + 1 }),
      )}
      <main className="body">
        <h2>{title(nameOf(siteOf(offer)))}</h2>
        <p className="muted">
          {[
            shape ? nameOf(shape.monsterId) : '',
            nameOf(`danger.${offer.danger}`),
            shape?.twistId ? t('send.twist', { twist: nameOf(shape.twistId) }) : '',
            t('send.travel', { days: offer.travelDays }),
            t('send.fee', { fee: money(offer.feeCopper) }),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="k">{t('send.party')}</div>
        <select value={standingId ?? ''} onChange={(e) => choose(e.target.value || null)}>
          {guild.standing.map((s) => (
            <option key={s.id} value={s.id}>
              {title(nameOf(s.nameId))}
            </option>
          ))}
          <option value="">{t('party.adhoc')}</option>
        </select>
        <div className="hist">
          {(['front', 'back'] as const).map((pos) => (
            <div key={pos}>
              <span className="when">{t(`position.${pos}`)}</span>
              <span className="names">
                {members
                  .filter((id) => position(id) === pos)
                  .map((id) => (
                    <button key={id} type="button" className="chip on" onClick={() => toggle(id)}>
                      {personOf(roster, id).name} ·{' '}
                      {nameOf(roster.find((a) => a.id === id)?.classId ?? '')} ✕
                    </button>
                  ))}
              </span>
            </div>
          ))}
        </div>
        {standing && standing.memberIds.some((id) => !free.includes(id)) && (
          <p className="muted">
            {t('send.missing')}{' '}
            {standing.memberIds
              .filter((id) => !free.includes(id))
              .map((id) => (
                <span key={id}>{name(id)} </span>
              ))}
          </p>
        )}
        {others.length > 0 && (
          <>
            <p className="muted">{t('send.add')}</p>
            <p className="names">
              {others.map((id) => (
                <button key={id} type="button" className="chip" onClick={() => toggle(id)}>
                  + {personOf(roster, id).name} ·{' '}
                  {nameOf(roster.find((a) => a.id === id)?.classId ?? '')}
                </button>
              ))}
            </p>
          </>
        )}
        <p className="muted">{t('send.swap', { min: size.min, max: size.max })}</p>
        <div className="k">{t('send.plan')}</div>
        <PlanPicker plan={plan} setPlan={setPlan} />
        <div className="btns end">
          <button type="button" className="btn" onClick={close}>
            {t('back')}
          </button>
          <button type="button" className="btn main" disabled={!ok} onClick={send}>
            {t('send.go')}
          </button>
        </div>
      </main>
    </>
  );
}

/** A standing party: its members and default plan (D-014). */
function PartySheet({
  save,
  id,
  header,
  name,
  tryAct,
  close,
}: {
  save: Save;
  id: string;
  header: Header;
  name: NameButton;
  tryAct: TryAct;
  close: () => void;
}) {
  const guild = guildOf(save);
  const party = guild.standing.find((s) => s.id === id);
  if (!party) {
    return (
      <>
        {header(t('sheet.party'), date(save.state.calendar))}
        <main className="body">
          <p>{t('party.gone')}</p>
          <button type="button" className="btn main" onClick={close}>
            {t('back')}
          </button>
        </main>
      </>
    );
  }
  const today = save.state.calendar;
  return (
    <>
      {header(title(nameOf(party.nameId)), date(today))}
      <main className="body">
        <div className="k">{t('party.members')}</div>
        {party.memberIds.map((m) => {
          const member = guild.members.find((x) => x.id === m);
          const a = save.state.roster.find((r) => r.id === m);
          return (
            <div key={m} className="row">
              <span>
                {name(m)} · {nameOf(a?.classId ?? '')}
              </span>
              <span className="muted">
                {member?.away
                  ? t('status.away')
                  : member && !isFree(member, today)
                    ? t('status.resting')
                    : t('status.fit')}
              </span>
            </div>
          );
        })}
        <p className="muted">{t('party.note')}</p>
        <div className="k">{t('party.plan')}</div>
        <PlanPicker
          plan={party.plan}
          setPlan={(plan) =>
            tryAct(() =>
              act(save, { type: 'party.plan', day: today, standingId: id, plan }, 'planned', [
                party.nameId,
              ]),
            )
          }
        />
        <button type="button" className="btn main" onClick={close}>
          {t('back')}
        </button>
      </main>
    </>
  );
}

function Contracts({ save, send }: { save: Save; send: (offerId: string) => void }) {
  const guild = guildOf(save);
  if (guild.board.length === 0) return <p className="muted">{t('contracts.none')}</p>;
  return (
    <>
      {guild.board.map((o) => {
        const shape = shapeOf(o.shownTemplateId);
        return (
          <button key={o.id} type="button" className="row" onClick={() => send(o.id)}>
            <span>
              {title(nameOf(siteOf(o)))}
              <br />
              <span className="muted">
                {[
                  shape ? nameOf(shape.monsterId) : '',
                  shape?.twistId ? nameOf(shape.twistId) : '',
                  t('send.travel', { days: o.travelDays }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <span className="n">
              <span className={`pill ${dangerPill(o.danger)}`}>{nameOf(`danger.${o.danger}`)}</span>
              <br />
              {money(o.feeCopper)}
            </span>
          </button>
        );
      })}
      <p className="muted">{t('contracts.note')}</p>
    </>
  );
}

function Roster({ save, name, tryAct }: { save: Save; name: NameButton; tryAct: TryAct }) {
  const guild = guildOf(save);
  const today = save.state.calendar;
  const houseRules = rules.house;
  const beds = guild.house && houseRules ? bedsOf(guild.house, houseRules) : Infinity;
  const roster = save.state.roster;
  return (
    <>
      <div className="k">{t('roster.members', { n: guild.members.length, beds })}</div>
      {guild.members.map((m) => {
        const a = roster.find((r) => r.id === m.id);
        return (
          <div key={m.id} className="row">
            <span>
              {name(m.id)} · {nameOf(a?.classId ?? '')}
            </span>
            <span className="muted">
              {m.away ? t('status.away') : isFree(m, today) ? t('status.fit') : t('status.resting')}
            </span>
          </div>
        );
      })}
      <div className="k">{t('roster.recruits')}</div>
      {guild.prospects.length === 0 && <p className="muted">{t('roster.norecruits')}</p>}
      {guild.prospects.map((p) => (
        <div key={p.adventurer.id} className="row">
          <span>
            {personOf([p.adventurer], p.adventurer.id).name} · {nameOf(p.adventurer.classId)}
            <br />
            <span className="muted">
              {ATTRIBUTES.map(
                (x) => `${nameOf(`attribute.${x}`)} ${p.adventurer.attributes[x]}`,
              ).join(' · ')}{' '}
              · {t('wage', { wage: money(p.wageCopper) })}
            </span>
          </span>
          <button
            type="button"
            className="btn small"
            disabled={guild.members.length >= beds}
            onClick={() =>
              tryAct(() =>
                act(
                  save,
                  { type: 'recruit.sign', day: today, prospectId: p.adventurer.id },
                  'signed',
                  [p.adventurer.id],
                ),
              )
            }
          >
            {t('roster.sign')}
          </button>
        </div>
      ))}
      {guild.prospects.length > 0 && (
        <p className="muted">{t('roster.fee', { weeks: rules.signOnWeeks })}</p>
      )}
      <div className="k">{t('roster.gone')}</div>
      {roster
        .filter((a) => a.dead || a.retiredYear !== undefined)
        .map((a) => (
          <div key={a.id} className="row">
            <span>{name(a.id)}</span>
            <span className="muted">{a.dead ? t('status.dead') : t('status.retired')}</span>
          </div>
        ))}
    </>
  );
}

/** The year's numbers against the patron's target (Desk, Year). */
function Year({ save }: { save: Save }) {
  const guild = guildOf(save);
  const career = guild.career;
  const house = guild.house;
  const wages = guild.members.reduce((s, m) => s + m.wageCopper, 0);
  const rooms = house && rules.house ? upkeepOf(house, rules.house) : 0;
  const rows: [string, string][] = [
    [t('year.chest'), money(guild.chestCopper)],
    [t('year.weekly'), money(wages + rules.runningCostCopper + rooms)],
    [t('year.renown'), String(guild.renown)],
  ];
  if (career) {
    rows.push([t('year.renown.year'), String(career.renownThisYear)]);
    rows.push([t('year.tier'), t(`tier.${career.tier}`)]);
    rows.push([t('year.confidence'), String(career.confidence)]);
  }
  return (
    <>
      {rows.map(([k, v]) => (
        <div key={k} className="row">
          <span>{k}</span>
          <span className="n">{v}</span>
        </div>
      ))}
      {career && <p>{t(`target.${career.target}`)}</p>}
      <Grace save={save} />
    </>
  );
}

/** The grace years' growth goals (D-189), from the career rules. */
function Grace({ save }: { save: Save }) {
  const guild = guildOf(save);
  const grace = rules.career?.grace;
  const career = guild.career;
  if (!grace || !career || career.target !== 'growth') return null;
  return (
    <>
      <div className="k">{t('grace.goals')}</div>
      <div className="row">
        <span>{t('grace.roster', { n: grace.roster })}</span>
        <span className="n">{guild.members.length}</span>
      </div>
      <div className="row">
        <span>{t('grace.renown', { n: grace.renown })}</span>
        <span className="n">{career.renownThisYear}</span>
      </div>
      <div className="row">
        <span>{t('grace.room')}</span>
        <span className="n">{career.roomsThisYear}</span>
      </div>
    </>
  );
}

/** Plain questions, the pause check and a new game (the fourth tab). */
function Ask({
  save,
  name,
  pause,
  startOver,
}: {
  save: Save;
  name: NameButton;
  pause: () => void;
  startOver: () => void;
}) {
  const guild = guildOf(save);
  const today = save.state.calendar;
  const fit = guild.members.filter((m) => isFree(m, today));
  const nextWeek = today + rules.daysPerWeek - ((today - 1) % rules.daysPerWeek);
  const wages = guild.members.reduce((s, m) => s + m.wageCopper, 0);
  const rooms = guild.house && rules.house ? upkeepOf(guild.house, rules.house) : 0;
  return (
    <>
      <h2>{t('ask')}</h2>
      <details>
        <summary>{t('ask.fit')}</summary>
        <p className="names">
          {fit.length === 0
            ? t('ask.fit.none')
            : fit.map((m) => <span key={m.id}>{name(m.id)} </span>)}
        </p>
      </details>
      <details>
        <summary>{t('ask.wages')}</summary>
        <p>
          {t('ask.wages.answer', {
            date: date(nextWeek),
            wages: money(wages),
            other: money(rules.runningCostCopper + rooms),
          })}
        </p>
      </details>
      <details>
        <summary>{t('ask.patron')}</summary>
        <p>{guild.career ? t(`target.${guild.career.target}`) : ''}</p>
        <Grace save={save} />
      </details>
      <div className="k">{t('ask.sitting', { no: save.sitting })}</div>
      <button type="button" className="btn main" onClick={pause}>
        {t('ask.pause')}
      </button>
      <CopyReport save={save} />
      <button type="button" className="btn" onClick={startOver}>
        {t('new')}
      </button>
      <p className="muted">{t('ask.note', { week: weekInYear(today, rules) })}</p>
    </>
  );
}

function CopyReport({ save }: { save: Save }) {
  const [shown, setShown] = useState('');
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = buildReport(save);
    setShown(text);
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };
  return (
    <>
      <button type="button" className="btn" onClick={copy}>
        {t('report.copy')}
      </button>
      {copied && <p className="muted">{t('report.copied')}</p>}
      {shown && (
        <textarea className="report" readOnly value={shown} aria-label={t('report.copy')} />
      )}
    </>
  );
}

/** The R7 check, asked when the owner stops a sitting, with the roster out of sight (screen 8, D-198). */
function PauseSheet({
  save,
  header,
  minutes,
  done,
  close,
}: {
  save: Save;
  header: Header;
  minutes: number;
  done: () => void;
  close: () => void;
}) {
  const [answers, setAnswers] = useState(['', '', '']);
  const [report, setReport] = useState('');
  const finish = (skipped: boolean) => {
    save.sittings.push({
      no: save.sitting,
      day: save.state.calendar,
      minutes,
      answers: skipped ? [] : answers,
      skipped,
    });
    save.log.push({ sitting: save.sitting, day: save.state.calendar, what: 'paused', ids: [] });
    save.sitting += 1;
    const text = buildReport(save);
    setReport(text);
    navigator.clipboard?.writeText(text).catch(() => undefined);
    done();
  };
  if (report)
    return (
      <>
        {header(t('sheet.pause'), '')}
        <main className="body">
          <p>{t('pause.copied')}</p>
          <textarea className="report" readOnly value={report} aria-label={t('report.copy')} />
          <button type="button" className="btn main" onClick={close}>
            {t('close')}
          </button>
        </main>
      </>
    );
  return (
    <>
      {header(t('sheet.pause'), t('pause.sitting', { no: save.sitting, minutes }))}
      <main className="body">
        <p className="letter">{t('pause.ask')}</p>
        {answers.map((a, n) => (
          <input
            key={n}
            className="field"
            value={a}
            placeholder={t(`pause.field.${n + 1}`)}
            aria-label={t(`pause.field.${n + 1}`)}
            onChange={(e) => setAnswers(answers.map((x, m) => (m === n ? e.target.value : x)))}
          />
        ))}
        <p className="muted">{t('pause.kept')}</p>
        <div className="btns end">
          <button type="button" className="btn" onClick={() => finish(true)}>
            {t('pause.skip')}
          </button>
          <button type="button" className="btn main" onClick={() => finish(false)}>
            {t('pause.save')}
          </button>
        </div>
        <p className="muted">{t('pause.paste')}</p>
      </main>
    </>
  );
}
