// Single source of truth for the eval model. Query generation, selection eval,
// and token counting MUST all use the same model — token counts are
// model-specific and would not line up otherwise.
//
// Haiku is the free-tier judge: cheapest per audit (one call per generated
// query) and the strictest reader of tool descriptions, so vague `description`
// fields fail here before they would on a larger model.
//
// ponytail: plain const. When a paid "audit against Sonnet" tier lands, make
// this a param on the anthropic* factories (they already take apiKey) and pass
// env.EVAL_MODEL — don't thread env through until that tier exists.
export const EVAL_MODEL = "claude-haiku-4-5";
