# MCP Audit — GTM, Marketing, Pricing & Revenue Report

> Generated 2026-07-05. Grounded in docs/VISION.md. Perspectives: CFO (numbers),
> CMO (channels/message), GTM (motion/sequencing).

---

## 1. ICP (Ideal Customer Profile)

### Primary ICP — "The accountable maintainer"

- **Who:** Platform/DevRel engineer at a B2B SaaS company (50–2,000 employees) that shipped an official MCP server in the last 6 months
- **Trigger:** Leadership just asked "is anyone using our MCP server?" and they have no answer. Or a user complained "Claude never picks your tool."
- **Pain:** Zero instrumentation; debugging by vibes in Claude Desktop; static checkers say "schema valid ✓" and stop
- **Budget authority:** Can expense $149 without approval; needs a lead's nod for a subscription — which is why the one-time tune-up is the right first offer
- **Where they live:** Anthropic Discord #mcp, r/mcp, X dev circles, GitHub (findable by name as committers on the servers audited at launch)

### Secondary ICPs

1. **Indie server authors** chasing Smithery/Glama ranking — want a public score to point at. Low willingness to pay, high willingness to share. They're distribution, not revenue.
2. **Server evaluators** — devs vetting third-party MCP servers before adopting. They're the SEO traffic ("is the Notion MCP server good?").

### Anti-ICP (don't chase yet)

Enterprises wanting SSO/SOC2/private evals, and agencies wanting white-label. Real demand later, wrong for a solo founder in a 90-day window.

**One line:** *You sell to the person whose name is on the commit when the MCP server disappoints.*

---

## 2. GTM Motion & Marketing Strategy

The motion is **product-led with a content wedge**: the free audit *is* the marketing, the permalink *is* the viral loop, the famous-server reports *are* the SEO moat. No sales, no paid ads — correct for a $149 ACV.

### Channel priority (master one before adding the next)

| # | Channel | Why | Effort |
|---|---------|-----|--------|
| 1 | **SEO famous-server corpus** | 20 pre-published audits of Notion/Stripe/Linear/Sentry servers rank for "[name] MCP server" — evergreen intent traffic | Front-loaded, then passive |
| 2 | **One big launch post (X + HN)** | "I audited the 20 most-used MCP servers. Here's how much context they waste." Numbers-first, matches brand voice | 48h live-in-comments sprint |
| 3 | **Community sniping** | Answer every "why doesn't Claude use my tool" thread in Discord #mcp / r/mcp with *that person's actual report* | ~30 min/day, ongoing |
| 4 | **Audit-then-DM outbound** | Run the audit on a maintainer's server first, DM with findings. The report is the cold email — it's about them, not you | 5–10 DMs/day |
| 5 | **Registry partnership (Smithery/Glama)** | Pitch an "MCP Audit score" badge on listings. One deal = permanent distribution | Month 2–3, after proof |

### Message architecture

- **Hook (emotional):** "4 of your 14 tools were never selected. Dead weight."
- **Value (rational):** effective-tools/total-tools + context tax in tokens → real dollars per conversation
- **Proof (social):** permalink + OG image with the headline score — the shareable artifact does the selling
- **CTA ladder:** free audit → email for full transcripts → $149 tune-up → (later) $49/mo CI check

### CMO watch-outs

- **The launch is one day; the corpus is the business.** Budget energy 20% launch, 80% repeatable loops (SEO + community sniping + DMs).
- **Content distribution > content creation.** Every famous-server report needs a tweet thread of its own — 20 reports = 20 launch-adjacent posts, not one.
- **Careful with public shaming.** Auditing Stripe's server and publishing "60% dead weight" gets attention but can burn the exact DevRel people you want as customers. Frame as "here's the fix," not "here's the failure" — the honest-instrument voice protects you here.
- **A monthly "State of MCP Tool Quality" post** (aggregate stats from the audit corpus) is the recurring linkable asset and feeds the gateway thesis narrative.

---

## 3. Pricing Strategy

### Current structure — mostly right, three adjustments

| Offer | Price | Verdict |
|-------|-------|---------|
| Audit | Free (3/day/IP) | ✅ Correct — acquisition engine, COGS $0.03–0.08 |
| Full transcripts | Email | ✅ Correct — email is the price, kill-gate metric |
| Concierge tune-up | $149 one-time | ⚠️ Likely underpriced — test $199–249 |
| CI check | $29–49/mo | ⚠️ Anchor at $49, don't start at $29 |

**Adjustments:**

1. **Test the tune-up at $199.** The buyer is expensing it; $149 vs $199 doesn't change conversion on a company card, and it's a 34% revenue lift per unit. Willingness-to-pay research at this scale = change the price for a week. Keep $149 only if buyers actually balk. Add a "team" tune-up at $499 (multi-server / >20 tools) as an anchor — some Notion-tier teams will take it.

2. **CI check: $49/mo per server, annual at $490 (2 months free).** $29 is indie pricing for a buyer who is a company. The value metric — *per server, per release* — scales with value: more servers, more releases, more gating. Don't price per seat (nobody shares a CI check) and don't price per eval run (punishes the behavior you want).

3. **Bundle the ladder:** tune-up buyers get 50% off first 3 months of CI check. Every $149 sale becomes a subscription lead — which is the actual business (front door to the gateway product).

### Value-based justification (use in copy)

Context tax is quantifiable: a bloated server wasting 3,000 tokens/conversation × thousands of conversations/month is real API spend. When the report says "this costs your users ~$X/month in wasted context," $49/mo prices against a measured number, not a vibe. That's the pricing moat — no one else can measure it.

---

## 4. Revenue Projections

### Unit economics

- COGS per fresh report: ~$0.05 (Haiku); cached repeats ≈ $0. Infra $100–200/mo.
- Tune-up: $149 revenue, ~$5 eval cost + 1–2 hrs founder time → ~96% gross margin, but **founder time is the real constraint** (~15–20 tune-ups/mo max solo).
- CI subscription: near-100% gross margin; breakeven on all infra at **3–4 subscribers**. This business is profitable almost immediately — the risk is demand, never cost.

### Funnel assumptions (from the 90-day targets)

Audit → email: 20% | Email → tune-up: 5% | Email → CI sub (once live): 8–10% over time

### Three scenarios, 12 months

| | Conservative | Base | Optimistic |
|---|---|---|---|
| Launch outcome | Post flops, SEO only | Post does okay (~300 upvotes / decent X reach) | Post front-pages, registry deal lands |
| Audit runs M1–3 | 600 total | 1,500 total | 4,000+ |
| Tune-ups M1–3 | 2 (~$300) | 8 (~$1,200) | 25 (~$3,700+) |
| CI subs at M6 | 5 → ~$250 MRR | 15–20 → ~$750–1,000 MRR | 50 → ~$2,500 MRR |
| CI subs at M12 | 15 → ~$750 MRR | 50–60 → ~$2,500–3,000 MRR | 150 → ~$7,500 MRR |
| **Year-1 total revenue** | **~$8–10k** | **~$25–35k** | **~$80–100k** |

*Base case includes ~4 tune-ups/mo ongoing (~$600/mo) on top of MRR.*

### ⚠️ CFO flag: the vision doc's M6 target is optimistic-case, not base-case

$2–5k MRR at month 6 requires **50–125 subscribers at ~$39**. From a base-case funnel of ~200–300 email captures by then, that implies 25–50% capture→subscriber conversion — unrealistic (8–10% is good). $2–5k MRR is the **month 9–12 base case** or **month 6 optimistic case**. This doesn't change any decision — the kill gate (30 captures + 1 tune-up by day 14) is the right test and stays as-is — but set expectations so a $1k-MRR month 6 reads as "on track," not "failing."

**Strategic framing:** Year 1 is not the money — it's (a) ramen-profitable proof, (b) the audit corpus + "effective tools" vocabulary, (c) a warm list of every MCP-shipping team. Those are the assets the gateway/observability product (the real thesis, $10k+ MRR potential) launches into.

---

## 5. 90-Day Execution Sequence

- **Days 1–7:** Ship. Pre-publish 20 famous-server audits with OG images.
- **Days 8–10:** Launch post (X + HN), 48h in comments, free audits on demand.
- **Days 8–14:** Kill gate watch in PostHog: audit → capture → tune-up click. **30 captures + 0 tune-ups → pivot paid offer to CI pre-orders at $29/mo founding price.**
- **Weeks 3–8:** Repeatable loops — daily community sniping, 5–10 audit-then-DMs/day, one report-thread/week. Deliver tune-ups fast; ask each buyer "would you gate releases on this?" — that's the CI-check discovery.
- **Weeks 9–12:** CI check beta to tune-up buyers + email list at founding pricing; pitch Smithery/Glama on the score badge.

---

## Bottom line

ICP is the accountable maintainer at a SaaS company with a neglected official MCP server. Motion is PLG with the free audit as the marketing engine — SEO corpus first, one launch spike, then community + outbound loops. Price the tune-up at $199 (test it), the CI check at $49/mo per server, and treat the vision's $2–5k MRR as a month 9–12 base case. Near-zero COGS means the only real risks are distribution and founder time — exactly what the day-14 kill gate tests.
