import { describe, it, expect } from "vitest";
import { ReportPage } from "./Report";
import type { ReportApiResponse } from "../types";

const base: ReportApiResponse = {
  status: "complete",
  error: null,
  progress: null,
  serverName: null,
  toolCount: 1,
  static: null,
  headline: null,
  tools: null,
  transcriptsUnlocked: false,
  transcripts: null,
  rawToolsJson: null,
};

describe("ReportPage escaping", () => {
  it("escapes attacker-controlled tool names in static findings", async () => {
    const resp: ReportApiResponse = {
      ...base,
      static: {
        defTokens: 10,
        defTokensEstimated: false,
        schemaIssues: [],
        weakDescriptions: [{ tool: "<script>alert(1)</script>", descriptionLen: 3 }],
        nameCollisions: [],
      },
    };
    const out = String(await ReportPage({ resp, hash: "abc" }));
    expect(out).not.toContain("<script>alert(1)</script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("escapes the raw tools/list payload in the empty-tools card", async () => {
    const resp: ReportApiResponse = {
      ...base,
      toolCount: 0,
      rawToolsJson: '[{"name":"<img src=x onerror=alert(1)>"}]',
    };
    const out = String(await ReportPage({ resp, hash: "abc" }));
    expect(out).not.toContain("<img src=x onerror=alert(1)>");
    expect(out).toContain("&lt;img");
  });

  it("renders the verdict page in FR-011 order: headline, dead tools, collisions, false positives, then per-tool table", async () => {
    const resp: ReportApiResponse = {
      ...base,
      toolCount: 3,
      headline: {
        effectiveTools: 1,
        totalTools: 3,
        defTokens: 4200,
        deadTools: ["sync_data"],
        collisions: [{ thief: "query_knowledge", victim: "search_docs", stolen: 2, of: 3 }],
        falsePositives: ["search_docs"],
        headline: "1/3 tools effective · 4200 tokens of context tax",
      },
      tools: [
        { tool: "search_docs", descriptionLen: 20, triggerAccuracy: 0.33, timesSelected: 3, stolenBy: {}, isDead: false },
      ],
    };
    const out = String(await ReportPage({ resp, hash: "abc" }));
    const headlineIdx = out.indexOf("1/3 tools effective");
    const deadIdx = out.indexOf("sync_data");
    const collisionIdx = out.indexOf("query_knowledge");
    const falsePositiveIdx = out.indexOf("False positives");
    const tableIdx = out.indexOf("Trigger accuracy");
    expect(headlineIdx).toBeGreaterThan(-1);
    expect(headlineIdx).toBeLessThan(deadIdx);
    expect(deadIdx).toBeLessThan(collisionIdx);
    expect(collisionIdx).toBeLessThan(falsePositiveIdx);
    expect(falsePositiveIdx).toBeLessThan(tableIdx);
  });

  it("escapes attacker-controlled strings in unlocked transcripts", async () => {
    const resp: ReportApiResponse = {
      ...base,
      tools: [
        { tool: "search_docs", descriptionLen: 10, triggerAccuracy: 1, timesSelected: 1, stolenBy: {}, isDead: false },
      ],
      transcriptsUnlocked: true,
      transcripts: [
        {
          tool: "search_docs",
          entries: [{ query: "<script>alert(1)</script>", selectedTool: "<b>evil</b>", leaked: false }],
        },
      ],
    };
    const out = String(await ReportPage({ resp, hash: "abc" }));
    expect(out).not.toContain("<script>alert(1)</script>");
    expect(out).not.toContain("<b>evil</b>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("renders SEO meta, canonical tag, audited-on date, and the run-it-yourself form for published reports", async () => {
    const resp: ReportApiResponse = {
      ...base,
      serverName: "Acme MCP",
      headline: {
        effectiveTools: 2,
        totalTools: 3,
        defTokens: 500,
        deadTools: [],
        collisions: [],
        falsePositives: [],
        headline: "2/3 tools effective · 500 tokens of context tax",
      },
    };
    const out = String(
      await ReportPage({ resp, hash: "abc", published: { slug: "acme-mcp", auditedAt: "2026-01-15T00:00:00Z" } }),
    );
    expect(out).toContain("2/3 tools effective — MCP Audit");
    expect(out).toContain('<link rel="canonical" href="/report/acme-mcp" />');
    expect(out).toContain("Audited on 2026-01-15");
    expect(out).toContain('id="runitform"');
  });
});
