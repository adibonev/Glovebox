import {
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
  expiryStatus,
  type ExpiryStatus,
} from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

import { parseBodyType, type BodyType } from "./bodyType";
import { type Counts } from "./dashboard";
import { SERVICE_TYPE_LABELS, STATUS_COLORS, formatDaysRemaining } from "./labels";
import { getReminderConfig } from "./reminderSettings";
import { currentAuthUser, currentUser } from "./session";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type GarageVehicleUrgent = {
  typeLabel: string;
  status: ExpiryStatus;
  color: string;
  daysText: string;
};

/** A Vehicle as shown on the garage page: identity + a status summary across its Service Records. */
export type GarageVehicle = {
  id: string;
  name: string;
  plate: string | null;
  year: number | null;
  bodyType: BodyType;
  serviceCount: number;
  counts: Counts;
  /** The single most pressing obligation, if any (drives the card's headline). */
  urgent: GarageVehicleUrgent | null;
};

export type GarageData = {
  userEmail: string;
  vehicles: GarageVehicle[];
};

export async function getGarage(): Promise<GarageData | null> {
  const supabase = await createClient();
  // Request-cached: the page shell asks for the same two rows, and pays for them once.
  const authUser = await currentAuthUser();
  if (!authUser) return null;

  const user = await currentUser();
  if (!user) return null;

  const ownedVehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
  const records = await new SupabaseServiceRecordRepository(supabase).listByUser(user.id);
  const { windows } = await getReminderConfig(supabase, user.id);
  const today = new Date();
  const window = (serviceType: string) => windows[serviceType] ?? 30;

  const vehicles: GarageVehicle[] = ownedVehicles.map((v) => {
    const enriched = records
      .filter((r) => r.vehicleId === v.id)
      .map((record) => ({
        record,
        status: expiryStatus(record, window(record.serviceType), today),
        days: Math.round((record.expiryDate.getTime() - today.getTime()) / MS_PER_DAY),
      }))
      .sort((a, b) => a.days - b.days);

    const counts: Counts = { valid: 0, expiring: 0, expired: 0 };
    for (const e of enriched) {
      if (e.status === "Valid") counts.valid += 1;
      else if (e.status === "ExpiringSoon") counts.expiring += 1;
      else counts.expired += 1;
    }

    const head = enriched.find((e) => e.status !== "Valid") ?? enriched[0];
    const urgent: GarageVehicleUrgent | null = head
      ? {
          typeLabel: SERVICE_TYPE_LABELS[head.record.serviceType] ?? head.record.serviceType,
          status: head.status,
          color: STATUS_COLORS[head.status],
          daysText: formatDaysRemaining(head.days),
        }
      : null;

    return {
      id: v.id,
      name: `${v.brand} ${v.model}`,
      plate: v.plate,
      year: v.year,
      bodyType: parseBodyType(v.bodyType),
      serviceCount: enriched.length,
      counts,
      urgent,
    };
  });

  return { userEmail: authUser.email ?? "", vehicles };
}
