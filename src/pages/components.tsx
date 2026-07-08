import { raw } from "hono/html";
import type { StaticResults } from "../types";

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
.finding-list { margin: 8px 0 0; padding-left: 20px; color: var(--text-secondary); }
.finding-list li { margin: 4px 0; }
.clean { color: var(--success); font-family: "JetBrains Mono", ui-monospace, monospace; }
`);

function ContextTaxCard({ defTokens, estimated, toolCount }: { defTokens: number; estimated: boolean; toolCount: number }) {
  return (
    <div class="card warning">
      <h3>Context tax</h3>
      <p>
        Your <span class="mono">{toolCount}</span> tool definitions consume{" "}
        <span class="mono">{defTokens}</span> tokens of every conversation before the user says a word
        {estimated ? " (estimated)" : ""}.
      </p>
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
