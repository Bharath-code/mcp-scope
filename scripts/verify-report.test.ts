import { describe, it, expect } from "vitest";
import { summarize, formatRow } from "./verify-report";

describe("summarize", () => {
  it("passes at or under 10% questionable", () => {
    expect(summarize(10, 1).verdict).toBe("PASS");
    expect(summarize(10, 0).verdict).toBe("PASS");
  });

  it("fails over 10% questionable", () => {
    const s = summarize(10, 2);
    expect(s.verdict).toBe("FIX_GENERATOR");
    expect(s.pct).toBeCloseTo(0.2);
  });

  it("handles zero rows without dividing by zero", () => {
    expect(summarize(0, 0)).toEqual({ total: 0, questionable: 0, pct: 0, verdict: "PASS" });
  });
});

describe("formatRow", () => {
  it("labels distractors and no-selection, and flags leaked queries", () => {
    const out = formatRow({ target_tool: null, query: "what's the weather", selected_tool: null, leaked: 0 }, 0, 5);
    expect(out).toContain("target=(distractor)");
    expect(out).toContain("selected=(none)");
    expect(out).not.toContain("[leaked]");
  });

  it("marks a leaked row", () => {
    const out = formatRow({ target_tool: "search_docs", query: "search the docs", selected_tool: "search_docs", leaked: 1 }, 2, 5);
    expect(out).toContain("[3/5]");
    expect(out).toContain("[leaked]");
  });
});
