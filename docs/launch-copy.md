# Launch Copy — MCP Audit

> Drafts for the HN post, X thread, and leaderboard page. Numbers in [brackets]
> are placeholders — fill from real audit results before publishing. Voice:
> the honest instrument. No hype, no hedging, numbers first.

## HN Post

**Title options (pick by real headline stat):**

1. Show HN: I audited the 20 most-used MCP servers. [N]% of their tools are dead weight
2. Show HN: MCP Audit – see which of your MCP server's tools Claude never selects
3. I measured how many context tokens the top 20 MCP servers charge every conversation

**Body:**

Every SaaS company shipped an MCP server this year. Almost none of them can
answer a basic question: when a user asks a realistic question, does the model
pick the right tool?

Security scanners exist (and a 2026 audit put their false-positive rate near
78%). Schema validators say "valid ✓" and stop. Inspectors let you poke at
tools by hand. Nobody measures behavior.

So I built a selection eval and ran it against the 20 most-used public MCP
servers — Notion, Stripe, Linear, Sentry, and 16 more. Per tool: 3 generated
queries with leakage controls, plus distractors, one Haiku call per query at
temperature 0, tool_choice auto. Selection only — no tool is ever executed.

Results across [N] tools:

- [X]% were never selected across any realistic query — dead weight that still
  costs context tokens on every conversation
- [Y] name collisions where one tool steals the majority of queries meant for
  another
- Median context tax: [Z] tokens per conversation before the user types a word

Every report is public at a permalink with full method disclosure — selection
at temp 0 with generated queries is a proxy, not ground truth, and the footer
says so. Every selection is logged; you can check my work.

Run it on your own server (paste a URL, no login, free): [link]
The 20 reports, ranked: [leaderboard link]

I'll be in the comments for the next 48 hours — happy to run a free audit on
any server you drop here.

## X Thread

**1/** I audited the 20 most-used MCP servers (Notion, Stripe, Linear…).

[X]% of their tools were never selected by Claude across realistic tasks.
Dead weight — that still costs tokens on every conversation.

Full reports, ranked: [link]

**2/** The method: 3 generated queries per tool (leakage-filtered) + distractors,
one Haiku call each, temp 0, selection only. No tool is ever executed.

Effective tools / total tools. One honest number.

**3/** Worst finding so far: [server] — [n] of [m] tools never selected, and
`[tool_a]` steals [k] of 3 queries meant for `[tool_b]`. Users get wrong
answers and blame the product.

**4/** The invisible one: context tax. [Server]'s tool definitions consume
[Z] tokens of every single conversation before the user says a word.
Nobody counts this until the bill or the latency complaint lands.

**5/** It's a proxy, not ground truth — temp-0 selection on generated queries.
The method and every logged selection are public. Check my work.

**6/** Run it on your own server. Paste a URL, no login, ~2 minutes, free:
[link]

Reply with your server URL and I'll run it for you.

## Leaderboard Page

**URL:** `/leaderboard`

**Title tag:** The MCP Server Leaderboard — effective tools, measured

**H1:** How the 20 most-used MCP servers actually score

**Intro:**

We ran a behavioral selection eval against the 20 most-used public MCP
servers. The score is effective tools / total tools: how many of a server's
tools Claude actually selected across realistic, leakage-controlled queries.
Also measured: context tax — the tokens a server's tool definitions consume
in every conversation. Selection only; no tool was executed. Method →

**Table columns:** Rank · Server · Effective tools / total · Context tax
(tokens) · Collisions · Report →

**Row example:** 3 · Linear · 11/13 · 4,210 · 1 · View report

**Footer CTA:** Your server isn't on this list — but you can score it in two
minutes. Paste your URL: [field]. No login. Free.

**Method footer (every page):** Selection at temperature 0 with generated
queries is a proxy, not ground truth. Every selection is logged and
inspectable. Method →

## README Badge (Could Have → ship if time allows)

SVG badge: `MCP Audit: 12/14 effective` — links to the permalink report.
The indie-author viral loop: a good score is a registry credential, a bad
score is a to-do list. Copy-paste snippet lives on every report page.
