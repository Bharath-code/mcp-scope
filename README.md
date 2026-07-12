# MCP Audit

Which of your tools does Claude actually use? A behavioral audit for MCP servers:
connect, list tools, and measure — with a Haiku selection eval — how often Claude
picks each tool, plus the context-tax token cost of your definitions.

One Cloudflare Worker + a Durable Object pipeline + D1. Server-rendered, no framework.

## Stack

- **Hono** on **Cloudflare Workers** (server-rendered `hono/jsx`)
- **Durable Object** (`AuditPipeline`) runs the multi-stage pipeline and writes progressive results
- **D1** for reports, tool results, eval transcripts, captures, orders, rate limits
- **Anthropic Haiku** for query generation + selection eval + token counting
- **Polar** (payments), **Resend** (email), **PostHog** (analytics), **Sentry** (errors)

## Local development

```bash
npm install
# apply schema to the local D1
npx wrangler d1 execute mcp-audit --local --file schema.sql
# run — STAGE_DELAY_MS enables the fast stub pipeline + /dev helper routes
npx wrangler dev --var STAGE_DELAY_MS:400
```

Copy `.dev.vars.example` to `.dev.vars` and fill in keys for features that need them.

Run tests and typecheck:

```bash
npm test          # vitest: ssrf, sentry scrubbing (+ similarity/scoring/anti-leakage later)
npm run typecheck # tsc --noEmit, strict
```

## Secrets

Non-secret vars live in `wrangler.toml [vars]` (`PUBLIC_POSTHOG_KEY`, `FOUNDER_EMAIL`).
Set the rest with `wrangler secret put NAME`:

| Secret | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Haiku eval + query generation + token counting |
| `POLAR_ACCESS_TOKEN` | checkout session creation |
| `POLAR_WEBHOOK_SECRET` | webhook signature verification |
| `POLAR_TUNE_UP_PRODUCT_ID` | the $149 tune-up product id |
| `RESEND_API_KEY` | transcript + notification email |
| `SENTRY_DSN` | error tracking |

`STAGE_DELAY_MS` / `ALARM_TIMEOUT_MS` are **dev-only** (passed via `--var`). They also
gate the `/dev/*` helper routes, so they must never be set in production.

## Deploy

Requires a logged-in Cloudflare account (`wrangler login`, or `CLOUDFLARE_API_TOKEN`).

```bash
# 1. Create the D1 database, paste the returned database_id into wrangler.toml
npx wrangler d1 create mcp-audit
# 2. Apply the schema to remote D1
npx wrangler d1 execute mcp-audit --remote --file schema.sql
# 3. Set secrets (see table above)
npx wrangler secret put ANTHROPIC_API_KEY
# ... repeat for each secret
# 4. Deploy
npx wrangler deploy
```

Attach the custom domain (`mcpaudit.dev`; `.com` redirects) via the Cloudflare
dashboard or a `[[routes]]` block in `wrangler.toml`.

## Architecture

`POST /audit` validates + rate-limits (3 fresh runs/day/IP), creates a `reports` row,
and kicks the `AuditPipeline` DO, then 302s to `/r/{id}`. The DO walks the stages,
writing status to D1; a 5-minute watchdog alarm fails stalled runs and refunds the
rate-limit charge. `/r/{id}` server-renders the current state; a tiny inline script
polls `/api/report/{id}` every 1.5s and reloads on completion.

**Never executes tools.** The MCP client calls `initialize` + `tools/list` only.

## Ops

Founder's morning check — saved queries in `scripts/ops.sql` (fresh runs/day, eval
cost/day, captures/day, tune-up orders, top IPs by volume):

```bash
npx wrangler d1 execute mcp-audit --remote --file scripts/ops.sql
```

Other operational scripts: `scripts/verify-report.ts` (hand-verify a report's eval
calls before publishing), `scripts/publish-famous.ts` (run + verify + publish a
candidate server), `scripts/kill-gate.ts` (day-14 launch readout).
