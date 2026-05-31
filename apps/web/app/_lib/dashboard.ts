import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  dueReminders,
  expiryStatus,
  type ReminderWindows,
} from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

import {
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDate,
  formatDaysRemaining,
} from "./labels";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Default Reminder Windows per Service Type (days). TODO: per-user reminder_settings.
const DEFAULT_WINDOWS: ReminderWindows = {
  civil_liability: 30,
  casco: 30,
  vignette: 14,
  inspection: 30,
  tax: 30,
  fire_extinguisher: 30,
  maintenance: 30,
};

export type GaugeView = {
  days: number;
  fraction: number;
  color: string;
  typeLabel: string;
  dateLabel: string;
};

export type ServiceItemView = {
  id: string;
  typeLabel: string;
  statusLabel: string;
  color: string;
  daysText: string;
  days: number;
};

export type DashboardData = {
  vehicle: { name: string; plate: string | null; year: number | null } | null;
  urgent: GaugeView | null;
  items: ServiceItemView[];
};

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Demo bootstrap: give a brand-new account one Vehicle and a few obligations so the
 * dashboard isn't empty. Dates are relative to now. Remove once Vehicle/Service CRUD exists.
 */
async function ensureDemoData(supabase: ServerClient, userId: number): Promise<void> {
  const { count } = await supabase
    .from("cars")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (count && count > 0) return;

  const { data: car } = await supabase
    .from("cars")
    .insert({ user_id: userId, brand: "BMW", model: "320d", year: 2019, license_plate: "СВ 4521 КХ" })
    .select("id")
    .single();
  if (!car) return;

  const now = Date.now();
  const inDays = (days: number) => isoDate(new Date(now + days * MS_PER_DAY));
  await supabase.from("services").insert([
    { car_id: car.id, user_id: userId, service_type: "civil_liability", expiry_date: inDays(12) },
    { car_id: car.id, user_id: userId, service_type: "vignette", expiry_date: inDays(-5) },
    { car_id: car.id, user_id: userId, service_type: "inspection", expiry_date: inDays(19) },
    { car_id: car.id, user_id: userId, service_type: "tax", expiry_date: inDays(75) },
    { car_id: car.id, user_id: userId, service_type: "casco", expiry_date: inDays(157) },
  ]);
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  // Resolve / provision the app User for this Auth Identity.
  const userRepo = new SupabaseUserRepository(supabase);
  const user =
    (await userRepo.findByAuthId(authUser.id)) ??
    (await userRepo.create({ authUserId: authUser.id, email: authUser.email ?? "" }));
  const userId = Number(user.id);

  await ensureDemoData(supabase, userId);

  const { data: car } = await supabase
    .from("cars")
    .select("brand, model, year, license_plate")
    .eq("user_id", userId)
    .order("id")
    .limit(1)
    .maybeSingle();

  const records = await new SupabaseServiceRecordRepository(supabase).listByUser(user.id);
  const today = new Date();

  const items: ServiceItemView[] = records
    .map((record) => {
      const status = expiryStatus(record, DEFAULT_WINDOWS[record.serviceType] ?? 30, today);
      const days = Math.round((record.expiryDate.getTime() - today.getTime()) / MS_PER_DAY);
      return {
        id: record.id,
        typeLabel: SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType,
        statusLabel: STATUS_LABELS[status],
        color: STATUS_COLORS[status],
        daysText: formatDaysRemaining(days),
        days,
      };
    })
    .sort((a, b) => a.days - b.days);

  const top = dueReminders(records, DEFAULT_WINDOWS, today)[0];
  const urgent: GaugeView | null = top
    ? {
        days: top.daysUntilExpiry,
        fraction: top.daysUntilExpiry / (DEFAULT_WINDOWS[top.serviceType] ?? 30),
        color: STATUS_COLORS.ExpiringSoon,
        typeLabel: SERVICE_TYPE_LABELS[top.serviceType] ?? top.serviceType,
        dateLabel: formatDate(top.expiryDate),
      }
    : null;

  const vehicle = car
    ? { name: `${car.brand} ${car.model}`, plate: car.license_plate, year: car.year }
    : null;

  return { vehicle, urgent, items };
}
