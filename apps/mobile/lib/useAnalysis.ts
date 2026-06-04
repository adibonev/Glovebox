import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  spendAnalysis,
} from "@glovebox/core";
import { chartColors } from "@glovebox/ui";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "./auth";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER, formatCost } from "./labels";
import { supabase } from "./supabase";

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);

export type SliceView = {
  serviceType: string;
  label: string;
  total: number;
  totalLabel: string;
  percent: number;
  color: string;
};
export type VehicleSpend = { name: string; totalLabel: string };
export type Analysis = {
  total: number;
  totalLabel: string;
  hasCosts: boolean;
  byType: SliceView[];
  perVehicle: VehicleSpend[];
};

function colorFor(serviceType: string): string {
  const i = SERVICE_TYPE_ORDER.indexOf(serviceType as (typeof SERVICE_TYPE_ORDER)[number]);
  return chartColors[(i >= 0 ? i : 0) % chartColors.length] ?? chartColors[0];
}

/** Loads the User's spend and derives the pie breakdown by Service Type (EUR). */
export function useAnalysis() {
  const { session } = useAuth();
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const user =
        (await userRepo.findByAuthId(session.user.id)) ??
        (await userRepo.create({ authUserId: session.user.id, email: session.user.email ?? "" }));

      const [vehicles, services] = await Promise.all([
        vehicleRepo.listByUser(user.id),
        serviceRepo.listByUser(user.id),
      ]);

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

      setData({
        total: analysis.total,
        totalLabel: formatCost(analysis.total) ?? "0,00 €",
        hasCosts: analysis.count > 0,
        byType,
        perVehicle,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при зареждане на анализа.");
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load().finally(() => {
        if (active && !loadedOnce.current) {
          loadedOnce.current = true;
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [load]),
  );

  return { data, loading, error };
}
