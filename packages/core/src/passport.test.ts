import { describe, expect, it } from "vitest";

import type { MileageReading, Renewal, ServiceRecord, Vehicle } from "./domain";
import { vehiclePassport } from "./passport";

const vehicle: Vehicle = {
  id: "car-1",
  userId: "user-1",
  brand: "BMW",
  model: "320d",
  year: 2016,
  plate: "CB4521KX",
  vin: "WBA8E31000K123456",
  bodyType: "sedan",
  fuelType: "diesel",
  firstRegistration: new Date("2016-03-14"),
};

const civilLiability: ServiceRecord = {
  id: "go",
  vehicleId: "car-1",
  serviceType: "civil_liability",
  expiryDate: new Date("2026-09-15"),
  cost: 245.5,
};

const renewal = (overrides: Partial<Renewal>): Renewal => ({
  id: "r1",
  vehicleId: "car-1",
  serviceType: "civil_liability",
  previousExpiryDate: new Date("2025-09-15"),
  previousCost: 231,
  renewedAt: new Date("2025-09-10"),
  ...overrides,
});

const reading = (km: number, readOn: string, source: MileageReading["source"]): MileageReading => ({
  id: `m-${readOn}`,
  vehicleId: "car-1",
  km,
  readOn: new Date(readOn),
  source,
});

const today = new Date("2026-06-01");

describe("vehiclePassport", () => {
  it("lists every period an obligation covered, the current one first", () => {
    const passport = vehiclePassport(
      {
        vehicle,
        serviceRecords: [civilLiability],
        renewals: [
          renewal({ id: "r1", previousExpiryDate: new Date("2024-09-15"), previousCost: 219 }),
          renewal({ id: "r2", previousExpiryDate: new Date("2025-09-15"), previousCost: 231 }),
        ],
        mileageReadings: [],
      },
      { today, includeCosts: true },
    );

    expect(passport.obligations).toHaveLength(1);
    expect(passport.obligations[0]!.periods).toEqual([
      { until: new Date("2026-09-15"), cost: 245.5, current: true },
      { until: new Date("2025-09-15"), cost: 231, current: false },
      { until: new Date("2024-09-15"), cost: 219, current: false },
    ]);
  });

  it("keeps each Mileage Reading with where it came from, oldest first", () => {
    const passport = vehiclePassport(
      {
        vehicle,
        serviceRecords: [],
        renewals: [],
        mileageReadings: [
          reading(184_312, "2026-03-03", "certificate"),
          reading(169_900, "2025-03-01", "manual"),
        ],
      },
      { today, includeCosts: true },
    );

    expect(passport.mileage.readings).toEqual([
      { km: 169_900, readOn: new Date("2025-03-01"), source: "manual" },
      { km: 184_312, readOn: new Date("2026-03-03"), source: "certificate" },
    ]);
    expect(passport.mileage.kmPerYear).toBe(14_334);
    expect(passport.mileage.rolledBack).toBe(false);
  });

  it("says so when a Mileage Reading is lower than the one before it", () => {
    const passport = vehiclePassport(
      {
        vehicle,
        serviceRecords: [],
        renewals: [],
        mileageReadings: [
          reading(210_000, "2024-03-01", "certificate"),
          reading(184_312, "2026-03-03", "certificate"),
        ],
      },
      { today, includeCosts: true },
    );

    expect(passport.mileage.rolledBack).toBe(true);
  });

  it("lists each Repair as an expense, newest first, and totals everything the Vehicle cost", () => {
    const passport = vehiclePassport(
      {
        vehicle,
        serviceRecords: [
          civilLiability,
          { id: "rep-1", vehicleId: "car-1", serviceType: "repair", expiryDate: new Date("2025-11-02"), cost: 480 },
          { id: "rep-2", vehicleId: "car-1", serviceType: "repair", expiryDate: new Date("2026-04-18"), cost: 120 },
        ],
        renewals: [renewal({ previousCost: 231 })],
        mileageReadings: [],
      },
      { today, includeCosts: true },
    );

    expect(passport.expenses).toEqual([
      { serviceType: "repair", date: new Date("2026-04-18"), cost: 120 },
      { serviceType: "repair", date: new Date("2025-11-02"), cost: 480 },
    ]);
    expect(passport.totalCost).toBe(245.5 + 231 + 480 + 120);
    expect(passport.obligations.map((o) => o.serviceType)).toEqual(["civil_liability"]);
  });

  it("leaves every amount out when the owner shares it without costs", () => {
    const passport = vehiclePassport(
      {
        vehicle,
        serviceRecords: [
          civilLiability,
          { id: "rep-1", vehicleId: "car-1", serviceType: "repair", expiryDate: new Date("2025-11-02"), cost: 480 },
        ],
        renewals: [renewal({ previousCost: 231 })],
        mileageReadings: [],
      },
      { today, includeCosts: false },
    );

    expect(passport.obligations[0]!.periods.map((p) => p.cost)).toEqual([null, null]);
    expect(passport.expenses[0]!.cost).toBeNull();
    expect(passport.totalCost).toBeNull();
  });

  it("keeps the history of an obligation the Vehicle no longer has", () => {
    const passport = vehiclePassport(
      {
        vehicle,
        serviceRecords: [],
        renewals: [renewal({ serviceType: "casco", previousExpiryDate: new Date("2025-06-01"), previousCost: 890 })],
        mileageReadings: [],
      },
      { today, includeCosts: true },
    );

    expect(passport.obligations).toEqual([
      {
        serviceType: "casco",
        status: null,
        periods: [{ until: new Date("2025-06-01"), cost: 890, current: false }],
      },
    ]);
  });
});
