# Vision — MCP Audit

> Captured by the Product Planner skill. This file is the source of truth for
> generating product-vision.md, prd.md, and product-roadmap.md. Edit it directly
> and re-run the Product Planner to regenerate downstream documents.

**Created:** 2026-07-05
**Updated:** 2026-07-05

## Founder

- **Name:** Bharath
- **Expertise:** Software engineer with 6 years of experience, currently building AI-integrated products
- **Background:** Software engineer with 6 years of experience, now building AI-integrated products. Months ago I identified MCP gateway/observability as my standout thesis — this auditor is the front door to that exact business, and my existing dev audience via git-scope is precisely the people shipping MCP servers.

## Purpose

- **Who you help:** Maintainers of already-shipped MCP servers — platform/DevRel engineers at SaaS companies with official servers (Notion, Stripe, Linear tier and below), plus indie server authors listed on registries like Smithery and Glama. Findable by name as committers on the servers audited at launch.
- **Problem you solve:** Teams shipping MCP servers have zero visibility into whether the model can actually use them. Tools go unselected, names collide, and definitions silently consume thousands of context tokens — the only current diagnostic is poking around in Claude Desktop by vibes. Static checkers say "schema valid ✓"; nobody measures behavior.
- **Desired transformation:** From debugging by vibes with zero instrumentation → one honest number (effective tools / total tools, plus context tax in tokens) and a PR-ready fix. Maintainers know exactly which tools Claude never picks and why, per release.
- **Why you:** Prior MCP gateway/observability thesis identified months before this product — the auditor is its natural front door. Existing dev audience via git-scope is exactly the developers shipping MCP servers. The eval harness — the only technically non-obvious piece — is already fully spec'd.

## Product

- **Name:** MCP Audit
- **One-liner:** Paste an MCP server URL, get a permalink report showing which of your tools Claude actually selects — and how many tokens of context tax you're charging every conversation.
- **How it works:** A maintainer pastes an MCP server URL or npm package name into a single field — no login, no card. Checks stream in live: connecting → tools/list → static pass → selection eval running query by query. The report lands at a permanent `/r/{hash}` URL with an OG image carrying the headline score, ready to share. Email capture unlocks the full per-tool eval transcripts; a $149 tune-up buy button offers the PR-ready fix.
- **Key capabilities:**
  - Behavioral tool-selection eval (Haiku-powered, never executes tools) producing effective-tools/total-tools
  - Context-tax measurement — tokens the tool definitions consume in every conversation
  - Static checks: schema validity, empty descriptions, near-duplicate tool names
  - Shareable permalink report with OG image and live streaming progress
  - $149 concierge tune-up upsell — rewritten tool descriptions as a PR-ready diff
- **Platform:** web
- **Market differentiation:** Behavioral, not static — no other tool can say "4 of your 14 tools were never selected across 25 realistic tasks." mcp-scan owns security, static checkers say "schema valid ✓" and stop. The selection eval with a public permalink is unoccupied ground, held by owning the famous-server report corpus (SEO) and making effective-tools/total-tools the shared vocabulary.
- **Magic moment:** The second the report shows a maintainer which of their tools are invisible to Claude — "4 of your 14 tools were never selected. Dead weight." Nobody forgets that moment, and the permalink makes it shareable.

## Audience

- **Primary user:** The platform/DevRel engineer at a SaaS company that shipped an official MCP server in the last 6 months and is now being asked "is anyone using it?" — no instrumentation, no answer, debugging tool-selection complaints by vibes in Claude Desktop.
- **Secondary users:**
  - Indie MCP server authors chasing Smithery/Glama registry ranking who want a score to point at
  - Engineering leads who approve the $149 tune-up purchase
  - Developers evaluating third-party MCP servers before adopting them
- **Current alternatives:** Manual poking in Claude Desktop, Anthropic's tool-writing docs, ad-hoc "review my tool descriptions" LLM prompts, mcp-scan (security only), and mostly shipping and hoping. The real enemy is "it seems to work" — no one reviews MCP quality and no release gate exists.
- **Frustrations:** Zero instrumentation — debugging by vibes; context bloat is invisible until a bill or latency spikes; static checkers validate schemas and say nothing about whether the model can actually use the tools.

## Business

- **Revenue model:** one-time
- **90-day goal:** Kill gate passed (30 email captures + ≥1 paid tune-up by day 14), then: 500+ audit runs, 100+ email captures, 5+ paid tune-ups ($745+), and the famous-server reports ranking on Google for "[name] MCP server" searches.
- **6-month vision:** The CI check is live as a subscription ($29–49/mo), 10+ teams gate releases on it, and the audit corpus plus the effective-tools score vocabulary is feeding the MCP gateway/observability product — the thesis this was always the front door to. Roughly $2–5k MRR.
- **Constraints:** Full-time sprint for the 7-day build window, then sustained part-time. Budget ~$100–200/mo covering Workers, D1, Haiku eval spend (~$0.03–0.08/fresh report, 3 free runs/day/IP), and domains. Hard kill gate at day 14: 30 captures + 0 tune-ups = pivot the paid offer to CI-check pre-orders; 0 captures = stop.
- **Go-to-market:** Publish audits of the 20 most popular public MCP servers (Notion, Stripe, Linear, Sentry…) as SEO pages, then one X/HN post — "I audited the 20 most-used MCP servers. Here's how much context they waste." Live in the comments for 48 hours offering free audits. Then audit-then-DM the named maintainers, and answer every "why doesn't Claude use my tool" thread in the Anthropic Discord #mcp, r/mcp, and Smithery/Glama circles with that person's actual report.

## Brand Voice

- **Personality:** The honest instrument — precise, blunt, trustworthy. A measuring device, not a marketer. It reports what it measured, discloses its method's limits, and never inflates a finding.
- **Tone of voice:** Plain, specific, numbers-first; no vanity scores, no hedging, no hype. Example finding: "4 of 14 tools were never selected. Dead weight." Example error: "Couldn't reach your server — check that the URL supports streamable HTTP or SSE." Example method footer: "Selection at temperature 0 with generated queries is a proxy, not ground truth — here's the method."

> Visual identity (mood, anti-patterns, design tokens) is deliberately not
> captured here — it lives in docs/design.md, generated by the Design System
> skill from image references.

## Tech Stack

- **App type:** web
- **Frontend:** Server-rendered JSX via Hono — the report page is the UI; no separate framework needed, keeps the whole app one Worker
- **Backend:** Hono on Cloudflare Workers with a Durable Object pipeline — a plain Worker would time out mid-eval; the DO runs the pipeline and writes progressive results, which is simultaneously the correct architecture and the entire "watch checks stream in" UX
- **Database:** Cloudflare D1 — three tables (reports, tool_results, eval_calls); tools/list JSON hash as cache key protects unit economics from SEO traffic
- **Auth:** None — no-login by design; optional bearer-token field for auditing private servers
- **Payments:** Polar — $149 tune-up checkout from day 1, fulfilled concierge-style; the buy button is the willingness-to-pay test
- **Analytics:** PostHog — funnel from audit run → email capture → tune-up click is the whole kill-gate instrumentation; free tier covers launch volume
- **Email:** Resend — email capture unlocks full eval transcripts; transactional delivery of report links
- **Error tracking:** Sentry — evals against arbitrary user-supplied MCP servers will fail in creative ways; catch them before users report

## Tooling

- **Coding agent:** Claude Code
