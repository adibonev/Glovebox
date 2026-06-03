import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  expiryStatus,
  type ExpiryStatus,
  type ReminderWindows,
} from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

import { mapBodyClass, type BodyType } from "./bodyType";
import {
  SERVICE_TYPE_CODES,
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDateShort,
  formatDaysRemaining,
} from "./labels";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Default Reminder Windows per Service Type (days). TODO: per-user reminder_settings.
export const DEFAULT_WINDOWS: ReminderWindows = {
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
  code: string;
  typeLabel: string;
  dateLabel: string;
  status: ExpiryStatus;
  statusLabel: string;
  color: string;
  daysText: string;
  days: number;
};

export type Counts = { valid: number; expiring: number; expired: number };

export type Vehicle = {
  id: string;
  name: string;
  plate: string | null;
  year: number | null;
  bodyType: BodyType;
};

/** Lightweight entry for the vehicle switcher (one per owned Vehicle). */
export type VehicleSummary = {
  id: string;
  name: string;
  plate: string | null;
};

export type DashboardData = {
  userEmail: string;
  /** The Vehicle currently shown (selected via `?v=`, else the first). */
  vehicle: Vehicle | null;
  /** All the User's Vehicles, for the switcher. */
  vehicles: VehicleSummary[];
  urgent: GaugeView | null;
  counts: Counts;
  items: ServiceItemView[];
};

export async function getDashboardData(
  selectedVehicleId?: string,
): Promise<DashboardData | null> {
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

  // All Vehicles (through the repository seam — one mapping place). The dashboard
  // shows exactly one: the `?v=` selection if it's owned, otherwise the first.
  const ownedVehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
  const active =
    ownedVehicles.find((v) => v.id === selectedVehicleId) ?? ownedVehicles[0] ?? null;

  const vehicles: VehicleSummary[] = ownedVehicles.map((v) => ({
    id: v.id,
    name: `${v.brand} ${v.model}`,
    plate: v.plate,
  }));

  // Service Records are scoped to the shown Vehicle (gauge / counts / list).
  const records = active
    ? await new SupabaseServiceRecordRepository(supabase).listByVehicle(active.id)
    : [];
  const today = new Date();

  const window = (serviceType: string) => DEFAULT_WINDOWS[serviceType] ?? 30;

  const enriched = records
    .map((record) => {
      const status: ExpiryStatus = expiryStatus(record, window(record.serviceType), today);
      const days = Math.round((record.expiryDate.getTime() - today.getTime()) / MS_PER_DAY);
      return { record, status, days };
    })
    .sort((a, b) => a.days - b.days);

  const counts: Counts = { valid: 0, expiring: 0, expired: 0 };
  for (const e of enriched) {
    if (e.status === "Valid") counts.valid += 1;
    else if (e.status === "ExpiringSoon") counts.expiring += 1;
    else counts.expired += 1;
  }

  const items: ServiceItemView[] = enriched.map(({ record, status, days }) => ({
    id: record.id,
    code: SERVICE_TYPE_CODES[record.serviceType] ?? "—",
    typeLabel: SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType,
    dateLabel: formatDateShort(record.expiryDate),
    status,
    statusLabel: STATUS_LABELS[status],
    color: STATUS_COLORS[status],
    daysText: formatDaysRemaining(days),
    days,
  }));

  // Most urgent obligation drives the gauge (first after sorting: overdue → soonest).
  const head = enriched[0];
  const urgent: GaugeView | null = head
    ? {
        days: head.days,
        fraction: head.days / window(head.record.serviceType),
        color: STATUS_COLORS[head.status],
        typeLabel: SERVICE_TYPE_LABELS[head.record.serviceType] ?? head.record.serviceType,
        dateLabel: formatDateShort(head.record.expiryDate),
      }
    : null;

  const vehicle: Vehicle | null = active
    ? {
        id: active.id,
        name: `${active.brand} ${active.model}`,
        plate: active.plate,
        year: active.year,
        bodyType: mapBodyClass(null),
      }
    : null;

  return { userEmail: authUser.email ?? "", vehicle, vehicles, urgent, counts, items };
}
