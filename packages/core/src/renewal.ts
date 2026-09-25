/**
 * Renewal — replacing a Service Record's Expiry Date with a later one once the obligation has
 * been paid for again. Pure, no I/O; `today` is passed in.
 *
 * The app knows an obligation lapsed; it cannot know it was renewed until the User says so. Every
 * expired Service Record is therefore a question left open, and this module is what keeps asking.
 */

import type { ServiceRecord } from "./domain";
import { isExpiringServiceType } from "./reminder";
import { addYears } from "./schedule";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole days from `today` to `date` (negative once it has passed). */
function daysUntil(date: Date, today: Date): number {
  return Math.round((date.getTime() - today.getTime()) / MS_PER_DAY);
}

/**
 * Service Records whose Expiry Date has passed with no new one entered, the longest-lapsed first.
 *
 * The Expiry Date itself still counts as valid (a certificate reads "до … включително"), the
 * same line {@link reminderStage} draws. Dated expenses never lapse, so they are never asked about.
 */
export function pendingRenewals(serviceRecords: ServiceRecord[], today: Date): ServiceRecord[] {
  return serviceRecords
    .filter((record) => isExpiringServiceType(record.serviceType))
    .filter((record) => daysUntil(record.expiryDate, today) < 0)
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
}

/**
 * How a Service Type is renewed: the document that carries the new Expiry Date, or none.
 *
 * - `inspectionScan` — the new Roadworthiness Inspection certificate (date and odometer).
 * - `policyScan` — the new insurance policy (date and premium).
 * - `vignette` — which Vignette was bought and when; the date follows by arithmetic.
 * - `date` — nothing to photograph, so the new date is asked for straight away.
 */
export type RenewalMethod = "inspectionScan" | "policyScan" | "vignette" | "date";

export function renewalMethod(serviceType: string): RenewalMethod {
  if (serviceType === "inspection") return "inspectionScan";
  if (serviceType === "civil_liability" || serviceType === "casco") return "policyScan";
  if (serviceType === "vignette") return "vignette";
  return "date";
}

/**
 * The Expiry Date to offer in the date picker: one year after the old one, which is how long a
 * policy, a Fire Extinguisher check or a year's Vehicle Tax runs. A lapse longer than that means
 * the old date says nothing about the new one, so the year runs from today instead. Only ever a
 * starting point: the User confirms or changes it.
 */
export function suggestedExpiry(previousExpiry: Date, today: Date): Date {
  const next = addYears(previousExpiry, 1);
  return next.getTime() > today.getTime() ? next : addYears(today, 1);
}

/**
 * Where tapping a Reminder's notification leads: straight to renewing the one Service Record it
 * was about, or to the list when it covered several.
 */
export function renewalLink(serviceRecordIds: readonly string[]): string {
  return serviceRecordIds.length === 1 ? `/renew/${serviceRecordIds[0]}` : "/renew";
}
