import { raw } from "hono/html";
import type { Headline, StaticResults, ToolResult, TranscriptGroup } from "../types";

// Design tokens straight from docs/design.md (precision-dark instrument look).
// ponytail: no build step in this Worker, so tokens live as a plain <style> block
// rather than a CSS pipeline — revisit if the page count grows past a couple.
export const FONT_LINKS = raw(`
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
`);

export const PAGE_STYLES = raw(`
:root {
  --background: #09090b;
  --foreground: #f4f4f5;
  --card: #09090b;
  --card-foreground: #f4f4f5;
  --popover: #09090b;
  --popover-foreground: #f4f4f5;
  --primary: #fafafa;
  --primary-foreground: #18181b;
  --secondary: #18181b;
  --secondary-foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #71717a;
  --accent: #27272a;
  --accent-foreground: #fafafa;
  --destructive: #7f1d1d;
  --destructive-foreground: #fef2f2;
  --border: #27272a;
  --input: #27272a;
  --ring: #d4d4d8;
  --radius: 0.5rem;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background-color: #09090b;
  color: #f4f4f5;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Nav (shadcn header) */
.site-header {
  border-bottom: 1px solid #27272a;
  background: rgba(9, 9, 11, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 50;
}
.site-header-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 24px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #f4f4f5;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.01em;
}
.brand-name {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 600;
}
.brand-tag {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: #18181b;
  border: 1px solid #27272a;
  color: #71717a;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
}
.nav-link {
  font-size: 13px;
  font-weight: 500;
  color: #71717a;
  text-decoration: none;
  transition: color 0.15s ease;
}
.nav-link:hover, .nav-link.active {
  color: #f4f4f5;
}

/* Layout */
main {
  max-width: 680px;
  margin: 0 auto;
  padding: 44px 24px 72px;
}
h1 {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.25;
  color: #fafafa;
  margin-bottom: 12px;
}
h2 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #fafafa;
  margin: 28px 0 14px;
}
p {
  color: #a1a1aa;
  margin-bottom: 12px;
}
.mono {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  font-feature-settings: 'tnum';
}

/* Hero */
.hero {
  margin-bottom: 28px;
}
.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  border: 1px solid #27272a;
  background: #18181b;
  color: #a1a1aa;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 16px;
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}
.hero-title {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: #fafafa;
  margin-bottom: 10px;
}
.subhead {
  color: #a1a1aa;
  font-size: 14.5px;
  line-height: 1.6;
  margin-bottom: 24px;
}

/* Forms (shadcn Input & Button) */
#auditform, #runitform {
  margin: 20px 0 28px;
}
input[type="text"], input[type="password"] {
  width: 100%;
  height: 42px;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 6px;
  padding: 8px 13px;
  color: #fafafa;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
input[type="text"]:focus, input[type="password"]:focus {
  outline: none;
  border-color: #71717a;
  box-shadow: 0 0 0 1px #71717a;
}
input::placeholder {
  color: #52525b;
}
button[type="submit"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 18px;
  border-radius: 6px;
  background: #fafafa;
  color: #09090b;
  border: none;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
button[type="submit"]:hover {
  background: #e4e4e7;
}
button[type="submit"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toggle-row {
  color: #71717a;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.toggle-row input {
  accent-color: #fafafa;
}
.hint {
  color: #71717a;
  font-size: 12.5px;
  margin: 6px 0 0;
}
#formerror, #runiterror, #captureerror {
  color: #f43f5e;
  font-size: 13px;
  margin-top: 8px;
}
form > * + * { margin-top: 14px; }

/* Stage Log (shadcn clean timeline) */
.stagelog-container {
  border: 1px solid #27272a;
  background: #09090b;
  border-radius: 8px;
  overflow: hidden;
  margin: 18px 0;
}
.stagelog-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  background: #121215;
  border-bottom: 1px solid #27272a;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
  margin-right: 6px;
}
ol#stagelog {
  list-style: none;
  padding: 6px 14px;
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  color: #71717a;
}
ol#stagelog li {
  padding: 6px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
ol#stagelog li[data-state="done"] {
  color: #a1a1aa;
}
ol#stagelog li[data-state="active"] {
  color: #fafafa;
  font-weight: 500;
}
ol#stagelog li[data-state="failed"] {
  color: #f43f5e;
}

/* Cards (shadcn Card) */
.card {
  border: 1px solid #27272a;
  background: #09090b;
  border-radius: 8px;
  padding: 18px 20px;
  margin: 14px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.card h3 {
  margin: 0 0 6px;
  font-size: 14.5px;
  font-weight: 600;
  color: #fafafa;
}
.card p {
  margin: 0;
  color: #a1a1aa;
  font-size: 13.5px;
  line-height: 1.55;
}
.card .mono { color: #f4f4f5; }
.card.warning {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.02);
}
.card.warning h3 { color: #fbbf24; }
.card.error {
  border-color: rgba(244, 63, 94, 0.3);
  background: rgba(244, 63, 94, 0.02);
}
.card.error h3 { color: #fb7185; }
.card.success {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.card.success p { color: #f4f4f5; }
.card button#copylinkbtn, .card button#tuneupbtn, .card button#capturebtn, .card.success button {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 6px;
  background: #18181b;
  color: #f4f4f5;
  border: 1px solid #27272a;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.card button#copylinkbtn:hover, .card button#tuneupbtn:hover, .card button#capturebtn:hover, .card.success button:hover {
  background: #27272a;
  border-color: #3f3f46;
}
.card.headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  border: 1px solid #27272a;
  background: #121215;
  border-radius: 8px;
  padding: 18px 20px;
}
.card.headline h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #fafafa;
  letter-spacing: -0.015em;
}
.finding-list {
  margin: 8px 0 0;
  padding-left: 20px;
  color: #a1a1aa;
  font-size: 13px;
}
.finding-list li { margin: 4px 0; }
.clean { color: #10b981; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.card pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #121215;
  border: 1px solid #27272a;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #d4d4d8;
  margin: 10px 0 0;
}

/* Tool Table (shadcn Table) */
table.tool-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #27272a;
  border-radius: 8px;
  overflow: hidden;
  margin: 18px 0;
  font-size: 13px;
  background: #09090b;
}
table.tool-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 500;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #121215;
  border-bottom: 1px solid #27272a;
}
table.tool-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #1f1f23;
  color: #d4d4d8;
}
table.tool-table tr:last-child td { border-bottom: none; }
table.tool-table tr:hover td { background: #121215; }

/* Value Props */
.value-props {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin: 28px 0;
}
.value-props .card {
  margin: 0;
  padding: 16px 18px;
}
.prop-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  color: #71717a;
  margin-bottom: 6px;
  display: block;
}

/* Published Grid */
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 32px;
  margin-bottom: 12px;
}
.section-header h2 { margin: 0; }
.section-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #52525b;
}
.published-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.published-card {
  display: block;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 14px 16px;
  text-decoration: none;
  color: #f4f4f5;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.published-card:hover {
  border-color: #3f3f46;
  background: #121215;
}
.published-card-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.published-card h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fafafa;
}
.tool-count-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #71717a;
}
.published-card p {
  margin: 0;
  color: #a1a1aa;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

/* Footer */
.site-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #27272a;
  text-align: center;
  font-size: 12.5px;
  color: #71717a;
  line-height: 1.7;
}
.site-footer a {
  color: #a1a1aa;
  text-decoration: none;
  transition: color 0.15s ease;
}
.site-footer a:hover {
  color: #fafafa;
}
.footer-links {
  margin-top: 4px;
}

/* Method Stages */
code {
  font-family: 'JetBrains Mono', monospace;
  background: #18181b;
  border: 1px solid #27272a;
  padding: 1.5px 5px;
  border-radius: 4px;
  font-size: 12px;
  color: #e4e4e7;
}
ol.method-stages {
  list-style: none;
  counter-reset: stage-counter;
  margin: 16px 0;
  padding: 0;
}
ol.method-stages li {
  counter-increment: stage-counter;
  position: relative;
  padding: 14px 16px 14px 44px;
  margin-bottom: 8px;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  color: #a1a1aa;
  font-size: 13.5px;
  line-height: 1.55;
}
ol.method-stages li::before {
  content: counter(stage-counter);
  position: absolute;
  left: 14px;
  top: 14px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #18181b;
  border: 1px solid #27272a;
  color: #a1a1aa;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
`);

export function SiteHeader({ activeTab }: { activeTab?: "audit" | "method" | "moat" } = {}) {
  return (
    <header class="site-header">
      <div class="site-header-inner">
        <a href="/" class="brand-link" aria-label="MCP Audit Home">
          <span class="brand-name">mcp-audit</span>
          <span class="brand-tag">v0.1</span>
        </a>
        <nav class="nav-links">
          <a href="/method" class={`nav-link ${activeTab === "method" ? "active" : ""}`}>Methodology</a>
          <a href="/moat" class={`nav-link ${activeTab === "moat" ? "active" : ""}`}>MCP 2.0 & Moat</a>
        </nav>
      </div>
    </header>
  );
}

function ContextTaxCard({ defTokens, estimated, toolCount }: { defTokens: number; estimated: boolean; toolCount: number }) {
  const tenTurnTokens = defTokens * 10;
  return (
    <div class="card warning">
      <h3>Context tax</h3>
      <p>
        Your <span class="mono">{toolCount}</span> tool definitions consume{" "}
        <span class="mono">{defTokens}</span> tokens of every conversation before the user says a word
        {estimated ? " (estimated)" : ""}.
      </p>
      {defTokens > 0 && (
        <p class="hint" style="margin-top: 8px;">
          Across a 10-turn conversation, that is <span class="mono">{tenTurnTokens.toLocaleString()} tokens</span> consumed by tool schemas alone.
        </p>
      )}
    </div>
  );
}

function SchemaIssuesCard({ issues }: { issues: StaticResults["schemaIssues"] }) {
  if (issues.length === 0) return null;
  return (
    <div class="card error">
      <h3>Schema issues</h3>
      <ul class="finding-list">
        {issues.map((i) => (
          <li>
            <span class="mono">{i.tool}</span>: {i.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeakDescriptionsCard({ items }: { items: StaticResults["weakDescriptions"] }) {
  if (items.length === 0) return null;
  return (
    <div class="card warning">
      <h3>Weak descriptions</h3>
      <ul class="finding-list">
        {items.map((i) => (
          <li>
            <span class="mono">{i.tool}</span> has a {i.descriptionLen}-character description. Too short to guide
            selection.
          </li>
        ))}
      </ul>
    </div>
  );
}

function NameCollisionsCard({ pairs }: { pairs: StaticResults["nameCollisions"] }) {
  if (pairs.length === 0) return null;
  return (
    <div class="card warning">
      <h3>Name collisions</h3>
      <ul class="finding-list">
        {pairs.map((p) => (
          <li>
            <span class="mono">{p.a}</span> and <span class="mono">{p.b}</span> are{" "}
            {Math.round(p.score * 100)}% similar. Claude can't reliably tell them apart.
          </li>
        ))}
      </ul>
    </div>
  );
}

// FR-011 verdict-page ordering: headline -> dead tools -> collisions ->
// false positives -> context tax -> per-tool table.
function copyLinkScript() {
  return raw(`
(function(){
  var btn = document.getElementById('copylinkbtn');
  if (!btn) return;
  btn.addEventListener('click', function(){
    navigator.clipboard.writeText(location.href).then(function(){
      btn.textContent = 'Copied';
      setTimeout(function(){ btn.textContent = 'Copy link'; }, 2000);
    });
  });
})();
`);
}

export function HeadlineBlock({ headline }: { headline: Headline }) {
  return (
    <div class="card headline">
      <h2 class="mono">{headline.headline}</h2>
      <button id="copylinkbtn" type="button">
        Copy link
      </button>
      <script>{copyLinkScript()}</script>
    </div>
  );
}

export function DeadToolsCard({ deadTools }: { deadTools: string[] }) {
  if (deadTools.length === 0) return null;
  return (
    <div class="card error">
      <h3>Dead tools</h3>
      <ul class="finding-list">
        {deadTools.map((t) => (
          <li>
            <span class="mono">{t}</span> was never selected. Dead weight.
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SelectionCollisionsCard({ collisions }: { collisions: Headline["collisions"] }) {
  if (collisions.length === 0) return null;
  return (
    <div class="card warning">
      <h3>Collisions</h3>
      <ul class="finding-list">
        {collisions.map((c) => (
          <li>
            <span class="mono">{c.thief}</span> steals {c.stolen} of {c.of} queries meant for{" "}
            <span class="mono">{c.victim}</span>.
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FalsePositivesCard({ falsePositives }: { falsePositives: string[] }) {
  if (falsePositives.length === 0) return null;
  return (
    <div class="card warning">
      <h3>False positives</h3>
      <ul class="finding-list">
        {falsePositives.map((t) => (
          <li>
            <span class="mono">{t}</span> triggered on a query it had nothing to do with.
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToolTable({ tools }: { tools: ToolResult[] }) {
  return (
    <table class="tool-table">
      <thead>
        <tr>
          <th>Tool</th>
          <th>Trigger accuracy</th>
          <th>Times selected</th>
        </tr>
      </thead>
      <tbody>
        {tools.map((t) => (
          <tr>
            <td class="mono">{t.tool}</td>
            <td class="mono">{t.notScorable ? "not scorable" : `${Math.round(t.triggerAccuracy * 100)}%`}</td>
            <td class="mono">{t.timesSelected}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Builds the unlocked transcript DOM client-side without innerHTML/outerHTML —
// every server-supplied string (queries, tool names) is attacker-controlled,
// so it's set via textContent, never parsed as markup.
function renderTranscriptsScript() {
  return raw(`
function renderTranscripts(groups){
  var section = document.createElement('section');
  section.id = 'transcripts';
  groups.forEach(function(g){
    var h = document.createElement('h4');
    h.className = 'mono';
    h.textContent = g.tool;
    section.appendChild(h);
    var ul = document.createElement('ul');
    ul.className = 'finding-list';
    g.entries.forEach(function(e){
      var li = document.createElement('li');
      li.textContent = e.query + ' -> ' + (e.selectedTool || '(none)') + (e.leaked ? ' [leaked]' : '');
      ul.appendChild(li);
    });
    section.appendChild(ul);
  });
  return section;
}
`);
}

function captureScript(hash: string) {
  return raw(`
(function(){
  var form = document.getElementById('captureform');
  if (!form) return;
  var btn = document.getElementById('capturebtn');
  var err = document.getElementById('captureerror');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    err.textContent = '';
    btn.disabled = true;
    fetch('/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('captureemail').value, hash: '${hash}' })
    }).then(function(res){
      return res.json().then(function(data){ return { ok: res.ok, data: data }; });
    }).then(function(r){
      if (!r.ok) {
        err.textContent = r.data.error || 'Something went wrong.';
        btn.disabled = false;
        return;
      }
      if (window.posthog) posthog.capture('email_captured', { report_hash: '${hash}' });
      return fetch('/api/transcripts/${hash}').then(function(res){ return res.json(); }).then(function(data){
        document.getElementById('capture-card').replaceWith(renderTranscripts(data.transcripts || []));
      });
    }).catch(function(){
      err.textContent = 'Something went wrong.';
      btn.disabled = false;
    });
  });
})();
`);
}

function TranscriptsView({ transcripts }: { transcripts: TranscriptGroup[] }) {
  return (
    <section id="transcripts">
      {transcripts.map((g) => (
        <>
          <h4 class="mono">{g.tool}</h4>
          <ul class="finding-list">
            {g.entries.map((e) => (
              <li>
                {e.query} → <span class="mono">{e.selectedTool ?? "(none)"}</span>
                {e.leaked ? " [leaked]" : ""}
              </li>
            ))}
          </ul>
        </>
      ))}
    </section>
  );
}

// TASK-029/030: locked state collects an email to unlock transcripts in-page;
// unlocked state (via cookie on load, or via capture without reload) shows them.
export function TranscriptUnlockCard({
  hash,
  unlocked,
  transcripts,
}: {
  hash: string;
  unlocked: boolean;
  transcripts: TranscriptGroup[] | null;
}) {
  if (unlocked) return <TranscriptsView transcripts={transcripts ?? []} />;
  return (
    <div class="card" id="capture-card">
      <h3>Transcripts</h3>
      <p>Enter your email to unlock every query we ran and what Claude picked.</p>
      <form id="captureform">
        <input
          id="captureemail"
          type="text"
          placeholder="you@example.com"
          aria-label="Email address"
          required
          autocomplete="email"
        />
        <button id="capturebtn" type="submit">
          Unlock
        </button>
        <p id="captureerror" class="hint" role="alert"></p>
      </form>
      <script>{renderTranscriptsScript()}</script>
      <script>{captureScript(hash)}</script>
    </div>
  );
}

function tuneUpScript(hash: string) {
  return raw(`
(function(){
  var btn = document.getElementById('tuneupbtn');
  if (!btn) return;
  btn.addEventListener('click', function(){
    btn.disabled = true;
    if (window.posthog) posthog.capture('checkout_clicked', { report_hash: '${hash}' });
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: '${hash}' })
    }).then(function(res){ return res.json(); }).then(function(data){
      btn.disabled = false;
      if (data.url) window.open(data.url, '_blank');
    }).catch(function(){ btn.disabled = false; });
  });
})();
`);
}

// TASK-033: quiet CTA, no popup — a single button, opens Polar checkout in a
// new tab. "Never asks twice" (Vision § Product Principles).
export function TuneUpCta({ hash }: { hash: string }) {
  return (
    <div class="card">
      <h3>MCP tune-up</h3>
      <p>$149: rewritten tool descriptions, delivered as a PR-ready diff.</p>
      <button id="tuneupbtn" type="button">
        Order tune-up
      </button>
      <script>{tuneUpScript(hash)}</script>
    </div>
  );
}

function paidBannerScript() {
  return raw(`
(function(){
  if (!/[?&]paid=1\\b/.test(location.search)) return;
  var banner = document.getElementById('paidbanner');
  if (!banner) return;
  banner.style.display = 'flex';
  var dismiss = document.getElementById('paidbannerdismiss');
  dismiss.addEventListener('click', function(){ banner.style.display = 'none'; });
})();
`);
}

// Hidden by default; the script above reveals it only when ?paid=1 is present
// (avoids threading query params through server-side render).
export function PaidBanner() {
  return (
    <div id="paidbanner" class="card success" style="display:none;">
      <p>Tune-up ordered. Your PR-ready diff lands within 48 hours at the email you used at checkout.</p>
      <button id="paidbannerdismiss" type="button">
        Dismiss
      </button>
      <script>{paidBannerScript()}</script>
    </div>
  );
}

function runItScript() {
  return raw(`
(function(){
  var form = document.getElementById('runitform');
  if (!form) return;
  var btn = document.getElementById('runitbtn');
  var err = document.getElementById('runiterror');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    err.textContent = '';
    btn.disabled = true;
    fetch('/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: document.getElementById('runiturl').value })
    }).then(function(res){
      if (res.redirected || res.ok) { location.href = res.url; return; }
      return res.json().then(function(data){
        err.textContent = data.error || 'Something went wrong.';
        btn.disabled = false;
      });
    }).catch(function(){
      err.textContent = "That address isn't reachable from here.";
      btn.disabled = false;
    });
  });
})();
`);
}

// TASK-036: published-report footer CTA — reuses the /audit endpoint.
export function RunOnYourServerForm() {
  return (
    <div class="card">
      <h3>Run this on your server</h3>
      <form id="runitform">
        <input
          id="runiturl"
          type="text"
          placeholder="https://your-server.example.com/mcp"
          aria-label="MCP server URL"
          required
        />
        <button id="runitbtn" type="submit">
          Run audit
        </button>
        <p id="runiterror" class="hint" role="alert"></p>
      </form>
      <script>{runItScript()}</script>
    </div>
  );
}

// TASK-037: landing-page grid of hand-verified published reports.
export function PublishedGrid({
  reports,
}: {
  reports: { slug: string; server_name: string | null; tool_count: number | null; headline_json: string | null }[];
}) {
  if (reports.length === 0) return null;
  return (
    <section id="published">
      <h2>Published audits</h2>
      <div class="published-grid">
        {reports.map((r) => {
          const h = r.headline_json ? (JSON.parse(r.headline_json) as Headline) : null;
          return (
            <a class="published-card" href={`/report/${r.slug}`}>
              <h3>{r.server_name ?? r.slug}</h3>
              {h && (
                <p class="mono">
                  {h.effectiveTools}/{h.totalTools} effective · {h.defTokens} tokens
                </p>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}

export function EmptyToolsCard({ rawJson }: { rawJson: string }) {
  return (
    <div class="card warning">
      <h3>This server exposes 0 tools</h3>
      <p>Nothing to evaluate — here's what tools/list returned.</p>
      <pre class="mono">{rawJson}</pre>
    </div>
  );
}

export function StaticFindings({ results, toolCount }: { results: StaticResults; toolCount: number }) {
  const clean =
    results.schemaIssues.length === 0 && results.weakDescriptions.length === 0 && results.nameCollisions.length === 0;
  return (
    <section>
      <h2>Static checks{clean ? " ✓" : ""}</h2>
      <ContextTaxCard defTokens={results.defTokens} estimated={results.defTokensEstimated} toolCount={toolCount} />
      <SchemaIssuesCard issues={results.schemaIssues} />
      <WeakDescriptionsCard items={results.weakDescriptions} />
      <NameCollisionsCard pairs={results.nameCollisions} />
      {clean && <p class="clean">static checks ✓ — no issues</p>}
    </section>
  );
}

export function BadgeCard({ idOrSlug }: { idOrSlug: string }) {
  const badgeUrl = `/badge/${idOrSlug}.svg`;
  const reportUrl = `/report/${idOrSlug}`;
  const markdown = `[![MCP Audit](${badgeUrl})](${reportUrl})`;
  return (
    <div class="card">
      <h3>README Badge</h3>
      <p>Display your verified score badge in your GitHub repository README:</p>
      <div style="margin: 12px 0;">
        <img src={badgeUrl} alt="MCP Audit Badge" />
      </div>
      <pre class="mono" style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-size: 12px; margin: 0; user-select: all;">{markdown}</pre>
    </div>
  );
}
