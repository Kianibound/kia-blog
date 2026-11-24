// Keeps the free-tier Neon compute awake while developing locally.
// Run in a terminal while the backend is up:  node keep-neon-warm.mjs
// It hits GET /health/db (a real SELECT 1) every 3 minutes; Neon sleeps
// after ~5 idle minutes, so this removes the ~2s cold start on first use.
// Stop it with Ctrl+C. Nothing is written anywhere.
const URL =
  process.env.NEST_HEALTH_DB_URL ?? "http://localhost:3000/health/db";
const INTERVAL_MS = 3 * 60 * 1000;

async function ping() {
  const start = performance.now();
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(15000) });
    console.log(
      `[${new Date().toLocaleTimeString("fa-IR")}] ${URL} -> ${res.status} in ${Math.round(performance.now() - start)}ms`,
    );
  } catch (error) {
    console.log(`[${new Date().toLocaleTimeString("fa-IR")}] ${URL} FAILED: ${error.message}`);
  }
}

await ping();
setInterval(ping, INTERVAL_MS);
