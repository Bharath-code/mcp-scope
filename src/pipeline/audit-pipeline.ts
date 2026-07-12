import { DurableObject } from "cloudflare:workers";
import {
  getCanonicalByToolsHash,
  getReport,
  insertEvalCalls,
  insertToolResults,
  patchReport,
  updateReportStatus,
} from "../lib/db";
import { refundFreshRun } from "../lib/rate-limit";
import { sha256Hex } from "../lib/hash";
import { ingest, classifyIngestError } from "./ingest";
import { runStaticChecks } from "./static-checks";
import { generateQueries } from "./query-gen";
import { anthropicSelectionCall, runSelectionEval } from "./selection-eval";
import { scoreReport, type EvalCall } from "./scoring";
import { capToolsForEval } from "./eval-cap";
import { TERMINAL_STATUSES, type ReportStatus } from "../types";
import type { Bindings } from "../index";

const DEFAULT_ALARM_MS = 5 * 60 * 1000; // FR-017 watchdog: 5 minutes

export type PipelineInput = {
  reportId: string;
  serverUrl: string;
  bearerToken?: string;
  clientIp?: string; // for rate-limit refund on stall/failure
  chargeDay?: string; // UTC day the fresh-run charge was made
};

type StoredMeta = {
  reportId: string;
  clientIp?: string;
  chargeDay?: string;
};

export class AuditPipeline extends DurableObject<Bindings> {
  async fetch(req: Request): Promise<Response> {
    const input = (await req.json()) as PipelineInput;
    this.ctx.waitUntil(this.run(input));
    return new Response("started", { status: 202 });
  }

  async run(input: PipelineInput): Promise<void> {
    const db = this.env.DB;
    const { reportId } = input;
    const meta: StoredMeta = {
      reportId,
      clientIp: input.clientIp,
      chargeDay: input.chargeDay,
    };
    await this.ctx.storage.put("meta", meta);
    await this.ctx.storage.setAlarm(Date.now() + this.alarmMs());

    try {
      // connecting + listing: real MCP ingest. classifyIngestError maps any
      // failure to its PRD copy so the report shows the specific outcome.
      if (!(await this.advance(reportId, "connecting"))) return;
      let result;
      try {
        result = await ingest(input.serverUrl, input.bearerToken);
      } catch (err) {
        throw new Error(classifyIngestError(err));
      }

      if (!(await this.advance(reportId, "listing"))) return;
      const toolsHash = await sha256Hex(result.rawJson);
      await patchReport(db, reportId, {
        tools_hash: toolsHash,
        server_name: result.serverName,
        tool_count: result.tools.length,
      });

      // TASK-013 cache dedupe: an unchanged server hashes identically to an
      // earlier complete report — alias to it, refund the charge, skip eval.
      const canonical = await getCanonicalByToolsHash(db, toolsHash, reportId);
      if (canonical) {
        await patchReport(db, reportId, {
          canonical_id: canonical.id,
          status: "complete",
          completed_at: new Date().toISOString(),
        });
        if (meta.clientIp && meta.chargeDay) {
          await refundFreshRun(db, meta.clientIp, meta.chargeDay);
        }
        await this.ctx.storage.deleteAlarm();
        return;
      }

      // TASK-018: nothing to evaluate. Complete now with the raw tools/list
      // payload on display instead of walking static/generating/evaluating.
      if (result.tools.length === 0) {
        await patchReport(db, reportId, {
          raw_json: result.rawJson,
          status: "complete",
          completed_at: new Date().toISOString(),
        });
        if (meta.clientIp && meta.chargeDay) {
          await refundFreshRun(db, meta.clientIp, meta.chargeDay);
        }
        await this.ctx.storage.deleteAlarm();
        return;
      }

      const apiKey = this.env.ANTHROPIC_API_KEY;

      if (!(await this.advance(reportId, "static"))) return;
      const staticResults = await runStaticChecks(apiKey, result.tools);
      await patchReport(db, reportId, {
        static_json: JSON.stringify(staticResults),
        def_tokens: staticResults.defTokens,
      });

      const { evalTools, capped } = capToolsForEval(result.tools);

      if (!(await this.advance(reportId, "generating"))) return;
      const queries = await generateQueries(apiKey, evalTools);
      await patchReport(db, reportId, { eval_total: queries.length });

      if (!(await this.advance(reportId, "evaluating"))) return;
      const { calls, costUsd } = await runSelectionEval(
        evalTools,
        queries,
        anthropicSelectionCall(apiKey),
        (done, total) => {
          // ponytail: throttle progress writes — every 3rd completion (and the
          // last) is plenty for a poller updating every 1.5s.
          if (done % 3 === 0 || done === total) {
            this.ctx.waitUntil(patchReport(db, reportId, { eval_done: done }));
          }
        },
      );

      const evalCalls: EvalCall[] = calls.map((c) => ({
        targetTool: c.targetTool,
        selectedTool: c.selectedTool,
        leaked: c.leaked,
      }));
      const { tools: toolResults, headline } = scoreReport(evalTools, evalCalls, staticResults.defTokens);
      if (capped) headline.evaluatedCount = evalTools.length;

      await insertToolResults(db, reportId, toolResults);
      await insertEvalCalls(db, reportId, calls);
      await patchReport(db, reportId, {
        headline_json: JSON.stringify(headline),
        effective_tools: headline.effectiveTools,
        eval_cost_usd: costUsd,
        status: "complete",
        completed_at: new Date().toISOString(),
      });
      await this.ctx.storage.deleteAlarm();
    } catch (err) {
      await this.fail(
        reportId,
        meta,
        err instanceof Error ? err.message : "Unknown pipeline error.",
      );
      await this.ctx.storage.deleteAlarm();
    }
  }

  // Watchdog: if the pipeline never reached a terminal state, the run stalled.
  async alarm(): Promise<void> {
    const meta = await this.ctx.storage.get<StoredMeta>("meta");
    if (!meta) return;
    const report = await getReport(this.env.DB, meta.reportId);
    if (!report || TERMINAL_STATUSES.has(report.status)) return;
    await this.fail(
      meta.reportId,
      meta,
      "The audit stalled — this is on us. Re-run free.",
    );
  }

  private async fail(reportId: string, meta: StoredMeta, message: string): Promise<void> {
    await updateReportStatus(this.env.DB, reportId, "failed", message);
    if (meta.clientIp && meta.chargeDay) {
      await refundFreshRun(this.env.DB, meta.clientIp, meta.chargeDay);
    }
  }

  // Advance to a stage only if not already terminal. Returns false if terminated.
  private async advance(reportId: string, stage: ReportStatus): Promise<boolean> {
    const res = await this.env.DB.prepare(
      "UPDATE reports SET status = ? WHERE id = ? AND status NOT IN ('complete','failed')",
    )
      .bind(stage, reportId)
      .run();
    return (res.meta.changes ?? 0) > 0;
  }

  private alarmMs(): number {
    return Number(this.env.ALARM_TIMEOUT_MS ?? String(DEFAULT_ALARM_MS));
  }
}
