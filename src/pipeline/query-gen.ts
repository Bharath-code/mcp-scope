// Query generation: one batched Haiku call produces per-tool eval queries plus
// global distractors. FR-006. Leaked queries get one regeneration attempt
// (TASK-020) before being kept flagged and excluded from scoring.
import Anthropic from "@anthropic-ai/sdk";
import type { McpTool } from "../types";
import { isLeaked } from "./anti-leakage";
import { EVAL_MODEL } from "../lib/model";

const QUERIES_PER_TOOL = 3;
const DISTRACTOR_COUNT = 5;
const EMIT_TOOL = "emit_queries";
const DISTRACTOR = "__distractor__"; // sentinel: query-gen model can't emit a JSON null tool name

export type GeneratedQuery = { targetTool: string | null; query: string; leaked: boolean };

type RawQuery = { tool: string; query: string };
type CallFn = (system: string, user: string, toolNames: string[]) => Promise<RawQuery[]>;

function emitToolSchema(toolNames: string[]) {
  return {
    name: EMIT_TOOL,
    description: "Emit the generated evaluation queries.",
    input_schema: {
      type: "object" as const,
      properties: {
        queries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tool: { type: "string", enum: [...toolNames, DISTRACTOR] },
              query: { type: "string" },
            },
            required: ["tool", "query"],
          },
        },
      },
      required: ["queries"],
    },
  };
}

// Parse defensively: only a well-shaped array of {tool, query} pairs is usable.
function parseRawQueries(input: unknown): RawQuery[] | null {
  if (!input || typeof input !== "object") return null;
  const queries = (input as { queries?: unknown }).queries;
  if (!Array.isArray(queries)) return null;
  const out: RawQuery[] = [];
  for (const q of queries) {
    if (!q || typeof q !== "object") return null;
    const tool = (q as { tool?: unknown }).tool;
    const query = (q as { query?: unknown }).query;
    if (typeof tool !== "string" || typeof query !== "string" || !query.trim()) return null;
    out.push({ tool, query });
  }
  return out;
}

function anthropicCall(apiKey: string): CallFn {
  const client = new Anthropic({ apiKey });
  return async (system, user, toolNames) => {
    const res = await client.messages.create({
      model: EVAL_MODEL,
      max_tokens: 4096,
      system,
      tools: [emitToolSchema(toolNames)],
      tool_choice: { type: "tool", name: EMIT_TOOL },
      messages: [{ role: "user", content: user }],
    });
    const block = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!block) return [];
    const parsed = parseRawQueries(block.input);
    if (!parsed) throw new Error("unusable query-gen output");
    return parsed;
  };
}

const GEN_SYSTEM = `You write test queries for evaluating whether an AI selects the right tool for a user's goal.
For each tool given (name, description, schema), write ${QUERIES_PER_TOOL} queries phrased as what a user wants to
accomplish -- never mention the tool's name or restate its description. Also write ${DISTRACTOR_COUNT} distractor
queries, unrelated to any tool, that should trigger none of them. Use the emit_queries tool with "${DISTRACTOR}" as
the tool value for distractors.`;

function buildUserPrompt(tools: McpTool[]): string {
  return tools
    .map((t) => `Tool: ${t.name}\nDescription: ${t.description ?? "(none)"}\nSchema: ${JSON.stringify(t.inputSchema ?? {})}`)
    .join("\n\n");
}

function toGenerated(raw: RawQuery[]): GeneratedQuery[] {
  return raw.map((r) => ({
    targetTool: r.tool === DISTRACTOR ? null : r.tool,
    query: r.query,
    leaked: r.tool !== DISTRACTOR && isLeaked(r.query, r.tool),
  }));
}

// Ask the model to rewrite just the leaked queries, avoiding the tool's name tokens.
async function regenerateLeaked(
  call: CallFn,
  toolNames: string[],
  leaked: { targetTool: string; query: string }[],
): Promise<Map<string, string>> {
  const prompt = leaked
    .map((l) => `Tool "${l.targetTool}": the query "${l.query}" leaks the tool name. Rewrite it as a pure user goal, without any word from the tool's name.`)
    .join("\n");
  const raw = await call(GEN_SYSTEM, prompt, toolNames).catch(() => []);
  const byTool = new Map<string, string>();
  for (const r of raw) if (r.tool !== DISTRACTOR) byTool.set(r.tool, r.query);
  return byTool;
}

export async function generateQueries(
  apiKey: string,
  tools: McpTool[],
  call: CallFn = anthropicCall(apiKey),
): Promise<GeneratedQuery[]> {
  const toolNames = tools.map((t) => t.name);
  const user = buildUserPrompt(tools);

  let raw: RawQuery[];
  try {
    raw = await call(GEN_SYSTEM, user, toolNames);
  } catch {
    raw = await call(GEN_SYSTEM, user, toolNames).catch(() => {
      throw new Error("Couldn't generate eval queries for this server -- try again.");
    });
  }

  let generated = toGenerated(raw);

  const leaked = generated.filter((g) => g.leaked && g.targetTool);
  if (leaked.length > 0) {
    const replacements = await regenerateLeaked(
      call,
      toolNames,
      leaked.map((l) => ({ targetTool: l.targetTool as string, query: l.query })),
    );
    generated = generated.map((g) => {
      if (!g.leaked || !g.targetTool) return g;
      const replacement = replacements.get(g.targetTool);
      if (!replacement) return g; // still-leaked -> kept, excluded from scoring downstream
      return { targetTool: g.targetTool, query: replacement, leaked: isLeaked(replacement, g.targetTool) };
    });
  }

  return generated;
}
