import { describe, expect, it } from "vitest";

import type { ServiceRecord } from "./domain";
import { pendingRenewals, renewalLink, renewalMethod, suggestedExpiry } from "./renewal";

const record = (overrides: Partial<ServiceRecord>): ServiceRecord => ({
  id: "go",
  vehicleId: "car-1",
  serviceType: "civil_liability",
  expiryDate: new Date("2026-06-15"),
  cost: null,
  ...overrides,
});

describe("pendingRenewals", () => {
  it("lists a Service Record whose Expiry Date has passed as waiting for its new Expiry Date", () => {
    const expired = record({ id: "go", expiryDate: new Date("2026-06-15") });

    expect(pendingRenewals([expired], new Date("2026-06-20"))).toEqual([expired]);
  });

  it("does not ask on the Expiry Date itself, which is still the last valid day", () => {
    const lastDay = record({ expiryDate: new Date("2026-06-15") });

    expect(pendingRenewals([lastDay], new Date("2026-06-15"))).toEqual([]);
  });

  it("never asks to renew a Repair, which is a dated expense and does not expire", () => {
    const repair = record({ id: "repair", serviceType: "repair", expiryDate: new Date("2026-01-10") });

    expect(pendingRenewals([repair], new Date("2026-06-20"))).toEqual([]);
  });

  it("puts the Service Record that lapsed longest ago first", () => {
    const vignette = record({ id: "vignette", serviceType: "vignette", expiryDate: new Date("2026-06-18") });
    const casco = record({ id: "casco", serviceType: "casco", expiryDate: new Date("2026-05-01") });
    const inspection = record({ id: "inspection", serviceType: "inspection", expiryDate: new Date("2026-12-01") });

    expect(
      pendingRenewals([vignette, inspection, casco], new Date("2026-06-20")).map((r) => r.id),
    ).toEqual(["casco", "vignette"]);
  });
});

describe("renewalMethod", () => {
  it("renews a Roadworthiness Inspection from a photo of the new certificate", () => {
    expect(renewalMethod("inspection")).toBe("inspectionScan");
  });

  it("renews Civil Liability Insurance and Casco from a photo of the new policy", () => {
    expect(renewalMethod("civil_liability")).toBe("policyScan");
    expect(renewalMethod("casco")).toBe("policyScan");
  });

  it("renews a Vignette from which one was bought", () => {
    expect(renewalMethod("vignette")).toBe("vignette");
  });

  it("renews a Fire Extinguisher, Vehicle Tax and Maintenance by entering the new date", () => {
    expect(renewalMethod("fire_extinguisher")).toBe("date");
    expect(renewalMethod("tax")).toBe("date");
    expect(renewalMethod("maintenance")).toBe("date");
  });
});

describe("suggestedExpiry", () => {
  it("proposes one year after the old Expiry Date, the period most obligations run for", () => {
    expect(suggestedExpiry(new Date("2026-06-15"), new Date("2026-06-20"))).toEqual(
      new Date("2027-06-15"),
    );
  });

  it("proposes one year from today when the old Expiry Date lapsed more than a year ago", () => {
    expect(suggestedExpiry(new Date("2024-03-01"), new Date("2026-06-20"))).toEqual(
      new Date("2027-06-20"),
    );
  });
});

describe("renewalLink", () => {
  it("opens the renewal of the one Service Record a Reminder was about", () => {
    expect(renewalLink(["42"])).toBe("/renew/42");
  });

  it("opens the list of renewals when a Reminder was about several Service Records", () => {
    expect(renewalLink(["42", "43"])).toBe("/renew");
  });
});
