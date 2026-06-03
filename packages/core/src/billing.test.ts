import { describe, expect, it } from "vitest";

import {
  canAddDocument,
  canAddService,
  canAddVehicle,
  entitlementsFor,
  hasEntitlement,
  quotaFor,
} from "./billing";

describe("entitlements", () => {
  it("Free unlocks only PDF export (email reminders are baseline for all)", () => {
    expect(entitlementsFor("free")).toEqual(["pdf_export"]);
    expect(hasEntitlement("free", "push_notifications")).toBe(false);
    expect(hasEntitlement("free", "unlimited_vehicles")).toBe(false);
  });

  it("Pro unlocks the full capability set", () => {
    expect(hasEntitlement("pro", "push_notifications")).toBe(true);
    expect(hasEntitlement("pro", "unlimited_vehicles")).toBe(true);
    expect(hasEntitlement("pro", "custom_reminder_windows")).toBe(true);
  });

  it("Legacy keeps the Pro capabilities (grandfathered forever)", () => {
    expect(entitlementsFor("legacy")).toEqual(entitlementsFor("pro"));
  });
});

describe("quotas", () => {
  it("Free is capped at 1 Vehicle and 2 Service Records, with unlimited Documents", () => {
    expect(quotaFor("free")).toEqual({
      vehicles: 1,
      servicesPerVehicle: 2,
      documentsPerServiceRecord: null,
    });
  });

  it("Pro and Legacy are unlimited", () => {
    expect(quotaFor("pro").vehicles).toBeNull();
    expect(quotaFor("legacy").servicesPerVehicle).toBeNull();
  });

  it("a Free User can add the first Vehicle but not a second", () => {
    expect(canAddVehicle("free", 0)).toBe(true);
    expect(canAddVehicle("free", 1)).toBe(false);
  });

  it("a Free User can add up to 2 Service Records, then is blocked", () => {
    expect(canAddService("free", 0)).toBe(true);
    expect(canAddService("free", 1)).toBe(true);
    expect(canAddService("free", 2)).toBe(false);
  });

  it("Free Documents are unlimited", () => {
    expect(canAddDocument("free", 5)).toBe(true);
  });

  it("Pro / Legacy can always add Vehicles, Service Records and Documents", () => {
    expect(canAddVehicle("pro", 50)).toBe(true);
    expect(canAddService("pro", 50)).toBe(true);
    expect(canAddDocument("legacy", 99)).toBe(true);
  });
});
