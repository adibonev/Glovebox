import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  spendAnalysis,
} from "@glovebox/core";
import { chartColors } from "@glovebox/ui";

import { createClient } from "@/lib/supabase/server";

import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER, formatCost } from "./labels";

export type SliceView = {
  serviceType: string;
  label: string;
  total: number;
  totalLabel: string;
  percent: number;
  color: string;
};

export type VehicleSpend = { name: string; totalLabel: string };

export type AnalysisData = {
  userEmail: string;
  total: number;
  totalLabel: string;
  hasCosts: boolean;
  byType: SliceView[];
  perVehicle: VehicleSpend[];
};

/** A stable chart color per Service Type (by its canonical order). */
function colorFor(serviceType: string): string {
  const i = SERVICE_TYPE_ORDER.indexOf(serviceType as (typeof SERVICE_TYPE_ORDER)[number]);
  return chartColors[(i >= 0 ? i : 0) % chartColors.length] ?? chartColors[0];
}

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

  const analysis = spendAnalysis(services);

  const byType: SliceView[] = analysis.byType.map((b) => ({
    serviceType: b.serviceType,
    label: SERVICE_TYPE_LABELS[b.serviceType] ?? b.serviceType,
    total: b.total,
    totalLabel: formatCost(b.total) ?? "",
    percent: Math.round(b.share * 100),
    color: colorFor(b.serviceType),
  }));

  const totalByVehicle = new Map<string, number>();
  for (const s of services) {
    if (s.cost == null || s.cost <= 0) continue;
    totalByVehicle.set(s.vehicleId, (totalByVehicle.get(s.vehicleId) ?? 0) + s.cost);
  }
  const perVehicle: VehicleSpend[] = vehicles
    .map((v) => ({ name: `${v.brand} ${v.model}`, total: totalByVehicle.get(v.id) ?? 0 }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((x) => ({ name: x.name, totalLabel: formatCost(x.total) ?? "" }));

  return {
    userEmail: authUser.email ?? "",
    total: analysis.total,
    totalLabel: formatCost(analysis.total) ?? "0,00 €",
    hasCosts: analysis.count > 0,
    byType,
    perVehicle,
  };
}
