import {
  SupabaseRenewalRepository,
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
  spendingOf,
} from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

import { currentAuthUser, currentUser } from "./session";

export type AnalysisVehicle = { id: string; name: string };
export type AnalysisRecord = { vehicleId: string; serviceType: string; cost: number; ts: number };

export type AnalysisData = {
  userEmail: string;
  vehicles: AnalysisVehicle[];
  records: AnalysisRecord[];
};

/** Raw spend data (costed Service Records + Vehicles). The client filters & charts it. */
export async function getAnalysisData(): Promise<AnalysisData | null> {
  const supabase = await createClient();
  // Request-cached: the page shell asks for the same two rows, and pays for them once.
  const authUser = await currentAuthUser();
  if (!authUser) return null;

  const user = await currentUser();
  if (!user) return null;

  const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
  const services = await new SupabaseServiceRecordRepository(supabase).listByUser(user.id);

  // What renewals replaced counts too, each period on the day it was paid (core `spendingOf`).
  const renewalRepo = new SupabaseRenewalRepository(supabase);
  const renewals = (
    await Promise.all(vehicles.map((v) => renewalRepo.listByVehicle(v.id).catch(() => [])))
  ).flat();

  const records: AnalysisRecord[] = spendingOf(services, renewals).map((spend) => ({
    vehicleId: spend.vehicleId,
    serviceType: spend.serviceType,
    cost: spend.cost,
    ts: spend.paidOn.getTime(),
  }));

  return {
    userEmail: authUser.email ?? "",
    vehicles: vehicles.map((v) => ({ id: v.id, name: `${v.brand} ${v.model}` })),
    records,
  };
}
