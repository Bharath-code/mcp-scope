import { html, raw } from "hono/html";
import type { ReportApiResponse, ReportStatus } from "../types";
import {
  PAGE_STYLES,
  StaticFindings,
  EmptyToolsCard,
  HeadlineBlock,
  DeadToolsCard,
  SelectionCollisionsCard,
  FalsePositivesCard,
  ToolTable,
  TranscriptUnlockCard,
  TuneUpCta,
  PaidBanner,
  RunOnYourServerForm,
} from "./components";
import { posthogSnippet } from "../lib/analytics";

// Ordered pipeline stages for the log. `queued` maps to "connecting" pending.
const STAGES: { key: ReportStatus; label: string }[] = [
  { key: "connecting", label: "connecting" },
  { key: "listing", label: "listing tools" },
  { key: "static", label: "static checks" },
  { key: "generating", label: "generating queries" },
  { key: "evaluating", label: "evaluating selection" },
];

const ORDER: ReportStatus[] = [
  "queued",
  "connecting",
  "listing",
  "static",
  "generating",
  "evaluating",
  "complete",
];

function idx(status: ReportStatus): number {
  const i = ORDER.indexOf(status);
  return i < 0 ? 0 : i;
}

// Server-rendered stage log. Also mirrored client-side (see renderScript) so the
// live poll can update it without a reload.
function StageLog({ resp }: { resp: ReportApiResponse }) {
  const cur = idx(resp.status);
  const failed = resp.status === "failed";
  return (
    <ol id="stagelog">
      {STAGES.map((s) => {
        const si = ORDER.indexOf(s.key);
        let state = "pending";
        if (resp.status === "failed") state = si < cur ? "done" : si === cur ? "failed" : "pending";
        else if (si < cur) state = "done";
        else if (si === cur) state = "active";
        const mark = state === "done" ? "✓" : state === "active" ? "…" : state === "failed" ? "✗" : "·";
        return (
          <li data-stage={s.key} data-state={state}>
            {mark} {s.label}
          </li>
        );
      })}
      {resp.status === "complete" && <li data-state="done">✓ complete</li>}
      {failed && resp.error && <li data-state="failed">✗ {resp.error}</li>}
    </ol>
  );
}

function renderScript(hash: string) {
  // <10KB, no framework. Poll every 1.5s; update the stage log; reload on terminal
  // so the full server-rendered complete/failed page (with findings) shows.
  return raw(`
(function(){
  var ORDER=${JSON.stringify(ORDER)};
  var STAGES=${JSON.stringify(STAGES)};
  function esc(s){var d=document.createElement('span');d.textContent=s;return d.innerHTML;}
  function render(r){
    var cur=ORDER.indexOf(r.status); if(cur<0)cur=0;
    var out='';
    for(var i=0;i<STAGES.length;i++){
      var s=STAGES[i], si=ORDER.indexOf(s.key), state='pending';
      if(r.status==='failed'){state=si<cur?'done':(si===cur?'failed':'pending');}
      else if(si<cur)state='done'; else if(si===cur)state='active';
      var mark=state==='done'?'✓':state==='active'?'…':state==='failed'?'✗':'·';
      out+='<li data-stage="'+s.key+'" data-state="'+state+'">'+mark+' '+esc(s.label)+'</li>';
    }
    if(r.status==='complete')out+='<li data-state="done">✓ complete</li>';
    if(r.status==='failed'&&r.error)out+='<li data-state="failed">✗ '+esc(r.error)+'</li>';
    var el=document.getElementById('stagelog'); if(el)el.innerHTML=out;
  }
  var delay=1500, stopped=false;
  function poll(){
    if(stopped)return;
    fetch('/api/report/${hash}').then(function(x){return x.json();}).then(function(r){
      if(r.status==='complete'||r.status==='failed'){
        stopped=true;
        if(window.posthog)posthog.capture(r.status==='complete'?'audit_completed':'audit_failed',{report_hash:'${hash}',tool_count:r.toolCount});
        location.reload();return;
      }
      render(r); delay=1500; setTimeout(poll,delay);
    }).catch(function(){ delay=Math.min(delay*2,15000); setTimeout(poll,delay); });
  }
  setTimeout(poll,delay);
})();
`);
}

function viewedScript(hash: string, toolCount: number | null) {
  return raw(`
if(window.posthog)posthog.capture('report_viewed',{report_hash:'${hash}',tool_count:${JSON.stringify(toolCount)}});
`);
}

export type PublishedInfo = { slug: string; auditedAt: string };

export function ReportPage({
  resp,
  hash,
  posthogKey,
  published,
}: {
  resp: ReportApiResponse;
  hash: string;
  posthogKey?: string;
  published?: PublishedInfo;
}) {
  const terminal = resp.status === "complete" || resp.status === "failed";
  const serverName = resp.serverName ? escapeText(resp.serverName) : null;
  const seoTitle =
    published && resp.headline
      ? `${serverName ?? "MCP Server"} Audit — ${resp.headline.effectiveTools}/${resp.headline.totalTools} tools effective — MCP Audit`
      : serverName
        ? `${serverName} — MCP Audit`
        : "MCP Audit";
  const seoDescription = published && resp.headline ? escapeText(resp.headline.headline) : null;
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${raw(seoTitle)}</title>
        ${published ? raw(`<link rel="canonical" href="/report/${published.slug}" />`) : ""}
        ${seoDescription ? raw(`<meta name="description" content="${seoDescription}" />`) : ""}
        <meta property="og:image" content="/og/${hash}.png" />
        <meta property="og:title" content="${raw(seoTitle)}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/og/${hash}.png" />
        <style>${PAGE_STYLES}</style>
        ${posthogKey ? html`<script>${raw(posthogSnippet(posthogKey))}</script>` : ""}
      </head>
      <body>
        <main>
          <h1>MCP Audit${resp.serverName ? raw(` — ${escapeText(resp.serverName)}`) : ""}</h1>
          ${published && (<p class="hint">Audited on {published.auditedAt.slice(0, 10)}.</p>)}
          <section aria-live="polite" aria-busy="${terminal ? "false" : "true"}">
            ${(<StageLog resp={resp} />)}
          </section>
          ${resp.status === "complete" && (<PaidBanner />)}
          ${resp.rawToolsJson !== null && (<EmptyToolsCard rawJson={resp.rawToolsJson} />)}
          ${resp.headline && (<HeadlineBlock headline={resp.headline} />)}
          ${resp.headline && (<DeadToolsCard deadTools={resp.headline.deadTools} />)}
          ${resp.headline && (<SelectionCollisionsCard collisions={resp.headline.collisions} />)}
          ${resp.headline && (<FalsePositivesCard falsePositives={resp.headline.falsePositives} />)}
          ${resp.headline?.evaluatedCount !== undefined && (
            <p class="hint">
              Evaluated the first {resp.headline.evaluatedCount} of {resp.headline.totalTools} tools; context tax counts
              all {resp.headline.totalTools}.
            </p>
          )}
          ${resp.static && (<StaticFindings results={resp.static} toolCount={resp.toolCount ?? 0} />)}
          ${resp.tools && (<ToolTable tools={resp.tools} />)}
          ${resp.tools && (
            <TranscriptUnlockCard hash={hash} unlocked={resp.transcriptsUnlocked} transcripts={resp.transcripts} />
          )}
          ${resp.status === "complete" && (<TuneUpCta hash={hash} />)}
          ${published && (<RunOnYourServerForm />)}
          <footer class="hint">
            Selection at temperature 0 with generated queries is a proxy, not ground truth. <a href="/method">Method →</a>
          </footer>
        </main>
        ${posthogKey ? html`<script>${viewedScript(hash, resp.toolCount)}</script>` : ""}
        ${terminal ? "" : (<script>{renderScript(hash)}</script>)}
      </body>
    </html>`;
}

function escapeText(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}
