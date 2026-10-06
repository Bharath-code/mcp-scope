import { Hono } from "hono";
import type { Bindings } from "../index";
import { getReport, getReportBySlug } from "../lib/db";
import type { Headline, ReportRow } from "../types";

export const badge = new Hono<{ Bindings: Bindings }>();

export function generateBadgeSvg(label: string, value: string, rightColor: string): string {
  // Approximate character widths for Verdana 11px
  const leftWidth = Math.round(label.length * 6.8 + 14);
  const rightWidth = Math.round(value.length * 7.2 + 16);
  const totalWidth = leftWidth + rightWidth;

  const leftTextX = leftWidth / 2;
  const rightTextX = leftWidth + rightWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#1E293B"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${rightColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${leftTextX}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${leftTextX}" y="14">${label}</text>
    <text x="${rightTextX}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${rightTextX}" y="14">${value}</text>
  </g>
</svg>`;
}

export function buildScoreBadge(report: ReportRow | null): string {
  if (!report) {
    return generateBadgeSvg("mcp audit", "not found", "#64748B");
  }

  if (report.status !== "complete" || !report.headline_json) {
    return generateBadgeSvg("mcp audit", "auditing...", "#0284C7");
  }

  const headline = JSON.parse(report.headline_json) as Headline;
  const ratio = headline.totalTools > 0 ? headline.effectiveTools / headline.totalTools : 0;
  const text = `${headline.effectiveTools}/${headline.totalTools} effective`;

  let color = "#059669"; // emerald
  if (ratio < 0.5) color = "#E11D48"; // rose
  else if (ratio < 0.75) color = "#D97706"; // amber

  return generateBadgeSvg("mcp audit", text, color);
}

badge.get("/badge/:id.svg", async (c) => {
  const id = c.req.param("id") ?? "";
  let report = await getReportBySlug(c.env.DB, id);
  if (!report) report = await getReport(c.env.DB, id);

  if (report?.canonical_id) {
    const canonical = await getReport(c.env.DB, report.canonical_id);
    if (canonical) report = canonical;
  }

  const svg = buildScoreBadge(report);
  return c.body(svg, 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});
