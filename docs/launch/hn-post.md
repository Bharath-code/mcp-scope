# Show HN: MCP Audit — Which of your tools does Claude actually pick?

## Title Candidates
1. **Show HN: MCP Audit — Which of your tools does Claude actually pick?** *(Recommended — highest curiosity)*
2. **Show HN: I audited 20 popular MCP servers to measure context tax and tool collisions**
3. **Show HN: MCP Audit — A behavioral selection eval and token tax meter for MCP**

---

## Submission URL
`https://mcpaudit.dev` (or fallback: `https://mcp-audit.kumarbharath63.workers.dev`)

---

## Post Body

Hey HN,

Every company shipping developer tools in 2026 is building a Model Context Protocol (MCP) server. But when we connect an MCP server to Claude Desktop or Cursor, how do we know if Claude actually uses our tools?

Today, the tooling landscape is mostly:
1. Static schema linters that check if JSON Schema is valid (necessary, but boring).
2. Security scanners that check for prompt injection or command execution risks (e.g. mcp-scan).

Nobody was checking **behavioral ergonomics**:
- **Context Tax:** Injecting 15 tool definitions can silently add 4,000–8,000 tokens to *every single turn* of the conversation before the user types anything.
- **Cognitive Collisions:** When tools have overlapping or vague descriptions (e.g., `query_knowledge` vs `search_docs`), models pick the wrong tool or guess randomly.
- **Dead Tools:** Tools that never get selected across realistic workflows.

We built **MCP Audit** (https://mcpaudit.dev): paste any publicly accessible MCP server URL (supporting Streamable HTTP or SSE). We connect, list tools, count the context tax in tokens, and run a fast selection eval against Claude 3.5 Haiku to see what actually gets picked.

### How it works (and why it's safe):
- **Never executes tools:** The client calls `initialize` and `tools/list` only. `tools/call` is strictly never invoked.
- **Anti-leakage query generation:** We batch-generate 3 realistic user queries per tool plus 5 distractor queries. We strip tool name tokens to prevent the eval from devolving into trivial substring matching.
- **Selection evaluation:** Queries are evaluated against Claude with `tool_choice: "auto"` at `temperature: 0`. We log which tool (if any) is selected.
- **One honest number:** `{effectiveTools}/{totalTools} tools effective · {defTokens} tokens of context tax`.

### Stack:
One Cloudflare Worker + Durable Objects (for long-running async stage execution and watchdog auto-refunds) + D1 SQLite. Server-rendered JSX (`hono/jsx`), no frontend build step, instant TTFB.

### Pre-published audits:
We pre-audited several reference implementations and public servers. You can browse them directly on the homepage or test your own server with no signup or credit card.

Full methodology details: https://mcpaudit.dev/method

Feedback, edge cases, and critiques welcome!

---

## Pre-Written Comment Responses to Common Objections

### Objection 1: "Isn't temperature 0 on synthetic queries just a proxy, not ground truth?"
> "100% correct. We state this explicitly on the report and in `/method`: selection at temperature 0 on generated queries is an approximation, not production telemetry. But it's an actionable proxy: if your tool isn't selected at temperature 0 even when given a query specifically designed for its declared purpose, it's virtually guaranteed to fail in noisy user conversations. It catches dead tools and name collisions before your users do."

### Objection 2: "Can't I just ask Claude to review my tool descriptions for free?"
> "You can, and we encourage it! But prompt reviews without an adversarial selection eval suffer from confirmation bias—Claude will often tell you 'These descriptions look great!' while still failing to select them when placed alongside 14 other competing tools. Having a standardized benchmark and reproducible transcripts is what proves whether an edit actually worked."
