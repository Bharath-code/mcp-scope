import { html, raw } from "hono/html";
import type { ReportApiResponse, ReportStatus } from "../types";

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
      if(r.status==='complete'||r.status==='failed'){stopped=true;location.reload();return;}
      render(r); delay=1500; setTimeout(poll,delay);
    }).catch(function(){ delay=Math.min(delay*2,15000); setTimeout(poll,delay); });
  }
  setTimeout(poll,delay);
})();
`);
}

export function ReportPage({ resp, hash }: { resp: ReportApiResponse; hash: string }) {
  const terminal = resp.status === "complete" || resp.status === "failed";
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${resp.serverName ? `${resp.serverName} — MCP Audit` : "MCP Audit"}</title>
      </head>
      <body>
        <main>
          <h1>MCP Audit${resp.serverName ? raw(` — ${escapeText(resp.serverName)}`) : ""}</h1>
          <section aria-live="polite" aria-busy="${terminal ? "false" : "true"}">
            ${(<StageLog resp={resp} />)}
          </section>
        </main>
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
