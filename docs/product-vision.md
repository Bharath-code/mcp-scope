# Product Vision — MCP Audit

## 1. Vision & Mission

### Vision Statement

Every MCP server ships with a known, measured quality score — "effective tools / total tools" is as standard a release check as a passing test suite.

### Mission Statement

MCP Audit gives maintainers behavioral proof of which tools Claude actually selects — one honest number at a permanent URL, from a single pasted server address, in under two minutes.

### Founder's Why

Bharath has spent six years as a software engineer and now builds AI-integrated products. Months before this product existed, he identified MCP gateway/observability as his standout thesis: as every SaaS company ships an MCP server, none of them can see whether it works. MCP Audit is not a new idea competing with that thesis — it is its front door. The microtool earns trust and a corpus of audit data; the CI check and gateway grow out of it naturally.

The founder-market fit is unusually direct. His existing developer audience via git-scope is precisely the population shipping MCP servers. He has watched teams debug tool-selection failures by vibes in Claude Desktop, with no instrumentation, no release gate, and no vocabulary for the problem. The eval harness — the only technically non-obvious piece of this product — was fully spec'd before planning began.

The honest framing, which the brand inherits: this is a wedge product with a dated kill gate, not a passion project that will be defended past its evidence. Ship in 7 days, measure for 14, and let the market answer.

### Core Values

**One honest number, honestly derived.** The headline is effective-tools/total-tools plus context tax — never a vanity score, never a letter grade designed to flatter. The report footer discloses the method's limits plainly: selection at temperature 0 with generated queries is a proxy, not ground truth. Honesty about the method is what lets the numbers survive adversarial HN readers, and adversarial readers are the distribution strategy.

**Never execute, only observe.** The eval measures tool *selection* — one `tool_use` block per call, stopped immediately. No side effects on anyone's server, ever. This is both a safety promise to the people being audited without their consent and the thing that keeps a fresh report under $0.08.

**The report is the product, the marketing, and the sales call.** Every design decision routes through the permalink: OG image with the score baked in, never gated, streaming checks as live theater. If a feature doesn't make the report more shareable or more convincing, it waits.

**Ship the buy button before the confidence.** The $149 tune-up ships day 1 with fully manual fulfillment, because willingness to pay is the core assumption — not traffic, not captures. Testing it late is the same as not testing it.

**Verify before you name names.** Publishing scores for Notion-tier servers is the growth loop, and one loud, correct rebuttal kills it. Hand-check 20+ selection results per famous server before anything with a company's name on it goes live. Speed everywhere else; care here.

### Strategic Pillars

**Behavioral beats static, always.** When scoping any check or feature, prefer the one that measures what the model *does* over what the schema *says*. Static checks exist to stream instantly while the eval runs — they are the opening act, never the headline.

**Unit economics are a product feature.** The tools/list hash cache, the 3 free runs/day/IP cap, and Haiku-only eval are not cost-cutting compromises — they are what makes a free, no-login, SEO-traffic-exposed tool survivable. Any new feature must state its per-run cost.

**The kill gate is law.** 14 days after launch: 30 email captures tests interest; ≥1 paid tune-up tests the business. 30-and-0 means pivot the paid offer to CI-check pre-orders. Zero captures means stop. No feature work to "fix" distribution.

**Everything feeds the gateway thesis.** When two options are equal, choose the one that produces reusable audit data, score vocabulary, or maintainer relationships — the assets the eventual MCP observability product needs.

### Success Looks Like

Twelve months out: the audit has run on thousands of servers, the 20 launch reports rank on Google for "[company] MCP server" searches, and "effective tools" appears unprompted in other people's readmes and registry listings. The $149 tune-up converted enough to prove the report sells work rather than teaching self-serve — 40+ fulfilled, most now via a largely automated diff pipeline Bharath reviews rather than writes. The CI check is a live subscription at $29–49/mo with 10+ teams gating releases on their score, generating $2–5k MRR, and its requirements are drawn directly from real audit-corpus failures. A registry conversation (Smithery or Glama) about embedding scores is underway. Bharath is no longer explaining what MCP Audit is to the MCP community; he's the person whose number they already use.

## 2. User Research

### Primary Persona

**Priya, 31, Platform/DevRel Engineer at a 300-person B2B SaaS company.** Her company shipped an official MCP server five months ago because the CEO saw competitors announce theirs. She wrote most of it in a two-week sprint, adapting the REST API surface into 14 tools. Now leadership asks "is anyone using it?" and customers file issues like "Claude keeps calling the wrong tool" — and she has literally no instrument to answer either question. Her current debugging loop is: open Claude Desktop, type prompts that should trigger a tool, squint at what happens, adjust a description, repeat. She is highly technical (ships TypeScript daily, comfortable with LLM APIs) but has no eval infrastructure and no budget line for one. Emotionally, the server is a low-grade anxiety: it has her name on the commits, it's public, and she suspects half of it doesn't work — she just can't prove which half. She would switch to anything that gives her evidence in minutes without a procurement conversation; a free, no-login report she can paste into a Slack thread to answer her boss is almost suspiciously exactly what she needs.

### Secondary Personas

**Dev, indie MCP server author on Smithery.** Maintains two servers evenings and weekends, watches registry ranking the way people watch GitHub stars. A public score is a badge opportunity when it's good and a to-do list when it's bad. He will run the audit on his own servers and his competitors' — and he's the most likely HN commenter, in both the good and the pedantic sense.

**Marcus, engineering lead and budget holder.** Doesn't run audits himself; approves Priya's $149 tune-up request. He needs the report to look credible enough to forward — the permalink and the plain-numbers presentation are for him. His objection is never price; it's "can't you just fix it yourself?"

**Aisha, developer evaluating third-party MCP servers.** Choosing between three community servers for her company's agent stack. Reads published reports the way people read npm download counts. She never pays, but her searches are what make the SEO pages compound.

### Jobs To Be Done

**Functional:** Find out which of my tools the model never selects, and why (collision vs. bad description vs. dead weight). Measure how many context tokens my server charges every conversation before the user types a word. Get a per-release check so regressions in tool selection get caught before customers do. Produce evidence — a link — that answers "is our MCP server any good?"

**Emotional:** Stop feeling like the server is an unexamined liability with my name on it. Replace "I think it works" with "I know 11 of 14 work, and I know what's wrong with the other 3." Feel like a rigorous engineer again in a corner of the stack that currently runs on vibes.

**Social:** Be the person on the team who brought the instrument, not the person whose server got a bad public score. For indie authors: display a good score as a registry credential. For DevRel: forward a credible report upward instead of a hand-wavy status update.

### Pain Points

1. **"Claude doesn't call my tool" with zero diagnostic path.** Severity: high, frequency: per-release and per-customer-complaint. Current remedy: manual poking in Claude Desktop. Consequence: shipped features that are effectively invisible, discovered only through customer complaints. This is the pain the product exists for.
2. **Tool name/description collisions.** Severity: high when present, silent until then. Two tools like `search_docs` and `query_knowledge` steal each other's queries; users get wrong results and blame the product. No existing tool detects this.
3. **Invisible context tax.** Severity: medium, but spikes to high when a bill or latency complaint lands. 14 tool definitions can consume 6,800 tokens of every conversation. Nobody counts this until it costs money.
4. **No release gate for MCP quality.** Severity: medium and structural. Schema-valid is the only check that exists, so regressions ship freely. This pain is latent — most maintainers haven't consciously registered it — which is exactly why the published famous-server reports have to manufacture visibility.
5. **Leadership asks "is anyone using it?" and there's no answer.** Severity: medium, recurring quarterly. Honest answer requires observability the team doesn't have; the audit answers the adjacent question ("*can* anyone use it?") immediately.

Honesty check: pains 1–2 are painkillers for the narrow segment actively debugging failures. Pains 3–5 are vitamins for everyone else until a published report naming their server converts latent pain into acute pain. The GTM is pain manufacturing, and it depends on the eval's credibility.

### Current Alternatives & Competitive Landscape

**Manual poking in Claude Desktop.** What everyone actually does. Does well: zero setup, tests the real thing. Falls short: unrepeatable, no coverage, no numbers, no artifact to share. Switching cost to MCP Audit: paste a URL. This is the true competitor.

**Anthropic's tool-writing docs.** Do well: authoritative guidance on writing tool descriptions. Fall short: guidance without measurement — you can follow every rule and still have collisions. Also a looming platform risk: Anthropic could ship the measurement too.

**Ad-hoc "review my tool descriptions" LLM prompts.** Do well: free, instant, decent suggestions. Fall short: no behavioral signal, no consistency, no artifact. Important nuance: this alternative gets *stronger* once MCP Audit's free report reveals what's broken — it's the self-serve escape hatch that threatens the $149 tune-up.

**mcp-scan / mcpserver-audit / Cisco mcp-scanner.** Do well: own MCP security scanning (mcpserver-audit is a Cloud Security Alliance project). Fall short (for this job): say nothing about selection behavior or context cost — and a 2026 independent audit measured a ~78% false-positive rate across the open-source scanners, a credibility gap the launch narrative exploits ("security scanners cry wolf; nobody measures whether your tools work"). Not competitors — lane markers. MCP Audit deliberately does not do security.

**MCP Inspector (official, 10k+ stars).** Does well: the de facto debugging surface — zero-install, lists tools, invokes them manually. Falls short: interactive by design; no evals, no score, no artifact. It's the manual-poking alternative with a nicer UI.

**MCPJam Inspector.** The closest real threat. Does well: open-source testing/eval platform with an LLM playground — model-in-the-loop testing exists today. Falls short: a dev tool you install, configure, and interpret yourself; no headline score, no permalink, no zero-friction URL-paste. Strategic risk: nothing technically stops MCPJam from shipping a hosted "paste URL, get score" mode — the defense is speed to owning the report corpus and the score vocabulary, not the harness.

**Arcade Evals / DIY harnesses (Braintrust-style).** Do well: conceptually the same selection eval — realistic scenarios, scored tool choice, no execution. Neon's in-house version drove tool-selection success from 60% to 100%, proof the pain and payoff are real. Fall short: frameworks you write and maintain code for; weeks of setup that only well-resourced teams attempt. MCP Audit is the same measurement as a verdict you receive, not a tool you operate.

**Do nothing / "it seems to work."** The real enemy. No one reviews MCP quality; no release gate exists; complacency is free. Displacing it requires either an active failure (customer complaint) or manufactured visibility (a published report with your company's name on it).

### Key Assumptions to Validate

1. **We assume maintainers will pay $149 for the PR-ready fix rather than self-serving with an LLM** because the diff saves them an afternoon and carries authority. To validate: the day-1 buy button, plus DMing 10 maintainers a preview of their own report and asking directly. This is the core assumption — everything else can succeed and the business still fails here.
2. **We assume the eval numbers survive adversarial public scrutiny** because the method is disclosed and the anti-leakage rules are sound. To validate: hand-check 20+ selections per server on 3 famous servers pre-launch; >10% questionable means fix the query generator before publishing anything named.
3. **We assume published famous-server reports generate organic traffic and self-audits** because naming companies creates search demand and defensive curiosity. To validate: 20+ stranger-initiated audit runs within 48 hours of the HN/X post.
4. **We assume 3 generated queries per tool is enough signal to be credible** because temp-0 selection is deterministic given the toolset. To validate: variance check on re-runs of the same server; hand-verification pass.
5. **We assume maintainers are findable and reachable by name** because they're committers on public repos. To validate: 5 replies and 2 calls from 20 audit-then-DM outreaches.
6. **We assume the window stays open ~6 months** before Anthropic or a registry ships equivalent eval. To validate: nothing to test — mitigate with the 7-day ship and by accumulating the report corpus that a late platform entrant won't have.
7. **We assume $0.03–0.08 per fresh report holds at real-world tool counts** because the math was done on a 14-tool server. To validate: cost instrumentation from day 1; the 3/day/IP cap bounds the damage if wrong.

### User Journey Map

**Awareness:** Priya sees the HN post "I audited the 20 most-used MCP servers" — or worse, a colleague forwards the report on *her company's* server. Emotion: curiosity with a defensive edge. Friction: skepticism about method ("selection by generated queries? hm").

**Consideration:** She reads a famous-server report. The method footer's plain disclosure of limits defuses her skepticism more than any claim could. She sees the field: paste a URL, no login. Friction: nearly none — that's the design.

**First use:** She pastes her server's URL. Checks stream in live — connecting, 14 tools found, static pass, eval 23/47. The theater matters: she watches receipts appear instead of a spinner. Emotion: the specific tension of watching your own test results come in.

**Magic moment:** "4 of your 14 tools were never selected. `search_docs` loses 2 of 3 queries to `query_knowledge`. 6,800 tokens of context tax." She screenshots it. She now knows something about her own server she could not have learned any other way in under two minutes. Emotion: the holy-shit moment the product is named for.

**Habit formation:** She captures her email to unlock the per-tool transcripts, pastes the permalink into Slack to answer her boss, and re-runs after her next release (the hash changes, the report refreshes). Friction to watch: v1 has no re-run alert — the habit depends on her remembering, which is a deliberate scope cut.

**Advocacy:** She either buys the $149 tune-up (the diff lands as a PR she can merge same-day) or fixes it herself from the transcripts — and either way, the next time someone in the MCP Discord asks "why doesn't Claude use my tool," she links the audit. The permalink is the advocacy vehicle; no referral machinery needed.

## 3. Product Strategy

### Product Principles

**No login, no card, no friction before the magic moment.** The path from landing to holy-shit is: paste URL, watch. Anything inserted into that path — even an email field — is scope creep against the core loop. Email capture comes *after* value, to unlock transcripts.

**Stream receipts, not spinners.** Progressive results are the UX. The Durable Object writing checks to D1 as they land isn't plumbing — it's the show. Every pipeline stage must emit a visible line on the report page.

**Cache like the business depends on it, because it does.** Same tools/list hash = same report, zero LLM spend. SEO traffic hitting famous-server reports must cost nothing marginal.

**Disclose the method's limits in the product itself.** The footer says temp-0 selection with generated queries is a proxy. "One honest number" includes honesty about how the number is made — this is both ethics and HN-preemption.

**Every report is a sales page that never asks twice.** The tune-up buy button is present, priced, and quiet. No popups, no gating, no dark patterns — the honest-instrument brand is worth more than a conversion percentage point.

**Name names only with receipts.** Famous-server reports get hand-verification before publication. The growth loop runs on credibility with an adversarial audience; protect it over speed.

### Market Differentiation

The category is crowded with things that look adjacent and are not. Static checkers (schema validation, linting) say "valid ✓" and stop — they measure the artifact, not the behavior. mcp-scan owns security scanning. Anthropic publishes writing guidance. Inspectors (official and MCPJam) let you *operate* a test session by hand. Nobody delivers a *verdict*: what the model actually does when handed your toolset — which tool it reaches for, which tools it never touches, which pairs collide — as one number at a shareable URL.

The category move: don't compete as "another MCP testing tool." MCP Audit is the **MCP quality score** — the Lighthouse/SSL-Labs of MCP servers. That framing makes inspectors complementary (the debugger you open *after* your audit fails) rather than competitive, and makes the score the axis every registry listing and readme eventually needs.

That behavioral gap matters to the target user because it's the only question they actually have: "does Claude use my server correctly?" Schema validity doesn't answer it; security posture doesn't answer it; documentation can't answer it. Only running selections can.

Defensibility is honestly thin — this is a fast-follow-able product — and the strategy accounts for that. The moat is not the harness (a competent team rebuilds it in a week); it's the published corpus of famous-server reports accumulating SEO and citations, plus "effective tools / total tools" becoming the vocabulary the community reasons with. Metrics that become vocabulary are sticky: whoever defines the number owns the category conversation. The 7-day ship exists because the window is real but not permanent — Anthropic or a registry could absorb this, and speed plus corpus ownership is the only available defense.

### Magic Moment Design

The magic moment: a maintainer sees which of their tools are invisible to Claude — "4 of your 14 tools were never selected. Dead weight."

For this moment to happen reliably, four things must be true. First, ingestion has to succeed on real-world servers — streamable HTTP and SSE transports, npm package resolution, and a graceful path (clear error + bearer-token field) when it can't connect, because a failed connect is the moment lost entirely. Second, the eval must complete in a tolerable wait — static results stream in under a second so the user is watching *something* while the ~47 Haiku calls run; the Durable Object pipeline plus progressive rendering is this requirement wearing an architecture hat. Third, the findings must be legible at a glance: headline number first, dead tools and collisions as named, specific lines — "`query_knowledge` steals 2 of 3 queries meant for `search_docs`" — not tables the user has to interpret. Fourth, the numbers must be *believable*, which the anti-leakage query rules and the method footer carry.

Shortest path from arrival to magic moment: one paste, one click, ~90 seconds of streaming. No sign-up exists to shorten. The moment is fully achievable in the MVP — it *is* the MVP; everything else in scope exists to deliver, share, or monetize it.

### MVP Definition

**Ingest + static pass.** Connect to a pasted URL or npm package, pull tools/list, hash it (the cache key), and stream instant results: context token count, schema validity, empty/one-line descriptions, near-duplicate names. Essential because it's the perceived speed and the cache is the unit economics. Done: a real server URL produces streaming static results in under 2 seconds.

**Selection eval harness.** Per tool: 3 generated queries (anti-leakage filtered) plus 5 global distractors; one Haiku call per query, full toolset, `tool_choice: auto`, temp 0; record selections; score triggerAccuracy, collisions, dead tools, false positives. Essential: this is the magic moment's engine. Done: a 14-tool server produces a scored report for under $0.10, and hand-checking 20 selections on 3 famous servers finds <10% questionable.

**Streaming permalink report.** Report created instantly at `/r/{hash}`, opens immediately, renders checks as the Durable Object writes them to D1; permanent, never gated; OG image with the headline score. Essential: the report is the product and the distribution. Done: a shared link unfurls with the score visible and loads the full report.

**Email capture → full transcripts.** Email unlocks per-tool eval transcripts (every query + what was selected), delivered via Resend. Essential: the interest half of the kill gate. Done: capture works, transcript email lands, count is queryable.

**$149 tune-up buy button (Polar).** Present on every report from day 1; fulfillment fully manual/concierge. Essential: the willingness-to-pay half of the kill gate — the whole reason to launch with payments. Done: a stranger can pay and Bharath gets notified to fulfill.

**20 published famous-server reports + rate limiting.** Pre-run audits of the most popular public MCP servers as SEO pages; 3 free runs/day/IP. Essential: the distribution loop and the cost cap. Done: 20 reports live at stable URLs, hand-verified, indexed.

### Explicitly Out of Scope

**Multi-model eval (GPT/Gemini selection).** Tempting because "does it work on other models" is the obvious follow-up question. Deferred: triples eval cost, and Claude-only is credible for the MCP audience. Reconsider as a paid feature once tune-ups convert (60–90 days).

**Accounts, dashboards, history.** Tempting because every SaaS reflex says users need them. Deferred: the permalink *is* the history, and accounts add auth surface to a no-login product. Reconsider only when the CI-check subscription exists (6 months).

**Re-run alerts / monitoring.** Tempting because it's the retention feature. Deferred: retention machinery before acquisition is proven is backwards — the validation explicitly cut it. Reconsider immediately after the kill gate passes.

**Security scanning.** Tempting because "audit" implies it. Permanently out: mcp-scan owns it, and competing dilutes the behavioral positioning. Link to mcp-scan instead.

**Tool execution.** Never. Core safety promise and cost guarantee.

**Auth beyond an optional bearer-token field.** OAuth-gated servers are real but rare in the target set. Reconsider when a paying customer asks (any time).

**CI-check subscription.** The 6-month vision, not the MVP — unless the kill gate returns 30-and-0, in which case it becomes the pivot: sell pre-orders, don't build.

### Feature Priority (MoSCoW)

**Must Have:** URL/npm ingest · tools/list hashing + cache · static pass (tokens, schema, descriptions, name similarity) · query generation with anti-leakage filter · Haiku selection eval · scoring (triggerAccuracy, collisions, dead tools, false positives, context tax) · streaming `/r/{hash}` report · OG image · email capture → transcripts · Polar $149 checkout · 3/day/IP rate limit · method-disclosure footer · 20 published reports.

**Should Have:** Bearer-token field for private servers · Sentry + PostHog instrumentation · robots-friendly SEO pages (titles, sitemaps) · copy-report-link and share affordances.

**Could Have:** Score badge (SVG) for readmes · "compare two servers" view · CSV/JSON export of eval calls.

**Won't Have (this time):** Multi-model eval · accounts/dashboards/history · re-run alerts · security scanning · tool execution · OAuth flows · CI-check subscription (pre-orders only if pivoting).

### Core User Flows

**Flow 1 — Run an audit (the core loop).** Trigger: maintainer lands with a server URL in hand. Steps: paste URL/npm name → optional bearer token → submit → redirected instantly to `/r/{hash}` → watch: connecting → N tools found → static checks ✓ → eval progress n/m → headline renders. Outcome: complete report at a permanent URL. Success criteria: <2s to first streamed result; <2min to headline on a 14-tool server; zero logins asked.

**Flow 2 — Capture → transcript → tune-up (the funnel).** Trigger: report shows failures worth understanding. Steps: enter email → transcripts unlocked/emailed → maintainer reads which queries went wrong → clicks "$149 MCP tune-up" → Polar checkout → Bharath fulfills concierge diff within 48h. Outcome: paid conversion or a self-server who still carries the permalink. Success criteria: capture rate ≥10% of completed audits; ≥1 paid tune-up by day 14.

**Flow 3 — SEO report → self-audit (the loop).** Trigger: Google search for "[company] MCP server" or the HN post. Steps: read famous-server report → notice the paste field ("run this on yours") → Flow 1. Outcome: stranger-initiated audits. Success criteria: 20+ stranger audits in the first 48 hours post-launch.

### Success Metrics

**Primary metric: paid tune-ups.** The one number that matters, because it tests the core assumption (report converts to paid work rather than teaching self-serve). Good: 1 by day 14 (kill gate passes). Great: 5+ by day 90.

**Secondary:** email captures (good: 30 by day 14; great: 100 by day 90) · completed audit runs (good: 100 by day 14; great: 500 by day 90) · SEO: famous-server reports ranking page-1 for "[name] MCP server" (good: 5 of 20 by day 90; great: 15 of 20).

**Leading indicators:** stranger-initiated audits in the post's first 48h (target 20+) · capture rate per completed audit (target ≥10%) · report-link shares observed in Discord/X threads · replies to the 20 maintainer DMs (target 5 replies, 2 calls) · cost per fresh report staying under $0.10.

The instrumentation for all of this is one PostHog funnel (run → complete → capture → checkout) plus the D1 tables themselves.

### Risks

1. **Eval validity fails under public scrutiny.** Likelihood: medium. Impact: fatal to the growth loop — one correct named-company rebuttal poisons the corpus. Mitigation: anti-leakage rules, hand-verification of 20+ selections per famous server pre-publication, method disclosure in the footer.
2. **The report teaches self-serve and nobody pays.** Likelihood: medium-high (it's the validated #1 flaw). Impact: business model, not product. Mitigation: day-1 buy button as the test, direct DM validation, and the pre-decided pivot: CI-check pre-orders (recurring, not self-servable).
3. **Platform absorption — Anthropic, a registry, or MCPJam ships equivalent eval.** Likelihood: medium over 6 months (MCPJam already has model-in-the-loop testing; a hosted paste-URL mode is one feature away). Impact: kills the standalone tool, not the corpus or the gateway thesis. Mitigation: 7-day ship; corpus and vocabulary accumulation; treat a registry approach as an exit lane (embed/license the score).
4. **Real-world ingestion is messier than spec'd.** Likelihood: high (arbitrary servers, flaky transports, huge toolsets). Impact: failed connects = lost magic moments. Mitigation: Sentry from day 1, explicit per-stage error copy, bearer-token fallback, cap tool count per eval with a clear "first 30 tools" disclosure.
5. **Eval cost blows past the model.** Likelihood: low-medium (50+-tool servers exist). Impact: unit economics. Mitigation: hash cache, 3/day/IP, per-report cost logging, tool-count cap.
6. **The HN post flops.** Likelihood: medium — launch posts are a lottery. Impact: slower funnel, not a dead one. Mitigation: distribution is three-legged (SEO pages compound regardless; DMs are push, not luck); re-post angles queued (X thread, r/mcp, Discord).
7. **Legal/PR friction from named reports.** Likelihood: low. Impact: distraction, takedown requests. Mitigation: only public servers, factual measured claims, disclosed method, cheerful correction policy — and every complaint is a conversation with exactly the target buyer.
8. **Solo-founder execution stall after the sprint.** Likelihood: medium (full-time sprint → part-time sustain is where microtools die). Impact: momentum. Mitigation: the kill gate makes continued investment conditional and explicit; concierge fulfillment is deliberately allowed to be manual.

### Moat & Endgame

**Honest premise: at launch there is no moat.** The eval harness, the no-login UX, and the $149 tune-up are all replicable in days by MCPJam or anyone motivated. What exists is a moat *plan* — four assets that compound only with speed and consistency, ranked by realism:

1. **Report corpus + SEO (strongest, starts day 1).** Every audit is a permalink page; the 20 famous-server reports ranking for "[name] MCP server" is a distribution channel a copycat starts at zero on. Same moat shape as SSL Labs and Lighthouse: nobody builds a second reference. A 6-month head start here outweighs any feature.
2. **Score vocabulary.** If maintainers and registries say "we're 11/13 effective," MCP Audit owns the unit of measurement. Whoever defines the metric owns the category; a second metric only confuses the market. This is why the README badge punches above its Could-Have slot.
3. **Eval-methodology data flywheel (real but slow).** Every audit logs real selection failures across real servers — data that improves query generation, distractors, and collision detection, and doubles as training data for the gateway product. It can't be bought, only accumulated.
4. **Trust brand.** In a market where the incumbent "audit" tools run a ~78% false-positive rate, the disclosed-method, logged-selections instrument is a position that competitors with incentives to inflate findings can't credibly copy.

**Not moats (don't defend them):** the eval itself, the UX, the price point, the stack.

**Sustainability ladder:**
- **Layer 1 (now):** free audits + $149 tune-ups — validation revenue, not a business; concierge doesn't scale past one founder.
- **Layer 2 (months 2–6):** the CI-check subscription ($29–49/mo) is the actual business. The audit is a diagnosis; the CI gate is a recurring prescription, churn-resistant because ripping out a release gate hurts. ~100 teams ≈ the $2–5k MRR target.
- **Layer 3 (the thesis):** gateway/observability. The corpus is simultaneously a qualified-lead list (which servers are broken, who maintains them) and training data. The auditor was always the front door.

**Sequencing defense vs. MCPJam:** they're an open-source dev tool with community obligations; MCP Audit is a hosted verdict with a corpus. Move corpus + badge + leaderboard fast enough that by the time a hosted mode ships, it would be publishing scores in MCP Audit's vocabulary.

**Exit lanes (ranked by likelihood — all maximized by the same two moves, so strategy is identical whether selling or holding):**

1. **Registry/platform tuck-in (12–24 mo).** Smithery, Glama, or Anthropic wants quality scores natively; the asset bought is the corpus + metric, not the code. Precondition: the leaderboard is *the* reference.
2. **Observability/gateway strategic (24–36 mo).** Only real once Layer 2 shows MRR — buyers pay for recurring revenue and data, not tools.
3. **Cash-flow hold (no exit, fine outcome).** $5–15k MRR on ~$200/mo costs is a >95%-margin solo asset that funds the gateway build.
4. **The kill gate (built-in downside exit).** Day-14 failure still exits with a public corpus, an audience, and eval learnings that feed the gateway thesis — the cheapest failure mode available.

## 4. Brand Strategy

### Positioning Statement

For maintainers of shipped MCP servers who have zero visibility into whether Claude can actually use their tools, MCP Audit is the behavioral audit that shows which tools get selected, which are dead weight, and what the server costs in context tokens. Unlike static checkers and security scanners that validate schemas and permissions, MCP Audit measures what the model actually does — and publishes one honest number at a permanent link.

### Brand Personality

MCP Audit is the honest instrument: a precision measuring device with a calm voice. As a person, it's the staff engineer who runs the benchmark before joining the argument — speaks in numbers, shows the raw data on request, and volunteers the limitations of its own method before anyone asks. It wears no branding hoodie; it looks like a well-made multimeter. It would never round 3.7 up to 4, never add a congratulatory exclamation point, never bury a bad result, and never claim more than it measured. When it's wrong, it says so and corrects the record visibly — because its entire value is that people can cite it without checking.

### Voice & Tone Guide

The voice is constant: plain, specific, numbers-first, zero hype. Tone shifts only in how much warmth accompanies the precision.

| Context | DO | DON'T |
|---|---|---|
| Landing page | "Paste your MCP server URL. See which tools Claude actually selects." | "Unlock the full potential of your MCP server with AI-powered insights!" |
| Running state | "Running eval — 23 of 47 selections complete." | "Hang tight, magic is happening! ✨" |
| Findings | "4 of 14 tools were never selected. Dead weight." | "Some tools may benefit from optimization opportunities." |
| Error states | "Couldn't reach your server — check that the URL supports streamable HTTP or SSE." | "Oops! Something went wrong 😢" |
| Empty/edge states | "This server exposes 0 tools. Nothing to evaluate — here's what tools/list returned." | "No results found. Try again later!" |
| Success / capture | "Transcripts sent. Every query we ran and what Claude picked, per tool." | "You're in! Welcome to the MCP Audit family 🎉" |
| Upsell copy | "$149 MCP tune-up: rewritten tool descriptions, delivered as a PR-ready diff." | "Supercharge your server with our premium optimization package!" |
| Method disclosure | "Selection at temperature 0 with generated queries is a proxy, not ground truth. Method →" | (Hiding the limitation, or burying it in a ToS page.) |

### Messaging Framework

**Tagline:** One honest number for your MCP server.

**Homepage headline:** Which of your tools does Claude actually use? — with the subhead: "Paste an MCP server URL. Get a behavioral audit: effective tools, collisions, and context tax. No login."

**Value propositions:** (1) Behavioral, not static — measures what the model does, not what your schema says. (2) Evidence at a permalink — a report you can paste into Slack, a readme, or a release checklist. (3) Two minutes, no login, free — and an honest method note at the bottom.

**Feature descriptions follow the finding format:** name the number, then the consequence. "Context tax: your 14 tool definitions consume 6,800 tokens of every conversation before the user says a word."

**Objection handlers:** *"Generated queries aren't real usage."* Correct — it's a proxy, disclosed in every footer; it still finds dead tools and collisions no other method surfaces, and transcripts let you judge every query yourself. *"I can fix descriptions myself with an LLM."* Yes — the transcripts are free; the $149 buys a reviewed, PR-ready diff and your afternoon back. *"Why should I trust a score you invented?"* Every selection is logged and inspectable; the method is public; famous-server reports are hand-verified before publication.

### Elevator Pitches

**5-second:** MCP Audit shows you which of your MCP server's tools Claude actually uses — one honest number, free, at a permalink.

**30-second:** Every company is shipping MCP servers, and none of them can see whether the model can actually use them. Tools go unselected, names collide, definitions eat thousands of context tokens — and the only diagnostic is poking around Claude Desktop by vibes. MCP Audit runs a behavioral selection eval against your server and gives you one honest number — effective tools out of total tools, plus context tax — at a permanent link. Free, no login, two minutes.

**2-minute:** In 2026, shipping an MCP server is table stakes for every SaaS company — and quality control for them basically doesn't exist. Schema checkers say "valid ✓," security scanners check permissions, and nobody measures the thing that matters: when a user asks a realistic question, does the model pick the right tool? We audited the 20 most-used MCP servers and the answer is often no — dead tools nobody can trigger, name collisions where the model picks wrong most of the time, thousands of context tokens taxed on every conversation. MCP Audit measures this behaviorally: it connects to your server, generates realistic queries per tool with leakage controls, runs cheap deterministic selection evals, and publishes one honest number at a permalink — with the method's limits disclosed right in the footer. The free report is the top of a funnel: a $149 tune-up delivers rewritten descriptions as a PR-ready diff, and a CI check that fails releases when the score drops is the subscription behind it. I'm Bharath — I've spent six years in software and identified MCP observability as my thesis before this tool existed; the audit is its front door, and my existing audience is exactly the developers shipping these servers. It shipped in 7 days with a 14-day kill gate — ask me in two weeks whether the market said yes.

### Competitive Differentiation Narrative

The MCP tooling landscape validates everything except the thing maintainers actually worry about. mcp-scan checks security posture — with a measured ~78% false-positive rate across open-source scanners, per a 2026 independent audit. Schema validators confirm your JSON parses. Anthropic's docs tell you how tool descriptions *should* read. Inspectors let you poke at tools by hand. All of it is either the artifact or a tool you operate; none of it is a verdict on behavior — and behavior is the product. Everyone else sells a tool you drive; MCP Audit sells an answer you receive. A tool that's schema-valid, secure, and never selected is dead weight that costs context tokens on every single conversation. MCP Audit is the only tool that can say "4 of your 14 tools were never selected across 25 realistic tasks, and `query_knowledge` steals 2 of every 3 queries meant for `search_docs`" — because it's the only one that actually runs the selections. The defensive position isn't the harness; it's the corpus and the vocabulary. Twenty published, hand-verified audits of the most famous MCP servers seed the search results, and "effective tools / total tools" is designed to become the number the community argues with. Whoever defines the metric owns the conversation — and the conversation leads directly to the CI gate and the observability layer this product was always the front door for.

## 5. Visual Design

Visual design tokens (colors, typography, spacing, components, motion) live in `docs/design.md`. If that file does not yet exist, run the Design System skill with image references to generate it before building.
