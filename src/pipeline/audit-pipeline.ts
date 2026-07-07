import { DurableObject } from "cloudflare:workers";
import { getReport, patchReport, updateReportStatus } from "../lib/db";
import { refundFreshRun } from "../lib/rate-limit";
import { TERMINAL_STATUSES, type ReportStatus } from "../types";
import type { Bindings } from "../index";

// ponytail: stub pipeline for Phase 0 — real stages land in Phase 1/2.
const STUB_STAGES: ReportStatus[] = [
  "connecting",
  "listing",
  "static",
  "generating",
  "evaluating",
];

const DEFAULT_ALARM_MS = 5 * 60 * 1000; // FR-017 watchdog: 5 minutes
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      const stageDelay = Number(this.env.STAGE_DELAY_MS ?? "1000");
      for (const stage of STUB_STAGES) {
        // Watchdog wins: if the run was already marked terminal, stop advancing.
        if (!(await this.advance(reportId, stage))) return;
        await sleep(stageDelay);
      }
      await patchReport(db, reportId, {
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
