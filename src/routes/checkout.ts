import { Hono } from "hono";
import { Polar } from "@polar-sh/sdk";
import type { Bindings } from "../index";
import { getReport } from "../lib/db";

export const checkout = new Hono<{ Bindings: Bindings }>();

checkout.post("/api/checkout", async (c) => {
  if (!c.env.POLAR_ACCESS_TOKEN || !c.env.POLAR_TUNE_UP_PRODUCT_ID) {
    return c.json({ error: "Checkout isn't configured yet." }, 503);
  }

  const body = (await c.req.json<{ hash?: string }>().catch(() => ({}))) as { hash?: string };
  const hash = (body.hash ?? "").trim();
  const report = await getReport(c.env.DB, hash);
  if (!report) return c.json({ error: "Report not found" }, 404);

  const polar = new Polar({
    accessToken: c.env.POLAR_ACCESS_TOKEN,
    server: c.env.POLAR_SERVER ?? "sandbox",
  });

  const result = await polar.checkouts.create({
    products: [c.env.POLAR_TUNE_UP_PRODUCT_ID],
    successUrl: new URL(`/r/${hash}?paid=1`, c.req.url).toString(),
    metadata: { report_hash: hash },
  });

  return c.json({ url: result.url });
});
