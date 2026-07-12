#!/usr/bin/env npx tsx
// Publish-famous pipeline (TASK-039). Runs the audit for each candidate
// server, waits for completion, then hands off to the hand-verification
// harness (TASK-027) before ever asking to publish. Never auto-publishes —
// Vision § Risks #1: >10% questionable means fix the generator, not the list.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const POLL_MS = 3000;
const MAX_POLL_MINUTES = 10;

export function extractReportId(locationHeader: string): string {
  const match = locationHeader.match(/\/r\/([^/?#]+)/);
  if (!match) throw new Error(`Couldn't find a report id in redirect location: ${locationHeader}`);
  return match[1];
}

export function buildPublishSql(reportId: string, slug: string): string {
  return `UPDATE reports SET is_published = 1, slug = '${slug}' WHERE id = '${reportId}'`;
}

async function submitAudit(baseUrl: string, url: string): Promise<string> {
  const res = await fetch(`${baseUrl}/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: url }),
    redirect: "manual",
  });
  const location = res.headers.get("location");
  if (!location) throw new Error(`No redirect from /audit for ${url} (status ${res.status})`);
  return extractReportId(location);
}

async function waitForCompletion(baseUrl: string, reportId: string): Promise<"complete" | "failed"> {
  const deadline = Date.now() + MAX_POLL_MINUTES * 60_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/api/report/${reportId}`);
    const data = (await res.json()) as { status: string };
    if (data.status === "complete" || data.status === "failed") return data.status;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`Report ${reportId} did not finish within ${MAX_POLL_MINUTES} minutes`);
}

async function main() {
  const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:8787";
  const candidatesPath = process.argv[2] ?? "scripts/candidates.json";
  const candidates = JSON.parse(readFileSync(candidatesPath, "utf8")) as string[];
  const remote = !process.argv.includes("--local");

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  for (const url of candidates) {
    console.log(`\n=== ${url} ===`);
    let reportId: string;
    try {
      reportId = await submitAudit(baseUrl, url);
    } catch (err) {
      console.error(`Skipping — ${(err as Error).message}`);
      continue;
    }

    console.log(`Report ${reportId} queued, waiting for completion...`);
    const status = await waitForCompletion(baseUrl, reportId);
    if (status === "failed") {
      console.log(`Report ${reportId} failed — skipping.`);
      continue;
    }

    console.log(`Report ${reportId} complete. Launching hand-verification...`);
    spawnSync("npx", ["tsx", "scripts/verify-report.ts", reportId, ...(remote ? [] : ["--local"])], {
      stdio: "inherit",
    });

    const publish = (await rl.question(`Publish ${url} (${reportId})? (y/n): `)).trim().toLowerCase();
    if (!publish.startsWith("y")) {
      console.log("Not publishing.");
      continue;
    }
    const slug = (await rl.question("Slug: ")).trim();
    if (!slug) {
      console.log("No slug entered — not publishing.");
      continue;
    }
    const sql = buildPublishSql(reportId, slug);
    execFileSync("npx", ["wrangler", "d1", "execute", "mcp-audit", remote ? "--remote" : "--local", "--command", sql], {
      stdio: "inherit",
    });
    console.log(`Published as /report/${slug}`);
  }

  rl.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
