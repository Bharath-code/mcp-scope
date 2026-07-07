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

export async function ingest(
  serverUrl: string,
  bearerToken?: string,
): Promise<IngestResult> {
  const url = new URL(serverUrl);
  // `redirect: "error"` blocks SSRF-via-redirect: assertSafeUrl (at the route)
  // vets the initial URL, but fetch would otherwise follow a 302 to a private
  // address (e.g. cloud metadata). MCP endpoints are exact — no legit redirect.
  const requestInit: RequestInit = { redirect: "error", ...authRequestInit(bearerToken) };

  // Streamable HTTP first (current spec), SSE only if the transport won't
  // connect (older servers). Once connected, any error is terminal — we do not
  // re-run tools/list over SSE.
  const factories = [
    () => new StreamableHTTPClientTransport(url, { requestInit }),
    () => new SSEClientTransport(url, { requestInit }),
  ];

  let connectErr: unknown;
  for (const makeTransport of factories) {
    const client = new Client(
      { name: "mcp-audit", version: "0.1.0" },
      { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
    );
    try {
      await client.connect(makeTransport(), { timeout: CONNECT_TIMEOUT_MS });
    } catch (err) {
      connectErr = err;
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
