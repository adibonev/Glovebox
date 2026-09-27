import { Ionicons } from "@expo/vector-icons";
import { canAddVehicle } from "@glovebox/core";
import { colors, statusColors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionMenu, type MenuAction } from "@/components/ActionMenu";
import { CarImage } from "@/components/CarImage";
import { parseBodyType } from "@/lib/bodyType";
import { DELETE_FAILED, deleteVehicle } from "@/lib/erasure";
import { SERVICE_TYPE_LABELS, formatDaysRemaining } from "@/lib/labels";
import { useGarage, type VehicleCard } from "@/lib/useGarage";

/**
 * The garage: each car with how it stands, one button to open it on the dashboard, and the rest
 * (edit, share, passport, delete) behind ⋯. Its deadlines are listed on the dashboard, not here.
 */
export default function VehiclesTab() {
  const router = useRouter();
  const { data, loading, refreshing, onRefresh, error, selectVehicle } = useGarage();
  // The card stays chosen while the sheet slides away, so it does not empty out mid-animation.
  const [menuFor, setMenuFor] = useState<VehicleCard | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const plan = data?.plan ?? "free";
  // Only the cars the User owns count; one shared with them is someone else's quota.
  const owned = (data?.cards ?? []).filter(({ vehicle }) => vehicle.userId === data?.userId).length;
  const canAddVehicleNow = canAddVehicle(plan, owned);

  const open = (vehicleId: string) => {
    selectVehicle(vehicleId);
    router.navigate("/");
  };

  const confirmDelete = (card: VehicleCard) => {
    const name = `${card.vehicle.brand} ${card.vehicle.model}`;
    Alert.alert(`Да изтрия ли ${name}?`, "Изтриват се и всичките ѝ срокове и документи.", [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: () => {
          deleteVehicle(card.vehicle.id)
            .then(onRefresh)
            .catch(() => Alert.alert("Колата не е изтрита", DELETE_FAILED));
        },
      },
    ]);
  };

  const actionsFor = (card: VehicleCard): MenuAction[] => {
    const mine = card.vehicle.userId === data?.userId;
    const id = card.vehicle.id;
    return [
      { label: "Редактирай", onPress: () => router.push(`/vehicle/${id}`) },
      { label: mine ? "Сподели" : "Семейство", onPress: () => router.push(`/share/${id}`) },
      ...(mine ? [{ label: "Паспорт", onPress: () => router.push(`/passport/${id}`) }] : []),
      ...(mine ? [{ label: "Изтрий колата", destructive: true, onPress: () => confirmDelete(card) }] : []),
    ];
  };

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Text className="text-2xl font-semibold text-ivory">Коли</Text>
        {canAddVehicleNow && (
          <Pressable
            onPress={() => router.push("/vehicle/setup")}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 rounded-xl border border-copper/40 bg-copper/10 px-3.5 py-2"
          >
            <Ionicons name="add" size={16} color={colors.copper} />
            <Text className="text-sm font-semibold text-copper">Добави кола</Text>
          </Pressable>
        )}
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

          {!canAddVehicleNow && (
            <View className="mb-4 rounded-2xl border border-copper/40 bg-panel p-4">
              <Text className="text-sm text-silver">
                Безплатният план е за 1 кола. С Pro добавяш колкото искаш, от сайта.
              </Text>
            </View>
          )}

          {data?.cards.length === 0 && (
            <View className="mt-12 items-center">
              <Text className="text-center text-base text-muted">Още нямаш добавени коли.</Text>
            </View>
          )}

          {data?.cards.map((card) => {
            const { vehicle } = card;
            const mine = vehicle.userId === data.userId;
            return (
              <View key={vehicle.id} className="mb-5 rounded-2xl border border-white/10 bg-panel p-4">
                <CarImage bodyType={parseBodyType(vehicle.bodyType)} height={130} />
                <View className="flex-row items-baseline justify-between gap-3">
                  <Text className="flex-1 text-lg font-semibold text-ivory" numberOfLines={1}>
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  {vehicle.year !== null && <Text className="text-sm text-dim">{vehicle.year}</Text>}
                </View>
                <View className="mt-1 flex-row flex-wrap items-center gap-2">
                  {vehicle.plate && (
                    <Text className="text-sm uppercase tracking-wider text-silver">{vehicle.plate}</Text>
                  )}
                  {!mine && (
                    <View className="rounded-full border border-copper/40 bg-copper/10 px-2.5 py-0.5">
                      <Text className="text-[11px] text-copper">Споделена с теб</Text>
                    </View>
                  )}
                </View>

                <StatusLine card={card} />

                <View className="mt-4 flex-row items-center gap-2">
                  <Pressable
                    onPress={() => open(vehicle.id)}
                    accessibilityRole="button"
                    className="flex-1 items-center rounded-xl bg-emerald py-3"
                  >
                    <Text className="text-base font-semibold text-ivory">Отвори</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setMenuFor(card);
                      setMenuOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Още за ${vehicle.brand} ${vehicle.model}`}
                    className="h-12 w-12 items-center justify-center rounded-xl border border-white/10"
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.silver} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <ActionMenu
        title={menuFor ? `${menuFor.vehicle.brand} ${menuFor.vehicle.model}` : undefined}
        actions={menuFor ? actionsFor(menuFor) : []}
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </SafeAreaView>
  );
}

/**
 * How the car stands, in one line: its most pressing deadline, or that all is well. The counts
 * follow only when more than that one needs attention, or they would say the same thing twice.
 */
function StatusLine({ card }: { card: VehicleCard }) {
  const obligations = card.items.filter((item) => item.expiring);
  if (card.items.length === 0) return <Text className="mt-3 text-sm text-dim">Няма добавени срокове</Text>;
  const head = obligations.find((item) => item.status !== "Valid");
  if (!head) return <Text className="mt-3 text-sm" style={{ color: statusColors.valid }}>Всичко е в ред</Text>;

  const { expiring, expired } = card.counts;
  const color = head.status === "Expired" ? statusColors.expired : statusColors.expiring;
  const more = expiring + expired > 1;
  return (
    <View className="mt-3">
      <Text className="text-sm" style={{ color }}>
        {SERVICE_TYPE_LABELS[head.record.serviceType] ?? head.record.serviceType} · {formatDaysRemaining(head.days)}
      </Text>
      {more && (
        <Text className="mt-0.5 text-xs text-muted">
          {[
            expiring > 0 ? `${expiring} ${expiring === 1 ? "изтича" : "изтичат"}` : null,
            expired > 0 ? `${expired} ${expired === 1 ? "изтекъл" : "изтекли"}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      )}
    </View>
  );
}
