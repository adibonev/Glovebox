import { colors, donutSlices } from "@glovebox/ui";
import { ActivityIndicator, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Screen } from "@/components/Screen";
import { useAnalysis } from "@/lib/useAnalysis";

export default function AnalysisScreen() {
  const { data, loading, error } = useAnalysis();

  const slices = data
    ? donutSlices(
        data.byType.map((b) => b.total),
        { cx: 100, cy: 100, rOuter: 92, rInner: 60 },
      )
    : [];

  return (
    <Screen title="Анализ на разходите">
      {loading ? (
        <View className="mt-12 items-center">
          <ActivityIndicator color={colors.copper} />
        </View>
      ) : error ? (
        <View className="rounded-xl border border-status-expired/40 bg-panel p-4">
          <Text className="text-sm text-status-expired">{error}</Text>
        </View>
      ) : !data?.hasCosts ? (
        <View className="mt-10 items-center">
          <Text className="text-center text-base text-muted">Още нямаш записани разходи.</Text>
          <Text className="mt-1 text-center text-sm text-dim">
            Добави цена към услугите, за да видиш анализа.
          </Text>
        </View>
      ) : (
        <>
          {/* Donut */}
          <View className="items-center">
            <View style={{ width: 220, height: 220 }}>
              <Svg viewBox="0 0 200 200" width="100%" height="100%">
                {data.byType.map((b, i) => (
                  <Path key={b.serviceType} d={slices[i]} fill={b.color} />
                ))}
              </Svg>
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-[10px] uppercase tracking-[2px] text-muted">Общо</Text>
                <Text className="text-3xl font-semibold leading-none text-ivory">{data.totalLabel}</Text>
              </View>
            </View>
          </View>

          {/* By Service Type */}
          <View className="mt-6 rounded-2xl border border-white/10 bg-panel p-4">
            <Text className="mb-1 text-sm text-muted">По вид услуга</Text>
            {data.byType.map((b) => (
              <View
                key={b.serviceType}
                className="flex-row items-center justify-between border-t border-white/[0.06] py-3"
              >
                <View className="flex-1 flex-row items-center gap-2.5">
                  <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: b.color }} />
                  <Text className="text-[15px] text-ivory">{b.label}</Text>
                </View>
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-[15px] font-semibold text-ivory">{b.totalLabel}</Text>
                  <Text className="text-xs text-dim">{b.percent}%</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Per vehicle */}
          {data.perVehicle.length > 1 && (
            <View className="mt-5 rounded-2xl border border-white/10 bg-panel p-4">
              <Text className="mb-1 text-sm text-muted">По автомобил</Text>
              {data.perVehicle.map((v) => (
                <View
                  key={v.name}
                  className="flex-row items-center justify-between border-t border-white/[0.06] py-3"
                >
                  <Text className="text-[15px] text-ivory">{v.name}</Text>
                  <Text className="text-[15px] font-semibold text-ivory">{v.totalLabel}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
