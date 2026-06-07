/**
 * Registry Check (seam): a lookup against an official government registry that returns the Expiry
 * Status / Expiry Date for one Service Type of one Vehicle, keyed by registration plate.
 *
 * Pure here — normalising the plate and defensively parsing a raw registry response into a Check
 * Result. The actual HTTP lives at the edge (apps/web/app/api/registry-check/route.ts), mirroring
 * the extraction seam (core = logic, route = fetch). First and ONLY source in this module:
 * Roadworthiness Inspection (`inspection`) via Изпълнителна агенция "Автомобилна администрация"
 * (rta.government.bg). Other Service Types / sources arrive as separate adapters behind this port.
 */

import type { ServiceRecord } from "./domain";
import { expiryStatus } from "./reminder";

/** The derived state of a Registry Check (lower-case, distinct from the in-app `ExpiryStatus`). */
export type CheckStatus = "valid" | "expiring" | "expired" | "unknown";

/** The outcome of a Registry Check (UBIQUITOUS_LANGUAGE.md → Check Result). */
export interface CheckResult {
  serviceType: string;
  /** Valid-until date as ISO `YYYY-MM-DD`, or null when the registry didn't yield one. */
  expiryDate: string | null;
  status: CheckStatus;
  /** ISO timestamp of when the Registry Check was performed. */
  checkedAt: string;
  /** Where the result came from, e.g. "rta.government.bg". */
  source: string;
}

/** A port that performs a Registry Check by registration plate. */
export interface RegistryChecker {
  check(plate: string): Promise<CheckResult>;
}

/** Source label for the Roadworthiness Inspection registry. */
export const RTA_SOURCE = "rta.government.bg";

/** Default Reminder Window (days) for deriving `expiring` when none is supplied. */
const DEFAULT_INSPECTION_WINDOW = 30;

// Bulgarian plates use the 12 Cyrillic letters that look like Latin — canonicalise to Latin.
const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H",
  О: "O", Р: "P", С: "C", Т: "T", У: "Y", Х: "X",
};

/** Canonical plate: upper-case, no spaces/punctuation, Cyrillic look-alikes mapped to Latin. */
export function normalizePlate(plate: string): string {
  return plate
    .toUpperCase()
    .replace(/[^0-9A-ZА-Я]/gu, "")
    .split("")
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join("");
}

/** Parse an ISO `YYYY-MM-DD` or Bulgarian `DD.MM.YYYY` date into ISO, or null if unrecognisable. */
function parseDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) {
    const date = `${iso[1]}-${iso[2]}-${iso[3]}`;
    return Number.isNaN(Date.parse(date)) ? null : date;
  }

  const bg = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (bg) {
    const date = `${bg[3]}-${bg[2]}-${bg[1]}`;
    return Number.isNaN(Date.parse(date)) ? null : date;
  }

  return null;
}

// Raw fields a Roadworthiness Inspection response might carry the valid-until date under.
const DATE_KEYS = [
  "validUntil",
  "valid_until",
  "validTo",
  "valid_to",
  "expiryDate",
  "expiry_date",
  "nextInspection",
  "next_inspection",
];

/**
 * Defensively turn a raw rta.government.bg inspection response into a Check Result. Never trusts
 * the raw shape: a recognisable date → valid/expiring/expired via the same Reminder Window logic;
 * anything else → `unknown` with a null Expiry Date.
 */
export function normalizeInspectionResult(
  raw: unknown,
  today: Date = new Date(),
  window: number = DEFAULT_INSPECTION_WINDOW,
): CheckResult {
  const base = {
    serviceType: "inspection",
    checkedAt: today.toISOString(),
    source: RTA_SOURCE,
  };

  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  let expiryDate: string | null = null;
  for (const key of DATE_KEYS) {
    const parsed = parseDate(obj[key]);
    if (parsed) {
      expiryDate = parsed;
      break;
    }
  }

  if (!expiryDate) return { ...base, expiryDate: null, status: "unknown" };

  const record: ServiceRecord = {
    id: "registry",
    vehicleId: "registry",
    serviceType: "inspection",
    expiryDate: new Date(expiryDate),
    cost: null,
  };
  const inApp = expiryStatus(record, window, today);
  const status: CheckStatus = inApp === "Valid" ? "valid" : inApp === "Expired" ? "expired" : "expiring";

  return { ...base, expiryDate, status };
}

/** Throttle: a Vehicle is rechecked at most once per day (null/over-24h → recheck). */
export function shouldRecheck(lastCheckedAt: string | null | undefined, today: Date): boolean {
  if (!lastCheckedAt) return true;
  const last = Date.parse(lastCheckedAt);
  if (Number.isNaN(last)) return true;
  const DAY_MS = 24 * 60 * 60 * 1000;
  return today.getTime() - last >= DAY_MS;
}

/** In-memory Registry Checker for tests / a fake adapter (keyed by normalized plate). */
export class InMemoryRegistryChecker implements RegistryChecker {
  constructor(private readonly results: Record<string, CheckResult> = {}) {}

  async check(plate: string): Promise<CheckResult> {
    const found = this.results[normalizePlate(plate)];
    if (found) return found;
    return {
      serviceType: "inspection",
      expiryDate: null,
      status: "unknown",
      checkedAt: new Date().toISOString(),
      source: "in-memory",
    };
  }
}
