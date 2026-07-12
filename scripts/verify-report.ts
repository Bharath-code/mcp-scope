#!/usr/bin/env npx tsx
// Hand-verification harness (TASK-027). Pre-publication gate from Vision §
// Risks #1: walk every eval call for a report, judge each selection ✓/✗, and
// print the % questionable. >10% questionable means fix the query generator,
// not the publish list.
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const QUESTIONABLE_THRESHOLD = 0.1;

export type EvalCallRow = {
  target_tool: string | null;
  query: string;
  selected_tool: string | null;
  leaked: number;
};

export type VerifySummary = {
  total: number;
  questionable: number;
  pct: number;
  verdict: "PASS" | "FIX_GENERATOR";
};

export function summarize(total: number, questionable: number): VerifySummary {
  const pct = total === 0 ? 0 : questionable / total;
  return { total, questionable, pct, verdict: pct > QUESTIONABLE_THRESHOLD ? "FIX_GENERATOR" : "PASS" };
}

export function formatRow(row: EvalCallRow, i: number, total: number): string {
  const target = row.target_tool ?? "(distractor)";
  const selected = row.selected_tool ?? "(none)";
  const leakedFlag = row.leaked ? " [leaked]" : "";
  return `[${i + 1}/${total}] target=${target} selected=${selected}${leakedFlag}\n  query: "${row.query}"`;
}

function fetchEvalCalls(reportId: string, remote: boolean): EvalCallRow[] {
  const sql = `SELECT target_tool, query, selected_tool, leaked FROM eval_calls WHERE report_id = '${reportId}' ORDER BY id ASC`;
  const args = ["wrangler", "d1", "execute", "mcp-audit", remote ? "--remote" : "--local", "--json", "--command", sql];
  const out = execFileSync("npx", args, { encoding: "utf8" });
  const parsed = JSON.parse(out) as Array<{ results: EvalCallRow[] }>;
  return parsed[0]?.results ?? [];
}

async function main() {
  const reportId = process.argv[2];
  const remote = !process.argv.includes("--local");
  if (!reportId) {
    console.error("Usage: npx tsx scripts/verify-report.ts <reportId> [--local]");
    process.exit(1);
  }

  const rows = fetchEvalCalls(reportId, remote);
  if (rows.length === 0) {
    console.log(`No eval calls found for report ${reportId}.`);
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let questionable = 0;
  for (let i = 0; i < rows.length; i++) {
    console.log(`\n${formatRow(rows[i], i, rows.length)}`);
    const answer = (await rl.question("Reasonable selection? (y/n): ")).trim().toLowerCase();
    if (answer.startsWith("n")) questionable++;
  }
  rl.close();

  const summary = summarize(rows.length, questionable);
  console.log(`\n${summary.questionable}/${summary.total} questionable (${(summary.pct * 100).toFixed(1)}%)`);
  console.log(
    summary.verdict === "PASS"
      ? "PASS — under 10% questionable."
      : "FIX_GENERATOR — over 10% questionable. Do not publish; fix the query generator and re-run.",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
