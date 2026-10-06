import { describe, it, expect } from "vitest";
import { buildOptimizationPrompt } from "./tune-up";

describe("buildOptimizationPrompt", () => {
  it("formats prompt with report headline, context tax, and colliding tools", () => {
    const report = {
      id: "test-report-id",
      server_name: "Stripe MCP",
      server_url: "https://stripe-mcp.demo/sse",
      headline_json: JSON.stringify({
        headline: "2/4 tools effective · 1200 tokens of context tax",
        effectiveTools: 2,
        totalTools: 4,
        defTokens: 1200,
        deadTools: ["cancel_subscription"],
        collisions: [],
        falsePositives: [],
      }),
      static_json: JSON.stringify({
        defTokens: 1200,
        defTokensEstimated: false,
        schemaIssues: [],
        weakDescriptions: [{ tool: "get_balance", descriptionLen: 12 }],
        nameCollisions: [],
      }),
      def_tokens: 1200,
    };

    const tools = [
      {
        tool_name: "create_invoice",
        description_len: 45,
        trigger_accuracy: 1.0,
        times_selected: 3,
        stolen_by_json: "{}",
        is_dead: 0,
      },
      {
        tool_name: "cancel_subscription",
        description_len: 25,
        trigger_accuracy: 0.0,
        times_selected: 0,
        stolen_by_json: "{}",
        is_dead: 1,
      },
    ];

    const prompt = buildOptimizationPrompt(report, tools);
    expect(prompt).toContain("Server Name: Stripe MCP");
    expect(prompt).toContain("Current Context Tax: 1200 tokens");
    expect(prompt).toContain("create_invoice: accuracy=100%");
    expect(prompt).toContain("cancel_subscription: accuracy=0%, selected=0 times [DEAD - Never Selected]");
  });
});
