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
  --background: #08090C;
  --surface: #0E1117;
  --surface-raised: #151922;
  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --text: #F1F4F9;
  --text-secondary: #94A0B8;
  --text-muted: #64748B;
  --accent: #22D3EE;
  --on-accent: #041619;
  --accent-subtle: rgba(34, 211, 238, 0.1);
  --accent-hover: #67E3F5;
  --success: #34D399;
  --on-success: #052E1F;
  --warning: #FBBF24;
  --on-warning: #2E2205;
  --error: #F87171;
  --on-error: #2E0A0A;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
::selection { background: rgba(34, 211, 238, 0.25); color: #FFF; }
body {
  background-color: var(--background);
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34, 211, 238, 0.09) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 85% 15%, rgba(96, 165, 250, 0.04) 0%, transparent 50%),
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Header & Navigation */
.site-header {
  border-bottom: 1px solid var(--border);
  background: rgba(8, 9, 12, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 100;
}
.site-header-inner {
  max-width: 820px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.02em;
}
.brand-glyph {
  color: var(--accent);
  font-size: 18px;
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.6);
}
.brand-name {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.brand-accent {
  color: var(--accent);
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}
.nav-link {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}
.nav-link:hover {
  color: var(--text);
}
.nav-link.active {
  color: var(--accent);
}

/* Layout */
main {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}
h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.25;
  margin-bottom: 12px;
  color: #FFF;
}
h2 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.35;
  margin: 32px 0 16px;
  color: #FFF;
}
p { margin-bottom: 14px; }
.mono {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
  font-feature-settings: "tnum";
}

/* Hero elements */
.hero { margin-bottom: 32px; }
.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(34, 211, 238, 0.08);
  border: 1px solid rgba(34, 211, 238, 0.25);
  color: var(--accent);
  font-size: 12px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-weight: 500;
  margin-bottom: 16px;
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  animation: pulse-dot 2s infinite ease-in-out;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
.hero-title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 14px;
  background: linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subhead {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 28px;
  max-width: 640px;
}

/* Form */
#auditform, #runitform {
  position: relative;
  margin: 24px 0 32px;
}
input[type="text"], input[type="password"] {
  background: rgba(14, 17, 24, 0.85);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 13px 18px;
  height: 50px;
  width: 100%;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.2s ease;
}
input[type="text"]:focus, input[type="password"]:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.2);
  background: rgba(18, 22, 32, 0.95);
}
button[type="submit"] {
  background: var(--accent);
  color: var(--on-accent);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  height: 48px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
button[type="submit"]:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 0 28px rgba(34, 211, 238, 0.45);
}
button[type="submit"]:active { transform: translateY(1px); }
button[type="submit"]:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
.toggle-row {
  color: var(--text-secondary);
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.hint { color: var(--text-muted); font-size: 13px; margin: 4px 0 0; }
#formerror, #runiterror, #captureerror { color: var(--error); font-size: 13px; margin-top: 8px; }
form > * + * { margin-top: 14px; }

/* Stage Log Telemetry */
.stagelog-container {
  background: rgba(11, 14, 20, 0.95);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin: 20px 0;
  box-shadow: 0 8px 30px -6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.stagelog-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  display: inline-block;
  margin-right: 8px;
  animation: pulse-dot 1.8s infinite ease-in-out;
}
ol#stagelog {
  list-style: none;
  padding: 14px 18px;
  background: transparent;
  border: none;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}
ol#stagelog li { padding: 6px 0; display: flex; align-items: center; gap: 8px; }
ol#stagelog li[data-state="done"] { color: var(--success); }
ol#stagelog li[data-state="active"] {
  color: var(--accent);
  font-weight: 500;
  animation: stage-blink 1.8s infinite ease-in-out;
}
@keyframes stage-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
ol#stagelog li[data-state="failed"] { color: var(--error); font-weight: 500; }

/* Cards */
.card {
  background: rgba(15, 18, 25, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px;
  margin: 18px 0;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.card:hover { border-color: var(--border-strong); }
.card h3 { margin: 0 0 8px; font-size: 17px; font-weight: 600; color: #FFF; }
.card p { margin: 0; color: var(--text-secondary); line-height: 1.6; }
.card .mono { color: var(--text); }
.card.warning {
  border-color: rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.03);
}
.card.error {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.03);
}
.card.success {
  border-color: rgba(52, 211, 153, 0.35);
  background: rgba(52, 211, 153, 0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.card.success p { color: var(--text); margin: 0; }
.card.success button, .card button#tuneupbtn, .card button#capturebtn {
  background: var(--surface-raised);
  color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.card.success button:hover, .card button#tuneupbtn:hover, .card button#capturebtn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent);
  color: #FFF;
}
.card.tuneup {
  border-color: rgba(34, 211, 238, 0.35);
  background: linear-gradient(135deg, rgba(17, 24, 38, 0.8) 0%, rgba(12, 16, 26, 0.9) 100%);
  box-shadow: 0 10px 30px -10px rgba(34, 211, 238, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.tuneup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.price-chip {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.04em;
}
.card.headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, rgba(20, 26, 38, 0.85) 0%, rgba(13, 17, 26, 0.95) 100%);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 16px;
  box-shadow: 0 10px 30px -10px rgba(34, 211, 238, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: 26px 28px;
}
.card.headline h2 { margin: 0; font-size: 22px; font-weight: 600; color: #FFFFFF; letter-spacing: -0.02em; }
.card.headline button#copylinkbtn {
  background: var(--surface-raised);
  color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.card.headline button#copylinkbtn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent);
  color: #FFF;
}
.score-badge {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}
.finding-list { margin: 10px 0 0; padding-left: 20px; color: var(--text-secondary); }
.finding-list li { margin: 6px 0; }
.clean { color: var(--success); font-family: "JetBrains Mono", ui-monospace, monospace; }
.card pre { white-space: pre-wrap; word-break: break-word; overflow-x: auto; margin: 12px 0 0; }

/* Tool table */
table.tool-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 20px 0;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(13, 16, 22, 0.6);
}
table.tool-table th, table.tool-table td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
table.tool-table th {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.03);
}
table.tool-table tr:last-child td { border-bottom: none; }
table.tool-table tr:hover td { background: rgba(255, 255, 255, 0.025); }

/* Value Props */
.value-props { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin: 36px 0; }
.value-props .card { margin: 0; padding: 22px; }
.prop-tag {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
  display: inline-block;
}

/* Published Grid */
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 40px;
  margin-bottom: 16px;
}
.section-header h2 { margin: 0; }
.section-tag {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
}
.published-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.published-card {
  display: block;
  background: rgba(17, 20, 28, 0.75);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
  text-decoration: none;
  color: var(--text);
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.4);
}
.published-card:hover {
  border-color: rgba(34, 211, 238, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.6);
}
.published-card-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.published-card h3 { margin: 0; font-size: 16px; color: #FFF; }
.tool-count-chip {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
}
.published-card p { margin: 0; color: var(--accent); font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 13px; }

/* Footer */
.site-footer {
  margin-top: 64px;
  padding-top: 28px;
  border-top: 1px solid var(--border);
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.7;
}
.site-footer a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}
.site-footer a:hover {
  color: var(--accent);
}
.footer-links {
  margin-top: 6px;
}

/* Method page specifics */
code {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  color: var(--accent);
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
  padding: 16px 20px 16px 54px;
  margin-bottom: 12px;
  background: rgba(15, 18, 25, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
}
ol.method-stages li::before {
  content: counter(stage-counter);
  position: absolute;
  left: 18px;
  top: 16px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  color: var(--accent);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
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
          <span class="brand-glyph">⚡</span>
          <span class="brand-name">mcp<span class="brand-accent">audit</span></span>
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
