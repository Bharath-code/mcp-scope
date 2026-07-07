// Sentry event scrubbing. Arbitrary user servers fail in creative ways, so we
// report — but bearer tokens (target-server creds) and emails must never leave
// the Worker. This scrubber is the load-bearing part and is unit-tested.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const BEARER_RE = /\b[Bb]earer\s+[A-Za-z0-9._~+/=-]+/g;
// Long opaque token-shaped strings (>=20 chars of token alphabet, no spaces).
const TOKEN_RE = /\b[A-Za-z0-9._~+/=-]{20,}\b/g;
const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie", "proxy-authorization"]);

function redactString(s: string): string {
  return s
    .replace(EMAIL_RE, "[email redacted]")
    .replace(BEARER_RE, "Bearer [redacted]")
    .replace(TOKEN_RE, "[redacted]");
}

function scrubHeaders(headers: unknown): unknown {
  if (!headers || typeof headers !== "object") return headers;
  if (Array.isArray(headers)) return headers;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    out[k] = SENSITIVE_HEADERS.has(k.toLowerCase())
      ? "[redacted]"
      : typeof v === "string"
        ? redactString(v)
        : v;
  }
  return out;
}

// Recursively redact strings; strip sensitive headers by key.
export function scrubValue(value: unknown, key?: string): unknown {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.toLowerCase() === "headers") out[k] = scrubHeaders(v);
      else out[k] = scrubValue(v, k);
    }
    return out;
  }
  return value;
}

export function scrubEvent<T>(event: T): T {
  return scrubValue(event) as T;
}

import type { ErrorEvent, Breadcrumb } from "@sentry/cloudflare";

export function sentryOptions(dsn: string | undefined) {
  return {
    dsn: dsn || undefined,
    tracesSampleRate: 0,
    beforeSend: (event: ErrorEvent): ErrorEvent => scrubEvent(event),
    beforeBreadcrumb: (crumb: Breadcrumb): Breadcrumb => scrubEvent(crumb),
  };
}
