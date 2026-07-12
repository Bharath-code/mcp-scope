import { describe, it, expect } from "vitest";
import { runSelectionEval, type CallFn } from "./selection-eval";
import type { McpTool } from "../types";
import type { GeneratedQuery } from "./query-gen";

const tools: McpTool[] = [{ name: "search_docs", description: "search" }];

const queries: GeneratedQuery[] = [
  { targetTool: "search_docs", query: "how do I find the policy", leaked: false },
  { targetTool: null, query: "what's the weather", leaked: false },
];

describe("runSelectionEval", () => {
  it("records selected tool and accumulates cost from usage", async () => {
    const call: CallFn = async (query) => ({
      selectedTool: query.includes("policy") ? "search_docs" : null,
      inputTokens: 100,
      outputTokens: 10,
    });
    const { calls, costUsd } = await runSelectionEval(tools, queries, call);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ targetTool: "search_docs", selectedTool: "search_docs", leaked: false });
    expect(calls[1]).toMatchObject({ targetTool: null, selectedTool: null });
    // 2 calls * (100*1/1e6 + 10*5/1e6) = 2 * 0.00015
    expect(costUsd).toBeCloseTo(0.0003, 6);
  });

  it("retries once on error, then records no-selection", async () => {
    let attempts = 0;
    const call: CallFn = async () => {
      attempts++;
      throw new Error("api down");
    };
    const { calls } = await runSelectionEval(tools, queries, call);
    expect(attempts).toBe(4); // 2 queries * (1 try + 1 retry)
    expect(calls.every((c) => c.selectedTool === null)).toBe(true);
  });

  it("recovers on the retry attempt", async () => {
    let firstCallFailed = false;
    const call: CallFn = async () => {
      if (!firstCallFailed) {
        firstCallFailed = true;
        throw new Error("transient");
      }
      return { selectedTool: "search_docs", inputTokens: 5, outputTokens: 1 };
    };
    const { calls } = await runSelectionEval([tools[0]], [queries[0]], call);
    expect(calls[0].selectedTool).toBe("search_docs");
  });

  it("reports progress once per completed query", async () => {
    const call: CallFn = async () => ({ selectedTool: null, inputTokens: 1, outputTokens: 1 });
    const progress: Array<[number, number]> = [];
    await runSelectionEval(tools, queries, call, (done, total) => progress.push([done, total]));
    expect(progress).toHaveLength(2);
    expect(progress[progress.length - 1]).toEqual([2, 2]);
  });

  it("caps concurrency at 5 in-flight calls", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const many: GeneratedQuery[] = Array.from({ length: 12 }, (_, i) => ({
      targetTool: null,
      query: `q${i}`,
      leaked: false,
    }));
    const call: CallFn = async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return { selectedTool: null, inputTokens: 1, outputTokens: 1 };
    };
    await runSelectionEval(tools, many, call);
    expect(maxInFlight).toBeLessThanOrEqual(5);
  });
});
