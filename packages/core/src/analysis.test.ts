import { describe, expect, it } from "vitest";

import { cumulativeAt, cumulativePoints, spendByMonth, spendShares } from "./analysis";

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

describe("cumulativePoints / cumulativeAt", () => {
  it("builds a running total sorted by date and reads the value as of a date", () => {
    const points = cumulativePoints([
      { t: 300, cost: 25 },
      { t: 100, cost: 50 },
      { t: 200, cost: null }, // ignored
      { t: 250, cost: 100 },
    ]);

    expect(points).toEqual([
      { t: 100, cumulative: 50 },
      { t: 250, cumulative: 150 },
      { t: 300, cumulative: 175 },
    ]);

    expect(cumulativeAt(points, 50)).toBe(0); // before the first event
    expect(cumulativeAt(points, 100)).toBe(50); // exactly on an event
    expect(cumulativeAt(points, 260)).toBe(150); // between events
    expect(cumulativeAt(points, 9999)).toBe(175); // after the last
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
