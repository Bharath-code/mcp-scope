import { html, raw } from "hono/html";
import { PAGE_STYLES } from "./components";

// Vanilla JS, no framework (matches Report.tsx's polling script). Intercepts the
// submit so 400/429 JSON errors render inline instead of a raw-JSON navigation,
// and follows the 302 to the report on success.
function formScript() {
  return raw(`
(function(){
  var form = document.getElementById('auditform');
  var btn = document.getElementById('submitbtn');
  var err = document.getElementById('formerror');
  var toggle = document.getElementById('privatetoggle');
  var tokenRow = document.getElementById('tokenrow');
  toggle.addEventListener('change', function(){
    tokenRow.style.display = toggle.checked ? 'block' : 'none';
  });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Running…';
    var body = {
      input: document.getElementById('urlinput').value,
      bearerToken: toggle.checked ? document.getElementById('tokeninput').value : undefined
    };
    fetch('/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function(res){
      if (res.redirected || res.ok) { location.href = res.url; return; }
      return res.json().then(function(data){
        err.textContent = data.error || 'Something went wrong.';
        btn.disabled = false;
        btn.textContent = 'Run audit';
      });
    }).catch(function(){
      err.textContent = "That address isn't reachable from here.";
      btn.disabled = false;
      btn.textContent = 'Run audit';
    });
  });
})();
`);
}

export function HomePage() {
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MCP Audit — Which of your tools does Claude actually use?</title>
        <style>${PAGE_STYLES}</style>
      </head>
      <body>
        <main>
          <h1>Which of your tools does Claude actually use?</h1>
          <p class="subhead">
            Paste your MCP server's URL. We'll list its tools, measure the context tax, and run real selection
            queries against Claude to see which tools actually get picked.
          </p>
          <form id="auditform">
            <input id="urlinput" type="text" name="input" placeholder="https://your-server.example.com/mcp" required />
            <label class="toggle-row">
              <input id="privatetoggle" type="checkbox" /> Private server?
            </label>
            <div id="tokenrow" style="display:none">
              <input id="tokeninput" type="password" placeholder="Bearer token" autocomplete="off" />
              <p class="hint">Used in-flight only, never stored.</p>
            </div>
            <button id="submitbtn" type="submit">Run audit</button>
            <p id="formerror" role="alert"></p>
          </form>
          <section id="published"></section>
        </main>
        <script>${formScript()}</script>
      </body>
    </html>`;
}
