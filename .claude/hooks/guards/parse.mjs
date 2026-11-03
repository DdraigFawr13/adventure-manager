// Shell command parser for the guards. No dependencies; Node 18 or newer.
// parse(command) → [{ name, args, redirects, pipeline, stage }], one entry per simple command, nested ones included.
// `pipeline` is unique within the whole parse (nested bodies included) and changes at every separator
// other than `|` and `|&`; `stage` is the command's position in its pipeline, from 0.
// It reads commands well enough to find a command word; it is not a full shell grammar.

const SEPARATORS = new Set(['\n', ';', ';;', '&&', '||', '|', '|&', '&', '(', ')', '{', '}']);
// Longest first, so '&&' wins over '&' and '>>' over '>'.
const OPERATORS = ['&>>', '<<-', '<<<', '&&', '||', '|&', ';;', '&>', '>>', '>|', '>&', '<&', '<<', ';', '|', '&', '(', ')', '>', '<'];
const OUTPUT_REDIRECTS = new Set(['>', '>>', '>|', '&>', '&>>', '>&']);
const INPUT_REDIRECTS = new Set(['<', '<&', '<<<']);
const WRAPPERS = new Set(['sudo', 'env', 'exec', 'nohup', 'time', 'nice', 'command', 'xargs']);
const VALUE_OPTIONS = { sudo: new Set(['-u', '-g']), nice: new Set(['-n']), xargs: new Set(['-I', '-n', '-P']) };
const SHELLS = new Set(['bash', 'sh', 'zsh']);
// Shell keywords that come before a command word (`then pkill …`, `! pkill …`).
const KEYWORDS = new Set(['if', 'then', 'elif', 'else', 'while', 'until', 'do', '!', 'builtin', 'coproc']);
const SSH_VALUE_OPTIONS = new Set(['-b', '-c', '-D', '-E', '-e', '-F', '-I', '-i', '-J', '-L', '-l', '-m', '-O', '-o', '-p', '-Q', '-R', '-S', '-W', '-w']);
const MAX_DEPTH = 8;

export function parse(command, depth = 0, ctx = { next: 0 }) {
  if (typeof command !== 'string' || depth > MAX_DEPTH) return [];
  const { tokens, nested } = tokenize(command);
  const out = [];
  let words = [];
  let redirects = [];
  let heredocs = [];
  let pending = null;
  let pipeline = ctx.next++;
  let stage = 0;
  const flush = () => {
    if (words.length || redirects.length || heredocs.length) {
      const [first, ...inner] = build(words, redirects, heredocs, depth, ctx);
      out.push({ ...first, pipeline, stage }, ...inner);
    }
    words = [];
    redirects = [];
    heredocs = [];
    pending = null;
  };
  for (const t of tokens) {
    if (t.type === 'heredoc') {
      heredocs.push(t);
      continue;
    }
    if (t.type === 'op') {
      if (SEPARATORS.has(t.value)) {
        flush();
        if (t.value === '|' || t.value === '|&') stage += 1;
        else {
          pipeline = ctx.next++;
          stage = 0;
        }
      } else pending = t.value;
      continue;
    }
    if (pending) {
      const dup = (pending === '>&' || pending === '<&') && /^(\d+|-)$/.test(t.value);
      if (OUTPUT_REDIRECTS.has(pending) && !dup) redirects.push(t.value);
      else if (!INPUT_REDIRECTS.has(pending) && !dup) words.push(t.value);
      pending = null;
      continue;
    }
    words.push(t.value);
  }
  flush();
  for (const body of nested) out.push(...parse(body, depth + 1, ctx));
  return out;
}

/** Split a git argument list into its global options and the subcommand: { dir, sub, rest }. */
export function gitSubcommand(args) {
  let dir = null;
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '-C') {
      const next = args[i + 1];
      if (next !== undefined) dir = next.startsWith('/') || !dir ? next : `${dir}/${next}`;
      i += 2;
    } else if (a === '-c') i += 2;
    else if (a.startsWith('-')) i += 1;
    else break;
  }
  return { dir, sub: args[i] ?? null, rest: args.slice(i + 1) };
}

/** Turn one simple command's words into { name, args, redirects }, plus any nested shell bodies. */
function build(words, redirects, heredocs, depth, ctx) {
  let i = 0;
  let lastWrapper = null;
  let wrapperAt = -1;
  while (i < words.length) {
    const w = words[i];
    if (KEYWORDS.has(w) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(w)) {
      i += 1;
      continue;
    }
    const base = basename(w);
    if (!WRAPPERS.has(base)) break;
    lastWrapper = base;
    wrapperAt = i;
    i += 1;
    while (i < words.length && words[i].startsWith('-') && words[i] !== '-') {
      const opt = words[i];
      i += 1;
      if (VALUE_OPTIONS[base]?.has(opt)) i += 1;
    }
  }
  let name = '';
  let args = [];
  if (i < words.length) {
    name = basename(words[i]);
    args = words.slice(i + 1);
  } else if (lastWrapper === 'env') {
    // Bare `env` keeps its other words (`env -i`, `env A=1`) as args, so a check can tell it apart.
    name = 'env';
    args = words.slice(wrapperAt + 1);
  }
  const out = [{ name, args, redirects }];
  if (SHELLS.has(name)) {
    const flag = args.findIndex((a) => /^-[A-Za-z]*c[A-Za-z]*$/.test(a));
    if (flag >= 0) {
      const body = args.slice(flag + 1).find((a) => !a.startsWith('-'));
      if (body !== undefined) out.push(...parse(body, depth + 1, ctx));
    } else {
      // A heredoc fed to a shell is its program.
      for (const doc of heredocs) out.push(...parse(doc.body, depth + 1, ctx));
    }
  } else if (name === 'eval') {
    if (args.length) out.push(...parse(args.join(' '), depth + 1, ctx));
  } else if (name === 'ssh') {
    let j = 0;
    while (j < args.length && args[j].startsWith('-')) j += SSH_VALUE_OPTIONS.has(args[j]) ? 2 : 1;
    const rest = args.slice(j + 1);
    if (rest.length) out.push(...parse(rest.join(' '), depth + 1, ctx));
  }
  return out;
}

function basename(word) {
  const parts = word.split('/');
  return parts[parts.length - 1] || word;
}

/** One quote-aware pass: words (quotes removed) and unquoted operators; $( ) and backtick bodies go to nested. */
function tokenize(src) {
  const tokens = [];
  const nested = [];
  const heredocs = [];
  let cur = '';
  let has = false;
  let i = 0;
  const push = () => {
    if (has) tokens.push({ type: 'word', value: cur });
    cur = '';
    has = false;
  };
  const readSubstitution = (at) => {
    // at points just past "$("; returns the index of the closing ")".
    const end = matchParen(src, at);
    nested.push(src.slice(at, end));
    return end;
  };
  const readBacktick = (at) => {
    let j = at;
    while (j < src.length && src[j] !== '`') j += src[j] === '\\' ? 2 : 1;
    nested.push(src.slice(at, j).replace(/\\`/g, '`'));
    return j;
  };

  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      if (src[i + 1] !== '\n') {
        cur += src[i + 1] ?? '';
        has = true;
      }
      i += 2;
      continue;
    }
    if (c === "'") {
      const end = src.indexOf("'", i + 1);
      const stop = end < 0 ? src.length : end;
      cur += src.slice(i + 1, stop);
      has = true;
      i = stop + 1;
      continue;
    }
    if (c === '"') {
      has = true;
      i += 1;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && '"\\$`\n'.includes(src[i + 1] ?? '')) {
          if (src[i + 1] !== '\n') cur += src[i + 1];
          i += 2;
        } else if (src[i] === '$' && src[i + 1] === '(') {
          const end = readSubstitution(i + 2);
          cur += src.slice(i, end + 1);
          i = end + 1;
        } else if (src[i] === '`') {
          const end = readBacktick(i + 1);
          cur += src.slice(i, end + 1);
          i = end + 1;
        } else {
          cur += src[i];
          i += 1;
        }
      }
      i += 1;
      continue;
    }
    if (c === '$' && src[i + 1] === '(') {
      const end = readSubstitution(i + 2);
      cur += src.slice(i, end + 1);
      has = true;
      i = end + 1;
      continue;
    }
    if (c === '`') {
      const end = readBacktick(i + 1);
      cur += src.slice(i, end + 1);
      has = true;
      i = end + 1;
      continue;
    }
    if (c === '#' && !has) {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      push();
      i += 1;
      continue;
    }
    if (c === '\n') {
      push();
      tokens.push({ type: 'op', value: '\n' });
      i += 1;
      for (const doc of heredocs.splice(0)) {
        const { end, body } = skipHeredoc(src, i, doc);
        doc.body = body;
        // An unquoted delimiter means $( ) and backticks in the body still run.
        if (!doc.quoted) nested.push(...substitutions(body));
        i = end;
      }
      continue;
    }
    if ((c === '{' || c === '}') && !has && /^[\s;&|)]?$/.test(src[i + 1] ?? '')) {
      tokens.push({ type: 'op', value: c });
      i += 1;
      continue;
    }
    const op = OPERATORS.find((o) => src.startsWith(o, i));
    if (op) {
      if ((op[0] === '>' || op[0] === '<') && has && /^\d+$/.test(cur)) {
        cur = '';
        has = false;
      } else push();
      i += op.length;
      if (op === '<<' || op === '<<-') {
        const { word, quoted, end } = readDelimiter(src, i);
        if (word) {
          const doc = { type: 'heredoc', word, quoted, strip: op === '<<-', body: '' };
          heredocs.push(doc);
          tokens.push(doc);
        }
        i = end;
        continue;
      }
      tokens.push({ type: 'op', value: op });
      continue;
    }
    cur += c;
    has = true;
    i += 1;
  }
  push();
  return { tokens, nested };
}

function matchParen(src, at) {
  let depth = 1;
  let j = at;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') j += 2;
    else if (c === "'") {
      const end = src.indexOf("'", j + 1);
      j = end < 0 ? src.length : end + 1;
    } else if (c === '"') {
      j += 1;
      while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1;
      j += 1;
    } else if (c === '(') {
      depth += 1;
      j += 1;
    } else if (c === ')') {
      depth -= 1;
      if (depth === 0) return j;
      j += 1;
    } else j += 1;
  }
  return src.length;
}

function readDelimiter(src, at) {
  let j = at;
  while (src[j] === ' ' || src[j] === '\t') j += 1;
  let word = '';
  let quoted = false;
  while (j < src.length && !/[\s;&|<>()]/.test(src[j])) {
    if (src[j] === "'" || src[j] === '"') {
      quoted = true;
      const q = src[j];
      const end = src.indexOf(q, j + 1);
      const stop = end < 0 ? src.length : end;
      word += src.slice(j + 1, stop);
      j = stop + 1;
    } else if (src[j] === '\\') {
      quoted = true;
      word += src[j + 1] ?? '';
      j += 2;
    } else {
      word += src[j];
      j += 1;
    }
  }
  return { word, quoted, end: j };
}

/** Read a heredoc body starting at a line start: { end: index after the delimiter line, body }. */
function skipHeredoc(src, at, { word, strip }) {
  let j = at;
  const lines = [];
  while (j < src.length) {
    const nl = src.indexOf('\n', j);
    const end = nl < 0 ? src.length : nl;
    let line = src.slice(j, end);
    if (strip) line = line.replace(/^\t+/, '');
    j = end + 1;
    if (line === word) return { end: j, body: lines.join('\n') };
    lines.push(line);
  }
  return { end: src.length, body: lines.join('\n') };
}

/** The bodies of $( ) and backticks in text that is not otherwise parsed as commands. */
function substitutions(text) {
  const out = [];
  let j = 0;
  while (j < text.length) {
    if (text[j] === '\\') j += 2;
    else if (text[j] === '$' && text[j + 1] === '(') {
      const end = matchParen(text, j + 2);
      out.push(text.slice(j + 2, end));
      j = end + 1;
    } else if (text[j] === '`') {
      const end = text.indexOf('`', j + 1);
      const stop = end < 0 ? text.length : end;
      out.push(text.slice(j + 1, stop));
      j = stop + 1;
    } else j += 1;
  }
  return out;
}

/**
 * The operands of a simple command: words that are not options. `--` ends the options; an option in
 * `valued` (exact match, so `--opt=v` is one word) also takes the next word. A lone `-` is an operand.
 */
export function operands(args, valued = new Set()) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') return out.concat(args.slice(i + 1));
    if (a.startsWith('-') && a !== '-') {
      if (valued.has(a)) i += 1;
      continue;
    }
    out.push(a);
  }
  return out;
}

/** True when a word is a short-flag group (`-fd`) holding `letter`, or equals one of `long`. */
export function hasFlag(args, letter, ...long) {
  for (const a of args) {
    if (a === '--') return false;
    if (long.includes(a) || long.some((l) => l.endsWith('=') && a.startsWith(l))) return true;
    if (letter && /^-[A-Za-z0-9]+$/.test(a) && a.includes(letter)) return true;
  }
  return false;
}
