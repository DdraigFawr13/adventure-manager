// Content overrides for balance runs (tools/balance/README.md): `--set path=value` changes one
// number, flag or word in a copy of the content, so a tuning try needs no edit to the content files.
// A path walks object keys with dots; `name[id]` picks the array entry with that id, and a plain
// number picks an array entry by index: `guild.house.incidents.kinds[incident.fire].weeklyBp`.

export interface Override {
  readonly path: string;
  readonly value: number | boolean | string;
}

/** Parses `path=value`; the value's type is checked against the content when it is applied. */
export function parseOverride(text: string): Override {
  const at = text.indexOf('=');
  if (at <= 0 || at === text.length - 1) throw new Error(`--set needs path=value, got "${text}".`);
  const raw = text.slice(at + 1);
  const value =
    raw === 'true'
      ? true
      : raw === 'false'
        ? false
        : Number.isFinite(Number(raw))
          ? Number(raw)
          : raw;
  return { path: text.slice(0, at), value };
}

/** The path's steps: keys, and `[id]` selectors kept as `{ id }`. */
function steps(path: string): (string | { id: string })[] {
  const out: (string | { id: string })[] = [];
  for (const part of path.split(/\.(?![^[]*\])/)) {
    const m = /^([^[\]]+)(?:\[([^\]]+)\])?$/.exec(part);
    if (!m) throw new Error(`Bad override path "${path}" at "${part}".`);
    out.push(m[1]!); // non-null: the first group always matches.
    if (m[2] !== undefined) out.push({ id: m[2] });
  }
  return out;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** A deep copy of content with every override applied; throws on an unknown path or a changed type. */
export function applyOverrides<T extends object>(content: T, overrides: readonly Override[]): T {
  if (overrides.length === 0) return content;
  const copy = structuredClone(content);
  for (const o of overrides) {
    const path = steps(o.path);
    let node: unknown = copy;
    for (let i = 0; i < path.length - 1; i += 1) node = child(node, path[i]!, o.path); // non-null: in range.
    const last = path[path.length - 1]!; // non-null: a path has at least one step.
    if (typeof last !== 'string' || !isRecord(node) || !Object.hasOwn(node, last))
      throw new Error(`Override path "${o.path}" does not name a value in the content.`);
    const old = node[last];
    if (typeof old !== typeof o.value)
      throw new Error(
        `Override "${o.path}" is a ${typeof old} (${JSON.stringify(old)}), not a ${typeof o.value}.`,
      );
    node[last] = o.value;
  }
  return copy;
}

function child(node: unknown, step: string | { id: string }, full: string): unknown {
  if (typeof step !== 'string') {
    if (!Array.isArray(node)) throw new Error(`"${full}": [${step.id}] needs a list.`);
    const found: unknown = node.find((e) => isRecord(e) && e.id === step.id);
    if (found === undefined) throw new Error(`"${full}": no entry with id ${step.id}.`);
    return found;
  }
  if (!isRecord(node) || !Object.hasOwn(node, step))
    throw new Error(`Override path "${full}" has no "${step}".`);
  return node[step];
}
