import { describe, it, expect } from "vitest";
import { HomePage } from "./Home";

describe("HomePage", () => {
  it("renders the three value props and tune-up footer blurb", async () => {
    const out = String(await HomePage());
    expect(out).toContain("Real selection, not a linter");
    expect(out).toContain("$149 gets you a PR-ready diff");
  });

  it("renders published reports and escapes attacker-controlled server names", async () => {
    const out = String(
      await HomePage(undefined, [
        {
          slug: "acme",
          server_name: "<script>alert(1)</script>",
          tool_count: 5,
          headline_json: JSON.stringify({
            effectiveTools: 3,
            totalTools: 5,
            defTokens: 800,
            deadTools: [],
            collisions: [],
            falsePositives: [],
            headline: "3/5 tools effective · 800 tokens of context tax",
          }),
        },
      ]),
    );
    expect(out).toContain('href="/report/acme"');
    expect(out).toContain("3/5 effective");
    expect(out).not.toContain("<script>alert(1)</script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("omits the published section entirely when there are no published reports", async () => {
    const out = String(await HomePage(undefined, []));
    expect(out).not.toContain("Published audits");
  });
});
