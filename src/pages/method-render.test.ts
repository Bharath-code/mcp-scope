import { describe, it, expect } from "vitest";
import { MethodPage } from "./Method";
import { ReportPage } from "./Report";
import type { ReportApiResponse } from "../types";

describe("MethodPage", () => {
  it("renders the method page", async () => {
    const out = String(await MethodPage());
    expect(out).toContain("Method");
    expect(out).toContain("anti-leakage");
    expect(out).toContain("Pipeline stages");
  });
});

describe("ReportPage footer", () => {
  it("shows the method disclosure footer on every report", async () => {
    const resp: ReportApiResponse = {
      status: "queued",
      error: null,
      progress: null,
      serverName: null,
      toolCount: null,
      static: null,
      headline: null,
      tools: null,
      transcriptsUnlocked: false,
      transcripts: null,
      rawToolsJson: null,
    };
    const out = String(await ReportPage({ resp, hash: "abc" }));
    expect(out).toContain("Selection at temperature 0 with generated queries is a proxy, not ground truth.");
    expect(out).toContain('href="/method"');
  });
});
