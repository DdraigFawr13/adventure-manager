// From Story-Generator src/app/tales/colours.ts @ 8a5c4ef (D-116); unchanged. Only Rgb3 is used here; the realm colour rules are kept for the later procedural renderer (PLAN §12d).
// Realm, people and faith colours for the Tales map. Pure: no DOM. A realm keeps one hue for the
// whole world (every year, every mode), picked by greedy graph colouring so that neighbouring
// realms sit far apart on the colour wheel.

export type Rgb3 = [number, number, number];

/** The 11 hues (degrees) realms and faiths draw from. */
export const HUES: readonly number[] = [0, 28, 48, 92, 150, 182, 212, 240, 272, 305, 335];

/** Distance between two hues on the wheel, 0 to 180. */
export function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

/** HLS to RGB, each 0-255; h in degrees. */
export function hlsToRgb(h: number, l: number, s: number): Rgb3 {
  const hh = (((h % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t0: number) => {
    const t = t0 < 0 ? t0 + 1 : t0 > 1 ? t0 - 1 : t0;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(channel(hh + 1 / 3) * 255),
    Math.round(channel(hh) * 255),
    Math.round(channel(hh - 1 / 3) * 255),
  ];
}

/** Soft fill for a realm, people or faith. */
export const fillColour = (hue: number): Rgb3 => hlsToRgb(hue, 0.76, 0.5);
/** The realm's border band. */
export const borderColour = (hue: number): Rgb3 => hlsToRgb(hue, 0.46, 0.55);
/** The realm's name on the map: the border colour, darker. */
export function labelColour(hue: number): Rgb3 {
  const c = borderColour(hue);
  return [Math.round(c[0] * 0.8), Math.round(c[1] * 0.8), Math.round(c[2] * 0.8)];
}

/** Neighbour sets, keyed by id, symmetric. */
export type Neighbours = Map<number, Set<number>>;

/**
 * Which ids touch which in a per-cell owner grid (0 = nobody), and how many cells each holds.
 * `skip` marks cells to ignore (sea and lakes). Four-neighbour touching only.
 */
export function touching(
  owner: ArrayLike<number>,
  width: number,
  height: number,
  skip?: ArrayLike<number>,
  into?: { neighbours: Neighbours; size: Map<number, number> },
): { neighbours: Neighbours; size: Map<number, number> } {
  const out = into ?? { neighbours: new Map(), size: new Map() };
  const link = (a: number, b: number) => {
    let set = out.neighbours.get(a);
    if (!set) out.neighbours.set(a, (set = new Set()));
    set.add(b);
  };
  const mine = new Map<number, number>();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const a = owner[i]!;
      if (!a || skip?.[i]) continue;
      mine.set(a, (mine.get(a) ?? 0) + 1);
      for (const j of [x + 1 < width ? i + 1 : -1, y + 1 < height ? i + width : -1]) {
        if (j < 0) continue;
        const b = owner[j]!;
        if (!b || b === a || skip?.[j]) continue;
        link(a, b);
        link(b, a);
      }
    }
  }
  for (const [id, n] of mine) out.size.set(id, Math.max(out.size.get(id) ?? 0, n));
  return out;
}

/**
 * One hue per id. Biggest first, each takes the hue farthest from its already-coloured
 * neighbours; ties go to the hue farthest from its neighbours' neighbours, then the least used
 * hue, then the earliest in the list. Deterministic.
 */
export function assignHues(
  ids: readonly number[],
  neighbours: Neighbours,
  size: ReadonlyMap<number, number>,
  hues: readonly number[] = HUES,
): Map<number, number> {
  const hue = new Map<number, number>();
  const used = new Map<number, number>();
  const order = [...ids].sort((a, b) => (size.get(b) ?? 0) - (size.get(a) ?? 0) || a - b);
  const coloured = (set: Iterable<number>, skip: ReadonlySet<number>): number[] => {
    const out: number[] = [];
    for (const n of set) {
      const h = skip.has(n) ? undefined : hue.get(n);
      if (h !== undefined) out.push(h);
    }
    return out;
  };
  for (const id of order) {
    const first = neighbours.get(id) ?? new Set<number>();
    const near = coloured(first, new Set());
    const far: number[] = [];
    const skip = new Set<number>([id, ...first]);
    for (const n of first) far.push(...coloured(neighbours.get(n) ?? [], skip));
    const gapOf = (h: number, list: number[]) =>
      list.length ? Math.min(...list.map((n) => hueGap(h, n))) : 999;
    let best = hues[0]!;
    let bestKey: number[] | null = null;
    hues.forEach((h, index) => {
      const key = [gapOf(h, near), gapOf(h, far), -(used.get(h) ?? 0), -index];
      let better = !bestKey;
      for (let i = 0; bestKey && i < key.length; i += 1) {
        if (key[i]! !== bestKey[i]!) {
          better = key[i]! > bestKey[i]!;
          break;
        }
      }
      if (better) {
        bestKey = key;
        best = h;
      }
    });
    hue.set(id, best);
    used.set(best, (used.get(best) ?? 0) + 1);
  }
  return hue;
}

/**
 * One hue per people (race), the way realms get theirs: peoples whose realms touch sit far apart
 * on the colour wheel and every people keeps far from the rest, the biggest choose first. `realmNeighbours` and `realmSize` are the realm
 * graph; `raceOf` names each realm's people. Deterministic: races are numbered in id order.
 */
export function assignRaceHues(
  realmNeighbours: Neighbours,
  realmSize: ReadonlyMap<number, number>,
  raceOf: (civ: number) => string | undefined,
): Map<string, number> {
  const races = [...new Set([...realmSize.keys()].map(raceOf))]
    .filter((r): r is string => r !== undefined)
    .sort();
  const index = new Map(races.map((r, i) => [r, i]));
  const links: Neighbours = new Map();
  const size = new Map<number, number>();
  for (const [civ, n] of realmSize) {
    const i = index.get(raceOf(civ) ?? '');
    if (i !== undefined) size.set(i, (size.get(i) ?? 0) + n);
  }
  for (const [a, set] of realmNeighbours) {
    const ia = index.get(raceOf(a) ?? '');
    if (ia === undefined) continue;
    for (const b of set) {
      const ib = index.get(raceOf(b) ?? '');
      if (ib === undefined || ib === ia) continue;
      if (!links.has(ia)) links.set(ia, new Set());
      links.get(ia)!.add(ib);
    }
  }
  // Peoples are few, so each also keeps far from every people already coloured, touching or not:
  // the farthest from all comes first, then the farthest from its neighbours.
  const hue = new Map<number, number>();
  const order = [...index.values()].sort(
    (a, b) => (size.get(b) ?? 0) - (size.get(a) ?? 0) || a - b,
  );
  for (const id of order) {
    const gapTo = (h: number, list: number[]) =>
      list.length ? Math.min(...list.map((n) => hueGap(h, n))) : 999;
    const all = [...hue.values()];
    const near = [...(links.get(id) ?? [])].flatMap((n) => (hue.has(n) ? [hue.get(n)!] : []));
    let best = HUES[0]!;
    let bestKey: [number, number] | null = null;
    for (const h of HUES) {
      const key: [number, number] = [gapTo(h, all), gapTo(h, near)];
      if (!bestKey || key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) {
        bestKey = key;
        best = h;
      }
    }
    hue.set(id, best);
  }
  return new Map(races.map((r, i) => [r, hue.get(i)!]));
}
