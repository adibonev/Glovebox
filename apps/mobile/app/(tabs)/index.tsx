import { Ionicons } from "@expo/vector-icons";
import { canAddService, pendingRenewals, renewalLink } from "@glovebox/core";
import { colors, statusColors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnalyticsConsentCard } from "@/components/AnalyticsConsent";
import { CarImage } from "@/components/CarImage";
import { DeadlineRow } from "@/components/DeadlineRow";
import { GaugePanel } from "@/components/GaugePanel";
import { PushBanner, usePushBanner } from "@/components/PushBanner";
import { Wordmark } from "@/components/Wordmark";
import { useAnalyticsChoice } from "@/lib/analytics";
import { parseBodyType } from "@/lib/bodyType";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";
import { todayAsDate } from "@/lib/mileage";
import { useGarage, type FlatItem } from "@/lib/useGarage";

/**
 * One car at a time, as on the website: its gauge, then every deadline and expense it has, each
 * row opening its own screen. With several cars, a row of names switches between them.
 */
export default function DashboardTab() {
  const router = useRouter();
  const { data, loading, refreshing, onRefresh, error, selectedVehicleId, selectVehicle } = useGarage();
  const offeredAddVehicle = useRef(false);
  const { added } = useLocalSearchParams<{ added?: string }>();
  const clearAdded = useCallback(() => router.setParams({ added: undefined }), [router]);
  const push = usePushBanner();
  const consent = useAnalyticsChoice();

  /**
   * A brand-new User lands on a dashboard with nothing on it, so send them straight into adding
   * a car rather than leaving them to find the button.
   *
   * Once per launch, not on every visit: someone who backs out of the chooser must be able to
   * stay on the empty dashboard instead of being pushed back in a loop.
   */
  useEffect(() => {
    if (loading || !data || data.cards.length > 0 || offeredAddVehicle.current) return;
    offeredAddVehicle.current = true;
    router.push("/vehicle/setup");
  }, [data, loading, router]);

  const cards = data?.cards ?? [];
  const card = cards.find((c) => c.vehicle.id === selectedVehicleId) ?? cards[0];
  const attention = (data?.flat ?? []).filter((f) => f.status !== "Valid");
  // Lapsed with no new date: the question the app keeps asking until it has an answer.
  const pendingIds = new Set(pendingRenewals(attention.map((f) => f.record), todayAsDate()).map((r) => r.id));
  const pending = attention.filter((f) => pendingIds.has(f.record.id));

  // One banner at a time, the most useful first: four stacked on top pushed the car off screen.
  let banner: ReactNode = null;
  if (added === "1") banner = <AddedNotice onDone={clearAdded} />;
  else if (pending.length > 0) banner = <RenewalBanner pending={pending} onPress={(url) => router.push(url)} />;
  else if (cards.length > 0 && push.show) banner = <PushBanner banner={push} />;
  else if (cards.length > 0 && consent.available && consent.choice === null) {
    banner = <AnalyticsConsentCard consent={consent} />;
  }

  const plan = data?.plan ?? "free";

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

          {banner}

          {card ? (
            <>
              <View className="mb-1 flex-row items-end justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-2xl font-semibold text-ivory" numberOfLines={1}>
                    {card.vehicle.brand} {card.vehicle.model}
                  </Text>
                  <Text className="mt-0.5 text-sm text-muted">
                    {[card.vehicle.plate, card.vehicle.year ? String(card.vehicle.year) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              </View>

              {cards.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 mt-3" contentContainerClassName="gap-2 px-5">
                  {cards.map(({ vehicle }) => {
                    const active = vehicle.id === card.vehicle.id;
                    return (
                      <Pressable
                        key={vehicle.id}
                        onPress={() => selectVehicle(vehicle.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        className={`rounded-full border px-4 py-2 ${
                          active ? "border-copper bg-copper/15" : "border-white/10 bg-panel"
                        }`}
                      >
                        <Text className={`text-sm ${active ? "text-ivory" : "text-silver"}`}>
                          {vehicle.brand} {vehicle.model}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <CarImage bodyType={parseBodyType(card.vehicle.bodyType)} />
              <GaugePanel urgent={card.urgent} counts={card.counts} />

              <View className="mb-2 mt-6 flex-row items-center justify-between">
                <Text className="text-xl font-semibold text-ivory">Срокове</Text>
                {canAddService(plan, card.items.length) && (
                  <Pressable
                    onPress={() => router.push(`/service/new?vehicleId=${card.vehicle.id}`)}
                    accessibilityRole="button"
                    className="flex-row items-center gap-1.5 rounded-xl border border-copper/40 bg-copper/10 px-3.5 py-2"
                  >
                    <Ionicons name="add" size={16} color={colors.copper} />
                    <Text className="text-sm font-semibold text-copper">Добави срок</Text>
                  </Pressable>
                )}
              </View>

              {card.items.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-white/15 px-5 py-8">
                  <Text className="text-center text-sm text-muted">Още няма срокове за тази кола.</Text>
                </View>
              ) : (
                <View className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
                  {card.items.map((item, index) => (
                    <DeadlineRow
                      key={item.record.id}
                      item={item}
                      first={index === 0}
                      onPress={() => router.push(`/service/${item.record.id}`)}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            data && (
              <View className="mt-12 items-center">
                <Text className="text-center text-base text-muted">Още нямаш добавени коли.</Text>
                <Pressable onPress={() => router.push("/vehicle/setup")} className="mt-4 rounded-xl bg-emerald px-5 py-3">
                  <Text className="font-semibold text-ivory">Добави кола</Text>
                </Pressable>
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/**
 * The end of a new car's setup (vehicle/setup, then its reminders). Shown for a few seconds, then
 * the flag leaves the route, so coming back to this tab later does not say it again.
 */
function AddedNotice({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 6000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View className="mb-4 flex-row items-center gap-3 rounded-2xl border border-status-valid/50 bg-status-valid/10 px-4 py-4">
      <Ionicons name="checkmark-circle" size={24} color={statusColors.valid} />
      <View className="flex-1">
        <Text className="text-base font-semibold text-ivory">Колата е добавена успешно.</Text>
        <Text className="mt-0.5 text-sm text-silver">Ще ти напомним, преди да изтече някой срок.</Text>
      </View>
    </View>
  );
}

/**
 * The banner that stays until a lapsed obligation has its new Expiry Date. A notification can be
 * swiped away; this cannot, and it leads to the same renewal screen the notification does.
 */
function RenewalBanner({ pending, onPress }: { pending: FlatItem[]; onPress: (url: string) => void }) {
  const first = pending[0];
  if (!first) return null;
  const single = pending.length === 1;
  const label = SERVICE_TYPE_LABELS[first.record.serviceType] ?? first.record.serviceType;

  return (
    <Pressable
      onPress={() => onPress(renewalLink(pending.map((item) => item.record.id)))}
      className="mb-4 flex-row items-center gap-3 rounded-2xl border border-status-expired/50 bg-status-expired/10 px-4 py-4"
    >
      <Ionicons name="alert-circle" size={24} color={statusColors.expired} />
      <View className="flex-1">
        <Text className="text-base font-semibold text-ivory">
          {single
            ? `${label} на ${first.vehicle.brand} ${first.vehicle.model} изтече.`
            : `${pending.length} срока изтекоха.`}
        </Text>
        <Text className="mt-0.5 text-sm text-silver">{single ? "Въведи новия срок." : "Въведи новите дати."}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.silver} />
    </Pressable>
  );
}
