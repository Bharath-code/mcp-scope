import { describe, it, expect } from "vitest";
import { runStaticChecks } from "./static-checks";
import type { McpTool } from "../types";

const noOp = async ({ tools }: { tools?: unknown[] }) => (tools ? 250 : 200);

describe("runStaticChecks", () => {
  it("flags missing/wrong-type schemas, weak descriptions, and name collisions", async () => {
    const tools: McpTool[] = [
      { name: "search_docs", description: "Searches the documentation for matching entries", inputSchema: { type: "object" } },
      { name: "searchDocs", description: "Searches the documentation for matching entries", inputSchema: { type: "object" } },
      { name: "delete_user", description: "short", inputSchema: { type: "string" } },
      { name: "list_files", inputSchema: "not an object" },
    ];
    const result = await runStaticChecks("k", tools, noOp);

    expect(result.schemaIssues).toEqual(
      expect.arrayContaining([
        { tool: "delete_user", reason: 'inputSchema.type is "string", expected "object"' },
        { tool: "list_files", reason: "inputSchema is not an object" },
      ]),
    );
    expect(result.weakDescriptions).toEqual(
      expect.arrayContaining([
        { tool: "delete_user", descriptionLen: 5 },
        { tool: "list_files", descriptionLen: 0 },
      ]),
    );
    expect(result.nameCollisions[0]).toMatchObject({ a: "search_docs", b: "searchDocs", score: 1 });
  });

  it("allows an absent inputSchema (no params)", async () => {
    const result = await runStaticChecks("k", [{ name: "ping", description: "Pings the remote server for liveness" }], noOp);
    expect(result.schemaIssues).toEqual([]);
  });

  it("flags an array inputSchema", async () => {
    const result = await runStaticChecks(
      "k",
      [{ name: "ping", description: "Pings the remote server for liveness", inputSchema: [] }],
      noOp,
    );
    expect(result.schemaIssues).toEqual([{ tool: "ping", reason: 'inputSchema.type is "undefined", expected "object"' }]);
  });

  it("does not flag dissimilar names as collisions", async () => {
    const tools: McpTool[] = [
      { name: "alpha", description: "Does the alpha thing for the system reliably", inputSchema: { type: "object" } },
      { name: "zeta", description: "Does the zeta thing for the system reliably", inputSchema: { type: "object" } },
    ];
    const result = await runStaticChecks("k", tools, noOp);
    expect(result.nameCollisions).toEqual([]);
  });
});
