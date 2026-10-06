import { html, raw } from "hono/html";
import { FONT_LINKS, PAGE_STYLES, SiteHeader } from "./components";
import { EFFECTIVE_THRESHOLD } from "../pipeline/scoring";
import { EVAL_TOOL_CAP } from "../pipeline/eval-cap";
import { posthogSnippet } from "../lib/analytics";

export function MethodPage(posthogKey?: string) {
  const threshold = Math.round(EFFECTIVE_THRESHOLD * 100);
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Method — MCP Audit</title>
        ${FONT_LINKS}
        <style>${PAGE_STYLES}</style>
        ${posthogKey ? html`<script>${raw(posthogSnippet(posthogKey))}</script>` : ""}
      </head>
      <body>
        <SiteHeader activeTab="method" />
        <main>
          <h1>Method</h1>
          <p class="subhead">
            Selection at temperature 0 with generated queries is a proxy for real usage, not ground truth. This page
            explains exactly what an audit does, so you can judge how much to trust it.
          </p>

          <h2>Pipeline stages</h2>
          <ol class="method-stages">
            <li><strong>connecting / listing</strong> — connect to your server via streamable HTTP (SSE fallback), call
              <code>initialize</code> and <code>tools/list</code>. Nothing else. <code>tools/call</code> is never
              invoked anywhere in this codebase.</li>
            <li><strong>static</strong> — schema validity, description length, and name-collision checks over the
              returned tool list, plus a token count of the tool definitions (the "context tax").</li>
            <li><strong>generating</strong> — one batched call generates 3 evaluation queries per tool (phrased as user
              goals, never mentioning the tool by name) plus 5 distractor queries expected to trigger nothing.</li>
            <li><strong>evaluating</strong> — each query is sent to the model once, with the full tool list available
              and <code>tool_choice: auto</code>, temperature 0. We record whichever tool (if any) it picks.</li>
          </ol>

          <h2>Query generation and anti-leakage</h2>
          <p>
            A query that echoes the target tool's name doesn't test selection — it tests string matching. Before a
            query counts toward a tool's score, its words are compared against that tool's name, split on
            case/underscore boundaries with common stopwords removed (get, list, search, create, and similar). Any
            query sharing a discriminating word with the tool name is flagged as leaked, regenerated once, and — if
            still leaked — kept in the record but excluded from scoring.
          </p>

          <h2>Scoring</h2>
          <ul class="finding-list">
            <li><strong>Trigger accuracy</strong> — of a tool's own (non-leaked) queries, the share that actually
              selected that tool.</li>
            <li><strong>Effective</strong> — a tool is counted as effective when trigger accuracy is at least
              ${threshold}%.</li>
            <li><strong>Dead</strong> — a tool selected zero times across every query, including other tools' queries
              and distractors.</li>
            <li><strong>Collision</strong> — when another tool ("thief") is selected for queries meant for a given tool
              ("victim"), reported as "thief steals N of M queries meant for victim."</li>
            <li><strong>False positive</strong> — a distractor query (meant to trigger nothing) that selected a tool
              anyway.</li>
            <li><strong>Context tax</strong> — tokens the tool definitions add to every request, measured as a minimal
              request's token count with the tools included minus the same request without them.</li>
          </ul>

          <h2>Known limitations</h2>
          <ul class="finding-list">
            <li>Servers with more than ${EVAL_TOOL_CAP} tools are evaluated on the first ${EVAL_TOOL_CAP} by list order
              only. Context tax still counts every tool the server returns.</li>
            <li>Selection at temperature 0 on generated queries approximates real usage patterns; it is not a
              substitute for production traffic.</li>
            <li>Query generation and selection both run on a single model. Systematic blind spots in that model become
              blind spots in the audit.</li>
            <li>If all of a tool's queries are excluded as leaked, that tool is disclosed as not scorable and left out
              of the effective/total denominator.</li>
          </ul>
          <footer class="site-footer">
            <div class="footer-links">
              <a href="/">← Run an audit</a> · <a href="/moat">MCP 2.0 & Defensibility →</a>
            </div>
          </footer>
        </main>
      </body>
    </html>`;
}
