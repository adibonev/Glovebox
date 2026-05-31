import type { Reminder, ReminderWindows } from "./reminder";
import { dueReminders } from "./reminder";
import type { ServiceRecordRepository } from "./repository";

/**
 * Use-case: the due Reminders for a User. Loads the User's Service Records through
 * the repository seam, then applies the pure dueReminders rule (ADR-0007). Thin
 * glue — all behaviour lives in the repository adapter and the Reminder module.
 */
export async function dueRemindersForUser(
  repository: ServiceRecordRepository,
  userId: string,
  windows: ReminderWindows,
  today: Date,
): Promise<Reminder[]> {
  const serviceRecords = await repository.listByUser(userId);
  return dueReminders(serviceRecords, windows, today);
}
