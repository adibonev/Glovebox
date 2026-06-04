import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  canAddService,
  canAddVehicle,
  expiryStatus,
  type ExpiryStatus,
  type Plan,
  type ServiceRecord,
  type Vehicle,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { signOut, useAuth } from "@/lib/auth";
import {
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDateShort,
  formatDaysRemaining,
} from "@/lib/labels";
import { getPlan } from "@/lib/plan";
import { supabase } from "@/lib/supabase";

// Default Reminder Window for the status badge until per-Service-Type settings land on mobile.
const DEFAULT_WINDOW = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const userRepo = new SupabaseUserRepository(supabase);
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const serviceRepo = new SupabaseServiceRecordRepository(supabase);

type EnrichedRecord = { record: ServiceRecord; status: ExpiryStatus; days: number };
type VehicleCard = { vehicle: Vehicle; items: EnrichedRecord[] };

export default function Dashboard() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<VehicleCard[]>([]);
  const [plan, setPlan] = useState<Plan>("free");
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const user =
        (await userRepo.findByAuthId(session.user.id)) ??
        (await userRepo.create({ authUserId: session.user.id, email: session.user.email ?? "" }));

      setPlan(await getPlan(user.id));
      const vehicles = await vehicleRepo.listByUser(user.id);
      const today = new Date();

      const result: VehicleCard[] = [];
      for (const vehicle of vehicles) {
        const records = await serviceRepo.listByVehicle(vehicle.id);
        const items = records
          .map((record) => ({
            record,
            status: expiryStatus(record, DEFAULT_WINDOW, today),
            days: Math.round((record.expiryDate.getTime() - today.getTime()) / MS_PER_DAY),
          }))
          .sort((a, b) => a.days - b.days);
        result.push({ vehicle, items });
      }
      setCards(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при зареждане на данните.");
    }
  }, [session]);

  // Reload whenever the dashboard regains focus (e.g. returning from an add/edit screen).
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

  const canAddVehicleNow = canAddVehicle(plan, cards.length);

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
        <Text className="text-2xl font-semibold">
          <Text className="text-ivory">Glove</Text>
          <Text className="text-copper">box</Text>
        </Text>
        <Pressable onPress={signOut} hitSlop={8}>
          <Text className="text-sm text-muted">Изход</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.copper} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-12"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.copper} />
          }
        >
          {error && (
            <View className="mb-4 rounded-xl border border-status-expired/40 bg-panel p-4">
              <Text className="text-sm text-status-expired">{error}</Text>
            </View>
          )}

          {/* Add vehicle (or upsell when the Free Vehicle Quota is reached) */}
          {canAddVehicleNow ? (
            <Pressable
              onPress={() => router.push("/vehicle/new")}
              className="mb-4 items-center rounded-2xl border border-emerald/60 bg-emerald/15 py-4"
            >
              <Text className="text-base font-semibold text-ivory">+ Добави автомобил</Text>
            </Pressable>
          ) : (
            <View className="mb-4 rounded-2xl border border-copper/40 bg-panel p-4">
              <Text className="text-sm text-silver">
                Free е до 1 автомобил. Надгради до Pro от уеб приложението за неограничено.
              </Text>
            </View>
          )}

          {cards.length === 0 && !error && (
            <View className="mt-16 items-center">
              <Text className="text-center text-base text-muted">Още нямаш добавени автомобили.</Text>
            </View>
          )}

          {cards.map(({ vehicle, items }) => (
            <View key={vehicle.id} className="mb-4 rounded-2xl border border-white/10 bg-panel p-4">
              <Pressable
                onPress={() => router.push(`/vehicle/${vehicle.id}`)}
                className="mb-3 flex-row items-center justify-between"
              >
                <Text className="text-lg font-semibold text-ivory">
                  {vehicle.brand} {vehicle.model}
                </Text>
                <View className="flex-row items-center gap-2">
                  {vehicle.plate && (
                    <Text className="text-xs uppercase tracking-wider text-silver">{vehicle.plate}</Text>
                  )}
                  <Text className="text-xs text-dim">Ред.</Text>
                </View>
              </Pressable>

              {items.length === 0 ? (
                <Text className="mb-3 text-sm text-dim">Няма добавени услуги.</Text>
              ) : (
                <View className="mb-3 gap-2.5">
                  {items.map(({ record, status, days }) => (
                    <Pressable
                      key={record.id}
                      onPress={() => router.push(`/service/${record.id}`)}
                      className="flex-row items-center gap-3"
                    >
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status] }}
                      />
                      <View className="flex-1">
                        <Text className="text-sm text-ivory">
                          {SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType}
                        </Text>
                        <Text className="text-xs text-dim">
                          {formatDateShort(record.expiryDate)} · {formatDaysRemaining(days)}
                        </Text>
                      </View>
                      <Text
                        className="text-[11px] uppercase tracking-wider"
                        style={{ color: STATUS_COLORS[status] }}
                      >
                        {STATUS_LABELS[status]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Add service (or upsell when the Free Service Quota is reached) */}
              {canAddService(plan, items.length) ? (
                <Pressable
                  onPress={() => router.push(`/service/new?vehicleId=${vehicle.id}`)}
                  className="items-center rounded-xl border border-white/10 py-2.5"
                >
                  <Text className="text-sm font-semibold text-copper">+ Добави услуга</Text>
                </Pressable>
              ) : (
                <Text className="text-xs text-dim">Free е до 2 услуги. Pro премахва лимита.</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
