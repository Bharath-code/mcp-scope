# Product Idea — MCP Server Auditor

_Generated: 2026-07-05 (from a standalone Idea Validator run)_

## One-liner
Paste an MCP server URL, get a permalink report showing which of your tools Claude actually selects, which are dead weight, and how many tokens of context tax your server charges every conversation.

## Problem
Teams shipping MCP servers have zero visibility into whether the model can actually use them. Tools go unselected, names collide, and definitions silently consume thousands of context tokens — and the only current diagnostic is poking around in Claude Desktop by vibes. Static checkers say "schema valid ✓"; nobody measures behavior.

## Target user
Maintainers of already-shipped MCP servers: platform/DevRel engineers at SaaS companies with official servers (Notion, Stripe, Linear tier and below), plus indie server authors listed on registries like Smithery and Glama. Findable by name — they're the committers on the servers to be audited at launch.

## Solution
A no-login microtool: input an MCP server URL or npm package, watch checks stream in live (connect → tools/list → static pass → selection eval), get a permanent report at `/r/{hash}`. The wedge is behavioral: a Haiku-powered tool-selection eval that produces one honest headline — **effective tools / total tools**, plus context tax in tokens. Full eval-harness spec lives in `idea.md`.

## Monetization
- **Day-1 paid test:** $149 "MCP tune-up" — rewritten tool descriptions delivered as a PR-ready diff. Fulfilled concierge-style (manually, LLM-assisted) from the first report; the buy button ships with the MVP because it *is* the willingness-to-pay test.
- **Later:** subscription CI check that fails a release when the score drops — the natural on-ramp to the existing MCP gateway/observability thesis.

## Smallest testable version
7-day build on Workers (Hono, Durable Object pipeline, D1, Haiku eval, Polar checkout): static checks, selection eval, streaming report page with OG image, email capture for full transcripts. Then publish audits of the 20 most popular public MCP servers as SEO pages and one X/HN post. No dashboard, no accounts, no re-run alerts, no multi-model eval, no security scanning.

## Kill gate (14 days from launch)
Split signals — they are not interchangeable:
- **Interest:** 30 email captures.
- **Core assumption:** ≥1 paid tune-up.
- 30 captures + 0 tune-ups = flaw confirmed, pivot the paid offer to CI-check pre-orders (recurring, not self-servable). 0 captures = stop; don't add features to fix distribution.

## Risky assumptions
1. The selection eval's numbers survive adversarial public scrutiny — self-generated queries at temp 0 are a proxy, and the launch strategy names real companies. (Mitigation: hand-verify 20+ selections per famous server before publishing.)
2. Maintainers will pay $149 for the fix rather than self-serving with an LLM once the free report shows them exactly what's broken. (Test: the day-1 concierge buy button + direct DMs asking the question.)
3. The window stays open long enough — Anthropic or a registry could ship equivalent linting/eval; the 7-day ship date is the mitigation.

## Candidates considered
Not applicable — direct validation run. (Prior context in `idea.md`: website agent-readiness checkers and repo agent-readiness scores were explicitly rejected as saturated before this candidate was chosen.)
