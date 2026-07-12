import { describe, it, expect } from "vitest";
import { groupTranscripts } from "./transcripts";
import type { EvalCallRow } from "./db";

const row = (over: Partial<EvalCallRow>): EvalCallRow => ({
  id: 1,
  report_id: "r1",
  target_tool: null,
  query: "q",
  selected_tool: null,
  leaked: 0,
  ...over,
});

describe("groupTranscripts", () => {
  it("groups entries by target tool, preserving order", () => {
    const rows = [
      row({ id: 1, target_tool: "search_docs", query: "find the policy", selected_tool: "search_docs" }),
      row({ id: 2, target_tool: "search_docs", query: "look up onboarding", selected_tool: "query_knowledge" }),
      row({ id: 3, target_tool: "sync_data", query: "sync my data" }),
    ];
    const groups = groupTranscripts(rows);
    expect(groups).toEqual([
      {
        tool: "search_docs",
        entries: [
          { query: "find the policy", selectedTool: "search_docs", leaked: false },
          { query: "look up onboarding", selectedTool: "query_knowledge", leaked: false },
        ],
      },
      { tool: "sync_data", entries: [{ query: "sync my data", selectedTool: null, leaked: false }] },
    ]);
  });

  it("groups distractor queries (null target) under a distractor label", () => {
    const groups = groupTranscripts([row({ target_tool: null, query: "what's the weather", leaked: 0 })]);
    expect(groups).toEqual([{ tool: "(distractor)", entries: [{ query: "what's the weather", selectedTool: null, leaked: false }] }]);
  });

  it("maps the leaked flag from 1/0 to boolean", () => {
    const groups = groupTranscripts([row({ target_tool: "t", leaked: 1 })]);
    expect(groups[0].entries[0].leaked).toBe(true);
  });
});
