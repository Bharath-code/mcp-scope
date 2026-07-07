import { describe, it, expect } from "vitest";
import { assertSafeUrl, SsrfError } from "./ssrf";

const rejects = [
  "http://example.com/mcp", // non-https
  "https://127.0.0.1/mcp",
  "https://10.0.0.5/mcp",
  "https://172.16.4.4/mcp",
  "https://172.31.255.255/mcp",
  "https://192.168.1.1/mcp",
  "https://169.254.169.254/mcp", // cloud metadata
  "https://0.0.0.0/mcp",
  "https://100.64.0.1/mcp", // CGNAT
  "https://metadata.google.internal/mcp",
  "https://localhost/mcp",
  "https://[::1]/mcp",
  "https://[::ffff:127.0.0.1]/mcp",
  "https://[fc00::1]/mcp",
  "https://[fe80::1]/mcp",
];

const allows = [
  "https://mcp.notion.com/mcp",
  "https://api.githubcopilot.com/mcp/",
  "https://8.8.8.8/mcp", // public IP literal
  "https://[2606:4700:4700::1111]/mcp", // public IPv6
];

describe("assertSafeUrl", () => {
  for (const url of rejects) {
    it(`rejects ${url}`, () => {
      expect(() => assertSafeUrl(url)).toThrow(SsrfError);
    });
  }
  for (const url of allows) {
    it(`allows ${url}`, () => {
      expect(() => assertSafeUrl(url)).not.toThrow();
    });
  }
});
