// Runs `prisma migrate deploy` with retries.
//
// Why: on Faable's free plan the Neon database sleeps, and waking it can
// take longer than Prisma's 10s advisory-lock timeout, so the first migrate
// attempt often fails with P1002. Retrying a few times lets the database
// warm up. If migrate still fails after all retries, this script warns
// loudly but exits 0 so the app can still start: migrations are normally
// already applied (they are applied from the developer's machine whenever
// the schema changes), so a failed migrate must not keep the app down.
import { spawnSync } from 'node:child_process';

const ATTEMPTS = 5;
const WAIT_MS = 15_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  console.log(`[migrate] attempt ${attempt}/${ATTEMPTS}: prisma migrate deploy`);
  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
  if (result.status === 0) {
    console.log('[migrate] done');
    process.exit(0);
  }
  if (attempt < ATTEMPTS) {
    console.log(`[migrate] failed, waiting ${WAIT_MS / 1000}s before retrying...`);
    await sleep(WAIT_MS);
  }
}

console.error(
  '[migrate] WARNING: `prisma migrate deploy` did not succeed after retries. ' +
    'Starting the app anyway; if the schema changed, run `npx prisma migrate deploy` from your machine.',
);
process.exit(0);
