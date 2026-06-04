import { chartColors, colors, donutSlices, linePath, linePoints } from "@glovebox/ui";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path } from "react-native-svg";

import { Screen } from "@/components/Screen";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER, formatCost } from "@/lib/labels";
import { useAnalysis } from "@/lib/useAnalysis";

const periodOf = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (period: string) => {
  const [y = "", m = ""] = period.split("-");
  return `${m}.${y.slice(2)}`;
};

export default function AnalysisScreen() {
  const { vehicles, records, loading, error } = useAnalysis();
  const [car, setCar] = useState("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => SERVICE_TYPE_ORDER.filter((t) => records.some((r) => r.serviceType === t)),
    [records],
  );

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.name ?? id;
  const typeColor = (t: string) => {
    const i = SERVICE_TYPE_ORDER.indexOf(t as (typeof SERVICE_TYPE_ORDER)[number]);
    return chartColors[(i >= 0 ? i : 0) % chartColors.length] ?? chartColors[0];
  };
  const carColor = (id: string) => {
    const i = vehicles.findIndex((v) => v.id === id);
    return chartColors[(i >= 0 ? i : 0) % chartColors.length] ?? chartColors[0];
  };

  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          (car === "all" || r.vehicleId === car) &&
          (category === "all" || r.serviceType === category),
      ),
    [records, car, category],
  );

  if (loading) {
    return (
      <Screen title="Анализ на разходите">
        <View className="mt-12 items-center">
          <ActivityIndicator color={colors.copper} />
        </View>
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen title="Анализ на разходите">
        <View className="rounded-xl border border-status-expired/40 bg-panel p-4">
          <Text className="text-sm text-status-expired">{error}</Text>
        </View>
      </Screen>
    );
  }
  if (records.length === 0) {
    return (
      <Screen title="Анализ на разходите">
        <View className="mt-10 items-center">
          <Text className="text-center text-base text-muted">Още нямаш записани разходи.</Text>
          <Text className="mt-1 text-center text-sm text-dim">
            Добави цена към услугите, за да видиш анализа.
          </Text>
        </View>
      </Screen>
    );
  }

  const total = filtered.reduce((sum, r) => sum + r.cost, 0);
  const groupByCar = category !== "all";

  const pieTotals = new Map<string, number>();
  for (const r of filtered) {
    const key = groupByCar ? r.vehicleId : r.serviceType;
    pieTotals.set(key, (pieTotals.get(key) ?? 0) + r.cost);
  }
  const pie = [...pieTotals.entries()]
    .map(([key, sum]) => ({ key, total: sum }))
    .sort((a, b) => b.total - a.total)
    .map((g) => ({
      key: g.key,
      label: groupByCar ? vehicleName(g.key) : (SERVICE_TYPE_LABELS[g.key] ?? g.key),
      total: g.total,
      percent: total > 0 ? Math.round((g.total / total) * 100) : 0,
      color: groupByCar ? carColor(g.key) : typeColor(g.key),
    }));
  const pieD = donutSlices(
    pie.map((s) => s.total),
    { cx: 100, cy: 100, rOuter: 92, rInner: 60 },
  );

  const lineCarIds =
    car === "all"
      ? vehicles.filter((v) => filtered.some((r) => r.vehicleId === v.id)).map((v) => v.id)
      : [car];
  const periodSet = new Set<string>();
  const perCar = new Map<string, Map<string, number>>();
  for (const id of lineCarIds) {
    const m = new Map<string, number>();
    for (const r of filtered) {
      if (r.vehicleId !== id) continue;
      const p = periodOf(r.ts);
      m.set(p, (m.get(p) ?? 0) + r.cost);
      periodSet.add(p);
    }
    perCar.set(id, m);
  }
  const periods = [...periodSet].sort();
  const lineSeries = lineCarIds.map((id) => ({
    id,
    name: vehicleName(id),
    color: carColor(id),
    values: periods.map((p) => perCar.get(id)?.get(p) ?? 0),
  }));
  const maxY = Math.max(1, ...lineSeries.flatMap((s) => s.values));

  const W = 320;
  const H = 150;
  const PAD = 14;

  return (
    <Screen title="Анализ на разходите">
      <FilterChips
        label="Кола"
        value={car}
        onChange={setCar}
        options={[{ value: "all", label: "Всички" }, ...vehicles.map((v) => ({ value: v.id, label: v.name }))]}
      />
      {categories.length > 0 && (
        <FilterChips
          label="Вид"
          value={category}
          onChange={setCategory}
          options={[
            { value: "all", label: "Всички" },
            ...categories.map((c) => ({ value: c, label: SERVICE_TYPE_LABELS[c] ?? c })),
          ]}
        />
      )}

      {filtered.length === 0 ? (
        <View className="mt-8 items-center">
          <Text className="text-center text-base text-muted">Няма разходи за този филтър.</Text>
        </View>
      ) : (
        <>
          {/* Donut */}
          <View className="mt-2 items-center">
            <View style={{ width: 210, height: 210 }}>
              <Svg viewBox="0 0 200 200" width="100%" height="100%">
                {pie.map((s, i) => (
                  <Path key={s.key} d={pieD[i]} fill={s.color} />
                ))}
              </Svg>
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-[10px] uppercase tracking-[2px] text-muted">Общо</Text>
                <Text className="text-3xl font-semibold leading-none text-ivory">{formatCost(total)}</Text>
              </View>
            </View>
          </View>

          {/* Legend */}
          <View className="mt-5 rounded-2xl border border-white/10 bg-panel p-4">
            <Text className="mb-1 text-sm text-muted">{groupByCar ? "По автомобил" : "По вид услуга"}</Text>
            {pie.map((s) => (
              <View key={s.key} className="flex-row items-center justify-between border-t border-white/[0.06] py-3">
                <View className="flex-1 flex-row items-center gap-2.5">
                  <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
                  <Text className="text-[15px] text-ivory">{s.label}</Text>
                </View>
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-[15px] font-semibold text-ivory">{formatCost(s.total)}</Text>
                  <Text className="text-xs text-dim">{s.percent}%</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Spend over time */}
          <View className="mt-5 rounded-2xl border border-white/10 bg-panel p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm text-muted">Разход във времето</Text>
              <Text className="text-[11px] text-dim">макс {formatCost(maxY)}</Text>
            </View>
            <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={150} preserveAspectRatio="none">
              <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(255,255,255,0.08)" />
              {lineSeries.map((s) => {
                const opts = { width: W, height: H, max: maxY, pad: PAD };
                return (
                  <G key={s.id}>
                    <Path
                      d={linePath(s.values, opts)}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {linePoints(s.values, opts).map((p, i) => (
                      <Circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color} />
                    ))}
                  </G>
                );
              })}
            </Svg>
            <View className="mt-1 flex-row justify-between">
              <Text className="text-[10px] text-dim">{periods[0] ? monthLabel(periods[0]) : ""}</Text>
              <Text className="text-[10px] text-dim">
                {periods.length > 1 ? monthLabel(periods[periods.length - 1] ?? "") : ""}
              </Text>
            </View>
            {lineSeries.length > 1 && (
              <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
                {lineSeries.map((s) => (
                  <View key={s.id} className="flex-row items-center gap-1.5">
                    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <Text className="text-[12px] text-muted">{s.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs uppercase tracking-wider text-dim">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              className={`rounded-lg border px-3 py-2 ${
                active ? "border-copper bg-copper/20" : "border-white/10 bg-panel"
              }`}
            >
              <Text className={`text-[13px] ${active ? "text-copper" : "text-muted"}`}>{o.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
