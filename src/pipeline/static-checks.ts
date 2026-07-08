import type { McpTool, SchemaIssue, StaticResults, WeakDescription } from "../types";
import { countDefTokens, type CountFn } from "../lib/tokens";
import { findNameCollisions } from "../lib/similarity";

const WEAK_DESCRIPTION_MIN_LEN = 40;

// Structural check only (no ajv): inputSchema must be an object with type "object".
// ponytail: the MCP SDK's listTools() zod-validates inputSchema.type === "object"
// upstream and throws on the whole response otherwise, so a malformed schema here
// is unreachable via the real ingest path today — this stands as defense-in-depth
// / for any future raw-JSON ingest path that skips SDK validation.
function checkSchema(tool: McpTool): SchemaIssue | null {
  const s = tool.inputSchema;
  if (s === undefined) return null; // absent schema is valid (no params)
  if (typeof s !== "object" || s === null) return { tool: tool.name, reason: "inputSchema is not an object" };
  const type = (s as { type?: unknown }).type;
  if (type !== "object") return { tool: tool.name, reason: `inputSchema.type is "${String(type)}", expected "object"` };
  return null;
}

function checkDescription(tool: McpTool): WeakDescription | null {
  const len = tool.description?.trim().length ?? 0;
  return len < WEAK_DESCRIPTION_MIN_LEN ? { tool: tool.name, descriptionLen: len } : null;
}

export async function runStaticChecks(apiKey: string, tools: McpTool[], count?: CountFn): Promise<StaticResults> {
  const { defTokens, estimated } = await countDefTokens(apiKey, tools, count);
  return {
    defTokens,
    defTokensEstimated: estimated,
    schemaIssues: tools.map(checkSchema).filter((x): x is SchemaIssue => x !== null),
    weakDescriptions: tools.map(checkDescription).filter((x): x is WeakDescription => x !== null),
    nameCollisions: findNameCollisions(tools.map((t) => t.name)),
  };
}
