// Git checks (GIT-03): force pushes that can overwrite others' work, and deleting branches that may
// be unmerged. When git can't confirm the answer (no base, a failed call), the check warns.
import { gitSubcommand, hasFlag, operands } from '../parse.mjs';

const PUSH_VALUED = new Set(['-o', '--repo', '--push-option', '--receive-pack', '--exec']);
const MERGED_HINT = "can't confirm it is merged (squash merges look unmerged): check the PR is merged";

const strip = (ref) => ref.replace(/^refs\/heads\//, '');
/** A branch name without the remote prefix: origin/main → main. */
const short = (ref) => ref.replace(/^[^/]+\//, '');

/** `git push` args: { remote, refspecs, rest }. */
export function parsePush(rest) {
  const [remote = null, ...refspecs] = operands(rest, PUSH_VALUED);
  return { remote, refspecs, rest };
}

const currentBranch = (facts, dir) => facts.git(['symbolic-ref', '--short', '-q', 'HEAD'], dir);

function forcePush(c, facts, rest) {
  const { refspecs } = parsePush(rest);
  const flagged = hasFlag(rest, 'f', '--force', '--force-with-lease', '--force-with-lease=', '--force-if-includes', '--mirror');
  if (!flagged && !refspecs.some((r) => r.startsWith('+'))) return null;
  if (hasFlag(rest, null, '--all', '--mirror')) return 'force push of every branch (`--all` or `--mirror`)';
  const base = facts.base;
  if (!base) return "force push, and the base branch can't be confirmed";
  const current = currentBranch(facts, c.dir);
  if (!current) return 'force push from a detached HEAD';
  const targets = (refspecs.length ? refspecs : [current]).map((r) => {
    const spec = r.replace(/^\+/, '');
    const dst = spec.includes(':') ? spec.slice(spec.indexOf(':') + 1) : spec;
    return dst === 'HEAD' || dst === '' ? current : strip(dst);
  });
  const hit = targets.find((t) => t === short(base) || t !== current);
  if (!hit) return null;
  return hit === short(base) ? `force push to the base branch \`${hit}\`` : `force push to \`${hit}\`, which is not your current branch`;
}

/** Branches a `git push` deletes: `--delete`/`-d` operands, or `:<b>` refspecs. */
function pushDeletes(rest) {
  const { remote, refspecs } = parsePush(rest);
  const all = hasFlag(rest, 'd', '--delete');
  const branches = all ? refspecs.map((r) => r.replace(/^\+/, '')) : refspecs.filter((r) => /^\+?:./.test(r)).map((r) => r.replace(/^\+?:/, ''));
  return { remote, branches: branches.map(strip) };
}

function deletes(c, facts) {
  const { sub, rest } = gitSubcommand(c.args);
  const unmerged = [];
  if (sub === 'branch') {
    const force = hasFlag(rest, 'D') || (hasFlag(rest, 'd', '--delete') && hasFlag(rest, 'f', '--force'));
    if (!force) return null;
    const base = facts.base;
    for (const b of operands(rest)) {
      if (!base || facts.git(['merge-base', '--is-ancestor', b, base], c.dir) === null) unmerged.push(b);
    }
  } else if (sub === 'push') {
    // Git reads the first operand as the remote, so a push that deletes always names one.
    const { remote, branches } = pushDeletes(rest);
    if (!branches.length) return null;
    const base = facts.base;
    for (const b of branches) {
      const ref = `${remote}/${b}`;
      const exists = facts.git(['rev-parse', '--verify', '-q', `refs/remotes/${ref}`], c.dir) !== null;
      if (!base || !exists || facts.git(['merge-base', '--is-ancestor', ref, base], c.dir) === null) unmerged.push(b);
    }
  }
  return unmerged.length ? `deletes ${unmerged.map((b) => `\`${b}\``).join(', ')}: ${MERGED_HINT}` : null;
}

export const checks = [
  {
    id: 'git.force',
    rule: 'GIT-03',
    tools: ['Bash'],
    mode: 'ask', // D-034
    test(input, facts) {
      for (const c of facts.commands()) {
        if (c.name !== 'git') continue;
        const { sub, rest } = gitSubcommand(c.args);
        if (sub !== 'push') continue;
        const message = forcePush(c, facts, rest);
        if (message) return message;
      }
      return null;
    },
  },
  {
    id: 'git.delete',
    rule: 'GIT-03',
    tools: ['Bash'],
    mode: 'ask', // D-034
    test(input, facts) {
      for (const c of facts.commands()) {
        if (c.name !== 'git') continue;
        const message = deletes(c, facts);
        if (message) return message;
      }
      return null;
    },
  },
];
