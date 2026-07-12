import type { ReportRow, ReportStatus, ToolResult, EvalCallInsert } from "../types";

export function getReport(db: D1Database, id: string): Promise<ReportRow | null> {
  return db.prepare("SELECT * FROM reports WHERE id = ?").bind(id).first<ReportRow>();
}

export function getReportBySlug(db: D1Database, slug: string): Promise<ReportRow | null> {
  return db.prepare("SELECT * FROM reports WHERE slug = ?").bind(slug).first<ReportRow>();
}

// Find the canonical completed report for a tools/list hash (cache dedupe).
// canonical_id IS NULL excludes prior aliases, so pointers never chain — one
// canonical per tools_hash. Earliest wins (created_at ASC).
export function getCanonicalByToolsHash(
  db: D1Database,
  toolsHash: string,
  excludeId: string,
): Promise<ReportRow | null> {
  return db
    .prepare(
      "SELECT * FROM reports WHERE tools_hash = ? AND status = 'complete' AND canonical_id IS NULL AND id != ? ORDER BY created_at ASC LIMIT 1",
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
  "canonical_id",
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
  "raw_json",
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

// Idempotent on (email, report_id) — resubmitting the same email is a no-op.
export async function insertEmailCapture(db: D1Database, email: string, reportId: string): Promise<void> {
  await db
    .prepare("INSERT INTO email_captures (email, report_id) VALUES (?, ?) ON CONFLICT(email, report_id) DO NOTHING")
    .bind(email, reportId)
    .run();
}

// Idempotent on polar_order_id — a replayed webhook is a no-op.
export async function insertTuneUpOrder(
  db: D1Database,
  order: { polarOrderId: string; reportId: string | null; email: string; amountCents: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tune_up_orders (polar_order_id, report_id, email, amount_cents)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(polar_order_id) DO NOTHING`,
    )
    .bind(order.polarOrderId, order.reportId, order.email, order.amountCents)
    .run();
}

export type PublishedReportRow = {
  slug: string;
  server_name: string | null;
  tool_count: number | null;
  headline_json: string | null;
};

// Landing-page grid (TASK-037). Most recently published first.
export async function getPublishedReports(db: D1Database, limit = 20): Promise<PublishedReportRow[]> {
  const { results } = await db
    .prepare(
      "SELECT slug, server_name, tool_count, headline_json FROM reports WHERE is_published = 1 ORDER BY created_at DESC LIMIT ?",
    )
    .bind(limit)
    .all<PublishedReportRow>();
  return results;
}

export type EvalCallRow = {
  id: number;
  report_id: string;
  target_tool: string | null;
  query: string;
  selected_tool: string | null;
  leaked: number;
};

export async function getEvalCallRows(db: D1Database, reportId: string): Promise<EvalCallRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM eval_calls WHERE report_id = ? ORDER BY id ASC")
    .bind(reportId)
    .all<EvalCallRow>();
  return results;
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
