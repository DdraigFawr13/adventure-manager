// What the phone map says about each tappable mark: its name, kind and short details, all from
// content text (engine-test.en.json, keys phone.*). Ids match the marks the scene returns.
import { sitesOf, type MapData } from '../map/map-data.ts';
import { GUILDS, type MarkKind } from '../map/map-scene.ts';

export interface MarkInfo {
  id: string;
  kind: MarkKind;
  name: string;
  /** Kind label, e.g. "Town". */
  kindName: string;
  lines: string[];
}

type Say = (key: string) => string;

/** Every mark the screen-reader list and the pop-up know, in reading order. */
export function describeMarks(data: MapData, text: Readonly<Record<string, string>>): MarkInfo[] {
  const say: Say = (key) => text[key] ?? key;
  const has = (key: string) => key in text;
  const make = (id: string, kind: MarkKind, name: string, extra: string[] = []): MarkInfo => {
    const lines = [`phone.kindline.${kind}`, `phone.about.${id}`, `phone.more.${id}`]
      .filter(has)
      .map(say);
    return { id, kind, name, kindName: say(`phone.kind.${kind}`), lines: [...lines, ...extra] };
  };
  const out: MarkInfo[] = [];
  sitesOf(data).forEach((_, k) => {
    out.push(make(`town.${k}`, 'town', say(k === 0 ? 'place.guild-hall' : `place.${k - 1}`)));
  });
  data.villageCells.forEach((_, k) =>
    out.push(make(`village.${k}`, 'village', say(`village.${k}`))),
  );
  out.push(make('landmark.0', 'landmark', say('landmark.0')));
  out.push(make('threat.0', 'threat', say('threat.0')));
  GUILDS.forEach((g, n) => {
    const tier = say('ui.tier').replace('{tier}', String(g.tier));
    out.push(make(`guild.${n}`, 'guild', say(g.nameKey), [tier]));
  });
  out.push(make('party.0', 'party', say('party.0')));
  return out;
}
