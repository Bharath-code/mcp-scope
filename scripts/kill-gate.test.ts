import { describe, it, expect } from "vitest";
import { computeVerdict } from "./kill-gate";

describe("computeVerdict", () => {
  it("stops when there are zero captures", () => {
    expect(computeVerdict(0, 0)).toBe("STOP");
  });

  it("passes once at least one tune-up is paid, regardless of capture count", () => {
    expect(computeVerdict(5, 1)).toBe("PASS");
    expect(computeVerdict(40, 2)).toBe("PASS");
  });

  it("pivots to CI pre-orders at 30 captures with zero paid tune-ups", () => {
    expect(computeVerdict(30, 0)).toBe("PIVOT_TO_CI_PREORDERS");
    expect(computeVerdict(50, 0)).toBe("PIVOT_TO_CI_PREORDERS");
  });

  it("is still in progress below both thresholds", () => {
    expect(computeVerdict(10, 0)).toBe("IN_PROGRESS");
  });
});
