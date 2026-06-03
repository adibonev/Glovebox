import { describe, expect, it } from "vitest";

import {
  canAddDocument,
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
  it("Free is capped at 1 Vehicle and 1 Document per Service Record", () => {
    expect(quotaFor("free")).toEqual({ vehicles: 1, documentsPerServiceRecord: 1 });
  });

  it("Pro and Legacy are unlimited", () => {
    expect(quotaFor("pro").vehicles).toBeNull();
    expect(quotaFor("legacy").documentsPerServiceRecord).toBeNull();
  });

  it("a Free User can add the first Vehicle but not a second", () => {
    expect(canAddVehicle("free", 0)).toBe(true);
    expect(canAddVehicle("free", 1)).toBe(false);
  });

  it("Pro / Legacy can always add Vehicles and Documents", () => {
    expect(canAddVehicle("pro", 50)).toBe(true);
    expect(canAddDocument("legacy", 99)).toBe(true);
  });

  it("a Free User can add the first Document but not a second", () => {
    expect(canAddDocument("free", 0)).toBe(true);
    expect(canAddDocument("free", 1)).toBe(false);
  });
});
