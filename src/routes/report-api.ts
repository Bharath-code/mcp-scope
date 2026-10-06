import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Bindings } from "../index";
import { getEvalCallRows, getReport, getToolResults } from "../lib/db";
import { groupTranscripts } from "../lib/transcripts";
import type { Headline, ReportApiResponse, ReportRow, StaticResults, ToolResult } from "../types";

const ERR_LOCKED = "Enter your email on the report page to unlock transcripts.";

export const reportApi = new Hono<{ Bindings: Bindings }>();

export function isUnlocked(cookieHeader: string | undefined, id: string): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(/;\s*/).includes(`unlocked_${id}=1`);
}

export async function buildReportResponse(
  db: D1Database,
  report: ReportRow,
  unlocked: boolean,
): Promise<ReportApiResponse> {
  const staticResults: StaticResults | null = report.static_json
    ? (JSON.parse(report.static_json) as StaticResults)
    : null;

  const headline: Headline | null = report.headline_json ? (JSON.parse(report.headline_json) as Headline) : null;

  let tools: ToolResult[] | null = null;
  if (report.status === "complete") {
    const rows = await getToolResults(db, report.id);
    if (rows.length > 0) {
      tools = rows.map((r) => ({
        tool: r.tool_name,
        descriptionLen: r.description_len,
        triggerAccuracy: r.trigger_accuracy,
        timesSelected: r.times_selected,
        stolenBy: JSON.parse(r.stolen_by_json) as Record<string, number>,
        isDead: r.is_dead === 1,
      }));
    }
  }

  return {
    status: report.status,
    error: report.error,
    progress: report.eval_total > 0 ? { evalDone: report.eval_done, evalTotal: report.eval_total } : null,
    serverName: report.server_name,
    toolCount: report.tool_count,
    static: staticResults,
    headline,
    tools,
    transcriptsUnlocked: unlocked,
    transcripts: unlocked && report.status === "complete" ? groupTranscripts(await getEvalCallRows(db, report.id)) : null,
    rawToolsJson: report.status === "complete" && report.tool_count === 0 ? report.raw_json : null,
  };
}

reportApi.get("/api/report/:hash", async (c) => {
  const id = c.req.param("hash");
  let report = await getReport(c.env.DB, id);
  if (!report) return c.json({ error: "Report not found" }, 404);
  // Cache-dedupe alias: serve the canonical report's data (TASK-013).
  if (report.canonical_id) {
    const canonical = await getReport(c.env.DB, report.canonical_id);
    if (canonical) report = canonical;
  }
  const unlocked = isUnlocked(c.req.header("cookie"), id) || (report.id !== id && isUnlocked(c.req.header("cookie"), report.id));
  return c.json(await buildReportResponse(c.env.DB, report, unlocked));
});

reportApi.get("/api/transcripts/:hash", async (c) => {
  const id = c.req.param("hash");
  let report = await getReport(c.env.DB, id);
  if (!report) return c.json({ error: "Report not found" }, 404);
  if (report.canonical_id) {
    const canonical = await getReport(c.env.DB, report.canonical_id);
    if (canonical) report = canonical;
  }
  const unlocked = isUnlocked(c.req.header("cookie"), id) || (report.id !== id && isUnlocked(c.req.header("cookie"), report.id));
  if (!unlocked) return c.json({ error: ERR_LOCKED }, 403);
  return c.json({ transcripts: groupTranscripts(await getEvalCallRows(c.env.DB, report.id)) });
});
