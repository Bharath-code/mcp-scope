import { Hono } from "hono";
import * as Sentry from "@sentry/cloudflare";
import { insertReport, getPublishedReports } from "./lib/db";
import { sentryOptions } from "./lib/sentry";
import { AuditPipeline as AuditPipelineClass } from "./pipeline/audit-pipeline";
import { audit } from "./routes/audit";
import { og } from "./routes/og";
import { capture } from "./routes/capture";
import { checkout } from "./routes/checkout";
import { webhooks } from "./routes/webhooks";
import { published } from "./routes/published";
import { seo } from "./routes/seo";
import { reportApi, buildReportResponse, isUnlocked } from "./routes/report-api";
import { getReport } from "./lib/db";
import { ReportPage } from "./pages/Report";
import { HomePage } from "./pages/Home";
import { MethodPage } from "./pages/Method";
import { MoatPage } from "./pages/Moat";
import { badge } from "./routes/badge";

export type Bindings = {
  DB: D1Database;
  AUDIT_PIPELINE: DurableObjectNamespace<AuditPipelineClass>;
  PUBLIC_POSTHOG_KEY: string;
  FOUNDER_EMAIL: string;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY?: string;
  POLAR_ACCESS_TOKEN?: string;
  POLAR_WEBHOOK_SECRET?: string;
  POLAR_TUNE_UP_PRODUCT_ID?: string;
  POLAR_SERVER?: "sandbox" | "production";
  SENTRY_DSN?: string;
  STAGE_DELAY_MS?: string;
  ALARM_TIMEOUT_MS?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => c.html(HomePage(c.env.PUBLIC_POSTHOG_KEY, await getPublishedReports(c.env.DB))));
app.get("/method", (c) => c.html(MethodPage(c.env.PUBLIC_POSTHOG_KEY)));
app.get("/moat", (c) => c.html(MoatPage));

// Dev-only helper to kick the pipeline directly. Active only when STAGE_DELAY_MS
// is set (local dev). ponytail: throwaway harness, not wired in prod.
app.post("/dev/kick", async (c) => {
  if (!c.env.STAGE_DELAY_MS) return c.text("disabled", 404);
  const id = crypto.randomUUID();
  const clientIp = c.req.query("ip");
  const chargeDay = c.req.query("day");
  await insertReport(c.env.DB, id, "https://example.test/mcp");
  const stub = c.env.AUDIT_PIPELINE.get(c.env.AUDIT_PIPELINE.idFromName(id));
  await stub.fetch("https://do/run", {
    method: "POST",
    body: JSON.stringify({ reportId: id, serverUrl: "https://example.test/mcp", clientIp, chargeDay }),
  });
  return c.json({ id });
});

app.route("/", audit);
app.route("/", og);
app.route("/", badge);
app.route("/", capture);
app.route("/", checkout);
app.route("/", webhooks);
app.route("/", published);
app.route("/", seo);
app.route("/", reportApi);

// Dev-only: throw to confirm Sentry receives scrubbed events. ponytail: gated on STAGE_DELAY_MS.
app.get("/dev/boom", (c) => {
  if (!c.env.STAGE_DELAY_MS) return c.text("disabled", 404);
  throw new Error("Test error from /dev/boom");
});

app.get("/r/:hash", async (c) => {
  const id = c.req.param("hash");
  let report = await getReport(c.env.DB, id);
  if (!report) {
    return c.html(
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Not found — MCP Audit</title>
        </head>
        <body>
          <main>
            <h1>No report at this address.</h1>
            <p>
              <a href="/">Run an audit →</a>
            </p>
          </main>
        </body>
      </html>,
      404,
    );
  }
  if (report.canonical_id) {
    const canonical = await getReport(c.env.DB, report.canonical_id);
    if (canonical) report = canonical;
  }
  const unlocked = isUnlocked(c.req.header("cookie"), id) || (report.id !== id && isUnlocked(c.req.header("cookie"), report.id));
  const resp = await buildReportResponse(c.env.DB, report, unlocked);
  return c.html(ReportPage({ resp, hash: id, posthogKey: c.env.PUBLIC_POSTHOG_KEY }));
});

// Wrap the DO and Worker with Sentry; beforeSend/beforeBreadcrumb scrub tokens + emails.
export const AuditPipeline = Sentry.instrumentDurableObjectWithSentry(
  (env: Bindings) => sentryOptions(env.SENTRY_DSN),
  AuditPipelineClass,
);

export default Sentry.withSentry(
  (env: Bindings) => sentryOptions(env.SENTRY_DSN),
  app,
) satisfies ExportedHandler<Bindings>;
