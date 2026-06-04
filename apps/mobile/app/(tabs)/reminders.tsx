import { colors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDateShort,
  formatDaysRemaining,
} from "@/lib/labels";
import { useGarage } from "@/lib/useGarage";

export default function RemindersTab() {
  const router = useRouter();
  const { data, loading, refreshing, onRefresh } = useGarage();

  // Everything not "Valid" — the obligations you'll be reminded about, soonest first.
  const due = (data?.flat ?? []).filter((f) => f.status !== "Valid");

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-2xl font-semibold text-ivory">Напомняния</Text>
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
          <View className="mb-4 rounded-2xl border border-white/10 bg-panel p-4">
            <Text className="text-sm text-silver">
              Изпращаме имейл напомняния преди да изтече всеки срок. Push известия идват с Pro.
            </Text>
          </View>

          {due.length === 0 ? (
            <View className="mt-12 items-center">
              <Text className="text-center text-base text-muted">Няма наближаващи срокове.</Text>
              <Text className="mt-1 text-center text-sm text-dim">Всичко е в сила.</Text>
            </View>
          ) : (
            due.map((item) => (
              <Pressable
                key={item.record.id}
                onPress={() => router.push(`/service/${item.record.id}`)}
                className="mb-2.5 flex-row items-center gap-3 rounded-xl border border-white/10 bg-panel px-4 py-3"
              >
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />
                <View className="flex-1">
                  <Text className="text-sm text-ivory">
                    {SERVICE_TYPE_LABELS[item.record.serviceType] ?? item.record.serviceType}
                  </Text>
                  <Text className="text-xs text-dim">
                    {item.vehicle.brand} {item.vehicle.model} · {formatDateShort(item.record.expiryDate)} ·{" "}
                    {formatDaysRemaining(item.days)}
                  </Text>
                </View>
                <Text className="text-[11px] uppercase tracking-wider" style={{ color: STATUS_COLORS[item.status] }}>
                  {STATUS_LABELS[item.status]}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
