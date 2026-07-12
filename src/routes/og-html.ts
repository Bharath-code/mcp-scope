// Pure HTML builder for the OG card (TASK-028), split from og.ts so it can be
// unit-tested without pulling in workers-og's wasm loader.
import type { Headline } from "../types";

const BG = "#0A0B0D";
const TEXT = "#E7EAF0";
const TEXT_SECONDARY = "#8A919E";
const ACCENT = "#22D3EE";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string,
  );
}

function card(inner: string): string {
  return `<div style="display:flex;flex-direction:column;justify-content:space-between;width:1200px;height:630px;background:${BG};padding:64px;font-family:sans-serif;">${inner}</div>`;
}

function wordmark(): string {
  return `<div style="display:flex;color:${TEXT_SECONDARY};font-size:32px;">MCP Audit</div>`;
}

export type OgReport = {
  status: string;
  server_name: string | null;
  server_url: string;
  headline_json: string | null;
};

export function ogHtml(report: OgReport | null): string {
  if (!report) {
    return card(`<div style="display:flex;color:${TEXT};font-size:40px;">Report not found</div>`);
  }
  if (report.status !== "complete" || !report.headline_json) {
    return card(`
      ${wordmark()}
      <div style="display:flex;color:${TEXT};font-size:48px;font-weight:600;">Audit in progress…</div>
      <div style="display:flex;color:${TEXT_SECONDARY};font-size:28px;">${escapeHtml(report.server_name ?? report.server_url)}</div>
    `);
  }
  const headline = JSON.parse(report.headline_json) as Headline;
  return card(`
    ${wordmark()}
    <div style="display:flex;color:${ACCENT};font-size:64px;font-weight:700;">${headline.effectiveTools}/${headline.totalTools} tools effective</div>
    <div style="display:flex;color:${TEXT};font-size:36px;">${headline.defTokens} tokens of context tax</div>
    <div style="display:flex;color:${TEXT_SECONDARY};font-size:28px;">${escapeHtml(report.server_name ?? "")}</div>
  `);
}
