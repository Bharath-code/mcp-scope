import { describe, it, expect } from "vitest";
import { buildSitemap } from "./seo";

describe("buildSitemap", () => {
  it("includes the landing page, /method, and published slugs but no /r/ hashes", () => {
    const xml = buildSitemap("https://mcpaudit.dev", ["notion-mcp", "stripe-mcp"]);
    expect(xml).toContain("<loc>https://mcpaudit.dev/</loc>");
    expect(xml).toContain("<loc>https://mcpaudit.dev/method</loc>");
    expect(xml).toContain("<loc>https://mcpaudit.dev/report/notion-mcp</loc>");
    expect(xml).toContain("<loc>https://mcpaudit.dev/report/stripe-mcp</loc>");
    expect(xml).not.toContain("/r/");
  });

  it("is valid-shaped XML with a urlset root", () => {
    const xml = buildSitemap("https://mcpaudit.dev", []);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("</urlset>");
  });
});
