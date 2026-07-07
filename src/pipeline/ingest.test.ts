import { describe, it, expect } from "vitest";
import { authRequestInit, assertUnderCap } from "./ingest";

describe("authRequestInit", () => {
  it("omits the header when no token is given", () => {
    expect(authRequestInit()).toBeUndefined();
    expect(authRequestInit("")).toBeUndefined();
  });
  it("builds a Bearer Authorization header", () => {
    expect(authRequestInit("sk-123")).toEqual({
      headers: { Authorization: "Bearer sk-123" },
    });
  });
});

describe("assertUnderCap", () => {
  it("passes payloads under 1 MB", () => {
    expect(() => assertUnderCap(JSON.stringify([{ name: "a" }]))).not.toThrow();
  });
  it("rejects payloads over 1 MB", () => {
    const huge = JSON.stringify([{ name: "x".repeat(1_000_001) }]);
    expect(() => assertUnderCap(huge)).toThrow(/over the 1 MB limit/);
  });
});
