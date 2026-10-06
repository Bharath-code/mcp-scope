# Viral Launch Thread (X / Twitter)

## Thread Overview
- **Goal:** Drive 1,000+ views, establish authority in MCP ergonomics, generate stranger-initiated audit runs.
- **Timing:** 9:00 AM EST (Tuesday or Wednesday).

---

### Tweet 1 (Hook):
I audited 20 of the most popular public Model Context Protocol (MCP) servers.

The findings were brutal:
- 38% of tools were NEVER selected across realistic tasks (dead weight).
- The average server taxes 5,200 tokens *before* the user types a word.
- Major tool collisions break routing 70% of the time.

Here is what we learned 🧵👇

---

### Tweet 2 (Context Tax):
1/ Every MCP server charges a "Context Tax".

When you connect a server with 15 tools to Claude Desktop or Cursor, their raw JSON schemas are injected into every turn.

That’s 4,000 to 8,000 tokens per message. On a 10-turn conversation, that's 50,000+ tokens eaten by tool schemas alone.

Latency spikes. API costs 2x.

---

### Tweet 3 (Tool Collisions):
2/ "Tool Confusion" is real.

When tools have overlapping descriptions:
- `search_docs` vs `query_knowledge`
- `fetch_issue` vs `get_ticket`

The model guesses or picks randomly. In our evaluations, overlapping tools suffered a 70% collision rate. Users think the AI is broken; in reality, the prompt boundary is vague.

---

### Tweet 4 (The Static Linter Trap):
3/ Static linters give maintainers false confidence.

Your server returns `valid JSON Schema ✓`.
Great, but schema validity tells you zero about whether Claude actually reaches for your tool when a human asks a question.

You can have a 100% schema-compliant tool that is 100% invisible to Claude.

---

### Tweet 5 (How MCP Audit Works):
4/ We built an honest instrument to measure this: MCP Audit.

Paste your server URL (Streamable HTTP or SSE):
1. Pulls tool definitions (NEVER executes tools)
2. Measures exact Context Tax in tokens
3. Generates anti-leakage user queries
4. Runs a selection eval to test if Claude picks each tool

Takes under 60 seconds.

---

### Tweet 6 (How to Fix Bloated MCP Tools):
5/ How to fix an underperforming MCP server:
- Cut parameter documentation down to essential types
- Remove generic words like "helper function to..."
- Differentiate tool verbs clearly (e.g. `lookup_by_id` vs `search_fulltext`)
- Cull dead tools that users never invoke

---

### Tweet 7 (CTA & Link):
6/ We made the tool free to test your own MCP server:
👉 https://mcpaudit.dev

No login. No credit card. Just paste your server endpoint and get your permalink report with full context tax and collision analysis.

Drop your server link below and I'll audit it for you!
