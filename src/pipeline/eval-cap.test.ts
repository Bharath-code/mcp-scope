import { describe, it, expect } from "vitest";
import { capToolsForEval, EVAL_TOOL_CAP } from "./eval-cap";

describe("capToolsForEval", () => {
  it("evaluates every tool when at or under the cap", () => {
    const tools = Array.from({ length: EVAL_TOOL_CAP }, (_, i) => `tool_${i}`);
    const { evalTools, capped } = capToolsForEval(tools);
    expect(capped).toBe(false);
    expect(evalTools).toHaveLength(EVAL_TOOL_CAP);
  });

  it("bounds eval to the first 30 by list order for a 35-tool fixture", () => {
    const tools = Array.from({ length: 35 }, (_, i) => `tool_${i}`);
    const { evalTools, capped } = capToolsForEval(tools);
    expect(capped).toBe(true);
    expect(evalTools).toHaveLength(30);
    expect(evalTools[0]).toBe("tool_0");
    expect(evalTools[29]).toBe("tool_29");
  });
});
