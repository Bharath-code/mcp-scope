// IP rate limiting via D1. 3 fresh (cache-missing) audits/day/IP; 10 captures/day/IP.

export const FRESH_RUN_LIMIT = 3;
export const CAPTURE_LIMIT = 10;

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Atomically increment fresh_runs for (ip, day) and return the new count.
export async function bumpFreshRun(db: D1Database, ip: string): Promise<number> {
  const day = utcDay();
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (ip, day, fresh_runs) VALUES (?, ?, 1)
       ON CONFLICT(ip, day) DO UPDATE SET fresh_runs = fresh_runs + 1
       RETURNING fresh_runs`,
    )
    .bind(ip, day)
    .first<{ fresh_runs: number }>();
  return row?.fresh_runs ?? 1;
}

// Refund a fresh-run charge (cache hit, failed run, watchdog stall). Never below 0.
export async function refundFreshRun(db: D1Database, ip: string, day: string): Promise<void> {
  await db
    .prepare(
      "UPDATE rate_limits SET fresh_runs = MAX(0, fresh_runs - 1) WHERE ip = ? AND day = ?",
    )
    .bind(ip, day)
    .run();
}

export async function bumpCapture(db: D1Database, ip: string): Promise<number> {
  const day = utcDay();
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (ip, day, captures) VALUES (?, ?, 1)
       ON CONFLICT(ip, day) DO UPDATE SET captures = captures + 1
       RETURNING captures`,
    )
    .bind(ip, day)
    .first<{ captures: number }>();
  return row?.captures ?? 1;
}
