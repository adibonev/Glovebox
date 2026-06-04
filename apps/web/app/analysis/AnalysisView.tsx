"use client";

import { chartColors, donutSlices, linePath, linePoints } from "@glovebox/ui";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { AnalysisRecord, AnalysisVehicle } from "../_lib/analysis";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER, formatCost } from "../_lib/labels";

type Props = { vehicles: AnalysisVehicle[]; records: AnalysisRecord[] };

const periodOf = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (period: string) => {
  const [y = "", m = ""] = period.split("-");
  return `${m}.${y.slice(2)}`;
};

export function AnalysisView({ vehicles, records }: Props) {
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

  if (records.length === 0) return <EmptyState />;

  const total = filtered.reduce((sum, r) => sum + r.cost, 0);
  const groupByCar = category !== "all";

  // Pie — by Service Type, or by car when a category is selected.
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

  // Line — monthly spend, one series per car (or the selected car).
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

  return (
    <div className="anim-up anim-d2">
      <div className="mb-5 flex flex-col gap-3">
        <FilterRow
          label="Кола"
          value={car}
          onChange={setCar}
          options={[{ value: "all", label: "Всички" }, ...vehicles.map((v) => ({ value: v.id, label: v.name }))]}
        />
        {categories.length > 0 && (
          <FilterRow
            label="Вид"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "Всички" },
              ...categories.map((c) => ({ value: c, label: SERVICE_TYPE_LABELS[c] ?? c })),
            ]}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-12 text-center font-body text-muted">
          Няма записани разходи за този филтър.
        </div>
      ) : (
        <>
          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex items-center justify-center rounded-[22px] border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6">
              <div className="relative h-[220px] w-[220px]">
                <svg viewBox="0 0 200 200" className="h-full w-full">
                  {pie.map((s, i) => (
                    <path key={s.key} d={pieD[i]} fill={s.color} />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Общо</span>
                  <span className="font-display text-[28px] font-semibold leading-none text-ivory">
                    {formatCost(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6">
              <h2 className="mb-3 font-display text-[18px] font-semibold text-ivory">
                {groupByCar ? "По автомобил" : "По вид услуга"}
              </h2>
              <ul className="flex flex-col">
                {pie.map((s) => (
                  <li
                    key={s.key}
                    className="flex items-center justify-between gap-3 border-t border-white/[0.06] py-3 first:border-t-0"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                      <span className="truncate font-body text-[15px] text-ivory">{s.label}</span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-2">
                      <span className="font-display text-[15px] font-semibold text-ivory">{formatCost(s.total)}</span>
                      <span className="font-mono text-[12px] text-dim">{s.percent}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-6 rounded-[22px] border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold text-ivory">Разход във времето</h2>
              <span className="font-mono text-[11px] text-dim">макс {formatCost(maxY)}</span>
            </div>
            <LineChart series={lineSeries} periods={periods} maxY={maxY} />
            {lineSeries.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {lineSeries.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-body text-[12px] text-muted">{s.name}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function LineChart({
  series,
  periods,
  maxY,
}: {
  series: { id: string; color: string; values: number[] }[];
  periods: string[];
  maxY: number;
}) {
  const W = 600;
  const H = 180;
  const PAD = 16;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[180px] w-full" preserveAspectRatio="none">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(255,255,255,0.08)" />
        {series.map((s) => {
          const opts = { width: W, height: H, max: maxY, pad: PAD };
          return (
            <g key={s.id}>
              <path
                d={linePath(s.values, opts)}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {linePoints(s.values, opts).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-dim">
        <span>{periods[0] ? monthLabel(periods[0]) : ""}</span>
        <span>{periods.length > 1 ? monthLabel(periods[periods.length - 1] ?? "") : ""}</span>
      </div>
    </div>
  );
}

function FilterRow({
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.15em] text-dim">{label}</span>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-1.5 font-body text-[13px] transition ${
              active
                ? "border-copper/60 bg-copper/[0.14] text-copper"
                : "border-white/10 bg-white/[0.03] text-silver/70 hover:border-white/25"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="anim-up anim-d2 rounded-[22px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-16 text-center">
      <p className="font-body text-muted">
        Още нямаш записани разходи. Добави цена към услугите, за да видиш анализа.
      </p>
      <div className="mt-5 flex justify-center">
        <Link
          href="/add-service"
          className="rounded-xl border border-copper/40 bg-gradient-to-b from-copper/[0.13] to-copper/[0.04] px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:border-copper/70"
        >
          Добави услуга с цена
        </Link>
      </div>
    </div>
  );
}
