// Worker thread for tools/balance/pool.ts (D-148): asks for a career, plays it, posts it back and
// asks again, so a thread that drew short careers takes more of them.
import { parentPort } from 'node:worker_threads';
import { playCareer, type CareerJob, type CareerSetup } from './career-play.ts';

parentPort?.on('message', (m: { index: number; setup: CareerSetup; job: CareerJob } | null) => {
  if (m === null) return parentPort?.close();
  parentPort?.postMessage({ index: m.index, career: playCareer(m.setup, m.job) });
});
parentPort?.postMessage('ready');
