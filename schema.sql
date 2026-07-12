-- schema.sql — MCP Audit (D1)
-- Q1(b): report identity is a provisional run id (PK); tools_hash is the indexed cache key.

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,                -- provisional run id: sha256(normalized_url + timestamp)
  tools_hash TEXT,                    -- sha256 of raw tools/list JSON (cache key), NULL until listed
  canonical_id TEXT REFERENCES reports(id), -- alias pointer: dedupe hit -> earlier complete report w/ same tools_hash
  server_url TEXT NOT NULL,           -- normalized input URL
  server_name TEXT,                   -- from MCP initialize serverInfo.name
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','connecting','listing','static','generating','evaluating','complete','failed')),
  error TEXT,                         -- user-facing error message when failed
  tool_count INTEGER,
  def_tokens INTEGER,                 -- context tax: tokens of serialized tool defs
  effective_tools INTEGER,           -- tools with trigger_accuracy >= 0.67
  eval_done INTEGER NOT NULL DEFAULT 0,
  eval_total INTEGER NOT NULL DEFAULT 0,
  headline_json TEXT,                 -- JSON: {effectiveTools, totalTools, defTokens, deadTools, collisions, falsePositives}
  static_json TEXT,                   -- JSON: static check results
  eval_cost_usd REAL,                 -- logged actual LLM spend for this report
  raw_json TEXT,                       -- tools/list payload, only kept for the 0-tools disclosure (TASK-018)
  is_published INTEGER NOT NULL DEFAULT 0,
  slug TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS tool_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  description_len INTEGER NOT NULL,
  trigger_accuracy REAL NOT NULL,
  times_selected INTEGER NOT NULL,
  stolen_by_json TEXT NOT NULL,       -- JSON Record<string, number>
  is_dead INTEGER NOT NULL,
  UNIQUE (report_id, tool_name)
);

CREATE TABLE IF NOT EXISTS eval_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  target_tool TEXT,                   -- NULL for distractor queries
  query TEXT NOT NULL,
  selected_tool TEXT,                 -- NULL = no tool_use block
  leaked INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_captures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  report_id TEXT NOT NULL REFERENCES reports(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (email, report_id)
);

CREATE TABLE IF NOT EXISTS tune_up_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  polar_order_id TEXT UNIQUE NOT NULL,
  report_id TEXT REFERENCES reports(id),
  email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','fulfilled','refunded')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  day TEXT NOT NULL,                  -- YYYY-MM-DD (UTC)
  fresh_runs INTEGER NOT NULL DEFAULT 0,
  captures INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, day)
);

CREATE INDEX IF NOT EXISTS idx_reports_tools_hash ON reports(tools_hash);
CREATE INDEX IF NOT EXISTS idx_tool_results_report ON tool_results(report_id);
CREATE INDEX IF NOT EXISTS idx_eval_calls_report ON eval_calls(report_id);
CREATE INDEX IF NOT EXISTS idx_reports_published ON reports(is_published) WHERE is_published = 1;
CREATE INDEX IF NOT EXISTS idx_captures_report ON email_captures(report_id);
