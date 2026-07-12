// FR-009: servers over this size are evaluated by list order only; context tax
// still counts every tool (TASK-023).
export const EVAL_TOOL_CAP = 30;

export function capToolsForEval<T>(tools: T[]): { evalTools: T[]; capped: boolean } {
  const capped = tools.length > EVAL_TOOL_CAP;
  return { evalTools: capped ? tools.slice(0, EVAL_TOOL_CAP) : tools, capped };
}
