import { Hono } from "hono";
import { ImageResponse } from "workers-og";
import type { Bindings } from "../index";
import { getReport } from "../lib/db";
import { ogHtml } from "./og-html";

export const og = new Hono<{ Bindings: Bindings }>();

og.get("/og/:hash{[0-9a-f]+}.png", async (c) => {
  const hash = c.req.param("hash");
  const report = await getReport(c.env.DB, hash);
  const html = ogHtml(report);
  return new ImageResponse(html, {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=86400" },
  });
});
