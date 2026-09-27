import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  daysUntil,
  expiryStatus,
  isExpiringServiceType,
  type ExpiryStatus,
  type Plan,
  type ServiceRecord,
  type Vehicle,
} from "@glovebox/core";
import { useFocusEffect } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { useAuth } from "./auth";
import { parseBodyType, type BodyType } from "./bodyType";
import { dataVersion, isFresh, type LoadStamp } from "./freshness";
import { SERVICE_TYPE_LABELS, STATUS_COLORS } from "./labels";
import { todayAsDate } from "./mileage";
import { reportProblem } from "./monitoring";
import { getPlan } from "./plan";
import { DEFAULT_WINDOW, loadReminderConfig } from "./reminderSettings";
import { supabase } from "./supabase";
import { publishDeadlines } from "./widget";

const CRITICAL_DAYS = 3;

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);

export type EnrichedRecord = {
  record: ServiceRecord;
  status: ExpiryStatus;
  days: number;
  /** False for dated expenses (Repair) — no status/gauge, shown with its cost. */
  expiring: boolean;
};
export type FlatItem = EnrichedRecord & { vehicle: Vehicle };
export type VehicleCard = { vehicle: Vehicle; items: EnrichedRecord[]; counts: Counts; urgent: UrgentView };
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
  isAdmin: boolean;
  plan: Plan;
  cards: VehicleCard[];
  /** Every obligation (with its Vehicle), sorted overdue → soonest. */
  flat: FlatItem[];
  /** Reminder Window per Service Type, to judge a status the same way everywhere. */
  windowFor: (serviceType: string) => number;
};

/** The gauge's view of the most pressing obligation among `items`, or null when there is none. */
function urgentOf(items: FlatItem[], windowFor: (serviceType: string) => number): UrgentView {
  const head = items[0];
  if (!head) return null;
  return {
    days: head.days,
    fraction: head.days / windowFor(head.record.serviceType),
    color: head.days <= CRITICAL_DAYS ? STATUS_COLORS.Expired : STATUS_COLORS[head.status],
    typeLabel: SERVICE_TYPE_LABELS[head.record.serviceType] ?? head.record.serviceType,
    vehicleName: `${head.vehicle.brand} ${head.vehicle.model}`,
    bodyType: parseBodyType(head.vehicle.bodyType),
    expired: head.days < 0,
  };
}

function countsOf(items: { status: ExpiryStatus }[]): Counts {
  const counts: Counts = { valid: 0, expiring: 0, expired: 0 };
  for (const item of items) {
    if (item.status === "Valid") counts.valid += 1;
    else if (item.status === "ExpiringSoon") counts.expiring += 1;
    else counts.expired += 1;
  }
  return counts;
}

/**
 * The User's garage: Vehicles (their own and those shared with them), every Service Record, the
 * Plan, and what the gauge shows. Four queries in all: the records come in one, not one per car.
 */
async function loadGarage(authUserId: string, email: string): Promise<Garage> {
  const user = await userRepo.findOrCreateByAuthId({ authUserId, email });
  const [plan, { windows }, vehicles, records] = await Promise.all([
    getPlan(user.id),
    loadReminderConfig(user.id),
    vehicleRepo.listByUser(user.id),
    serviceRepo.listByUser(user.id),
  ]);
  const windowFor = (serviceType: string) => windows[serviceType] ?? DEFAULT_WINDOW;
  // The phone's own date: counting from the clock time showed a policy as expired from the
  // afternoon of its last valid day.
  const today = todayAsDate();

  const cards: VehicleCard[] = [];
  const flat: FlatItem[] = [];
  for (const vehicle of vehicles) {
    const items = records
      .filter((record) => record.vehicleId === vehicle.id)
      .map((record) => {
        const expiring = isExpiringServiceType(record.serviceType);
        const status: ExpiryStatus = expiring ? expiryStatus(record, windowFor(record.serviceType), today) : "Valid";
        return { record, status, days: daysUntil(record.expiryDate, today), expiring };
      })
      // Obligations first (by urgency), then expenses (newest first).
      .sort((a, b) => {
        if (a.expiring !== b.expiring) return a.expiring ? -1 : 1;
        if (a.expiring) return a.days - b.days;
        return b.record.expiryDate.getTime() - a.record.expiryDate.getTime();
      });

    // The gauge, the counts and the reminders only consider obligations.
    const obligations = items.filter((item) => item.expiring).map((item) => ({ ...item, vehicle }));
    flat.push(...obligations);
    cards.push({ vehicle, items, counts: countsOf(obligations), urgent: urgentOf(obligations, windowFor) });
  }

  flat.sort((a, b) => a.days - b.days);
  publishDeadlines(flat, windowFor);
  return { userId: user.id, isAdmin: user.isAdmin, plan, cards, flat, windowFor };
}

type GarageState = {
  data: Garage | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  /** Load again now: pull to refresh. */
  onRefresh: () => void;
  /** Load again if something was written since, or the data is old (see lib/freshness). */
  ensureFresh: () => void;
  /** The car the dashboard shows: the one last chosen, else the first. */
  selectedVehicleId: string | null;
  selectVehicle: (id: string) => void;
};

const GarageContext = createContext<GarageState | null>(null);

/**
 * One garage for the whole app. Every tab reads the same copy, loaded once and again only after
 * a write (lib/freshness) or when it has grown old; it used to be loaded afresh by each tab on
 * each visit.
 */
export function GarageProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const authUserId = session?.user.id ?? null;
  const email = session?.user.email ?? "";
  const [data, setData] = useState<Garage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const stamp = useRef<LoadStamp | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const load = useCallback((): Promise<void> => {
    if (!authUserId) return Promise.resolve();
    if (inFlight.current) return inFlight.current;
    const started: LoadStamp = { version: dataVersion(), at: Date.now() };
    const run = loadGarage(authUserId, email)
      .then((garage) => {
        setData(garage);
        setError(null);
        stamp.current = started;
      })
      .catch((e: unknown) => {
        reportProblem(`garage load failed: ${e instanceof Error ? e.message : String(e)}`);
        setError("Данните не се заредиха. Дръпни надолу, за да опиташ пак.");
      })
      .finally(() => {
        setLoading(false);
        inFlight.current = null;
      });
    inFlight.current = run;
    return run;
  }, [authUserId, email]);

  // A different User (or none): nothing of the last one's garage may show.
  useEffect(() => {
    stamp.current = null;
    setData(null);
    setError(null);
    setChosen(null);
    setLoading(true);
    void load();
  }, [load]);

  const ensureFresh = useCallback(() => {
    if (!isFresh(stamp.current)) void load();
  }, [load]);

  // Back from the background the next morning: the day counts have moved.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") ensureFresh();
    });
    return () => subscription.remove();
  }, [ensureFresh]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
  }, [load]);

  const selectedVehicleId = useMemo(() => {
    const cards = data?.cards ?? [];
    return cards.some((card) => card.vehicle.id === chosen) ? chosen : (cards[0]?.vehicle.id ?? null);
  }, [data, chosen]);

  const value = useMemo<GarageState>(
    () => ({ data, error, loading, refreshing, onRefresh, ensureFresh, selectedVehicleId, selectVehicle: setChosen }),
    [data, error, loading, refreshing, onRefresh, ensureFresh, selectedVehicleId],
  );

  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

/** The shared garage, brought up to date when the screen comes into view if it needs to be. */
export function useGarage(): GarageState {
  const garage = useContext(GarageContext);
  if (!garage) throw new Error("useGarage needs a GarageProvider above it.");
  const { ensureFresh } = garage;
  useFocusEffect(
    useCallback(() => {
      ensureFresh();
    }, [ensureFresh]),
  );
  return garage;
}
