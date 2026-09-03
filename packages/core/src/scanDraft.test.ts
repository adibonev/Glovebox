import { describe, expect, it } from "vitest";

import { certificateCheckUrl } from "./documentScan";
import { buildInspectionDraft, missingVehicleFields, onboardingGaps } from "./scanDraft";

const AUDI_SCAN = {
  plate: "EH9697KA",
  vin: "WAUZZZ4G4CN031801",
  brand: "Audi",
  model: "A 6",
  firstRegistration: new Date("2011-09-05"),
  inspectionDate: new Date("2026-08-17"),
  expiryDate: new Date("2027-08-17"),
  mileageKm: 369786,
};

const NOTHING_READ = {
  plate: null,
  vin: null,
  brand: null,
  model: null,
  firstRegistration: null,
  inspectionDate: null,
  expiryDate: null,
  mileageKm: null,
};

describe("buildInspectionDraft", () => {
  it("turns a scanned certificate into a Vehicle draft", () => {
    const draft = buildInspectionDraft(AUDI_SCAN, null);

    expect(draft.vehicle).toEqual({
      brand: "Audi",
      model: "A 6",
      year: 2011,
      plate: "EH9697KA",
      vin: "WAUZZZ4G4CN031801",
    });
  });

  it("derives the model year from the date of first registration", () => {
    expect(buildInspectionDraft(AUDI_SCAN, null).vehicle.year).toBe(2011);
  });

  it("creates a Roadworthiness Inspection Service Record at the certificate's Expiry Date", () => {
    const draft = buildInspectionDraft(AUDI_SCAN, null);

    expect(draft.serviceRecord).toEqual({
      serviceType: "inspection",
      expiryDate: new Date("2027-08-17"),
      cost: null,
    });
  });

  it("keeps the date of first registration, which drives every later Inspection", () => {
    expect(buildInspectionDraft(AUDI_SCAN, null).firstRegistration).toEqual(
      new Date("2011-09-05"),
    );
  });

  it("stores the official check link when the certificate QR was read", () => {
    const certificate = {
      certNumber: "117142271-C7C5C2D1E3B9-57",
      url: certificateCheckUrl("117142271-C7C5C2D1E3B9-57"),
    };

    expect(buildInspectionDraft(AUDI_SCAN, certificate).certificateUrl).toBe(certificate.url);
  });

  it("has no check link when no QR was found on the document", () => {
    expect(buildInspectionDraft(AUDI_SCAN, null).certificateUrl).toBeNull();
  });

  it("raises no Service Record when the Expiry Date could not be read", () => {
    // Without an Expiry Date there is nothing to remind about — the User supplies it by hand.
    const draft = buildInspectionDraft({ ...AUDI_SCAN, expiryDate: null }, null);

    expect(draft.serviceRecord).toBeNull();
  });
});

describe("missingVehicleFields", () => {
  it("reports nothing missing when the scan filled every Vehicle field", () => {
    expect(missingVehicleFields(buildInspectionDraft(AUDI_SCAN, null).vehicle)).toEqual([]);
  });

  it("names every Vehicle field the scan could not fill", () => {
    const draft = buildInspectionDraft(NOTHING_READ, null);

    expect(missingVehicleFields(draft.vehicle)).toEqual(["brand", "model", "year", "plate", "vin"]);
  });
});

describe("onboardingGaps", () => {
  it("lists the Service Types the User has not recorded yet", () => {
    // After scanning only the Inspection certificate, everything else is still open.
    const gaps = onboardingGaps(buildInspectionDraft(AUDI_SCAN, null).vehicle, ["inspection"]);

    expect(gaps.vehicleFields).toEqual([]);
    expect(gaps.serviceTypes).toEqual([
      "civil_liability",
      "casco",
      "vignette",
      "tax",
      "fire_extinguisher",
    ]);
  });

  it("reports both the empty Vehicle fields and the missing Service Types", () => {
    const gaps = onboardingGaps({ brand: "Audi", model: null, year: null, plate: "EH9697KA", vin: null }, [
      "inspection",
      "civil_liability",
    ]);

    expect(gaps.vehicleFields).toEqual(["model", "year", "vin"]);
    expect(gaps.serviceTypes).toEqual(["casco", "vignette", "tax", "fire_extinguisher"]);
  });

  it("is empty once every Vehicle field and every Service Type is covered", () => {
    const gaps = onboardingGaps(buildInspectionDraft(AUDI_SCAN, null).vehicle, [
      "inspection",
      "civil_liability",
      "casco",
      "vignette",
      "tax",
      "fire_extinguisher",
    ]);

    expect(gaps.vehicleFields).toEqual([]);
    expect(gaps.serviceTypes).toEqual([]);
  });

  it("ignores a Repair, which is a dated expense and never part of onboarding", () => {
    const gaps = onboardingGaps(buildInspectionDraft(AUDI_SCAN, null).vehicle, [
      "inspection",
      "repair",
    ]);

    expect(gaps.serviceTypes).not.toContain("repair");
  });
});
