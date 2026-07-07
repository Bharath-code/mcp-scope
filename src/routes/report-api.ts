import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Bindings } from "../index";
import { getReport, getToolResults } from "../lib/db";
import type { ReportApiResponse, ReportRow, StaticResults, ToolResult } from "../types";

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

  let headline: ReportApiResponse["headline"] = null;
  if (report.headline_json) {
    const h = JSON.parse(report.headline_json) as {
      effectiveTools: number;
      totalTools: number;
      defTokens: number;
    };
    headline = {
      effectiveTools: h.effectiveTools,
      totalTools: h.totalTools,
      defTokens: h.defTokens,
    };
  }

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
  const unlocked = isUnlocked(c.req.header("cookie"), id);
  return c.json(await buildReportResponse(c.env.DB, report, unlocked));
});
