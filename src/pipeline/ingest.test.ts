import { describe, it, expect } from "vitest";
import { authRequestInit, assertUnderCap, classifyIngestError, INGEST_ERRORS } from "./ingest";

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

describe("classifyIngestError", () => {
  it("maps 401/403 to the bearer-token hint", () => {
    expect(classifyIngestError({ code: 401 })).toBe(INGEST_ERRORS.auth);
    expect(classifyIngestError({ code: 403 })).toBe(INGEST_ERRORS.auth);
  });
  it("maps the 1 MB cap error", () => {
    let thrown: unknown;
    try {
      assertUnderCap(JSON.stringify([{ name: "x".repeat(1_000_001) }]));
    } catch (e) {
      thrown = e;
    }
    expect(classifyIngestError(thrown)).toBe(INGEST_ERRORS.tooBig);
  });
  it("maps network/DNS failures to unreachable", () => {
    expect(classifyIngestError(new TypeError("fetch failed"))).toBe(INGEST_ERRORS.unreachable);
    expect(classifyIngestError(new Error("Could not connect to this MCP server."))).toBe(
      INGEST_ERRORS.unreachable,
    );
    expect(classifyIngestError(new Error("Request timed out"))).toBe(INGEST_ERRORS.unreachable);
    // CF edge surfaces DNS/connection failure as a bare "internal error; reference".
    expect(classifyIngestError(new Error("internal error; reference = j9kb8jke6bjku74"))).toBe(
      INGEST_ERRORS.unreachable,
    );
  });
  it("treats a real HTTP status as reached-but-not-MCP, not unreachable", () => {
    // example.com: streamable POST → 405 with an HTML body.
    expect(
      classifyIngestError({ code: 405, message: "Error POSTing to endpoint: <!doctype html> 405" }),
    ).toBe(INGEST_ERRORS.notMcp);
  });
  it("maps JSON parse failures with an escaped-safe excerpt", () => {
    const msg = classifyIngestError(new SyntaxError("Unexpected token < in JSON at position 0"));
    expect(msg).toMatch(/invalid JSON from tools\/list/);
    expect(msg).toMatch(/Unexpected token/);
  });
  it("falls through to the non-MCP message", () => {
    expect(classifyIngestError({ code: -1, message: "Unexpected content type: text/html" })).toBe(
      INGEST_ERRORS.notMcp,
    );
  });
});
