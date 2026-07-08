import { describe, it, expect } from "vitest";
import { countDefTokens } from "./tokens";
import type { McpTool } from "../types";

const tools: McpTool[] = [{ name: "search", description: "find things", inputSchema: { type: "object" } }];

describe("countDefTokens", () => {
  it("returns the marginal tax: with-tools minus baseline", async () => {
    const count = async ({ tools }: { tools?: unknown[] }) => (tools ? 250 : 200);
    expect(await countDefTokens("k", tools, count)).toEqual({ defTokens: 50, estimated: false });
  });

  it("short-circuits to zero for a server with no tools", async () => {
    const count = async () => {
      throw new Error("should not be called");
    };
    expect(await countDefTokens("k", [], count)).toEqual({ defTokens: 0, estimated: false });
  });

  it("never goes negative", async () => {
    const count = async ({ tools }: { tools?: unknown[] }) => (tools ? 190 : 200);
    expect((await countDefTokens("k", tools, count)).defTokens).toBe(0);
  });

  it("falls back to a flagged length/4 estimate when the counter throws", async () => {
    const count = async () => {
      throw new Error("api down");
    };
    const { defTokens, estimated } = await countDefTokens("k", tools, count);
    expect(estimated).toBe(true);
    expect(defTokens).toBe(Math.ceil(JSON.stringify(tools).length / 4));
  });
});
