import { colors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarImage } from "@/components/CarImage";
import { GaugePanel } from "@/components/GaugePanel";
import { Wordmark } from "@/components/Wordmark";
import {
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDaysRemaining,
} from "@/lib/labels";
import { useGarage } from "@/lib/useGarage";

export default function DashboardTab() {
  const router = useRouter();
  const { data, loading, refreshing, onRefresh, error } = useGarage();

  const attention = (data?.flat ?? []).filter((f) => f.status !== "Valid");
  const top = attention.slice(0, 4);

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <View className="px-5 pb-3 pt-2">
        <Wordmark size={24} />
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

          {data?.urgent && <CarImage bodyType={data.urgent.bodyType} />}

          <GaugePanel
            urgent={data?.urgent ?? null}
            counts={data?.counts ?? { valid: 0, expiring: 0, expired: 0 }}
          />

          {top.length > 0 && (
            <View className="mt-5">
              <Text className="mb-2 text-sm text-muted">Изискват внимание</Text>
              {top.map((item) => (
                <Pressable
                  key={item.record.id}
                  onPress={() => router.push(`/service/${item.record.id}`)}
                  className="mb-2 flex-row items-center gap-3 rounded-xl border border-white/10 bg-panel px-4 py-3"
                >
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />
                  <View className="flex-1">
                    <Text className="text-sm text-ivory">
                      {SERVICE_TYPE_LABELS[item.record.serviceType] ?? item.record.serviceType}
                    </Text>
                    <Text className="text-xs text-dim">
                      {item.vehicle.brand} {item.vehicle.model} · {formatDaysRemaining(item.days)}
                    </Text>
                  </View>
                  <Text className="text-[11px] uppercase tracking-wider" style={{ color: STATUS_COLORS[item.status] }}>
                    {STATUS_LABELS[item.status]}
                  </Text>
                </Pressable>
              ))}
              {attention.length > top.length && (
                <Pressable onPress={() => router.push("/reminders")} className="mt-1 items-center py-2">
                  <Text className="text-sm text-copper">Виж всички в „Напомняния"</Text>
                </Pressable>
              )}
            </View>
          )}

          {data && data.cards.length === 0 && (
            <View className="mt-12 items-center">
              <Text className="text-center text-base text-muted">Още нямаш добавени автомобили.</Text>
              <Pressable onPress={() => router.push("/vehicle/new")} className="mt-4 rounded-xl bg-emerald px-5 py-3">
                <Text className="font-semibold text-ivory">+ Добави автомобил</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
