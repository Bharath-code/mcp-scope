// Near-duplicate tool-name detection via Sørensen–Dice on character bigrams.
// FR-005: flag name pairs with Dice ≥ 0.8 on normalized names.
import type { CollisionWarning } from "../types";

export const NAME_COLLISION_THRESHOLD = 0.8;

// Lowercase, drop separators/non-alphanumerics: search_docs ≡ searchDocs.
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function bigrams(s: string): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    out.set(g, (out.get(g) ?? 0) + 1);
  }
  return out;
}

// Dice coefficient: 2·|shared bigrams| / (|A|+|B|). 1 = identical, 0 = disjoint.
export function nameSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0; // ponytail: bigrams need ≥2 chars
  const ga = bigrams(na);
  const gb = bigrams(nb);
  let shared = 0;
  let total = 0;
  for (const n of ga.values()) total += n;
  for (const [g, n] of gb) {
    total += n;
    shared += Math.min(n, ga.get(g) ?? 0);
  }
  return (2 * shared) / total;
}

// All unordered name pairs at or above the collision threshold, strongest first.
export function findNameCollisions(names: string[]): CollisionWarning[] {
  const out: CollisionWarning[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const score = nameSimilarity(names[i], names[j]);
      if (score >= NAME_COLLISION_THRESHOLD) out.push({ a: names[i], b: names[j], score });
    }
  }
  return out.sort((x, y) => y.score - x.score);
}
