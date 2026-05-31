import { describe, expect, it } from "vitest";

import { expiryStatus } from "./reminder";

describe("expiryStatus", () => {
  it("is Expired when the Expiry Date is in the past", () => {
    const serviceRecord = {
      id: "go-2026",
      serviceType: "civil_liability",
      expiryDate: new Date("2026-05-22"), // 10 days before today
    };

    const status = expiryStatus(serviceRecord, 30, new Date("2026-06-01"));

    expect(status).toBe("Expired");
  });
});
