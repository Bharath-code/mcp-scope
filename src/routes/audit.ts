import { Hono } from "hono";
import type { Bindings } from "../index";
import { insertReport } from "../lib/db";
import { sha256Hex } from "../lib/hash";
import { bumpFreshRun, refundFreshRun, utcDay, FRESH_RUN_LIMIT } from "../lib/rate-limit";
import { assertSafeUrl, SsrfError } from "../lib/ssrf";

export const audit = new Hono<{ Bindings: Bindings }>();

const ERR_EMPTY = "Enter an MCP server URL or npm package name.";
const ERR_NPM = "We couldn't find a hosted endpoint for that package — paste the server URL directly.";
const ERR_SCHEME = "Enter a valid https:// MCP server URL.";
const ERR_UNREACHABLE = "That address isn't reachable from here.";
const ERR_RATE = "Free limit is 3 audits per day. Cached reports are always free.";

// Normalize: trim, lowercase host, strip trailing slash.
function normalizeUrl(raw: string): string {
  const u = new URL(raw);
  u.hostname = u.hostname.toLowerCase();
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
  return u.toString();
}

function looksLikeNpm(input: string): boolean {
  // No scheme and matches an npm package name shape.
  return !/^https?:\/\//i.test(input) && /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i.test(input);
}

audit.post("/audit", async (c) => {
  const ct = c.req.header("content-type") ?? "";
  let input = "";
  let bearerToken: string | undefined;
  if (ct.includes("application/json")) {
    const body = (await c.req
      .json<{ input?: string; bearerToken?: string }>()
      .catch(() => ({}))) as { input?: string; bearerToken?: string };
    input = (body.input ?? "").trim();
    bearerToken = body.bearerToken?.trim() || undefined;
  } else {
    const body = await c.req.parseBody();
    input = String(body.input ?? "").trim();
    const bt = String(body.bearerToken ?? "").trim();
    bearerToken = bt || undefined;
  }

  if (!input) return c.json({ error: ERR_EMPTY }, 400);
  if (looksLikeNpm(input)) return c.json({ error: ERR_NPM }, 400);

  let normalized: string;
  try {
    normalized = normalizeUrl(input);
    if (new URL(normalized).protocol !== "https:") return c.json({ error: ERR_SCHEME }, 400);
  } catch {
    return c.json({ error: ERR_SCHEME }, 400);
  }

  // SSRF guard (private ranges, metadata hosts) — neutral copy.
  try {
    assertSafeUrl(normalized);
  } catch (e) {
    if (e instanceof SsrfError) return c.json({ error: ERR_UNREACHABLE }, 400);
    throw e;
  }

  const ip = c.req.header("CF-Connecting-IP") ?? "0.0.0.0";
  const day = utcDay();
  const count = await bumpFreshRun(c.env.DB, ip);
  if (count > FRESH_RUN_LIMIT) {
    await refundFreshRun(c.env.DB, ip, day);
    return c.json({ error: ERR_RATE }, 429);
  }

  const id = await sha256Hex(`${normalized}\n${Date.now()}\n${crypto.randomUUID()}`);
  await insertReport(c.env.DB, id, normalized);

  const stub = c.env.AUDIT_PIPELINE.get(c.env.AUDIT_PIPELINE.idFromName(id));
  await stub.fetch("https://do/run", {
    method: "POST",
    body: JSON.stringify({ reportId: id, serverUrl: normalized, bearerToken, clientIp: ip, chargeDay: day }),
  });

  return c.redirect(`/r/${id}`, 302);
});
