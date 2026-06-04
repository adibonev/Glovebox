import {
  SupabaseServiceRecordRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  expiryStatus,
  type ExpiryStatus,
  type ServiceRecord,
  type Vehicle,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useCallback, useEffect, useState } from "react";
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
import { supabase } from "@/lib/supabase";

// Default Reminder Window for the status badge until per-Service-Type settings land on mobile.
const DEFAULT_WINDOW = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type EnrichedRecord = { record: ServiceRecord; status: ExpiryStatus; days: number };
type VehicleCard = { vehicle: Vehicle; items: EnrichedRecord[] };

export default function Dashboard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<VehicleCard[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      // Resolve / provision the app User (auth identity → users.id), same as web.
      const userRepo = new SupabaseUserRepository(supabase);
      const user =
        (await userRepo.findByAuthId(session.user.id)) ??
        (await userRepo.create({
          authUserId: session.user.id,
          email: session.user.email ?? "",
        }));

      const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
      const recordRepo = new SupabaseServiceRecordRepository(supabase);
      const today = new Date();

      const result: VehicleCard[] = [];
      for (const vehicle of vehicles) {
        const records = await recordRepo.listByVehicle(vehicle.id);
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

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      {/* Header */}
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

          {cards.length === 0 && !error && (
            <View className="mt-20 items-center">
              <Text className="text-center text-base text-muted">
                Още нямаш добавени автомобили.
              </Text>
              <Text className="mt-1 text-center text-sm text-dim">
                Добави първия си автомобил от уеб приложението.
              </Text>
            </View>
          )}

          {cards.map(({ vehicle, items }) => (
            <View
              key={vehicle.id}
              className="mb-4 rounded-2xl border border-white/10 bg-panel p-4"
            >
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-ivory">
                  {vehicle.brand} {vehicle.model}
                </Text>
                {vehicle.plate && (
                  <Text className="font-mono text-xs uppercase tracking-wider text-silver">
                    {vehicle.plate}
                  </Text>
                )}
              </View>

              {items.length === 0 ? (
                <Text className="text-sm text-dim">Няма добавени услуги.</Text>
              ) : (
                <View className="gap-2.5">
                  {items.map(({ record, status, days }) => (
                    <View key={record.id} className="flex-row items-center gap-3">
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
                        className="font-mono text-[11px] uppercase tracking-wider"
                        style={{ color: STATUS_COLORS[status] }}
                      >
                        {STATUS_LABELS[status]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
