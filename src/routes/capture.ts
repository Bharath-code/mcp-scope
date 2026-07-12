import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import type { Bindings } from "../index";
import { getReport, insertEmailCapture } from "../lib/db";
import { bumpCapture, refundCapture, utcDay, CAPTURE_LIMIT } from "../lib/rate-limit";
import { sendTranscriptEmail } from "../lib/email";

export const capture = new Hono<{ Bindings: Bindings }>();

const ERR_EMAIL = "Enter a valid email address.";
const ERR_NOT_FOUND = "Report not found.";
const ERR_RATE = "Free limit is 10 captures per day per IP. Try again tomorrow.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

capture.post("/api/capture", async (c) => {
  const body = (await c.req.json<{ email?: string; hash?: string }>().catch(() => ({}))) as {
    email?: string;
    hash?: string;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  const hash = (body.hash ?? "").trim();

  if (!EMAIL_RE.test(email)) return c.json({ error: ERR_EMAIL }, 400);

  const report = await getReport(c.env.DB, hash);
  if (!report) return c.json({ error: ERR_NOT_FOUND }, 404);

  const ip = c.req.header("CF-Connecting-IP") ?? "0.0.0.0";
  const day = utcDay();
  const count = await bumpCapture(c.env.DB, ip);
  if (count > CAPTURE_LIMIT) {
    await refundCapture(c.env.DB, ip, day);
    return c.json({ error: ERR_RATE }, 429);
  }

  await insertEmailCapture(c.env.DB, email, hash);
  setCookie(c, `unlocked_${hash}`, "1", {
    httpOnly: true,
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "Lax",
  });

  // Best-effort: a Resend failure never blocks the capture — the email is
  // stored and the in-page unlock already works without it.
  if (c.env.RESEND_API_KEY) {
    const reportUrl = new URL(`/r/${hash}`, c.req.url).toString();
    c.executionCtx.waitUntil(sendTranscriptEmail(c.env.RESEND_API_KEY, email, reportUrl));
  }

  return c.json({ ok: true });
});
