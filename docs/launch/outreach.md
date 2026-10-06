# Maintainer Outreach & Community Sniping Tracker

> Grounded in `docs/product-vision.md` § First-10-customers plan and `docs/gtm-report.md`.
> **Strategy:** The audit report is the cold outreach. It is about *their code*, backed by receipts. Not a sales pitch—a conversation opener.

---

## 1. The 2-Sentence Conversational Opener

**Subject:** Quick note on your [Server Name] MCP server (tool selection eval)

> *"Hey [Name], I ran a behavioral audit on your [Server Name] MCP server—it looks like [N] of your tools never get selected by Claude due to description collisions, while taxing [X,XXX] tokens per message. Here is the full breakdown and query transcript: https://mcpaudit.dev/report/[slug]. Happy to send over the PR diff to fix the descriptions if helpful!"*

---

## 2. Target 20 Maintainers & Outreach Tracking Table

| # | MCP Server | Maintainer / Team | Contact Channel | Report Slug | Sent Date | Reply? | Call? | Outcome |
|---|------------|-------------------|-----------------|-------------|-----------|--------|-------|---------|
| 1 | **Cloudflare Docs** | Cloudflare DevRel / Workers Team | GitHub / Discord | `cloudflare-docs` | | [ ] | [ ] | |
| 2 | **Stripe MCP** | Developer Experience Committer | GitHub / X | `stripe-mcp` | | [ ] | [ ] | |
| 3 | **Linear MCP** | Linear Integrations Lead | GitHub / X | `linear-mcp` | | [ ] | [ ] | |
| 4 | **Notion MCP** | Notion Platform Engineer | GitHub / X | `notion-mcp` | | [ ] | [ ] | |
| 5 | **Sentry MCP** | Sentry DevRel Lead | GitHub / Discord | `sentry-mcp` | | [ ] | [ ] | |
| 6 | **Neon Postgres** | Neon Serverless Committer | GitHub / Discord | `neon-mcp` | | [ ] | [ ] | |
| 7 | **Supabase MCP** | Supabase Platform Engineer | GitHub / Discord | `supabase-mcp` | | [ ] | [ ] | |
| 8 | **GitHub MCP** | GitHub Ecosystem Committer | GitHub Issues | `github-mcp` | | [ ] | [ ] | |
| 9 | **Brave Search** | Brave API Lead | GitHub / X | `brave-search-mcp` | | [ ] | [ ] | |
| 10 | **Puppeteer MCP** | Automation Integrations Lead | GitHub / Discord | `puppeteer-mcp` | | [ ] | [ ] | |
| 11 | **Resend MCP** | Resend Platform Lead | GitHub / X | `resend-mcp` | | [ ] | [ ] | |
| 12 | **PostHog MCP** | PostHog Integrations Lead | GitHub / Slack | `posthog-mcp` | | [ ] | [ ] | |
| 13 | **Slack MCP** | Community Maintainer | GitHub / X | `slack-mcp` | | [ ] | [ ] | |
| 14 | **Jira MCP** | Atlassian Ecosystem Committer | GitHub Issues | `jira-mcp` | | [ ] | [ ] | |
| 15 | **SQLite MCP** | Database Tools Committer | GitHub / Discord | `sqlite-mcp` | | [ ] | [ ] | |
| 16 | **Airtable MCP** | Workflow Automation Committer | GitHub / X | `airtable-mcp` | | [ ] | [ ] | |
| 17 | **HubSpot MCP** | CRM Integrations Committer | GitHub / X | `hubspot-mcp` | | [ ] | [ ] | |
| 18 | **Zendesk MCP** | Customer Support Integrations | GitHub Issues | `zendesk-mcp` | | [ ] | [ ] | |
| 19 | **Datadog MCP** | Monitoring Integration Committer| GitHub / Discord | `datadog-mcp` | | [ ] | [ ] | |
| 20 | **PagerDuty MCP** | On-call Automation Committer | GitHub / X | `pagerduty-mcp` | | [ ] | [ ] | |

---

## 3. Community Sniping Scripts (Discord / Reddit)

### Scenario: Someone asks on Anthropic Discord (`#mcp`) or Reddit `r/mcp`:
> *"Why doesn't Claude Desktop pick my tool? My schema is valid and it works in MCP Inspector, but Claude ignores it."*

### Response Script:
> *"This usually happens because of description collision or vague parameter contracts rather than schema invalidity. We built a free behavioral tool auditor that tests which tools Claude actually selects under realistic task prompts: https://mcpaudit.dev.*
>
> *If your server is publicly reachable via HTTP/SSE, paste your URL there—it'll show you if other tools are stealing queries, which tools are dead weight, and the exact token context tax you're adding per message."*

---

## 4. Next Step Checklist
- [ ] Run `npx tsx scripts/publish-famous.ts` across candidate servers.
- [ ] Verify each published slug renders correctly at `https://mcpaudit.dev/report/{slug}`.
- [ ] Send 5 DMs daily and record outcomes above. Target: 5 replies, 2 calls.
