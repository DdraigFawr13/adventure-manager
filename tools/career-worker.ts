// Worker thread for tools/career-sim.ts (D-148): plays the careers it is sent and posts them back.
import { parentPort, workerData } from 'node:worker_threads';
import { playCareer, type CareerJob, type CareerSetup } from './career-play.ts';

// cast-ok: career-sim.ts sends exactly this shape.
const { setup, jobs } = workerData as {
  setup: CareerSetup;
  jobs: { index: number; job: CareerJob }[];
};
for (const { index, job } of jobs)
  parentPort?.postMessage({ index, career: playCareer(setup, job) });
