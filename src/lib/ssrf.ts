// SSRF guard: the product fetches user-supplied URLs server-side, so this is the
// top risk. https-only; reject private/reserved IP literals and cloud-metadata hosts.
// ponytail: checks URL host literals + a hostname denylist. It does NOT resolve DNS
// (Workers can't cheaply, and rebinding needs connect-time pinning) — upgrade to a
// resolving/pinned fetch if DNS-rebinding becomes a real threat.

export class SsrfError extends Error {}

const METADATA_HOSTS = new Set([
  "metadata.google.internal",
  "localhost",
]);

function ipv4ToParts(host: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return parts;
}

function isPrivateIpv4([a, b]: number[]): boolean {
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (metadata)
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  return false;
}

function isPrivateIpv6(host: string): boolean {
  let h = host.toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1);
  // IPv4-mapped ::ffff:a.b.c.d (dotted form)
  const mappedDotted = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(h);
  if (mappedDotted) {
    const parts = ipv4ToParts(mappedDotted[1]);
    return parts ? isPrivateIpv4(parts) : true;
  }
  // IPv4-mapped in hex form ::ffff:7f00:1 (URL parser normalizes to this)
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(h);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return isPrivateIpv4([hi >> 8, hi & 0xff, lo >> 8, lo & 0xff]);
  }
  if (h === "::1" || h === "::") return true; // loopback / unspecified
  const first = parseInt(h.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  return false;
}

export function assertSafeUrl(rawUrl: string): void {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new SsrfError("Invalid URL.");
  }
  if (u.protocol !== "https:") throw new SsrfError("Only https URLs are allowed.");

  let host = u.hostname.toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);

  if (METADATA_HOSTS.has(host)) throw new SsrfError("Blocked host.");

  const v4 = ipv4ToParts(host);
  if (v4) {
    if (isPrivateIpv4(v4)) throw new SsrfError("Private or reserved address.");
    return;
  }
  if (host.includes(":")) {
    if (isPrivateIpv6(host)) throw new SsrfError("Private or reserved address.");
    return;
  }
  // Hostname (not an IP literal): allowed past the guard. DNS-resolution-time
  // rebinding is out of scope for v1 (see file header).
}
