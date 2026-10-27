// Stored baselines (tools/balance/README.md): a scenario's careers as played on the commit that
// saved them, one JSON line per seed, so a later run pairs with them seed by seed without a
// worktree. Each line keeps the whole career (a new metric over existing fields needs no replay)
// and a hash of it, so "identical to the baseline" is an exact check of every recorded number.
// The header keeps a hash of the content played, so a run on changed content is flagged.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import type { Career } from '../career-play.ts';
import type { Scenario } from './scenarios.ts';

export type Settings = Omit<Scenario, 'description'>;

export interface Baseline {
  readonly scenario: string;
  readonly settings: Settings;
  readonly contentHash: string;
  readonly commit: string;
  readonly careers: readonly { seed: string; hash: string; career: Career }[];
}

const DEFAULT_DIR = new URL('./baselines/', import.meta.url);
const fileFor = (scenario: string, dir: URL) => new URL(`${scenario}.jsonl.gz`, dir);
const hash = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);

/** A career without its runtime, which differs from run to run. */
export function hashCareer(career: Career): string {
  const { seconds: _seconds, ...rest } = career;
  return hash(JSON.stringify(rest));
}

/** Every number, flag and word the careers were played with. */
export const hashContent = (content: object) => hash(JSON.stringify(content));

export function loadBaseline(scenario: string, dir = DEFAULT_DIR): Baseline | null {
  const file = fileFor(scenario, dir);
  if (!existsSync(file)) return null;
  const [head, ...lines] = gunzipSync(readFileSync(file)).toString('utf8').trim().split('\n');
  // cast-ok: written by saveBaseline below; the seeds are checked as the careers are paired.
  const header = JSON.parse(head ?? '{}') as Omit<Baseline, 'careers'>;
  // cast-ok: as above, one career line per seed.
  const careers = lines.map((l) => JSON.parse(l) as Baseline['careers'][number]);
  return { ...header, careers };
}

export function saveBaseline(baseline: Omit<Baseline, 'commit'>, dir = DEFAULT_DIR): string {
  const { careers, ...header } = baseline;
  const text = [
    JSON.stringify({ ...header, commit: currentCommit() }),
    ...careers.map((c) =>
      JSON.stringify({ seed: c.seed, hash: c.hash, career: { ...c.career, seconds: 0 } }),
    ),
  ].join('\n');
  mkdirSync(dir, { recursive: true });
  writeFileSync(fileFor(baseline.scenario, dir), gzipSync(`${text}\n`, { level: 9 }));
  return fileFor(baseline.scenario, dir).pathname;
}

const git = (...args: string[]) => execFileSync('git', args, { stdio: 'pipe' }).toString().trim();

/** Uncommitted changes to the code or content (the baselines themselves aside). */
export function treeIsDirty(): boolean {
  return (
    git('status', '--porcelain', '--', 'packages', 'tools', ':(exclude)tools/balance/baselines') !==
    ''
  );
}

function currentCommit(): string {
  try {
    return `${git('rev-parse', '--short', 'HEAD')}${treeIsDirty() ? '+changes' : ''}`;
  } catch {
    return 'unknown';
  }
}

/** Whether the baseline's commit is in this branch's history (a baseline from elsewhere may mislead). */
export function inHistory(commit: string): boolean {
  try {
    git('merge-base', '--is-ancestor', commit.replace('+changes', ''), 'HEAD');
    return true;
  } catch {
    return false;
  }
}
