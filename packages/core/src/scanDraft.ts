/**
 * Scan Draft — what a scanned document proposes, and what the User still has to supply.
 * Pure, no I/O.
 *
 * A Draft is never written straight to the store: it fills the confirmation screen, the User
 * corrects it, and only then does it become a Vehicle and a Service Record. {@link onboardingGaps}
 * backs the closing step of the onboarding — the screen listing everything still to be entered
 * by hand.
 */

import {
  parseCertificateQr,
  readInspectionCertificate,
  readPolicy,
  type CertificateRef,
  type InspectionScan,
} from "./documentScan";

/** Vehicle fields a scan can propose. Every one may be null — the User fills the rest. */
export interface VehicleDraft {
  brand: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  vin: string | null;
}

/** A Service Record a scan proposes. */
export interface ServiceRecordDraft {
  serviceType: string;
  expiryDate: Date;
  cost: number | null;
}

/** Everything one scanned Roadworthiness Inspection certificate yields. */
export interface InspectionDraft {
  vehicle: VehicleDraft;
  /** Null when no Expiry Date could be read — there is then nothing to remind about. */
  serviceRecord: ServiceRecordDraft | null;
  /**
   * Date of first registration. Not a Vehicle column, but worth carrying: the statutory
   * Inspection schedule follows from it for every year after this certificate expires.
   */
  firstRegistration: Date | null;
  /**
   * The official public check for this certificate, stored so the User can open the full
   * record themselves. Null when the document carried no QR code (certificates predating it).
   */
  certificateUrl: string | null;
}

/** Assemble the drafts a scanned Inspection certificate proposes. */
export function buildInspectionDraft(
  scan: InspectionScan,
  certificate: CertificateRef | null,
): InspectionDraft {
  return {
    vehicle: {
      brand: scan.brand,
      model: scan.model,
      // The certificate carries no model year, but first registration implies it closely enough
      // to save the User a field. They can correct it on the confirmation screen.
      year: scan.firstRegistration?.getUTCFullYear() ?? null,
      plate: scan.plate,
      vin: scan.vin,
    },
    serviceRecord: scan.expiryDate
      ? { serviceType: "inspection", expiryDate: scan.expiryDate, cost: null }
      : null,
    firstRegistration: scan.firstRegistration,
    certificateUrl: certificate?.url ?? null,
  };
}

/**
 * What a platform read off one photographed document. The reading itself happens at the edge —
 * the camera decodes QR codes, an OCR engine (or a PDF text layer) produces the text — and this
 * module only interprets it. Same split as the Registry Check seam: `core` holds the logic, the
 * app holds the I/O.
 */
export interface DocumentScanInput {
  /** Printed text read off the document. */
  text: string;
  /** Payloads of any QR codes in the same frame; order does not matter. */
  qrPayloads?: readonly string[];
}

/**
 * Read one photographed Roadworthiness Inspection certificate into a confirmable Draft — the
 * single entry point the apps call after capturing a document.
 */
export function scanInspectionDocument(input: DocumentScanInput): InspectionDraft {
  // The frame may hold several codes (a station sticker, a hologram); take the first that is
  // actually an Inspection certificate and ignore the rest.
  const certificate =
    (input.qrPayloads ?? []).map(parseCertificateQr).find((ref) => ref !== null) ?? null;

  return buildInspectionDraft(readInspectionCertificate(input.text), certificate);
}

/** The Service Types whose document a camera can actually read. */
export const SCANNABLE_SERVICE_TYPES = ["inspection", "civil_liability", "casco"] as const;

/** Everything one photographed insurance policy yields. */
export interface PolicyDraft {
  /** Null when no Expiry Date could be read — there is then nothing to remind about. */
  serviceRecord: ServiceRecordDraft | null;
  /**
   * The vehicle the policy is written for.
   *
   * Worth carrying even though it is not saved: a policy for the wrong car is the one mistake a
   * User cannot catch on a confirmation form, because every date on it is genuine. Comparing
   * this against the Vehicle turns that into something the app can point at.
   */
  insuredVehicle: { plate: string | null; vin: string | null };
}

/**
 * Read one photographed insurance policy into a confirmable Draft.
 *
 * The Service Type is told, not guessed: Civil Liability and Casco policies are laid out alike,
 * and the User has already said which one they are photographing.
 */
export function scanPolicyDocument(
  input: DocumentScanInput,
  serviceType: "civil_liability" | "casco",
): PolicyDraft {
  const policy = readPolicy(input.text);

  return {
    serviceRecord: policy.expiryDate
      ? { serviceType, expiryDate: policy.expiryDate, cost: policy.cost }
      : null,
    insuredVehicle: { plate: policy.plate, vin: policy.vin },
  };
}

/** Vehicle fields in the order the confirmation screen shows them. */
const VEHICLE_FIELDS = ["brand", "model", "year", "plate", "vin"] as const;

/** The Vehicle fields a Draft left empty, in display order. */
export function missingVehicleFields(vehicle: VehicleDraft): (keyof VehicleDraft)[] {
  return VEHICLE_FIELDS.filter((field) => vehicle[field] == null);
}

/**
 * The Service Types the onboarding walks through, in the order it asks for them: the Inspection
 * certificate first (it creates the Vehicle), then the two insurances, then the three the User
 * types in by hand. Repair is absent by design — it is a dated expense, not an obligation with
 * an Expiry Date (UBIQUITOUS_LANGUAGE.md).
 */
export const ONBOARDING_SERVICE_TYPES = [
  "inspection",
  "civil_liability",
  "casco",
  "vignette",
  "tax",
  "fire_extinguisher",
] as const;

/** What the User still has to enter by hand once the scanning steps are done. */
export interface OnboardingGaps {
  vehicleFields: (keyof VehicleDraft)[];
  serviceTypes: string[];
}

/**
 * What the closing step of the onboarding should ask for: the Vehicle fields no scan filled,
 * and the Service Types with no Service Record yet.
 */
export function onboardingGaps(
  vehicle: VehicleDraft,
  recordedServiceTypes: readonly string[],
): OnboardingGaps {
  const recorded = new Set(recordedServiceTypes);
  return {
    vehicleFields: missingVehicleFields(vehicle),
    serviceTypes: ONBOARDING_SERVICE_TYPES.filter((type) => !recorded.has(type)),
  };
}
