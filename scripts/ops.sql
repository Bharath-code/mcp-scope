-- Ops queries (TASK-045). Founder's morning check — run each against remote D1:
--   npx wrangler d1 execute mcp-audit --remote --file scripts/ops.sql
-- Or paste a single query with --command "...".

-- Fresh (cache-missing) audit runs today, by day.
SELECT day, SUM(fresh_runs) AS fresh_runs
FROM rate_limits
GROUP BY day
ORDER BY day DESC
LIMIT 14;

-- Eval spend per day (only reports that reached evaluating/complete have a cost).
SELECT DATE(created_at) AS day, ROUND(SUM(eval_cost_usd), 2) AS eval_cost_usd, COUNT(*) AS reports
FROM reports
WHERE eval_cost_usd IS NOT NULL
GROUP BY day
ORDER BY day DESC
LIMIT 14;

-- Email captures per day.
SELECT DATE(created_at) AS day, COUNT(*) AS captures
FROM email_captures
GROUP BY day
ORDER BY day DESC
LIMIT 14;

-- Tune-up orders, most recent first.
SELECT polar_order_id, email, amount_cents, status, created_at
FROM tune_up_orders
ORDER BY created_at DESC
LIMIT 50;

-- Top IPs by fresh-run volume today (watch for abuse).
SELECT ip, fresh_runs, captures
FROM rate_limits
WHERE day = strftime('%Y-%m-%d', 'now')
ORDER BY fresh_runs DESC
LIMIT 20;
