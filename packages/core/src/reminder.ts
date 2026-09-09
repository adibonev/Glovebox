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

/**
 * How far along the run-up to an Expiry Date a Reminder is.
 *
 * One warning is not enough. A driver told fifteen days ahead that the policy runs out puts it
 * off, and by the time it matters the message is buried. So the app says it again as the date
 * closes in, and once more after it has passed — the last one being the only message that can
 * still save a fine.
 */
export type ReminderStage = "window" | "twoDays" | "oneDay" | "expired";

export interface Reminder {
  serviceRecordId: string;
  serviceType: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  stage: ReminderStage;
}

/**
 * Which step of the ladder a Service Record is on, or null while it is not due at all.
 *
 * The Expiry Date itself still counts as valid: a document valid "до 17.08.2027 включително"
 * covers the whole of that day, so the day it runs out is the last day, not the first day late.
 */
export function reminderStage(daysUntilExpiry: number, window: number): ReminderStage | null {
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 1) return "oneDay";
  if (daysUntilExpiry <= 2) return "twoDays";
  if (daysUntilExpiry <= window) return "window";
  return null;
}

/**
 * Whether this step also goes out by e-mail.
 *
 * Only the first one does. It arrives while there is still time to act on a desk, and it is the
 * step the User chose the timing of. The rest are the phone tapping a shoulder — an e-mail
 * saying "24 hours left" that is read the next morning is worse than nothing.
 */
export function remindByEmail(stage: ReminderStage): boolean {
  return stage === "window";
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

    const daysUntilExpiry = daysUntil(record.expiryDate, today);
    const stage = reminderStage(daysUntilExpiry, windowDays);
    if (!stage) continue;

    reminders.push({
      serviceRecordId: record.id,
      serviceType: record.serviceType,
      expiryDate: record.expiryDate,
      daysUntilExpiry,
      stage,
    });
  }

  return reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}
