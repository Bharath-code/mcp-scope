# Validation Report — MCP Server Auditor

_Generated: 2026-07-05_

## Verdict
**Strong**

The wedge is real, the buyer is findable by name, the build is scoped to a week, and the kill gate is already written. The one risk to keep watching: eval validity — every part of the funnel (SEO reports naming real companies, the HN post, the tune-up upsell) sits on numbers produced by a proxy method, and one loud, correct rebuttal from a named company kills the trust the whole loop runs on.

## Scorecard
| Area | Score | Read |
|---|---:|---|
| Pain intensity | 3/5 | Real and documented for maintainers debugging selection failures; latent for the majority until published reports manufacture visibility. |
| Buyer clarity | 4/5 | Named, findable people — the committers on the 20 servers audited at launch. |
| Urgency | 3/5 | No forcing function exists yet; the public reports are an attempt to create one, which is unproven. |
| Differentiation | 4/5 | Behavioral selection eval is unoccupied ground; mcp-scan owns security, static checkers are boring. Thin moat, real window. |
| Speed to validate | 5/5 | 7-day build, self-running distribution loop, explicit dated kill gate. |
| Founder advantage | 4/5 | Direct line to the prior MCP gateway/observability thesis; git-scope audience is exactly these devs; eval harness already spec'd. |

## Core Assumption
Maintainers of shipped MCP servers will pay $149 to fix tool-selection failures once a free behavioral report shows them which of their tools Claude never picks — free usage is nearly guaranteed; paid conversion instead of self-serve is the thing that must be true.

## Fatal Flaws
| Risk | Severity | Why It Matters | Fast Test |
|---|---|---|---|
| Eval validity under public scrutiny: self-generated queries at temperature 0 are a proxy, and launch publishes named reports on Notion/Stripe/Linear-tier servers. | High | The naming-competitors SEO loop is the distribution strategy; it only compounds if the numbers survive adversarial readers, who are exactly the audience being baited. | Hand-check 20+ selection results per server on 3 famous servers before publishing anything named. >10% questionable = fix the query generator first. |
| The report teaches self-serve: the $149 tune-up is rewritten descriptions, but the free report reveals which tools fail and why — any dev can paste that into Claude and fix it in 20 minutes. | High | This is the gap between 30 email captures (likely) and 1 paid tune-up (the real signal); the original gate treated them as interchangeable. | DM 10 maintainers a preview of their own report: "would you pay $149 for the PR-ready diff, or just fix it yourself?" Count honest self-serve answers. |
| Platform absorption: Anthropic (which already publishes tool-writing guidance) or registries like Smithery/Glama could ship equivalent linting/eval. | Medium | The microtool has no moat; the window is speed plus owning the published-report corpus. | The existing 7-day ship / 14-day kill gate already tests this — speed is the test. |

## Problem Reality
- Pain: "Claude doesn't call my tool" / wrong-tool selection — real, searchable complaints in the MCP Discord and GitHub issues. Maintainers debug by vibes in Claude Desktop with zero instrumentation; context bloat is invisible until a bill or latency spikes. Frequency is per-release.
- Early adopter: the platform/DevRel engineer at a SaaS company that shipped an official MCP server in the last 6 months and is being asked "is anyone using it?" — plus indie authors on Smithery/Glama chasing registry ranking. Findable by name as committers on the launch-audit servers.
- Vitamin or painkiller: painkiller for the narrow segment actively debugging selection failures; vitamin for everyone else — until the published reports create the pain by naming underperformers publicly. The distribution strategy is pain manufacturing, and it only works if the eval-validity flaw holds.

## Competition
- Current behavior: manual poking in Claude Desktop, reading Anthropic's tool-writing docs, ad-hoc "review my tool descriptions" prompts, mcp-scan for security. Mostly shipping and hoping.
- Real enemy: "it seems to work" — no one reviews MCP quality, no release gate exists. The displacement target is complacency, plus free LLM self-serve once awareness exists.
- Differentiation needed: the behavioral selection eval with a public permalink — no static checker can say "4 of your 14 tools were never selected." Hold it by owning the famous-server report corpus (SEO) and keeping effective-tools/total-tools un-gameable enough to become the shared vocabulary.

## First 10 Customers
1. Audit-then-DM the 20 famous-server maintainers: publish their reports, then email/DM each committer — "I ran a behavioral audit on your MCP server; 3 tools never got selected. Happy to walk through it." Success = 5 replies, 2 calls. Conversation opener, not a pitch.
2. One post, comment-farming: the "I audited the 20 most-used MCP servers" HN/X post, then live in the comments for 48 hours offering free audits to anyone who drops a server URL. Success = 20+ stranger-initiated audit runs.
3. MCP community spaces: Anthropic Discord #mcp, r/mcp, Smithery/Glama maintainer circles — answer every "why doesn't Claude use my tool" thread with that person's actual report. Success = 3 conversations reaching "would you pay for the fix?"

## MVP
- Build: the 7-day scope as spec'd (static pass + selection eval + streaming permalink report + OG image + 10 published reports), plus the $149 tune-up buy button from day 1 with fully manual concierge fulfillment — the buy button is the willingness-to-pay test.
- Cut: everything already cut (multi-model eval, accounts, dashboards, security scanning, tool execution) plus the re-run alert — retention machinery before acquisition is proven. Email capture unlocking transcripts is enough.
- 2-week test: the kill gate, split — 30 email captures tests interest; ≥1 paid tune-up tests the core assumption. 30 captures + 0 tune-ups is a fail that points at the pivot: sell the CI check (recurring, not self-servable, and the gateway thesis anyway) instead of the productized fix.

## Edits Applied to product-idea.md
- Created `docs/product-idea.md` from this validation run (none existed).
- Target user — set to the narrowed frame: maintainers of already-shipped MCP servers (SaaS platform/DevRel engineers + indie registry authors), confirmed in the direction check.
- Kill gate — split into interest (30 captures) vs. core assumption (1 paid tune-up), with 30-captures-0-tune-ups defined as a fail that pivots to CI-check pre-orders, confirmed in the direction check.
- Risky assumptions — the three fatal flaws from this report.
- `## Candidates considered` marked "Not applicable — direct validation run," preserving the note that agent-readiness checkers were rejected as saturated.

## Next Step
The idea holds up — run the **Product Planner** skill; its intake will pick up `docs/product-idea.md` from here.
