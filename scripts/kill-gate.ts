#!/usr/bin/env npx tsx
// Day-14 kill-gate readout (TASK-047). VISION.md § Business: 30 captures + 0
// paid tune-ups -> pivot the paid offer to CI-check pre-orders; 0 captures ->
// stop; >=1 paid tune-up -> pass. Before day 14 (or short of those thresholds)
// there's no final call yet, so this prints IN_PROGRESS rather than guessing.
import { execFileSync } from "node:child_process";

const CAPTURE_TARGET = 30;
const PAID_TARGET = 1;

export type GateVerdict = "PASS" | "PIVOT_TO_CI_PREORDERS" | "STOP" | "IN_PROGRESS";

export function computeVerdict(captures: number, paidTuneUps: number): GateVerdict {
  if (captures === 0) return "STOP";
  if (paidTuneUps >= PAID_TARGET) return "PASS";
  if (captures >= CAPTURE_TARGET) return "PIVOT_TO_CI_PREORDERS";
  return "IN_PROGRESS";
}

function runD1Query(remote: boolean, sql: string): unknown[] {
  const args = ["wrangler", "d1", "execute", "mcp-audit", remote ? "--remote" : "--local", "--json", "--command", sql];
  const out = execFileSync("npx", args, { encoding: "utf8" });
  const parsed = JSON.parse(out) as Array<{ results: unknown[] }>;
  return parsed[0]?.results ?? [];
}

function main() {
  const remote = !process.argv.includes("--local");
  const launchDateArg = process.argv.find((a) => a.startsWith("--launch-date="));
  const launchDate = launchDateArg ? new Date(launchDateArg.split("=")[1]) : null;
  const founderIpsArg = process.argv.find((a) => a.startsWith("--founder-ips="));
  const founderIps = founderIpsArg ? founderIpsArg.split("=")[1].split(",") : [];

  const captureRows = runD1Query(remote, "SELECT COUNT(*) AS n FROM email_captures") as { n: number }[];
  const paidRows = runD1Query(remote, "SELECT COUNT(*) AS n FROM tune_up_orders WHERE status != 'refunded'") as {
    n: number;
  }[];
  const freshRunRows = runD1Query(remote, "SELECT COALESCE(SUM(fresh_runs), 0) AS n FROM rate_limits") as {
    n: number;
  }[];

  const captures = captureRows[0]?.n ?? 0;
  const paidTuneUps = paidRows[0]?.n ?? 0;
  const freshRuns = freshRunRows[0]?.n ?? 0;
  const captureRate = freshRuns > 0 ? captures / freshRuns : 0;

  let strangerRuns: number | null = null;
  if (founderIps.length > 0) {
    const notIn = founderIps.map((ip) => `'${ip}'`).join(",");
    const strangerRows = runD1Query(
      remote,
      `SELECT COALESCE(SUM(fresh_runs), 0) AS n FROM rate_limits WHERE ip NOT IN (${notIn})`,
    ) as { n: number }[];
    strangerRuns = strangerRows[0]?.n ?? 0;
  }

  const daysSinceLaunch = launchDate ? Math.floor((Date.now() - launchDate.getTime()) / 86_400_000) : null;

  console.log("=== Kill-gate readout ===");
  if (daysSinceLaunch !== null) console.log(`Days since launch: ${daysSinceLaunch}`);
  console.log(`Fresh runs: ${freshRuns}`);
  if (strangerRuns !== null) console.log(`Stranger-initiated runs (excluding founder IPs): ${strangerRuns}`);
  console.log(`Email captures: ${captures} (target ${CAPTURE_TARGET})`);
  console.log(`Capture rate: ${(captureRate * 100).toFixed(1)}%`);
  console.log(`Paid tune-ups: ${paidTuneUps} (target >= ${PAID_TARGET})`);

  const verdict = computeVerdict(captures, paidTuneUps);
  console.log(`\nVerdict: ${verdict}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
