import { describe, expect, it } from "vitest";

import { cumulativeAt, cumulativePoints, spendByMonth, spendShares, spendingOf } from "./analysis";
import type { Renewal, ServiceRecord } from "./domain";

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

describe("spendingOf — when the money was spent", () => {
  const record = (fields: Partial<ServiceRecord>): ServiceRecord => ({
    id: "s1",
    vehicleId: "audi",
    serviceType: "civil_liability",
    expiryDate: new Date("2027-08-11"),
    cost: 193.27,
    ...fields,
  });

  it("counts a cost on the day it was entered, not on the Expiry Date", () => {
    const spending = spendingOf([record({ costDate: new Date("2026-08-12") })], []);
    expect(spending).toEqual([
      { vehicleId: "audi", serviceType: "civil_liability", cost: 193.27, paidOn: new Date("2026-08-12") },
    ]);
  });

  it("counts a Repair on its own date: that date is the day of the expense", () => {
    const repair = record({ serviceType: "repair", expiryDate: new Date("2026-05-02"), costDate: new Date("2026-09-01") });
    expect(spendingOf([repair], [])[0]?.paidOn).toEqual(new Date("2026-05-02"));
  });

  it("adds what every renewed period cost, on the day that cost was entered", () => {
    const renewal: Renewal = {
      id: "r1",
      vehicleId: "audi",
      serviceType: "civil_liability",
      previousExpiryDate: new Date("2026-08-11"),
      previousCost: 180,
      previousCostDate: new Date("2025-08-10"),
      renewedAt: new Date("2026-08-12"),
    };
    const spending = spendingOf([record({ costDate: new Date("2026-08-12") })], [renewal]);
    expect(spending.map((s) => [s.cost, s.paidOn.toISOString().slice(0, 10)])).toEqual([
      [180, "2025-08-10"],
      [193.27, "2026-08-12"],
    ]);
  });

  it("leaves out anything without a cost", () => {
    expect(spendingOf([record({ cost: null }), record({ cost: 0 })], [])).toEqual([]);
  });

  it("falls back to the Expiry Date while the database does not keep the day yet", () => {
    expect(spendingOf([record({ costDate: null })], [])[0]?.paidOn).toEqual(new Date("2027-08-11"));
  });
});
