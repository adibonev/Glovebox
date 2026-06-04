import { describe, expect, it } from "vitest";

import { spendByMonth, spendShares } from "./analysis";

describe("spendShares", () => {
  it("sums costs and breaks spend down by key, largest first", () => {
    const result = spendShares([
      { key: "civil_liability", cost: 120 },
      { key: "repair", cost: 300 },
      { key: "civil_liability", cost: 80 },
      { key: "vignette", cost: 50 },
    ]);

    expect(result.total).toBe(550);
    expect(result.count).toBe(4);
    expect(result.slices).toEqual([
      { key: "repair", total: 300, share: 300 / 550 },
      { key: "civil_liability", total: 200, share: 200 / 550 },
      { key: "vignette", total: 50, share: 50 / 550 },
    ]);
  });

  it("ignores items with no (or non-positive) cost", () => {
    const result = spendShares([
      { key: "casco", cost: null },
      { key: "tax", cost: 0 },
      { key: "casco", cost: 200 },
    ]);

    expect(result.total).toBe(200);
    expect(result.count).toBe(1);
    expect(result.slices).toEqual([{ key: "casco", total: 200, share: 1 }]);
  });

  it("returns an empty breakdown when nothing has a cost", () => {
    expect(spendShares([{ key: "inspection", cost: null }])).toEqual({
      total: 0,
      count: 0,
      slices: [],
    });
  });
});

describe("spendByMonth", () => {
  it("buckets costs by calendar month, oldest first", () => {
    const result = spendByMonth([
      { date: new Date("2026-03-10"), cost: 100 },
      { date: new Date("2026-01-05"), cost: 50 },
      { date: new Date("2026-03-20"), cost: 25 },
      { date: new Date("2026-01-28"), cost: null },
    ]);

    expect(result).toEqual([
      { period: "2026-01", total: 50 },
      { period: "2026-03", total: 125 },
    ]);
  });
});
