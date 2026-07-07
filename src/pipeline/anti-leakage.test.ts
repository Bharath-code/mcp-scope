import { describe, it, expect } from "vitest";
import { nameTokens, leakTokens, isLeaked } from "./anti-leakage";

describe("nameTokens", () => {
  it("splits snake_case, camelCase and digits", () => {
    expect(nameTokens("getUserProfile2")).toEqual(["get", "user", "profile", "2"]);
    expect(nameTokens("search_docs")).toEqual(["search", "docs"]);
  });
});

describe("leakTokens", () => {
  it("drops stopword verbs and short tokens", () => {
    expect(leakTokens("search_documents")).toEqual(["documents"]);
    expect(leakTokens("list_all")).toEqual([]);
  });
});

describe("isLeaked", () => {
  it("flags queries echoing a discriminating name token", () => {
    expect(isLeaked("Find all my documents from last week", "search_documents")).toBe(true);
  });
  it("passes clean user-goal queries", () => {
    expect(isLeaked("What did the team ship yesterday?", "search_documents")).toBe(false);
  });
  it("ignores stopword-only overlap", () => {
    expect(isLeaked("search everything", "search_docs")).toBe(false);
  });
});
