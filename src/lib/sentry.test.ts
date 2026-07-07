import { describe, it, expect } from "vitest";
import { scrubEvent } from "./sentry";

describe("scrubEvent", () => {
  it("strips sensitive request headers", () => {
    const ev = {
      request: {
        url: "https://x/audit",
        headers: { Authorization: "Bearer sk-abc123def456ghi789jkl", "User-Agent": "curl" },
      },
    };
    const out = scrubEvent(ev) as typeof ev;
    expect(out.request.headers.Authorization).toBe("[redacted]");
    expect(out.request.headers["User-Agent"]).toBe("curl");
  });

  it("redacts bearer tokens embedded in message strings", () => {
    const out = scrubEvent({ message: "failed with Bearer sk-abc123def456ghi789jkl xyz" }) as {
      message: string;
    };
    expect(out.message).not.toContain("sk-abc123def456ghi789jkl");
    expect(out.message).toContain("[redacted]");
  });

  it("redacts email addresses anywhere", () => {
    const out = scrubEvent({ extra: { note: "captured user@example.com today" } }) as {
      extra: { note: string };
    };
    expect(out.extra.note).toBe("captured [email redacted] today");
  });

  it("redacts long opaque tokens", () => {
    const out = scrubEvent({ tags: { key: "abcdefghijklmnopqrstuvwxyz0123" } }) as {
      tags: { key: string };
    };
    expect(out.tags.key).toBe("[redacted]");
  });

  it("leaves short benign strings alone", () => {
    const out = scrubEvent({ level: "error", short: "ok" }) as { level: string; short: string };
    expect(out.level).toBe("error");
    expect(out.short).toBe("ok");
  });
});
