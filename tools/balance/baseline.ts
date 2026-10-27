// Stored baselines (tools/balance/README.md): a scenario's careers as played on the commit that
// saved them, one JSON line per seed, so a later run pairs with them seed by seed without a
// worktree. Each line keeps the whole career (any metric, even one added later, can be computed)
// and a hash of it, so "identical to the baseline" is an exact check.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import type { Career } from '../career-play.ts';
import type { Override } from './overrides.ts';
import type { Scenario } from './scenarios.ts';

export type Settings = Omit<Scenario, 'description'>;

export interface Baseline {
  readonly scenario: string;
  readonly settings: Settings;
  readonly overrides: readonly Override[];
  readonly commit: string;
  readonly careers: readonly { seed: string; hash: string; career: Career }[];
}

const dir = new URL('./baselines/', import.meta.url);
const fileFor = (scenario: string) => new URL(`${scenario}.jsonl.gz`, dir);

/** A career without its runtime, which differs from run to run. */
export function hashCareer(career: Career): string {
  const { seconds: _seconds, ...rest } = career;
  return createHash('sha256').update(JSON.stringify(rest)).digest('hex').slice(0, 16);
}

export function loadBaseline(scenario: string): Baseline | null {
  const file = fileFor(scenario);
  if (!existsSync(file)) return null;
  const [head, ...lines] = gunzipSync(readFileSync(file)).toString('utf8').trim().split('\n');
  // cast-ok: written by saveBaseline below; the header and lines are checked as they are used.
  const header = JSON.parse(head ?? '{}') as Omit<Baseline, 'careers'>;
  // cast-ok: as above, one career line per seed.
  const careers = lines.map((l) => JSON.parse(l) as Baseline['careers'][number]);
  return { ...header, careers };
}

export function saveBaseline(baseline: Omit<Baseline, 'commit'>): string {
  const commit = currentCommit();
  const { careers, ...header } = baseline;
  const text = [
    JSON.stringify({ ...header, commit }),
    ...careers.map((c) =>
      JSON.stringify({ seed: c.seed, hash: c.hash, career: { ...c.career, seconds: 0 } }),
    ),
  ].join('\n');
  mkdirSync(dir, { recursive: true });
  // Node writes no timestamp into the gzip header, so re-saving the same careers changes no bytes.
  writeFileSync(fileFor(baseline.scenario), gzipSync(`${text}\n`, { level: 9 }));
  return fileFor(baseline.scenario).pathname;
}

/** The commit the careers were played on, with "+changes" when the tree has uncommitted edits. */
function currentCommit(): string {
  try {
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();
    const dirty = execFileSync('git', [
      'status',
      '--porcelain',
      '--',
      'packages',
      'tools',
      ':(exclude)tools/balance/baselines',
    ])
      .toString()
      .trim();
    return dirty ? `${sha}+changes` : sha;
  } catch {
    return 'unknown';
  }
}
