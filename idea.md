I searched before answering because the obvious candidates for this funnel are already dead. Two spaces you'd naturally reach for are saturated: website agent-readiness checkers (Cloudflare launched isitagentready.com, Lighthouse now has an agentic browsing category, plus a dozen indie clones) and repo agent-readiness scores (Factory.ai's Agent Readiness evaluates 60+ criteria, with multiple open-source alternatives already shipped). Don't build either. A "checker" only works when you're early or you own the audience.

Here's the one I'd build: **an MCP server auditor.**

Input: an MCP server URL or npm package name. One field, no login, no card. Output: a report at a permalink.

**Why this and not something else.** You already identified MCP gateway/observability as your standout thesis months ago — this is the microtool-funnel front door to that exact business, not a new idea. Every company shipping an MCP server in 2026 (which is rapidly becoming "every SaaS company") has zero visibility into whether it's any good. And your audience via git-scope is precisely the developers building these.

**The holy-shit moment.** Static checkers say "schema valid ✓". Boring, and mcp-scan-type tools cover security already. Your wedge is *behavioral*: actually connect to the server, pull the tool definitions, then run a cheap LLM eval against realistic queries and show:

- "Your 14 tool definitions consume 6,800 tokens of every conversation before the user says a word"
- "`search_docs` and `query_knowledge` collide — the model picks the wrong one 70% of the time"
- "4 of your tools were never selected across 25 realistic tasks. Dead weight."

Nobody forgets the moment a report tells them which of their tools are invisible to Claude. That's the one honest number: **effective tools / total tools**, plus context cost. No vanity score.

**Mapping to the funnel in the image:**

- *Distribution (introvert-proof):* run the audit yourself on the 20 most popular public MCP servers — Notion, Stripe, Linear, Sentry — and publish each as an SEO page (`/report/notion-mcp`). One X/HN post: "I audited the 20 most-used MCP servers. Here's how much context they waste." The report names competitors, so Notion's team runs it on theirs. That's the loop doing your outreach for you.
- *The tool:* checks stream in live — connecting… pulling tools… running eval 7/25… — real progress you can watch. This is most of your "wow UX" for free.
- *The report:* permalink, never gated, OG image with the score baked in so it looks good when shared.
- *Capture:* email gets you the full breakdown (per-tool eval transcripts) and a re-run alert.
- *Upgrade:* framed as buying work — a "$149 MCP tune-up": rewritten tool descriptions + a PR-ready diff, generated mostly by an LLM pipeline you review. Later, the subscription is a CI check that fails when a release drops the score — which is your gateway/observability product growing out of the microtool naturally.

**Build scope — and this is the part that matters for you specifically.** Hono on Workers, MCP client over SSE/streamable HTTP, D1 or Convex for reports, Haiku for the eval (cache per server version, cap free runs at ~3/day/IP so unit economics stay sane), Polar for the tune-up checkout. Static checks day 1–2, eval harness day 3–4, report page + OG image day 5, publish 10 reports of famous servers day 6–7. Nothing else. No dashboard, no accounts, no settings page.

Gate before you're allowed to build anything more: ship in 7 days, publish the 10 reports, one post. If in 14 days you don't have 30 email captures or 1 paid tune-up, the market told you something and you stop — you don't add features to fix distribution. You know why I'm saying this part explicitly.

Want me to spec the eval harness (the query-generation + tool-selection scoring loop) since that's the only technically non-obvious piece?

Here's the eval harness spec. Everything else in the product is CRUD; this is the piece that creates the holy-shit moment, so getting the design right matters.

## The core idea

You never execute tools. You only measure **selection**: given the server's full tool list and a realistic user query, which tool does the model reach for? One `tool_use` block per call, stopped immediately. That keeps it cheap, safe (no side effects on someone's server), and fast.

## Pipeline

**1. Ingest.** Connect over streamable HTTP/SSE, call `tools/list`. Hash the raw JSON — this hash is your cache key. Same hash = serve cached report, zero LLM spend. This single decision protects your unit economics from the SEO pages getting traffic.

**2. Static pass (no LLM, runs in <1s, streams first).** Token count of the tool definitions as they'd sit in context (tokenize the serialized JSON), schema validity, tools with empty/one-line descriptions, near-duplicate names (cheap string similarity is enough for v1). These results appear on the report page instantly while the eval runs — that's your perceived speed.

**3. Query generation.** One batched Haiku call: for each tool, generate 3 queries a real user would type that *should* route to that tool, plus 5 global distractor queries that should trigger nothing. Two rules that make or break validity:

- Queries must not contain the tool's name or distinctive tokens from it. Otherwise `search_docs` trivially wins on "search the docs" and your eval is theater. Post-filter: reject any generated query sharing a rare token with the target tool name, regenerate.
- Generate from the tool's *schema + description*, but instruct: "write what a user wants to accomplish, not what the tool does."

**4. Selection eval.** For each query: one Haiku call, full toolset attached, `tool_choice: auto`, temperature 0, `max_tokens` tiny. Record which tool (or none) appears in the `tool_use` block. Run with `Promise.all` capped at ~5 concurrent. For a 14-tool server that's ~47 calls of (tool defs + one sentence) input — roughly $0.03–0.08 per fresh report on Haiku. Cap free runs at 3/day/IP and you cannot lose money by accident.

**5. Scoring.**

```ts
type ToolResult = {
  tool: string
  triggerAccuracy: number   // own queries where it was picked / 3
  stolenBy: Record<string, number>  // collision matrix row
  timesSelected: number     // across ALL queries
}

// The honest number:
effectiveTools = tools.filter(t => t.triggerAccuracy >= 0.67).length
headline = `${effectiveTools}/${tools.length} tools effective · ${defTokens} tokens of context tax`
```

Derived findings, in order of shareability: dead tools (selected zero times anywhere), collisions ("`query_knowledge` steals 2 of 3 queries meant for `search_docs`"), false positives (distractors that triggered something — a hallucination-risk signal), context tax.

## Infrastructure shape on Workers

A plain Worker will time out mid-eval, so: report page is created instantly at `/r/{hash}` and opens immediately; a **Durable Object** (or Queue consumer) runs the pipeline and writes progressive results to D1; the report page polls or holds an SSE connection and renders checks as they land. This is simultaneously the correct architecture and the entire "watch real progress" UX from the funnel image — connecting → 14 tools found → static checks ✓ → eval 23/47 → done. No spinner, receipts appearing line by line.

Three D1 tables: `reports (hash, server_url, status, headline_json)`, `tool_results`, `eval_calls` (store every query + selection — the full transcripts are what the email capture unlocks).

## What's explicitly out of v1

Multi-model eval (Claude-only; "GPT/Gemini selection" is a paid feature later, not a launch blocker). Authenticated servers beyond an optional bearer-token field. Security scanning — mcp-scan owns that, don't compete. Executing tools, ever. Accounts, dashboards, history.

One known limitation to disclose in the report footer rather than engineer away: selection at temperature 0 with self-generated queries is a proxy, not ground truth. Say so plainly — "one honest number" includes being honest about the method. It'll buy you trust and preempt the HN pedants.

That's the whole non-obvious surface. Day 3–4 of the seven. Clock starts when you say it does — what's your ship date?

