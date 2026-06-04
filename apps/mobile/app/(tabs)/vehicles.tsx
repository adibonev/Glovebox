import { canAddService, canAddVehicle } from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarImage } from "@/components/CarImage";
import { parseBodyType } from "@/lib/bodyType";
import {
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDateShort,
  formatDaysRemaining,
} from "@/lib/labels";
import { useGarage } from "@/lib/useGarage";

export default function VehiclesTab() {
  const router = useRouter();
  const { data, loading, refreshing, onRefresh, error } = useGarage();

  const plan = data?.plan ?? "free";
  const canAddVehicleNow = canAddVehicle(plan, data?.cards.length ?? 0);

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-2xl font-semibold text-ivory">Автомобили</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.copper} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-8"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.copper} />}
        >
          {error && (
            <View className="mb-4 rounded-xl border border-status-expired/40 bg-panel p-4">
              <Text className="text-sm text-status-expired">{error}</Text>
            </View>
          )}

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

          {data?.cards.map(({ vehicle, items }) => (
            <View key={vehicle.id} className="mb-5 rounded-2xl border border-white/10 bg-panel p-4">
              <CarImage bodyType={parseBodyType(vehicle.bodyType)} height={130} />

              <Pressable
                onPress={() => router.push(`/vehicle/${vehicle.id}`)}
                className="mb-3 mt-1 flex-row items-center justify-between"
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
                      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                      <View className="flex-1">
                        <Text className="text-sm text-ivory">
                          {SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType}
                        </Text>
                        <Text className="text-xs text-dim">
                          {formatDateShort(record.expiryDate)} · {formatDaysRemaining(days)}
                        </Text>
                      </View>
                      <Text className="text-[11px] uppercase tracking-wider" style={{ color: STATUS_COLORS[status] }}>
                        {STATUS_LABELS[status]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

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
