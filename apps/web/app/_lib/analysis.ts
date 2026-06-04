import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
} from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

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
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const userRepo = new SupabaseUserRepository(supabase);
  const user =
    (await userRepo.findByAuthId(authUser.id)) ??
    (await userRepo.create({ authUserId: authUser.id, email: authUser.email ?? "" }));

  const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
  const services = await new SupabaseServiceRecordRepository(supabase).listByUser(user.id);

  const records: AnalysisRecord[] = services
    .filter((s) => s.cost != null && s.cost > 0)
    .map((s) => ({
      vehicleId: s.vehicleId,
      serviceType: s.serviceType,
      cost: s.cost as number,
      ts: s.expiryDate.getTime(),
    }));

  return {
    userEmail: authUser.email ?? "",
    vehicles: vehicles.map((v) => ({ id: v.id, name: `${v.brand} ${v.model}` })),
    records,
  };
}
