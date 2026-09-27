import {
  SupabaseMileageReadingRepository,
  SupabaseRenewalRepository,
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  spendingOf,
} from "@glovebox/core";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "./auth";
import { reportProblem } from "./monitoring";
import { supabase } from "./supabase";

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);
const mileageRepo = new SupabaseMileageReadingRepository(supabase);
const renewalRepo = new SupabaseRenewalRepository(supabase);

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

      // What renewals replaced counts too, each period on the day it was paid (core `spendingOf`).
      const renewals = (
        await Promise.all(vs.map((v) => renewalRepo.listByVehicle(v.id).catch(() => [])))
      ).flat();

      setVehicles(vs.map((v) => ({ id: v.id, name: `${v.brand} ${v.model}` })));
      setRecords(
        spendingOf(services, renewals).map((spend) => ({
          vehicleId: spend.vehicleId,
          serviceType: spend.serviceType,
          cost: spend.cost,
          ts: spend.paidOn.getTime(),
        })),
      );
      setReadings(mileage.map((r) => ({ vehicleId: r.vehicleId, km: r.km, readOn: r.readOn })));
    } catch (e) {
      reportProblem(`analysis load failed: ${e instanceof Error ? e.message : String(e)}`);
      setError("Анализът не се зареди. Дръпни надолу, за да опиташ пак.");
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
