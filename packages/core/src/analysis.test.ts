import { describe, expect, it } from "vitest";

import { spendAnalysis } from "./analysis";

describe("spendAnalysis", () => {
  it("sums costs and breaks spend down by Service Type, largest first", () => {
    const result = spendAnalysis([
      { serviceType: "civil_liability", cost: 120 },
      { serviceType: "repair", cost: 300 },
      { serviceType: "civil_liability", cost: 80 },
      { serviceType: "vignette", cost: 50 },
    ]);

    expect(result.total).toBe(550);
    expect(result.count).toBe(4);
    expect(result.byType).toEqual([
      { serviceType: "repair", total: 300, share: 300 / 550 },
      { serviceType: "civil_liability", total: 200, share: 200 / 550 },
      { serviceType: "vignette", total: 50, share: 50 / 550 },
    ]);
  });

  it("ignores records with no (or non-positive) cost", () => {
    const result = spendAnalysis([
      { serviceType: "casco", cost: null },
      { serviceType: "tax", cost: 0 },
      { serviceType: "casco", cost: 200 },
    ]);

    expect(result.total).toBe(200);
    expect(result.count).toBe(1);
    expect(result.byType).toEqual([{ serviceType: "casco", total: 200, share: 1 }]);
  });

  it("returns an empty breakdown when nothing has a cost", () => {
    const result = spendAnalysis([{ serviceType: "inspection", cost: null }]);
    expect(result).toEqual({ total: 0, byType: [], count: 0 });
  });
});
