import { colors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { SERVICE_TYPE_LABELS, STATUS_COLORS, formatDaysRemaining } from "@/lib/labels";
import { useGarage } from "@/lib/useGarage";

/**
 * Every obligation that is due or overdue, overdue first: where a notification about several of
 * them at once leads, and where the dashboard banner leads when more than one is waiting.
 */
export default function RenewListScreen() {
  const router = useRouter();
  const { data, loading } = useGarage();
  const due = (data?.flat ?? []).filter((item) => item.status !== "Valid");

  return (
    <Screen title="Срокове за подновяване">
      {loading ? (
        <View className="mt-10 items-center">
          <ActivityIndicator color={colors.copper} />
        </View>
      ) : due.length === 0 ? (
        <Text className="text-base leading-6 text-silver">
          Всичко е подновено. Ще те подсетим, когато наближи следващият срок.
        </Text>
      ) : (
        due.map((item) => (
          <Pressable
            key={item.record.id}
            onPress={() => router.push(`/renew/${item.record.id}`)}
            className="mb-2 flex-row items-center gap-3 rounded-xl border border-white/10 bg-panel px-4 py-4"
          >
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />
            <View className="flex-1">
              <Text className="text-base text-ivory">
                {SERVICE_TYPE_LABELS[item.record.serviceType] ?? item.record.serviceType}
              </Text>
              <Text className="text-xs text-dim">
                {item.vehicle.brand} {item.vehicle.model} · {formatDaysRemaining(item.days)}
              </Text>
            </View>
            <Text className="text-sm text-copper">Поднови</Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
