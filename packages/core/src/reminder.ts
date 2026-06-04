/**
 * Reminder module (ADR-0007) — pure, no I/O. `today` is passed in.
 * First tracer bullet: return the Reminders due for a set of Service Records.
 */

import type { ServiceRecord } from "./domain";

/**
 * Service Types that are one-off **dated expenses**, not expiring obligations (e.g. Repair).
 * They have no Reminder Window, no Expiry Status, and never raise a Reminder — they only
 * carry a date and a cost (for the spend Analysis).
 */
export const NON_EXPIRING_SERVICE_TYPES: ReadonlySet<string> = new Set(["repair"]);

/** True for obligations that lapse (ГО, Каско, …); false for dated expenses (Repair). */
export function isExpiringServiceType(serviceType: string): boolean {
  return !NON_EXPIRING_SERVICE_TYPES.has(serviceType);
}

/** Reminder Window (days before Expiry Date) per Service Type. */
export type ReminderWindows = Record<string, number>;

export interface Reminder {
  serviceRecordId: string;
  serviceType: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole days from `today` to `expiryDate` (negative once expired). Shared by both functions. */
function daysUntil(expiryDate: Date, today: Date): number {
  return Math.round((expiryDate.getTime() - today.getTime()) / MS_PER_DAY);
}

export type ExpiryStatus = "Valid" | "ExpiringSoon" | "Expired";

export function expiryStatus(
  serviceRecord: ServiceRecord,
  window: number,
  today: Date,
): ExpiryStatus {
  const days = daysUntil(serviceRecord.expiryDate, today);
  if (days < 0) return "Expired";
  if (days <= window) return "ExpiringSoon";
  return "Valid";
}

export function dueReminders(
  serviceRecords: ServiceRecord[],
  windows: ReminderWindows,
  today: Date,
): Reminder[] {
  const reminders: Reminder[] = [];

  for (const record of serviceRecords) {
    // Dated expenses (Repair) never raise a Reminder.
    if (NON_EXPIRING_SERVICE_TYPES.has(record.serviceType)) continue;

    const windowDays = windows[record.serviceType];
    if (windowDays === undefined) continue;

    // A Service Record is due exactly when its Expiry Status is ExpiringSoon.
    if (expiryStatus(record, windowDays, today) !== "ExpiringSoon") continue;

    reminders.push({
      serviceRecordId: record.id,
      serviceType: record.serviceType,
      expiryDate: record.expiryDate,
      daysUntilExpiry: daysUntil(record.expiryDate, today),
    });
  }

  return reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}
