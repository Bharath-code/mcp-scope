import { raw } from "hono/html";
import type { Headline, StaticResults, ToolResult, TranscriptGroup } from "../types";

// Design tokens straight from docs/design.md (precision-dark instrument look).
// ponytail: no build step in this Worker, so tokens live as a plain <style> block
// rather than a CSS pipeline — revisit if the page count grows past a couple.
export const PAGE_STYLES = raw(`
:root {
  --background: #0A0B0D;
  --surface: #111318;
  --surface-raised: #171A21;
  --border: #23262E;
  --border-strong: #343946;
  --text: #E7EAF0;
  --text-secondary: #8A919E;
  --text-muted: #5C6370;
  --accent: #22D3EE;
  --on-accent: #06181C;
  --success: #34D399;
  --on-success: #052E1F;
  --warning: #FBBF24;
  --on-warning: #2E2205;
  --error: #F87171;
  --on-error: #2E0A0A;
}
* { box-sizing: border-box; }
body {
  background: var(--background);
  color: var(--text);
  font-family: Inter, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
}
main { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
h1 { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; }
h2 { font-size: 21px; font-weight: 600; letter-spacing: -0.01em; }
.mono { font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 13px; }
ol#stagelog { list-style: none; padding: 0; font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 13px; color: var(--text-secondary); }
ol#stagelog li { padding: 4px 0; }
ol#stagelog li[data-state="done"] { color: var(--success); }
ol#stagelog li[data-state="active"] { color: var(--accent); }
ol#stagelog li[data-state="failed"] { color: var(--error); }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin: 16px 0;
}
.card h3 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
.card p { margin: 0; color: var(--text-secondary); }
.card .mono { color: var(--text); }
.card.warning { border-color: var(--warning); }
.card.error { border-color: var(--error); }
.card.success { border-color: var(--success); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.card.success p { color: var(--text); margin: 0; }
.card.success button, .card button#tuneupbtn {
  background: var(--surface-raised);
  color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}
.finding-list { margin: 8px 0 0; padding-left: 20px; color: var(--text-secondary); }
.finding-list li { margin: 4px 0; }
.clean { color: var(--success); font-family: "JetBrains Mono", ui-monospace, monospace; }
.card pre { white-space: pre-wrap; word-break: break-word; overflow-x: auto; margin: 12px 0 0; }
.card.headline { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.card.headline h2 { margin: 0; font-size: 20px; }
.card.headline button {
  background: var(--surface-raised);
  color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}
table.tool-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
table.tool-table th, table.tool-table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); }
table.tool-table th { color: var(--text-secondary); font-weight: 600; }
.value-props { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 32px 0; }
.value-props .card { margin: 0; }
.published-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.published-card {
  display: block;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  text-decoration: none;
  color: var(--text);
}
.published-card h3 { margin: 0 0 4px; font-size: 15px; }
.published-card p { margin: 0; color: var(--text-secondary); }
.subhead { color: var(--text-secondary); }
input[type="text"], input[type="password"] {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  height: 48px;
  width: 100%;
  font-size: 15px;
  font-family: inherit;
}
input[type="text"]:focus, input[type="password"]:focus {
  outline: 3px solid rgba(34, 211, 238, 0.25);
  border-color: var(--border-strong);
}
button[type="submit"] {
  background: var(--accent);
  color: var(--on-accent);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  height: 40px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
button[type="submit"]:hover { background: #67E3F5; }
button[type="submit"]:disabled { opacity: 0.4; cursor: default; }
.toggle-row { color: var(--text-secondary); font-size: 13px; }
.hint { color: var(--text-muted); font-size: 13px; margin: 4px 0 0; }
#formerror { color: var(--error); font-size: 13px; margin-top: 8px; }
form > * + * { margin-top: 12px; }
`);

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
