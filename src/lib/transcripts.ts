// Groups eval_calls rows by target tool for the transcript view (TASK-030).
// Distractor queries (target_tool null) group under "(distractor)".
import type { EvalCallRow } from "./db";
import type { TranscriptGroup } from "../types";

const DISTRACTOR_LABEL = "(distractor)";

export function groupTranscripts(rows: EvalCallRow[]): TranscriptGroup[] {
  const byTool = new Map<string, TranscriptGroup>();
  for (const row of rows) {
    const tool = row.target_tool ?? DISTRACTOR_LABEL;
    let group = byTool.get(tool);
    if (!group) {
      group = { tool, entries: [] };
      byTool.set(tool, group);
    }
    group.entries.push({ query: row.query, selectedTool: row.selected_tool, leaked: row.leaked === 1 });
  }
  return [...byTool.values()];
}
