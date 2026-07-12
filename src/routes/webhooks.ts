import { Hono } from "hono";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import * as Sentry from "@sentry/cloudflare";
import type { Bindings } from "../index";
import { getReport, insertTuneUpOrder } from "../lib/db";
import { sendTuneUpOrderEmail } from "../lib/email";
import { captureServerEvent } from "../lib/analytics";

export const webhooks = new Hono<{ Bindings: Bindings }>();

webhooks.post("/api/webhooks/polar", async (c) => {
  const body = await c.req.text();
  const headers = Object.fromEntries(c.req.raw.headers.entries());

  let event;
  try {
    event = validateEvent(body, headers, c.env.POLAR_WEBHOOK_SECRET ?? "");
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      Sentry.captureException(err);
      return c.text("invalid signature", 401);
    }
    throw err;
  }

  if (event.type === "order.paid") {
    const order = event.data;
    const reportHash = typeof order.metadata?.report_hash === "string" ? order.metadata.report_hash : null;
    await insertTuneUpOrder(c.env.DB, {
      polarOrderId: order.id,
      reportId: reportHash,
      email: order.customer.email ?? "",
      amountCents: order.totalAmount,
    });

    if (c.env.RESEND_API_KEY && c.env.FOUNDER_EMAIL) {
      const reportUrl = reportHash ? new URL(`/r/${reportHash}`, c.req.url).toString() : "(no report)";
      c.executionCtx.waitUntil(
        sendTuneUpOrderEmail(c.env.RESEND_API_KEY, c.env.FOUNDER_EMAIL, order.customer.email ?? "", reportUrl),
      );
    }
    const reportRow = reportHash ? await getReport(c.env.DB, reportHash) : null;
    c.executionCtx.waitUntil(
      captureServerEvent(c.env.PUBLIC_POSTHOG_KEY, "tune_up_paid", order.customer.email ?? order.id, {
        report_hash: reportHash,
        tool_count: reportRow?.tool_count ?? null,
        is_published: reportRow ? reportRow.is_published === 1 : null,
      }),
    );
    return c.json({ ok: true });
  }

  // ponytail: other event types are ack'd and logged, not acted on — no
  // downstream feature depends on them yet.
  console.log(`polar webhook: ${event.type}`);
  return c.json({ ok: true });
});
