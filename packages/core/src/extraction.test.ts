import { describe, expect, it } from "vitest";

import { parseExtractedServiceInfo } from "./extraction";

describe("parseExtractedServiceInfo", () => {
  it("keeps a valid Service Type, ISO date and cost", () => {
    expect(
      parseExtractedServiceInfo({ serviceType: "civil_liability", expiryDate: "2026-09-01", cost: 120 }),
    ).toEqual({ serviceType: "civil_liability", expiryDate: "2026-09-01", cost: 120 });
  });

  it("rejects an unknown Service Type and a malformed date", () => {
    expect(
      parseExtractedServiceInfo({ serviceType: "spaceship", expiryDate: "01.09.2026", cost: 50 }),
    ).toEqual({ serviceType: null, expiryDate: null, cost: 50 });
  });

  it("coerces a numeric string cost and nulls a negative one", () => {
    expect(parseExtractedServiceInfo({ cost: "99.50" })).toEqual({
      serviceType: null,
      expiryDate: null,
      cost: 99.5,
    });
    expect(parseExtractedServiceInfo({ cost: -5 }).cost).toBeNull();
  });

  it("returns all-null for junk input", () => {
    expect(parseExtractedServiceInfo(null)).toEqual({
      serviceType: null,
      expiryDate: null,
      cost: null,
    });
  });
});
