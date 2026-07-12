import { describe, it, expect } from "vitest";
import { extractReportId, buildPublishSql } from "./publish-famous";

describe("extractReportId", () => {
  it("pulls the report id out of a /r/:hash redirect location", () => {
    expect(extractReportId("/r/abc123")).toBe("abc123");
    expect(extractReportId("https://mcpaudit.dev/r/abc123?x=1")).toBe("abc123");
  });

  it("throws when the location doesn't look like a report redirect", () => {
    expect(() => extractReportId("/")).toThrow(/report id/);
  });
});

describe("buildPublishSql", () => {
  it("builds the publish UPDATE statement", () => {
    expect(buildPublishSql("abc123", "notion-mcp")).toBe(
      "UPDATE reports SET is_published = 1, slug = 'notion-mcp' WHERE id = 'abc123'",
    );
  });
});
