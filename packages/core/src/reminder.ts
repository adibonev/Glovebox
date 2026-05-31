/**
 * Reminder module (ADR-0007) — pure, no I/O. `today` is passed in.
 * First tracer bullet: return the Reminders due for a set of Service Records.
 */

export interface ServiceRecord {
  id: string;
  serviceType: string;
  expiryDate: Date;
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
  throw new Error("expiryStatus: not implemented for non-expired records yet");
}

export function dueReminders(
  serviceRecords: ServiceRecord[],
  windows: ReminderWindows,
  today: Date,
): Reminder[] {
  const reminders: Reminder[] = [];

  for (const record of serviceRecords) {
    const windowDays = windows[record.serviceType];
    if (windowDays === undefined) continue;

    const daysUntilExpiry = daysUntil(record.expiryDate, today);

    if (daysUntilExpiry >= 0 && daysUntilExpiry <= windowDays) {
      reminders.push({
        serviceRecordId: record.id,
        serviceType: record.serviceType,
        expiryDate: record.expiryDate,
        daysUntilExpiry,
      });
    }
  }

  return reminders.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}
