import type { ReminderWindows, ServiceRecord } from "@glovebox/core";

// Sample data for the first screen — replaced by Supabase later. `today` is fixed so
// the demo's Expiry Statuses are deterministic.
export const today = new Date("2026-06-01");

export const sampleVehicle = {
  name: "BMW 320d",
  plate: "СВ 4521 КХ",
  year: 2019,
};

export const sampleWindows: ReminderWindows = {
  civil_liability: 30,
  casco: 30,
  vignette: 14,
  inspection: 30,
  tax: 30,
};

export const sampleServiceRecords: ServiceRecord[] = [
  { id: "go", vehicleId: "v1", serviceType: "civil_liability", expiryDate: new Date("2026-06-13") },
  { id: "vignette", vehicleId: "v1", serviceType: "vignette", expiryDate: new Date("2026-05-27") },
  { id: "inspection", vehicleId: "v1", serviceType: "inspection", expiryDate: new Date("2026-06-20") },
  { id: "tax", vehicleId: "v1", serviceType: "tax", expiryDate: new Date("2026-08-15") },
  { id: "casco", vehicleId: "v1", serviceType: "casco", expiryDate: new Date("2026-11-05") },
];
