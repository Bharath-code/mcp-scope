import { defineConfig } from "vitest/config";

// ponytail: plain node pool — all unit tests here are pure functions (ssrf,
// similarity, scoring, anti-leakage). Switch to @cloudflare/vitest-pool-workers
// only if a test needs real D1/DO bindings.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
