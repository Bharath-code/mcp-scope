import { describe, it, expect } from "vitest";
import { generateBadgeSvg, buildScoreBadge } from "./badge";
import type { ReportRow } from "../types";

describe("generateBadgeSvg", () => {
  it("renders an SVG with label, value, and specified color", () => {
    const svg = generateBadgeSvg("mcp audit", "12/14 effective", "#059669");
    expect(svg).toContain("<svg");
    expect(svg).toContain("mcp audit");
    expect(svg).toContain("12/14 effective");
    expect(svg).toContain("#059669");
  });
});

describe("buildScoreBadge", () => {
  it("renders a not found badge when report is null", () => {
    const svg = buildScoreBadge(null);
    expect(svg).toContain("not found");
  });

  it("renders auditing badge when report is incomplete", () => {
    const report = {
      id: "abc",
      status: "evaluating",
      headline_json: null,
    } as unknown as ReportRow;
    const svg = buildScoreBadge(report);
    expect(svg).toContain("auditing...");
  });

  it("renders green score badge when ratio >= 0.75", () => {
    const report = {
      id: "abc",
      status: "complete",
      headline_json: JSON.stringify({
        effectiveTools: 12,
        totalTools: 14,
      }),
    } as unknown as ReportRow;
    const svg = buildScoreBadge(report);
    expect(svg).toContain("12/14 effective");
    expect(svg).toContain("#059669");
  });

  it("renders rose badge when ratio < 0.5", () => {
    const report = {
      id: "abc",
      status: "complete",
      headline_json: JSON.stringify({
        effectiveTools: 2,
        totalTools: 10,
      }),
    } as unknown as ReportRow;
    const svg = buildScoreBadge(report);
    expect(svg).toContain("2/10 effective");
    expect(svg).toContain("#E11D48");
  });
});
