import { Hono } from "hono";
import * as Sentry from "@sentry/cloudflare";
import { insertReport } from "./lib/db";
import { sentryOptions } from "./lib/sentry";
import { AuditPipeline as AuditPipelineClass } from "./pipeline/audit-pipeline";
import { audit } from "./routes/audit";
import { reportApi, buildReportResponse, isUnlocked } from "./routes/report-api";
import { getReport } from "./lib/db";
import { ReportPage } from "./pages/Report";
import { HomePage } from "./pages/Home";

export type Bindings = {
  DB: D1Database;
  AUDIT_PIPELINE: DurableObjectNamespace<AuditPipelineClass>;
  PUBLIC_POSTHOG_KEY: string;
  FOUNDER_EMAIL: string;
  SENTRY_DSN?: string;
  STAGE_DELAY_MS?: string;
  ALARM_TIMEOUT_MS?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.html(HomePage()));

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
app.route("/", reportApi);

// Dev-only: throw to confirm Sentry receives scrubbed events. ponytail: gated on STAGE_DELAY_MS.
app.get("/dev/boom", (c) => {
  if (!c.env.STAGE_DELAY_MS) return c.text("disabled", 404);
  throw new Error("Test error from /dev/boom");
});

app.get("/r/:hash", async (c) => {
  const id = c.req.param("hash");
  const report = await getReport(c.env.DB, id);
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
  const unlocked = isUnlocked(c.req.header("cookie"), id);
  const resp = await buildReportResponse(c.env.DB, report, unlocked);
  return c.html(ReportPage({ resp, hash: id }));
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
