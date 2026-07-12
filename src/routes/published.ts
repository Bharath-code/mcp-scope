import { Hono } from "hono";
import type { Bindings } from "../index";
import { getReportBySlug } from "../lib/db";
import { buildReportResponse, isUnlocked } from "./report-api";
import { ReportPage } from "../pages/Report";

export const published = new Hono<{ Bindings: Bindings }>();

// FR-013: SEO-indexable permalink for a hand-curated, published report.
published.get("/report/:slug", async (c) => {
  const slug = c.req.param("slug");
  const report = await getReportBySlug(c.env.DB, slug);
  if (!report || report.is_published !== 1) return c.notFound();

  const unlocked = isUnlocked(c.req.header("cookie"), report.id);
  const resp = await buildReportResponse(c.env.DB, report, unlocked);
  return c.html(
    ReportPage({
      resp,
      hash: report.id,
      posthogKey: c.env.PUBLIC_POSTHOG_KEY,
      published: { slug, auditedAt: report.completed_at ?? report.created_at },
    }),
  );
});
