# Day-14 Kill-Gate Decision Record

> Grounded in `docs/VISION.md` § Business Constraints and `scripts/kill-gate.ts`.
> **Rule:** The kill gate is law. You do not build features to "fix" distribution. The numbers dictate the exact path forward.

---

## 1. Execution Log

- **Launch Date:** [YYYY-MM-DD]
- **Readout Date:** [YYYY-MM-DD] (Day 14)
- **Script Run Command:** `npx tsx scripts/kill-gate.ts --launch-date=[YYYY-MM-DD]`

---

## 2. Metric Scorecard

| Metric | Target | Actual | Delta |
|---|---|---|---|
| Stranger-Initiated Runs (48h) | >20 | [TBD] | |
| Total Fresh Runs (Day 14) | >100 | [TBD] | |
| Email Captures | ≥30 | [TBD] | |
| Capture Rate (% of runs) | >15% | [TBD] | |
| Paid Tune-Ups ($149) | ≥1 | [TBD] | |

---

## 3. Verdict Framework

Depending on the output from `scripts/kill-gate.ts`:

### Case A: PASS (≥1 Paid Tune-Up)
* **Status:** Business assumption validated. Buyers exist who expense fixes.
* **Next Steps:**
  1. Build automated re-run alert emails on tool changes.
  2. Test $199 and $499 team tune-up tiers.
  3. Begin private beta for the $49/mo GitHub Action CI check with tune-up buyers.

### Case B: PIVOT TO CI PRE-ORDERS (≥30 Captures, 0 Paid Tune-Ups)
* **Status:** High interest in the audit report, but maintainers self-serve description fixes using Claude rather than paying $149 for a manual diff.
* **Next Steps:**
  1. Deprecate the one-off $149 tune-up as primary offer.
  2. Launch Founding Pre-Orders for the **$29/mo MCP CI Check (GitHub Action)**.
  3. Gate the CI check behind pre-orders: need 5 pre-orders before writing action code.

### Case C: STOP (0 Email Captures)
* **Status:** Market signal is clear: maintainers do not care enough about tool selection accuracy to enter an email.
* **Next Steps:**
  1. Cease development immediately.
  2. Publish a transparent post-mortem blog post on lessons learned from MCP behavioral ergonomics.
  3. Archive the project and carry learnings into the next venture.

---

## 4. Final Signed Decision

- **Recorded Verdict:** `[IN_PROGRESS / PASS / PIVOT_TO_CI_PREORDERS / STOP]`
- **Founder Decision:** [To be recorded on Day 14]
- **Date:** [To be signed on Day 14]
