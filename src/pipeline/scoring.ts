// Scoring: turn logged eval calls into per-tool verdicts and a headline.
// FR-009. Leaked queries are excluded from every denominator.
import type {
  McpTool,
  ToolResult,
  Headline,
  CollisionPair,
} from "../types";

// A tool is "effective" at or above this share of its own scored queries.
export const EFFECTIVE_THRESHOLD = 0.67;

// One recorded selection eval. targetTool null = distractor query.
export type EvalCall = {
  targetTool: string | null;
  selectedTool: string | null;
  leaked: boolean;
};

export type ScoreResult = { tools: ToolResult[]; headline: Headline };

export function scoreReport(
  tools: McpTool[],
  calls: EvalCall[],
  defTokens: number,
): ScoreResult {
  const timesSelected = new Map<string, number>();
  for (const c of calls) {
    if (c.selectedTool) timesSelected.set(c.selectedTool, (timesSelected.get(c.selectedTool) ?? 0) + 1);
  }

  const results: ToolResult[] = tools.map((t) => {
    const own = calls.filter((c) => c.targetTool === t.name);
    const scored = own.filter((c) => !c.leaked);
    const picked = scored.filter((c) => c.selectedTool === t.name).length;

    // Which other tools stole this tool's scored queries.
    const stolenBy: Record<string, number> = {};
    for (const c of scored) {
      if (c.selectedTool && c.selectedTool !== t.name) {
        stolenBy[c.selectedTool] = (stolenBy[c.selectedTool] ?? 0) + 1;
      }
    }

    // All target queries leaked -> nothing to score against.
    const notScorable = own.length > 0 && scored.length === 0;

    return {
      tool: t.name,
      descriptionLen: t.description?.length ?? 0,
      triggerAccuracy: scored.length ? picked / scored.length : 0,
      timesSelected: timesSelected.get(t.name) ?? 0,
      stolenBy,
      isDead: (timesSelected.get(t.name) ?? 0) === 0,
      ...(notScorable ? { notScorable: true } : {}),
    };
  });

  const effectiveTools = results.filter(
    (r) => !r.notScorable && r.triggerAccuracy >= EFFECTIVE_THRESHOLD,
  ).length;
  const deadTools = results.filter((r) => r.isDead).map((r) => r.tool);

  // Directional collision pairs: thief steals `stolen` of victim's `of` queries.
  const collisions: CollisionPair[] = [];
  for (const victim of results) {
    const of = calls.filter((c) => c.targetTool === victim.tool && !c.leaked).length;
    for (const [thief, stolen] of Object.entries(victim.stolenBy)) {
      collisions.push({ thief, victim: victim.tool, stolen, of });
    }
  }
  collisions.sort((a, b) => b.stolen - a.stolen);

  // Tools any distractor query triggered — should be none.
  const falsePositives = [
    ...new Set(
      calls
        .filter((c) => c.targetTool === null && c.selectedTool)
        .map((c) => c.selectedTool as string),
    ),
  ];

  const totalTools = tools.length;
  const headline: Headline = {
    effectiveTools,
    totalTools,
    defTokens,
    deadTools,
    collisions,
    falsePositives,
    headline: `${effectiveTools}/${totalTools} tools effective · ${defTokens} tokens of context tax`,
  };

  return { tools: results, headline };
}
