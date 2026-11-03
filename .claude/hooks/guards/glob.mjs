// A small glob matcher for the guards (path.matchesGlob needs Node 22).
// Rules: match the POSIX path relative to the project root; "**/" is zero or more folders, "*" stays
// within one segment, "?" is one character, "[]" is not supported. Dotfiles match like other files,
// matching is case-sensitive, and a pattern with no "/" matches the base name at any depth.

const cache = new Map();

export function globToRegExp(pattern) {
  if (cache.has(pattern)) return cache.get(pattern);
  const p = pattern.replace(/^\.\//, '');
  let re = '';
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === '*' && p[i + 1] === '*') {
      if (p[i + 2] === '/') {
        re += '(?:[^/]+/)*';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  const out = new RegExp(p.includes('/') ? `^${re}$` : `^(?:.*/)?${re}$`);
  cache.set(pattern, out);
  return out;
}

/** Normalise a root-relative path; null if it lies outside the root. */
export function normalise(rel) {
  if (typeof rel !== 'string' || !rel) return null;
  let p = rel.replace(/\\/g, '/');
  while (p.startsWith('./')) p = p.slice(2);
  p = p.replace(/\/+$/, '');
  if (!p || p === '.' || p.startsWith('/') || p === '..' || p.startsWith('../')) return null;
  return p;
}

export function matches(pattern, rel) {
  const p = normalise(rel);
  return p !== null && globToRegExp(pattern).test(p);
}

export function matchesAny(patterns, rel) {
  return patterns.some((pattern) => matches(pattern, rel));
}

/** An argument names a path set if it matches, or if it is a folder holding a match ("<arg>/x"). */
export function names(patterns, rel) {
  const p = normalise(rel);
  if (p === null) return false;
  return matchesAny(patterns, p) || matchesAny(patterns, `${p}/x`);
}
