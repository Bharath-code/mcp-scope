// MCP ingest: connect to a server, read its tool list, nothing else.
// TASK-011 / Build Philosophy #7 — we call `initialize` + `tools/list` ONLY.
// `tools/call` is never imported or wrapped: this audits definitions, it does
// not execute anyone's tools.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import type { McpTool } from "../types";

const CONNECT_TIMEOUT_MS = 15_000; // FR: 15s per request
const MAX_TOOLS_BYTES = 1_000_000; // 1 MB cap on the tools/list payload

export type IngestResult = {
  serverName: string | null;
  tools: McpTool[];
  rawJson: string; // canonical tool payload; TASK-012 hashes this for dedupe
};

// The bearer token lives ONLY inside this RequestInit for the duration of the
// connection. It is never written to D1 and never logged (PRD § Security).
export function authRequestInit(bearerToken?: string): RequestInit | undefined {
  if (!bearerToken) return undefined;
  return { headers: { Authorization: `Bearer ${bearerToken}` } };
}

// Reject oversized tool lists before we serialize them into a report.
export function assertUnderCap(rawJson: string): void {
  const bytes = new TextEncoder().encode(rawJson).length;
  if (bytes > MAX_TOOLS_BYTES) {
    throw new Error(
      `This server's tool list is ${(bytes / 1_000_000).toFixed(1)} MB, over the 1 MB limit.`,
    );
  }
}

// User-facing ingest failure copy (PRD § Edge Cases > Ingestion). Returned raw —
// the report page escapes error text on both server render and client poll.
export const INGEST_ERRORS = {
  unreachable: "Couldn't reach your server — check the URL and that it's publicly accessible.",
  notMcp:
    "Connected, but this doesn't look like an MCP endpoint — check that the URL supports streamable HTTP or SSE.",
  auth: "Your server wants authentication — add a bearer token below and re-run.",
  tooBig: "Your tools/list response exceeds 1 MB — that's its own finding. Contact us.",
} as const;

// Map a thrown ingest error to its user-facing copy. The SDK surfaces HTTP
// status as a numeric `.code`; network/DNS failures throw TypeError or a
// message we pattern-match. Anything connectable-but-unrecognized falls through
// to the non-MCP message.
// ponytail: message-pattern classification, not exhaustive. Tighten if a real
// server trips the wrong bucket.
export function classifyIngestError(err: unknown): string {
  const code = (err as { code?: unknown })?.code;
  if (code === 401 || code === 403) return INGEST_ERRORS.auth;

  const msg = err instanceof Error ? err.message : String(err);
  if (/1 MB limit/.test(msg)) return INGEST_ERRORS.tooBig;
  if (/invalid JSON|Unexpected token|not valid JSON|in JSON at position/i.test(msg)) {
    // ponytail: excerpt = the parser's own message; plumbing raw response bytes
    // out of the SDK isn't worth it. Renderer escapes this.
    return `Your server returned invalid JSON from tools/list: ${msg.slice(0, 200)}`;
  }

  // A positive numeric code = a real HTTP status, so we reached the server —
  // it's just not MCP-shaped. Only classify as unreachable when there's no HTTP
  // status and the error looks network-level. On the CF edge a DNS/connection
  // failure surfaces as a bare `Error: internal error; reference = ...`.
  const httpStatus = typeof code === "number" && code > 0;
  const networkish =
    err instanceof TypeError ||
    /fetch failed|network|ENOTFOUND|ECONNREFUSED|getaddrinfo|could not connect|connection (refused|reset|closed|lost)|timed out|timeout|\bdns\b|internal error|reference =/i.test(
      msg,
    );
  if (!httpStatus && networkish) return INGEST_ERRORS.unreachable;
  return INGEST_ERRORS.notMcp;
}

export async function ingest(
  serverUrl: string,
  bearerToken?: string,
): Promise<IngestResult> {
  const url = new URL(serverUrl);
  // `redirect: "manual"` blocks SSRF-via-redirect: assertSafeUrl (at the route)
  // vets the initial URL; with "manual" a 3xx is returned unfollowed, so the SDK
  // sees a non-ok status and throws instead of chasing a redirect to a private
  // address (e.g. cloud metadata). MCP endpoints are exact — no legit redirect.
  // ("error" is not implementable at the CF edge — it throws a TypeError.)
  const requestInit: RequestInit = { redirect: "manual", ...authRequestInit(bearerToken) };

  // Streamable HTTP first (current spec), SSE only if the transport won't
  // connect (older servers). Once connected, any error is terminal — we do not
  // re-run tools/list over SSE.
  const factories = [
    () => new StreamableHTTPClientTransport(url, { requestInit }),
    () => new SSEClientTransport(url, { requestInit }),
  ];

  // Streamable is the primary transport; its connect error is the most
  // informative one to surface. Keep the first (streamable) failure and throw
  // that if every transport fails — the SSE fallback's errors are vague.
  let connectErr: unknown;
  for (const makeTransport of factories) {
    const client = new Client(
      { name: "mcp-audit", version: "0.1.0" },
      { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
    );
    try {
      await client.connect(makeTransport(), { timeout: CONNECT_TIMEOUT_MS });
    } catch (err) {
      if (connectErr === undefined) connectErr = err;
      await client.close().catch(() => {});
      continue; // transport failed to connect — try the next one
    }

    try {
      // ponytail: first page only. Tool-count cap + pagination land in TASK-023.
      const result = await client.listTools(undefined, { timeout: CONNECT_TIMEOUT_MS });
      const tools: McpTool[] = result.tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
      const rawJson = JSON.stringify(tools);
      assertUnderCap(rawJson);
      return {
        serverName: client.getServerVersion()?.name ?? null,
        tools,
        rawJson,
      };
    } finally {
      await client.close().catch(() => {});
    }
  }

  throw connectErr instanceof Error
    ? connectErr
    : new Error("Could not connect to this MCP server.");
}
