import {
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
  expiryStatus,
  isExpiringServiceType,
  type ExpiryStatus,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";

import { createClient } from "@/lib/supabase/server";

import { parseBodyType, type BodyType } from "./bodyType";
import {
  SERVICE_TYPE_CODES,
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatCost,
  formatDateShort,
  formatDaysRemaining,
} from "./labels";
import { getReminderConfig } from "./reminderSettings";
import { currentAuthUser, currentUser } from "./session";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type GaugeView = {
  days: number;
  fraction: number;
  color: string;
  typeLabel: string;
  dateLabel: string;
};

export type ServiceItemView = {
  id: string;
  serviceType: string;
  code: string;
  typeLabel: string;
  dateLabel: string;
  status: ExpiryStatus;
  statusLabel: string;
  color: string;
  daysText: string;
  days: number;
  /** True for non-expiring types (Repair) — shown as a dated expense, no status/days. */
  isExpense: boolean;
  /** Recorded cost (EUR), formatted (e.g. "120,00 €") or null. */
  costLabel: string | null;
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
  const authUser = await currentAuthUser();
  if (!authUser) return null;

  // Resolve / provision the app User for this Auth Identity (request-cached).
  const user = await currentUser();
  if (!user) return null;

  // All Vehicles (through the repository seam — one mapping place) and the User's Reminder
  // Windows. Neither depends on the other, so they share one round trip's latency. The
  // dashboard shows exactly one Vehicle: the `?v=` selection if owned, otherwise the first.
  const [ownedVehicles, { windows }] = await Promise.all([
    new SupabaseVehicleRepository(supabase).listByUser(user.id),
    getReminderConfig(supabase, user.id),
  ]);
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

  // Reminder Windows come from the User's settings (falling back to defaults).
  const window = (serviceType: string) => windows[serviceType] ?? 30;

  const enriched = records
    .map((record) => {
      const expiring = isExpiringServiceType(record.serviceType);
      // Non-expiring types (Repair) have no Expiry Status — placeholder, never shown.
      const status: ExpiryStatus = expiring
        ? expiryStatus(record, window(record.serviceType), today)
        : "Valid";
      const days = Math.round((record.expiryDate.getTime() - today.getTime()) / MS_PER_DAY);
      return { record, status, days, expiring };
    })
    // Obligations first (by urgency), then expenses (newest first).
    .sort((a, b) => {
      if (a.expiring !== b.expiring) return a.expiring ? -1 : 1;
      if (a.expiring) return a.days - b.days;
      return b.record.expiryDate.getTime() - a.record.expiryDate.getTime();
    });

  const counts: Counts = { valid: 0, expiring: 0, expired: 0 };
  for (const e of enriched) {
    if (!e.expiring) continue; // expenses carry no status
    if (e.status === "Valid") counts.valid += 1;
    else if (e.status === "ExpiringSoon") counts.expiring += 1;
    else counts.expired += 1;
  }

  const items: ServiceItemView[] = enriched.map(({ record, status, days, expiring }) => ({
    id: record.id,
    serviceType: record.serviceType,
    code: SERVICE_TYPE_CODES[record.serviceType] ?? "—",
    typeLabel: SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType,
    dateLabel: formatDateShort(record.expiryDate),
    status,
    statusLabel: STATUS_LABELS[status],
    color: expiring ? STATUS_COLORS[status] : colors.muted,
    daysText: formatDaysRemaining(days),
    days,
    isExpense: !expiring,
    costLabel: formatCost(record.cost),
  }));

  // Most urgent obligation drives the gauge (first EXPIRING after sorting: overdue → soonest).
  // Within a few days of expiry (or already expired) the gauge turns red — critical.
  const CRITICAL_DAYS = 3;
  const head = enriched.find((e) => e.expiring);
  const urgent: GaugeView | null = head
    ? {
        days: head.days,
        fraction: head.days / window(head.record.serviceType),
        color: head.days <= CRITICAL_DAYS ? STATUS_COLORS.Expired : STATUS_COLORS[head.status],
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
        bodyType: parseBodyType(active.bodyType),
      }
    : null;

  return { userEmail: authUser.email ?? "", vehicle, vehicles, urgent, counts, items };
}
