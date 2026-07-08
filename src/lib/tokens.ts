import Anthropic from "@anthropic-ai/sdk";
import type { McpTool } from "../types";

// Token counts are model-specific; must match the eval model (TASK-019+).
const HAIKU = "claude-haiku-4-5";
const PROBE = [{ role: "user" as const, content: "." }];

export type DefTokens = { defTokens: number; estimated: boolean };

type CountArgs = { tools?: unknown[]; messages: typeof PROBE };
export type CountFn = (args: CountArgs) => Promise<number>;

// Context tax = tokens the tool defs add to every request: the same minimal
// message counted with the tools minus without. Falls back to a ~4-chars/token
// estimate (flagged) if the API errors, so a report still renders a number.
export async function countDefTokens(
  apiKey: string,
  tools: McpTool[],
  count: CountFn = anthropicCount(apiKey),
): Promise<DefTokens> {
  if (tools.length === 0) return { defTokens: 0, estimated: false };
  try {
    const [withTools, baseline] = await Promise.all([
      count({ tools: toAnthropicTools(tools), messages: PROBE }),
      count({ messages: PROBE }),
    ]);
    return { defTokens: Math.max(0, withTools - baseline), estimated: false };
  } catch {
    return { defTokens: Math.ceil(JSON.stringify(tools).length / 4), estimated: true };
  }
}

function anthropicCount(apiKey: string): CountFn {
  const client = new Anthropic({ apiKey });
  return async ({ tools, messages }) => {
    const res = await client.messages.countTokens({
      model: HAIKU,
      messages,
      ...(tools ? { tools: tools as Anthropic.ToolUnion[] } : {}),
    });
    return res.input_tokens;
  };
}

function toAnthropicTools(tools: McpTool[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description ?? "",
    input_schema: (t.inputSchema ?? { type: "object" }) as Anthropic.Tool.InputSchema,
  }));
}
