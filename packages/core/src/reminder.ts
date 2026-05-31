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
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function dueReminders(
  serviceRecords: ServiceRecord[],
  windows: ReminderWindows,
  today: Date,
): Reminder[] {
  const reminders: Reminder[] = [];

  for (const record of serviceRecords) {
    const windowDays = windows[record.serviceType];
    if (windowDays === undefined) continue;

    const daysUntilExpiry = Math.round(
      (record.expiryDate.getTime() - today.getTime()) / MS_PER_DAY,
    );

    if (daysUntilExpiry <= windowDays) {
      reminders.push({
        serviceRecordId: record.id,
        serviceType: record.serviceType,
      });
    }
  }

  return reminders;
}
