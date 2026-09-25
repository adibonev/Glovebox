import {
  SupabaseMileageReadingRepository,
  SupabasePassportLinkRepository,
  SupabaseRenewalRepository,
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
  vehiclePassport,
  type ExpiryStatus,
  type MileageSource,
  type PassportLink,
  type VehiclePassport,
} from "@glovebox/core";

import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

import { FUEL_TYPE_LABELS } from "./fuelType";
import { SERVICE_TYPE_LABELS, formatCost } from "./labels";

/** A token is 32 hex characters (see the passport migration). Anything else is not looked up. */
const TOKEN = /^[0-9a-f]{32}$/;

export type LoadedPassport = { passport: VehiclePassport; link: PassportLink };

/**
 * A passport as whoever holds its link sees it. Resolved with the service role, because the
 * person opening it is usually not signed in, and scoped entirely by the link: the token names
 * one Vehicle and nothing else is read.
 */
export async function passportByToken(token: string, today = new Date()): Promise<LoadedPassport | null> {
  if (!TOKEN.test(token)) return null;
  const admin = createAdminClient();

  const link = await new SupabasePassportLinkRepository(admin).findActiveByToken(token);
  if (!link) return null;
  const vehicle = await new SupabaseVehicleRepository(admin).getById(link.vehicleId);
  if (!vehicle) return null;

  const [serviceRecords, renewals, mileageReadings] = await Promise.all([
    new SupabaseServiceRecordRepository(admin).listByVehicle(link.vehicleId),
    new SupabaseRenewalRepository(admin).listByVehicle(link.vehicleId),
    new SupabaseMileageReadingRepository(admin).listByVehicle(link.vehicleId),
  ]);

  return {
    passport: vehiclePassport(
      { vehicle, serviceRecords, renewals, mileageReadings },
      { today, includeCosts: link.includeCosts },
    ),
    link,
  };
}

/** The address a Passport Link opens, and the one its QR code carries. */
export function passportUrl(token: string): string {
  return `${SITE_URL}/p/${token}`;
}

// ---- wording, shared by the page and the PDF so the two never disagree -------------------

const pad = (n: number) => String(n).padStart(2, "0");

/** "15.09.2026". Dates are stored as UTC midnights, so UTC fields are the calendar day. */
export function passportDate(date: Date): string {
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

const kmFormatter = new Intl.NumberFormat("bg-BG");

export function passportKm(km: number): string {
  return `${kmFormatter.format(km)} км`;
}

/** Worded around "срок", so it agrees with every Service Type (преглед, каско, винетка). */
export const PASSPORT_STATUS: Record<ExpiryStatus, string> = {
  Valid: "В сила",
  ExpiringSoon: "Изтича скоро",
  Expired: "Изтекъл срок",
};

/** For an obligation the Vehicle no longer has, and only its history remains. */
export const PASSPORT_STATUS_ENDED = "Вече не се води";

export const MILEAGE_SOURCE: Record<MileageSource | "unknown", string> = {
  certificate: "От удостоверение за ГТП",
  manual: "Въведен ръчно",
  unknown: "Без отбелязан източник",
};

export function mileageSourceLabel(source: MileageSource | null): string {
  return MILEAGE_SOURCE[source ?? "unknown"];
}

export function serviceTypeLabel(serviceType: string): string {
  return SERVICE_TYPE_LABELS[serviceType] ?? serviceType;
}

export function passportCost(cost: number | null): string | null {
  return formatCost(cost);
}

/** "2016 · Дизел", from whichever of the two are known. */
export function vehicleFacts(vehicle: VehiclePassport["vehicle"]): string {
  const fuel = vehicle.fuelType ? FUEL_TYPE_LABELS[vehicle.fuelType as keyof typeof FUEL_TYPE_LABELS] : null;
  return [vehicle.year ? String(vehicle.year) : null, fuel].filter(Boolean).join(" · ");
}

/** What the passport can and cannot vouch for, in the owner's and a buyer's terms. */
export const PASSPORT_FOOTNOTE =
  "Съставен от Glovebox по данните, които собственикът е въвел. Километрите, отбелязани „От удостоверение за ГТП“, са прочетени от снимка на удостоверението и не са променяни на ръка. Връзката показва данните към момента, в който я отвориш.";
