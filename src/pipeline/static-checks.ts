import type { McpTool, StaticResults } from "../types";
import { countDefTokens } from "../lib/tokens";

// ponytail: token count only for TASK-014. Schema validity, weak-description
// flags, and name-collision pairs land in TASK-015 — arrays stay empty until.
export async function runStaticChecks(apiKey: string, tools: McpTool[]): Promise<StaticResults> {
  const { defTokens, estimated } = await countDefTokens(apiKey, tools);
  return {
    defTokens,
    defTokensEstimated: estimated,
    schemaIssues: [],
    weakDescriptions: [],
    nameCollisions: [],
  };
}
