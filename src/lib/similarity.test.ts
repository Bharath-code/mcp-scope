import { describe, it, expect } from "vitest";
import { nameSimilarity, findNameCollisions } from "./similarity";

describe("nameSimilarity", () => {
  it("scores identical normalized names as 1", () => {
    expect(nameSimilarity("search_docs", "searchDocs")).toBe(1);
  });
  it("scores disjoint names near 0", () => {
    expect(nameSimilarity("alpha", "zzzzz")).toBeLessThan(0.2);
  });
  it("scores near-duplicates high", () => {
    expect(nameSimilarity("get_user", "get_users")).toBeGreaterThan(0.8);
  });
});

describe("findNameCollisions", () => {
  it("returns pairs ≥ threshold, strongest first", () => {
    const pairs = findNameCollisions(["search_docs", "searchDocs", "delete_user", "list_files"]);
    expect(pairs[0]).toMatchObject({ score: 1 });
    expect(pairs.every((p) => p.score >= 0.8)).toBe(true);
    expect(pairs.some((p) => p.a === "delete_user" || p.b === "delete_user")).toBe(false);
  });
});
