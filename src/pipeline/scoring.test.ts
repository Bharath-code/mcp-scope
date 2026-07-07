import { describe, it, expect } from "vitest";
import { scoreReport, type EvalCall } from "./scoring";
import type { McpTool } from "../types";

const tools: McpTool[] = [
  { name: "search_docs", description: "Search the docs" },
  { name: "query_knowledge", description: "Query the KB" },
  { name: "sync_data", description: "Sync" },
];

// search_docs: 2/3 own picked (effective). query_knowledge steals 2 of 3
// from search_docs. sync_data never selected (dead). one leaked query for
// query_knowledge (excluded). one distractor triggers a false positive.
const calls: EvalCall[] = [
  { targetTool: "search_docs", selectedTool: "search_docs", leaked: false },
  { targetTool: "search_docs", selectedTool: "query_knowledge", leaked: false },
  { targetTool: "search_docs", selectedTool: "query_knowledge", leaked: false },
  { targetTool: "query_knowledge", selectedTool: "query_knowledge", leaked: false },
  { targetTool: "query_knowledge", selectedTool: null, leaked: true },
  { targetTool: null, selectedTool: "search_docs", leaked: false },
];

describe("scoreReport", () => {
  const { tools: results, headline } = scoreReport(tools, calls, 4200);
  const byName = Object.fromEntries(results.map((r) => [r.tool, r]));

  it("computes triggerAccuracy excluding leaked queries", () => {
    expect(byName.search_docs.triggerAccuracy).toBeCloseTo(1 / 3);
    expect(byName.query_knowledge.triggerAccuracy).toBe(1); // leaked one excluded
  });

  it("marks unselected tools dead", () => {
    expect(byName.sync_data.isDead).toBe(true);
    expect(headline.deadTools).toEqual(["sync_data"]);
  });

  it("records directional collisions", () => {
    expect(headline.collisions).toContainEqual({
      thief: "query_knowledge",
      victim: "search_docs",
      stolen: 2,
      of: 3,
    });
  });

  it("flags distractor-triggered false positives", () => {
    expect(headline.falsePositives).toEqual(["search_docs"]);
  });

  it("renders the headline string", () => {
    // search_docs 0.33 fails, query_knowledge 1.0 passes -> 1 effective
    expect(headline.effectiveTools).toBe(1);
    expect(headline.headline).toBe("1/3 tools effective · 4200 tokens of context tax");
  });
});
