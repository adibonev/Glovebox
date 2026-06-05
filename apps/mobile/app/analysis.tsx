import { cumulativeAt, cumulativePoints, type CumulativePoint } from "@glovebox/core";
import { chartColors, colors, donutSlices } from "@glovebox/ui";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { Screen } from "@/components/Screen";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER, formatCost, formatCostCompact } from "@/lib/labels";
import { useAnalysis } from "@/lib/useAnalysis";

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDate = (ms: number) => {
  const d = new Date(ms);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
};

export default function AnalysisScreen() {
  const { vehicles, records, loading, error } = useAnalysis();
  const [car, setCar] = useState("all");
  const [category, setCategory] = useState("all");
  const [year, setYear] = useState("all");

  const categories = useMemo(
    () => SERVICE_TYPE_ORDER.filter((t) => records.some((r) => r.serviceType === t)),
    [records],
  );
  const years = useMemo(
    () => [...new Set(records.map((r) => new Date(r.ts).getFullYear()))].sort((a, b) => b - a),
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
          (category === "all" || r.serviceType === category) &&
          (year === "all" || new Date(r.ts).getFullYear() === Number(year)),
      ),
    [records, car, category, year],
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
  const series = lineCarIds.map((id) => ({
    id,
    name: vehicleName(id),
    color: carColor(id),
    points: cumulativePoints(
      filtered.filter((r) => r.vehicleId === id).map((r) => ({ t: r.ts, cost: r.cost })),
    ),
  }));
  const allTs = filtered.map((r) => r.ts);
  const minT = allTs.length ? Math.min(...allTs) : 0;
  const maxT = allTs.length ? Math.max(...allTs) : 1;
  const maxY = Math.max(1, ...series.map((s) => s.points.at(-1)?.cumulative ?? 0));

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
      {years.length > 1 && (
        <FilterChips
          label="Период"
          value={year}
          onChange={setYear}
          options={[{ value: "all", label: "Всички" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
        />
      )}

      {filtered.length === 0 ? (
        <View className="mt-8 items-center">
          <Text className="text-center text-base text-muted">Няма разходи за този филтър.</Text>
        </View>
      ) : (
        <>
          <View className="mt-2 items-center">
            <View style={{ width: 210, height: 210 }}>
              <Svg viewBox="0 0 200 200" width="100%" height="100%">
                {pie.map((s, i) => (
                  <Path key={s.key} d={pieD[i]} fill={s.color} />
                ))}
              </Svg>
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-[10px] uppercase tracking-[2px] text-muted">Общо</Text>
                <Text className="font-display text-2xl leading-none text-ivory">{formatCostCompact(total)}</Text>
              </View>
            </View>
          </View>

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

          <SpendTimeline series={series} minT={minT} maxT={maxT} maxY={maxY} />
        </>
      )}
    </Screen>
  );
}

function SpendTimeline({
  series,
  minT,
  maxT,
  maxY,
}: {
  series: { id: string; name: string; color: string; points: CumulativePoint[] }[];
  minT: number;
  maxT: number;
  maxY: number;
}) {
  const W = 320;
  const H = 170;
  const PAD = 16;
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [chartW, setChartW] = useState(0);

  const span = Math.max(1, maxT - minT);
  const x = (t: number) => PAD + ((t - minT) / span) * (W - PAD * 2);
  const y = (v: number) => PAD + (H - PAD * 2) - (v / Math.max(1, maxY)) * (H - PAD * 2);

  const onLayout = (e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width);
  const onTouch = (locationX: number) => {
    if (chartW === 0) return;
    const frac = Math.max(0, Math.min(1, locationX / chartW));
    setHoverT(minT + ((frac * W - PAD) / (W - PAD * 2)) * span);
  };

  const stepPath = (points: CumulativePoint[]) => {
    const pts: [number, number][] = [[x(minT), y(0)]];
    let prev = 0;
    for (const p of points) {
      pts.push([x(p.t), y(prev)]);
      pts.push([x(p.t), y(p.cumulative)]);
      prev = p.cumulative;
    }
    pts.push([x(maxT), y(prev)]);
    return pts.map(([cx, cy], i) => `${i === 0 ? "M" : "L"}${cx},${cy}`).join(" ");
  };

  const hx = hoverT == null ? 0 : Math.max(minT, Math.min(maxT, hoverT));

  return (
    <View className="mt-5 rounded-2xl border border-white/10 bg-panel p-4">
      <Text className="mb-2 text-sm text-muted">Натрупан разход във времето</Text>

      <View className="mb-2 min-h-[34px]">
        {hoverT == null ? (
          <Text className="text-xs text-dim">Плъзни с пръст по графиката за сума към дата.</Text>
        ) : (
          <View>
            <Text className="text-[13px] text-ivory">{fmtDate(hx)}</Text>
            <View className="mt-0.5 flex-row flex-wrap gap-x-3">
              {series.map((s) => (
                <Text key={s.id} className="text-xs" style={{ color: s.color }}>
                  {s.name}: <Text className="text-ivory">{formatCost(cumulativeAt(s.points, hx))}</Text>
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>

      <View
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => onTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => onTouch(e.nativeEvent.locationX)}
        onResponderRelease={() => setHoverT(null)}
        onResponderTerminate={() => setHoverT(null)}
      >
        <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
          <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(255,255,255,0.08)" />
          {series.map((s) => (
            <Path key={s.id} d={stepPath(s.points)} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" />
          ))}
          {hoverT != null && (
            <>
              <Line x1={x(hx)} y1={PAD} x2={x(hx)} y2={H - PAD} stroke="rgba(196,149,76,0.55)" strokeWidth={1} />
              {series.map((s) => (
                <Circle key={s.id} cx={x(hx)} cy={y(cumulativeAt(s.points, hx))} r={4} fill={s.color} />
              ))}
            </>
          )}
        </Svg>
      </View>

      <View className="mt-1 flex-row justify-between">
        <Text className="text-[10px] text-dim">{fmtDate(minT)}</Text>
        <Text className="text-[10px] text-dim">{fmtDate(minT + span / 2)}</Text>
        <Text className="text-[10px] text-dim">{fmtDate(maxT)}</Text>
      </View>

      {series.length > 1 && (
        <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
          {series.map((s) => (
            <View key={s.id} className="flex-row items-center gap-1.5">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <Text className="text-[12px] text-muted">{s.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
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
