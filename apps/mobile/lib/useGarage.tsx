import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  expiryStatus,
  type ExpiryStatus,
  type Plan,
  type ServiceRecord,
  type Vehicle,
} from "@glovebox/core";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "./auth";
import { parseBodyType, type BodyType } from "./bodyType";
import { SERVICE_TYPE_LABELS, STATUS_COLORS } from "./labels";
import { getPlan } from "./plan";
import { supabase } from "./supabase";

// Default Reminder Window for the status/gauge until per-Service-Type settings land on mobile.
const DEFAULT_WINDOW = 30;
const CRITICAL_DAYS = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);

export type EnrichedRecord = { record: ServiceRecord; status: ExpiryStatus; days: number };
export type FlatItem = EnrichedRecord & { vehicle: Vehicle };
export type VehicleCard = { vehicle: Vehicle; items: EnrichedRecord[] };
export type Counts = { valid: number; expiring: number; expired: number };
export type UrgentView = {
  days: number;
  fraction: number;
  color: string;
  typeLabel: string;
  vehicleName: string;
  bodyType: BodyType;
  expired: boolean;
} | null;

export type Garage = {
  userId: string;
  plan: Plan;
  cards: VehicleCard[];
  /** Every Service Record (with its Vehicle), sorted overdue → soonest. */
  flat: FlatItem[];
  urgent: UrgentView;
  counts: Counts;
};

/** Loads the User's garage (Vehicles + Service Records + Plan) and derives the gauge/counts. */
export function useGarage() {
  const { session } = useAuth();
  const [data, setData] = useState<Garage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const user =
        (await userRepo.findByAuthId(session.user.id)) ??
        (await userRepo.create({ authUserId: session.user.id, email: session.user.email ?? "" }));

      const plan = await getPlan(user.id);
      const vehicles = await vehicleRepo.listByUser(user.id);
      const today = new Date();

      const cards: VehicleCard[] = [];
      const flat: FlatItem[] = [];
      const counts: Counts = { valid: 0, expiring: 0, expired: 0 };

      for (const vehicle of vehicles) {
        const records = await serviceRepo.listByVehicle(vehicle.id);
        const items = records
          .map((record) => ({
            record,
            status: expiryStatus(record, DEFAULT_WINDOW, today),
            days: Math.round((record.expiryDate.getTime() - today.getTime()) / MS_PER_DAY),
          }))
          .sort((a, b) => a.days - b.days);

        for (const item of items) {
          flat.push({ ...item, vehicle });
          if (item.status === "Valid") counts.valid += 1;
          else if (item.status === "ExpiringSoon") counts.expiring += 1;
          else counts.expired += 1;
        }
        cards.push({ vehicle, items });
      }

      flat.sort((a, b) => a.days - b.days);
      const head = flat[0];
      const urgent: UrgentView = head
        ? {
            days: head.days,
            fraction: head.days / DEFAULT_WINDOW,
            color: head.days <= CRITICAL_DAYS ? STATUS_COLORS.Expired : STATUS_COLORS[head.status],
            typeLabel: SERVICE_TYPE_LABELS[head.record.serviceType] ?? head.record.serviceType,
            vehicleName: `${head.vehicle.brand} ${head.vehicle.model}`,
            bodyType: parseBodyType(head.vehicle.bodyType),
            expired: head.days < 0,
          }
        : null;

      setData({ userId: user.id, plan, cards, flat, urgent, counts });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при зареждане на данните.");
    }
  }, [session]);

  // Reload whenever the screen regains focus (e.g. after an add/edit on another screen).
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  return { data, error, loading, refreshing, onRefresh };
}
