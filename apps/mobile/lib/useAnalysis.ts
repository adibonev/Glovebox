import {
  SupabaseMileageReadingRepository,
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
} from "@glovebox/core";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "./auth";
import { supabase } from "./supabase";

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const mileageRepo = new SupabaseMileageReadingRepository(supabase);

export type AnalysisVehicle = { id: string; name: string };
export type AnalysisRecord = { vehicleId: string; serviceType: string; cost: number; ts: number };
export type AnalysisReading = { vehicleId: string; km: number; readOn: Date };

/** Loads the raw costed Service Records, Mileage Readings and Vehicles; the screen filters & charts them. */
export function useAnalysis() {
  const { session } = useAuth();
  const [vehicles, setVehicles] = useState<AnalysisVehicle[]>([]);
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [readings, setReadings] = useState<AnalysisReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const user =
        await userRepo.findOrCreateByAuthId({ authUserId: session.user.id, email: session.user.email ?? "" });

      const [vs, services, mileage] = await Promise.all([
        vehicleRepo.listByUser(user.id),
        serviceRepo.listByUser(user.id),
        // Mileage Readings arrived later than the rest of the schema. A store without them still
        // has spend worth showing, so their absence is not an error.
        mileageRepo.listByUser(user.id).catch(() => []),
      ]);

      setVehicles(vs.map((v) => ({ id: v.id, name: `${v.brand} ${v.model}` })));
      setRecords(
        services
          .filter((s) => s.cost != null && s.cost > 0)
          .map((s) => ({
            vehicleId: s.vehicleId,
            serviceType: s.serviceType,
            cost: s.cost as number,
            ts: s.expiryDate.getTime(),
          })),
      );
      setReadings(mileage.map((r) => ({ vehicleId: r.vehicleId, km: r.km, readOn: r.readOn })));
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

  return { vehicles, records, readings, loading, error };
}
