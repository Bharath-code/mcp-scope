import { describe, it, expect } from "vitest";
import { generateQueries } from "./query-gen";
import type { McpTool } from "../types";

const tools: McpTool[] = [
  { name: "search_docs", description: "Search internal documentation", inputSchema: { type: "object" } },
];

describe("generateQueries", () => {
  it("parses queries and tags distractors as targetTool null", async () => {
    const call = async () => [
      { tool: "search_docs", query: "Find out how to reset a password" },
      { tool: "__distractor__", query: "What's the weather like today?" },
    ];
    const result = await generateQueries("k", tools, call);
    expect(result).toEqual([
      { targetTool: "search_docs", query: "Find out how to reset a password", leaked: false },
      { targetTool: null, query: "What's the weather like today?", leaked: false },
    ]);
  });

  it("retries once on unusable output, then fails the stage", async () => {
    let calls = 0;
    const call = async () => {
      calls++;
      throw new Error("unusable query-gen output");
    };
    await expect(generateQueries("k", tools, call)).rejects.toThrow(/Couldn't generate/);
    expect(calls).toBe(2);
  });

  it("regenerates a leaked query once, keeping it flagged if still leaked", async () => {
    let call2Args: string | null = null;
    const call = async (_system: string, user: string) => {
      if (user.includes("Rewrite it")) {
        call2Args = user;
        return [{ tool: "search_docs", query: "How do I look up an internal policy?" }];
      }
      return [{ tool: "search_docs", query: "search the docs for onboarding steps" }];
    };
    const result = await generateQueries("k", tools, call);
    expect(call2Args).toContain("search_docs");
    expect(result).toEqual([
      { targetTool: "search_docs", query: "How do I look up an internal policy?", leaked: false },
    ]);
  });

  it("keeps a query leaked=true if regeneration still leaks", async () => {
    const call = async (_system: string, user: string) => {
      if (user.includes("Rewrite it")) {
        return [{ tool: "search_docs", query: "search the docs again please" }];
      }
      return [{ tool: "search_docs", query: "search the docs for onboarding steps" }];
    };
    const result = await generateQueries("k", tools, call);
    expect(result[0].leaked).toBe(true);
  });
});
