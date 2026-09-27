import { describe, expect, it } from "vitest";

import { expiryStatus } from "./reminder";

describe("expiryStatus", () => {
  it("is Expired when the Expiry Date is in the past", () => {
    const serviceRecord = {
      id: "go-2026",
      vehicleId: "car-1",
      serviceType: "civil_liability",
      expiryDate: new Date("2026-05-22"), // 10 days before today
      cost: null,
    };

    const status = expiryStatus(serviceRecord, 30, new Date("2026-06-01"));

    expect(status).toBe("Expired");
  });

  it("is ExpiringSoon when the Expiry Date falls within the Reminder Window", () => {
    const serviceRecord = {
      id: "go-2026",
      vehicleId: "car-1",
      serviceType: "civil_liability",
      expiryDate: new Date("2026-06-15"), // 14 days from today, window is 30
      cost: null,
    };

    const status = expiryStatus(serviceRecord, 30, new Date("2026-06-01"));

    expect(status).toBe("ExpiringSoon");
  });

  it("is Valid when the Expiry Date is before the Reminder Window", () => {
    const serviceRecord = {
      id: "go-2026",
      vehicleId: "car-1",
      serviceType: "civil_liability",
      expiryDate: new Date("2026-07-31"), // 60 days from today, window is 30
      cost: null,
    };

    const status = expiryStatus(serviceRecord, 30, new Date("2026-06-01"));

    expect(status).toBe("Valid");
  });
});

describe("expiryStatus on the Expiry Date itself", () => {
  const lastDay = {
    id: "go-2026",
    vehicleId: "car-1",
    serviceType: "civil_liability",
    expiryDate: new Date("2026-12-04"), // valid through 04.12.2026 inclusive
    cost: null,
  };

  it("is still not Expired in the afternoon of the last valid day", () => {
    // 13:00 UTC is 15:00 in Sofia: the policy covers the rest of the day.
    expect(expiryStatus(lastDay, 30, new Date("2026-12-04T13:00:00Z"))).toBe("ExpiringSoon");
  });

  it("is Expired from the next day on, whatever the hour", () => {
    expect(expiryStatus(lastDay, 30, new Date("2026-12-05T00:01:00Z"))).toBe("Expired");
  });
});
