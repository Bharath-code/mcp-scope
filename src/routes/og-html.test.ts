import { describe, it, expect } from "vitest";
import { ogHtml } from "./og-html";

describe("ogHtml", () => {
  it("renders a not-found card when the report is missing", () => {
    expect(ogHtml(null)).toContain("Report not found");
  });

  it("renders an in-progress card for incomplete reports", () => {
    const html = ogHtml({ status: "evaluating", server_name: "My Server", server_url: "https://x", headline_json: null });
    expect(html).toContain("Audit in progress");
    expect(html).toContain("My Server");
  });

  it("renders the headline score for complete reports", () => {
    const headline_json = JSON.stringify({
      effectiveTools: 2,
      totalTools: 3,
      defTokens: 500,
      deadTools: [],
      collisions: [],
      falsePositives: [],
      headline: "2/3 tools effective · 500 tokens of context tax",
    });
    const html = ogHtml({ status: "complete", server_name: "Acme", server_url: "https://x", headline_json });
    expect(html).toContain("2/3 tools effective");
    expect(html).toContain("500 tokens of context tax");
    expect(html).toContain("Acme");
  });

  it("escapes an attacker-controlled server name", () => {
    const html = ogHtml({
      status: "evaluating",
      server_name: "<script>alert(1)</script>",
      server_url: "https://x",
      headline_json: null,
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
