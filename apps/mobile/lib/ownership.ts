import { SupabaseVehicleRepository } from "@glovebox/core";

import { supabase } from "./supabase";

const vehicleRepo = new SupabaseVehicleRepository(supabase);

/**
 * The users.id a new Service Record, Mileage Reading or Document on this Vehicle is written
 * under: always the owner's, also when a family member it is shared with writes it. That is the
 * database's rule (the sharing migration), and it keeps the owner's lists and quotas whole.
 */
export async function recordOwner(vehicleId: string): Promise<string> {
  const vehicle = await vehicleRepo.getById(vehicleId);
  if (!vehicle) throw new Error("Колата не е намерена.");
  return vehicle.userId;
}
