#!/usr/bin/env npx tsx
// Tune-Up Generator (TASK-033 Fulfillment Engine).
// Automates the $149 Concierge Tune-Up deliverable:
// Reads a report's tool results, collisions, and dead tools from D1,
// then prompts Claude to optimize tool descriptions, resolve naming collisions,
// and minimize context tax. Generates a PR-ready git diff and review summary.

import { execFileSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import { EVAL_MODEL } from "../src/lib/model";
import type { ToolResult, Headline, StaticResults } from "../src/types";

type DbReport = {
  id: string;
  server_name: string | null;
  server_url: string;
  headline_json: string | null;
  static_json: string | null;
  def_tokens: number;
};

type DbToolResult = {
  tool_name: string;
  description_len: number;
  trigger_accuracy: number;
  times_selected: number;
  stolen_by_json: string;
  is_dead: number;
};

function runD1Query(remote: boolean, sql: string): unknown[] {
  const args = ["wrangler", "d1", "execute", "mcp-audit", remote ? "--remote" : "--local", "--json", "--command", sql];
  const out = execFileSync("npx", args, { encoding: "utf8" });
  const parsed = JSON.parse(out) as Array<{ results: unknown[] }>;
  return parsed[0]?.results ?? [];
}

const TUNE_UP_SYSTEM = `You are a Principal AI Systems Engineer specializing in Anthropic Model Context Protocol (MCP) tool ergonomics.
Your goal is to optimize MCP tool definitions to:
1. Eliminate tool selection collisions (ensure distinct routing boundaries).
2. Resurrect dead tools by clarifying what user goals trigger them.
3. Compress context tax by trimming fluff while preserving parameter contracts.
4. Output a clean, production-grade JSON mapping of tool names to new descriptions and a unified git diff snippet.`;

export function buildOptimizationPrompt(report: DbReport, tools: DbToolResult[], staticResults?: StaticResults | null): string {
  const headline: Headline | null = report.headline_json ? JSON.parse(report.headline_json) : null;
  return `Server Name: ${report.server_name ?? "(unnamed)"}
URL: ${report.server_url}
Current Headline: ${headline?.headline ?? "N/A"}
Current Context Tax: ${report.def_tokens} tokens

Tool Results:
${tools
  .map((t) => {
    const collisions = t.stolen_by_json !== "{}" ? ` (Collides with: ${t.stolen_by_json})` : "";
    const dead = t.is_dead ? " [DEAD - Never Selected]" : "";
    return `- ${t.tool_name}: accuracy=${(t.trigger_accuracy * 100).toFixed(0)}%, selected=${t.times_selected} times${dead}${collisions}`;
  })
  .join("\n")}

${staticResults?.weakDescriptions?.length ? `Weak Descriptions:\n${staticResults.weakDescriptions.map((w) => `- ${w.tool}: ${w.descriptionLen} chars`).join("\n")}` : ""}

Please generate:
1. Analysis of why tools failed or collided.
2. Rewritten, high-performance descriptions for each underperforming tool.
3. A unified diff format showing the exact description replacements for the maintainer's codebase.`;
}

async function main() {
  const reportId = process.argv[2];
  const remote = !process.argv.includes("--local");

  if (!reportId || reportId.startsWith("--")) {
    console.error("Usage: npx tsx scripts/tune-up.ts <reportId> [--local]");
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    process.exit(1);
  }

  console.log(`Fetching report ${reportId} from D1 (${remote ? "remote" : "local"})...`);
  const reportRows = runD1Query(remote, `SELECT * FROM reports WHERE id = '${reportId}'`) as DbReport[];
  if (!reportRows || reportRows.length === 0) {
    console.error(`Report ${reportId} not found in database.`);
    process.exit(1);
  }
  const report = reportRows[0];

  const toolRows = runD1Query(remote, `SELECT * FROM tool_results WHERE report_id = '${reportId}'`) as DbToolResult[];
  const staticResults: StaticResults | null = report.static_json ? JSON.parse(report.static_json) : null;

  console.log(`Found ${toolRows.length} tools. Generating tune-up optimizations with Claude...`);
  const client = new Anthropic({ apiKey });
  const prompt = buildOptimizationPrompt(report, toolRows, staticResults);

  const res = await client.messages.create({
    model: EVAL_MODEL,
    max_tokens: 4096,
    system: TUNE_UP_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = res.content.find((b) => b.type === "text")?.text ?? "";

  console.log("\n============================================================");
  console.log(`MCP TUNE-UP REPORT FOR: ${report.server_name ?? reportId}`);
  console.log("============================================================\n");
  console.log(responseText);
  console.log("\n============================================================");
  console.log("Deliverable ready for founder review & customer delivery.");
  console.log("============================================================\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
