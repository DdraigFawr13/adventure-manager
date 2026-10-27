// Plays careers on worker threads across the machine's cores (D-148). Each thread takes the next
// career when it finishes one, so long and short careers balance out; results come back in job
// order, so a report is the same however many threads ran it. CAREER_SIM_THREADS overrides.
import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import type { Career, CareerJob, CareerSetup } from '../career-play.ts';

export interface PoolItem {
  readonly setup: CareerSetup;
  readonly job: CareerJob;
}

export async function playCareers(items: readonly PoolItem[]): Promise<Career[]> {
  const threads = Math.max(
    1,
    Math.min(items.length, Number(process.env.CAREER_SIM_THREADS ?? availableParallelism())),
  );
  const out: Career[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from(
      { length: threads },
      () =>
        new Promise<void>((resolve, reject) => {
          const worker = new Worker(new URL('../career-worker.ts', import.meta.url));
          const feed = () => {
            const index = next;
            next += 1;
            const item = items[index];
            worker.postMessage(item ? { index, setup: item.setup, job: item.job } : null);
          };
          worker.on('message', (m: 'ready' | { index: number; career: Career }) => {
            if (m !== 'ready') out[m.index] = m.career;
            feed();
          });
          worker.on('error', reject);
          worker.on('exit', (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`A career thread stopped with code ${code}.`)),
          );
        }),
    ),
  );
  // A thread that ends without reporting every career would leave a gap; fail rather than report
  // over fewer careers.
  const missing = items.findIndex((_, i) => out[i] === undefined);
  if (missing >= 0) throw new Error(`No result for ${items[missing]!.job.seed}.`); // non-null: an index of items.
  return out;
}
