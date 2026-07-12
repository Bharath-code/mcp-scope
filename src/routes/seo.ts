import { Hono } from "hono";
import type { Bindings } from "../index";
import { getPublishedReports } from "../lib/db";

export const seo = new Hono<{ Bindings: Bindings }>();

// TASK-038: /r/:hash permalinks are reachable but intentionally excluded from
// the sitemap — only the landing page, /method, and published slugs are indexed.
export function buildSitemap(origin: string, slugs: string[]): string {
  const urls = [`${origin}/`, `${origin}/method`, ...slugs.map((s) => `${origin}/report/${s}`)];
  const entries = urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

seo.get("/sitemap.xml", async (c) => {
  const reports = await getPublishedReports(c.env.DB, 1000);
  const origin = new URL(c.req.url).origin;
  return c.text(buildSitemap(origin, reports.map((r) => r.slug)), 200, { "Content-Type": "application/xml" });
});

seo.get("/robots.txt", (c) => {
  const origin = new URL(c.req.url).origin;
  return c.text(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
});
