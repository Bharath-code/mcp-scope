// Anti-leakage: keep generated queries from lexically echoing the target tool
// name. FR-006 — a scored query must not share a non-stopword token with its
// target tool's name, or the model picks the tool for the wrong reason.

// Generic verbs/nouns that carry no discriminating signal. A query saying
// "search" shouldn't count as leaking `search_docs`.
const STOPWORDS = new Set([
  "get", "list", "search", "create", "update", "delete", "fetch", "read",
  "write", "set", "find", "add", "remove", "new", "query", "run", "exec",
  "make", "do", "the", "a", "an", "of", "to", "for", "and", "or", "my",
  "all", "any", "tool", "api", "data", "info",
]);

// Split tool name into lowercase tokens on _/-/space and camelCase & digit
// boundaries: getUserProfile2 -> [get, user, profile, 2].
export function nameTokens(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .map((t) => t.toLowerCase())
    .filter(Boolean);
}

// The discriminating tokens a query must avoid: non-stopword, ≥2 chars.
export function leakTokens(name: string): string[] {
  return [...new Set(nameTokens(name))].filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

// True if the query contains any leak token from the tool name as a whole word.
export function isLeaked(query: string, toolName: string): boolean {
  const words = new Set(nameTokens(query));
  return leakTokens(toolName).some((t) => words.has(t));
}
