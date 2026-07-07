// Shared types for MCP Audit.

export type ReportStatus =
  | "queued"
  | "connecting"
  | "listing"
  | "static"
  | "generating"
  | "evaluating"
  | "complete"
  | "failed";

export const TERMINAL_STATUSES: ReadonlySet<ReportStatus> = new Set(["complete", "failed"]);

// A single tool's behavioral verdict.
export type ToolResult = {
  tool: string;
  descriptionLen: number;
  triggerAccuracy: number; // own scored queries picked / own scored count (leaked excluded)
  timesSelected: number; // across ALL queries incl. distractors
  stolenBy: Record<string, number>; // collision matrix row: other tool -> count it stole
  isDead: boolean; // selected zero times anywhere
  notScorable?: boolean; // all own queries leaked -> excluded from denominator
};

export type SchemaIssue = { tool: string; reason: string };
export type WeakDescription = { tool: string; descriptionLen: number };
export type CollisionWarning = { a: string; b: string; score: number };

// Result of the static (pre-eval) pass.
export type StaticResults = {
  defTokens: number;
  defTokensEstimated: boolean;
  schemaIssues: SchemaIssue[];
  weakDescriptions: WeakDescription[];
  nameCollisions: CollisionWarning[];
};

export type CollisionPair = { thief: string; victim: string; stolen: number; of: number };

// Headline verdict block.
export type Headline = {
  effectiveTools: number;
  totalTools: number;
  defTokens: number;
  deadTools: string[];
  collisions: CollisionPair[];
  falsePositives: string[]; // tools triggered by distractor queries
  evaluatedCount?: number; // when capped (< totalTools)
  headline: string; // rendered one-liner
};

// GET /api/report/:hash response shape.
export type ReportApiResponse = {
  status: ReportStatus;
  error: string | null;
  progress: { evalDone: number; evalTotal: number } | null;
  serverName: string | null;
  toolCount: number | null;
  static: StaticResults | null;
  headline: { effectiveTools: number; totalTools: number; defTokens: number } | null;
  tools: ToolResult[] | null;
  transcriptsUnlocked: boolean;
};

// Row shape as stored in D1 `reports`.
export type ReportRow = {
  id: string;
  tools_hash: string | null;
  canonical_id: string | null; // alias -> canonical report id when a dedupe cache hit
  server_url: string;
  server_name: string | null;
  status: ReportStatus;
  error: string | null;
  tool_count: number | null;
  def_tokens: number | null;
  effective_tools: number | null;
  eval_done: number;
  eval_total: number;
  headline_json: string | null;
  static_json: string | null;
  eval_cost_usd: number | null;
  is_published: number;
  slug: string | null;
  created_at: string;
  completed_at: string | null;
};

export type EvalCallInsert = {
  targetTool: string | null;
  query: string;
  selectedTool: string | null;
  leaked: boolean;
  latencyMs: number | null;
};

// Minimal MCP tool definition shape used across the pipeline.
export type McpTool = {
  name: string;
  description?: string;
  inputSchema?: unknown;
};
