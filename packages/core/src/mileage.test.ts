import { describe, expect, it } from "vitest";

import { distanceDriven } from "./mileage";

describe("distanceDriven", () => {
  it("has nothing to show for a single Mileage Reading", () => {
    expect(distanceDriven([{ km: 369786, readOn: new Date("2026-08-17") }])).toEqual([]);
  });

  it("reports the kilometres driven between two Inspections a year apart", () => {
    expect(
      distanceDriven([
        { km: 350214, readOn: new Date("2025-08-17") },
        { km: 369786, readOn: new Date("2026-08-17") },
      ]),
    ).toEqual([
      { from: new Date("2025-08-17"), to: new Date("2026-08-17"), km: 19572, kmPerYear: 19572 },
    ]);
  });

  it("scales the distance to a year when the Inspections were not a year apart", () => {
    // A certificate renewed a month late covers thirteen months of driving, not twelve.
    const [interval] = distanceDriven([
      { km: 100000, readOn: new Date("2025-01-10") },
      { km: 113000, readOn: new Date("2026-02-10") },
    ]);

    expect(interval).toMatchObject({ km: 13000, kmPerYear: 12000 });
  });

  it("orders Mileage Readings by date, whatever order they arrive in", () => {
    const intervals = distanceDriven([
      { km: 369786, readOn: new Date("2026-08-17") },
      { km: 350214, readOn: new Date("2025-08-17") },
    ]);

    expect(intervals.map((interval) => interval.km)).toEqual([19572]);
  });

  it("passes over a reading lower than the one before it, which cannot be right", () => {
    // A digit lost in recognition or in typing: 30 000 between 300 000 and 340 000.
    const intervals = distanceDriven([
      { km: 300000, readOn: new Date("2024-08-17") },
      { km: 30000, readOn: new Date("2025-08-17") },
      { km: 340000, readOn: new Date("2026-08-17") },
    ]);

    expect(intervals).toEqual([
      { from: new Date("2024-08-17"), to: new Date("2026-08-17"), km: 40000, kmPerYear: 20000 },
    ]);
  });
});
