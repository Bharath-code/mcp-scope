import type { ReportRow, ReportStatus, ToolResult, EvalCallInsert } from "../types";

export function getReport(db: D1Database, id: string): Promise<ReportRow | null> {
  return db.prepare("SELECT * FROM reports WHERE id = ?").bind(id).first<ReportRow>();
}

export function getReportBySlug(db: D1Database, slug: string): Promise<ReportRow | null> {
  return db.prepare("SELECT * FROM reports WHERE slug = ?").bind(slug).first<ReportRow>();
}

// Find a completed report with the same tools/list hash (cache dedupe).
export function getCanonicalByToolsHash(
  db: D1Database,
  toolsHash: string,
  excludeId: string,
): Promise<ReportRow | null> {
  return db
    .prepare(
      "SELECT * FROM reports WHERE tools_hash = ? AND status = 'complete' AND id != ? ORDER BY created_at ASC LIMIT 1",
    )
    .bind(toolsHash, excludeId)
    .first<ReportRow>();
}

export async function updateReportStatus(
  db: D1Database,
  id: string,
  status: ReportStatus,
  error?: string | null,
): Promise<void> {
  await db
    .prepare("UPDATE reports SET status = ?, error = ? WHERE id = ?")
    .bind(status, error ?? null, id)
    .run();
}

// Generic patch of a report row with a whitelisted set of columns.
const PATCHABLE = new Set([
  "tools_hash",
  "server_name",
  "status",
  "error",
  "tool_count",
  "def_tokens",
  "effective_tools",
  "eval_done",
  "eval_total",
  "headline_json",
  "static_json",
  "eval_cost_usd",
  "is_published",
  "slug",
  "completed_at",
]);

export async function patchReport(
  db: D1Database,
  id: string,
  patch: Partial<Record<string, string | number | null>>,
): Promise<void> {
  const cols = Object.keys(patch).filter((k) => PATCHABLE.has(k));
  if (cols.length === 0) return;
  const setClause = cols.map((c) => `${c} = ?`).join(", ");
  const values = cols.map((c) => patch[c] ?? null);
  await db
    .prepare(`UPDATE reports SET ${setClause} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function insertReport(
  db: D1Database,
  id: string,
  serverUrl: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO reports (id, server_url, status) VALUES (?, ?, 'queued')")
    .bind(id, serverUrl)
    .run();
}

export async function insertToolResults(
  db: D1Database,
  reportId: string,
  results: ToolResult[],
): Promise<void> {
  if (results.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO tool_results
       (report_id, tool_name, description_len, trigger_accuracy, times_selected, stolen_by_json, is_dead)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(report_id, tool_name) DO UPDATE SET
       description_len = excluded.description_len,
       trigger_accuracy = excluded.trigger_accuracy,
       times_selected = excluded.times_selected,
       stolen_by_json = excluded.stolen_by_json,
       is_dead = excluded.is_dead`,
  );
  await db.batch(
    results.map((r) =>
      stmt.bind(
        reportId,
        r.tool,
        r.descriptionLen,
        r.triggerAccuracy,
        r.timesSelected,
        JSON.stringify(r.stolenBy),
        r.isDead ? 1 : 0,
      ),
    ),
  );
}

export async function getToolResults(db: D1Database, reportId: string): Promise<ToolResultRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM tool_results WHERE report_id = ? ORDER BY id ASC")
    .bind(reportId)
    .all<ToolResultRow>();
  return results;
}

export async function insertEvalCalls(
  db: D1Database,
  reportId: string,
  calls: EvalCallInsert[],
): Promise<void> {
  if (calls.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO eval_calls (report_id, target_tool, query, selected_tool, leaked, latency_ms)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  await db.batch(
    calls.map((c) =>
      stmt.bind(
        reportId,
        c.targetTool ?? null,
        c.query,
        c.selectedTool ?? null,
        c.leaked ? 1 : 0,
        c.latencyMs ?? null,
      ),
    ),
  );
}

export type ToolResultRow = {
  id: number;
  report_id: string;
  tool_name: string;
  description_len: number;
  trigger_accuracy: number;
  times_selected: number;
  stolen_by_json: string;
  is_dead: number;
};
