import {
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
  expiryStatus,
  type ExpiryStatus,
} from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

import { SERVICE_TYPE_LABELS, STATUS_COLORS, formatDateShort } from "./labels";
import { getReminderConfig, type ReminderConfig } from "./reminderSettings";
import { currentAuthUser, currentUser } from "./session";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type UpcomingReminder = {
  id: string;
  serviceTypeLabel: string;
  vehicleName: string;
  windowDays: number;
  reminderDateLabel: string;
  expiryDateLabel: string;
  status: ExpiryStatus;
  color: string;
  /** Days until the Reminder fires (negative = the Reminder Window is already open). */
  daysUntilReminder: number;
};

export type RemindersData = {
  userEmail: string;
  config: ReminderConfig;
  upcoming: UpcomingReminder[];
};

export async function getRemindersData(): Promise<RemindersData | null> {
  const supabase = await createClient();
  // Request-cached: the page shell asks for the same two rows, and pays for them once.
  const authUser = await currentAuthUser();
  if (!authUser) return null;

  const user = await currentUser();
  if (!user) return null;

  const config = await getReminderConfig(supabase, user.id);
  const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
  const records = await new SupabaseServiceRecordRepository(supabase).listByUser(user.id);
  const today = new Date();

  const nameById = new Map(vehicles.map((v) => [v.id, `${v.brand} ${v.model}`]));

  const upcoming: UpcomingReminder[] = records
    .map((record) => {
      const windowDays = config.windows[record.serviceType] ?? 30;
      const status = expiryStatus(record, windowDays, today);
      const reminderDate = new Date(record.expiryDate.getTime() - windowDays * MS_PER_DAY);
      const daysUntilReminder = Math.round((reminderDate.getTime() - today.getTime()) / MS_PER_DAY);
      return {
        id: record.id,
        serviceTypeLabel: SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType,
        vehicleName: nameById.get(record.vehicleId) ?? "—",
        windowDays,
        reminderDateLabel: formatDateShort(reminderDate),
        expiryDateLabel: formatDateShort(record.expiryDate),
        status,
        color: STATUS_COLORS[status],
        daysUntilReminder,
      };
    })
    .sort((a, b) => a.daysUntilReminder - b.daysUntilReminder);

  return { userEmail: authUser.email ?? "", config, upcoming };
}
