// Selection eval: fire each generated query at the model with the full toolset
// and record what it picked. FR-007. Concurrency-capped, cost-logged.
import Anthropic from "@anthropic-ai/sdk";
import type { McpTool, EvalCallInsert } from "../types";
import type { GeneratedQuery } from "./query-gen";
import { toAnthropicTools } from "../lib/tokens";

const HAIKU = "claude-haiku-4-5";
const CONCURRENCY = 5;
const MAX_TOKENS = 64;

// Haiku 4.5 pricing: $1/$5 per MTok input/output.
const INPUT_PRICE_PER_TOKEN = 1 / 1_000_000;
const OUTPUT_PRICE_PER_TOKEN = 5 / 1_000_000;

export type CallFn = (
  query: string,
  tools: McpTool[],
) => Promise<{ selectedTool: string | null; inputTokens: number; outputTokens: number }>;

export type EvalRunResult = { calls: EvalCallInsert[]; costUsd: number };

export function anthropicSelectionCall(apiKey: string): CallFn {
  const client = new Anthropic({ apiKey });
  return async (query, tools) => {
    const res = await client.messages.create({
      model: HAIKU,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      tool_choice: { type: "auto" },
      tools: toAnthropicTools(tools),
      messages: [{ role: "user", content: query }],
    });
    const block = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    return {
      selectedTool: block?.name ?? null,
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
    };
  };
}

// Simple concurrency-capped map: never more than `limit` calls in flight.
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function runSelectionEval(
  tools: McpTool[],
  queries: GeneratedQuery[],
  call: CallFn,
  onProgress?: (done: number, total: number) => void,
): Promise<EvalRunResult> {
  let costUsd = 0;
  let done = 0;

  const calls = await mapWithConcurrency(queries, CONCURRENCY, async (q) => {
    const start = Date.now();
    let outcome: { selectedTool: string | null; inputTokens: number; outputTokens: number } | null = null;
    try {
      outcome = await call(q.query, tools);
    } catch {
      try {
        outcome = await call(q.query, tools);
      } catch {
        outcome = null; // retried once, still failing -> counts as no-selection
      }
    }
    const latencyMs = Date.now() - start;
    if (outcome) costUsd += outcome.inputTokens * INPUT_PRICE_PER_TOKEN + outcome.outputTokens * OUTPUT_PRICE_PER_TOKEN;

    done++;
    onProgress?.(done, queries.length);

    const insert: EvalCallInsert = {
      targetTool: q.targetTool,
      query: q.query,
      selectedTool: outcome?.selectedTool ?? null,
      leaked: q.leaked,
      latencyMs,
    };
    return insert;
  });

  return { calls, costUsd };
}
