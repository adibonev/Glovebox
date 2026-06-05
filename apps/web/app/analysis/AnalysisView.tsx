"use client";

import { cumulativeAt, cumulativePoints, type CumulativePoint } from "@glovebox/core";
import { chartColors, donutSlices } from "@glovebox/ui";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { AnalysisRecord, AnalysisVehicle } from "../_lib/analysis";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER, formatCost, formatCostCompact } from "../_lib/labels";

type Props = { vehicles: AnalysisVehicle[]; records: AnalysisRecord[] };

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDate = (ms: number) => {
  const d = new Date(ms);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
};

export function AnalysisView({ vehicles, records }: Props) {
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

  if (records.length === 0) return <EmptyState />;

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

  // Timeline: cumulative spend per car (or the selected car).
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
        {years.length > 1 && (
          <FilterRow
            label="Период"
            value={year}
            onChange={setYear}
            options={[{ value: "all", label: "Всички" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
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
              <div className="relative h-[210px] w-[210px]">
                <svg viewBox="0 0 200 200" className="h-full w-full">
                  {pie.map((s, i) => (
                    <path key={s.key} d={pieD[i]} fill={s.color} />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Общо</span>
                  <span className="font-display text-[24px] font-semibold leading-none tracking-tight text-ivory">
                    {formatCostCompact(total)}
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
            <h2 className="mb-1 font-display text-[18px] font-semibold text-ivory">Натрупан разход във времето</h2>
            <SpendTimeline series={series} minT={minT} maxT={maxT} maxY={maxY} />
          </section>
        </>
      )}
    </div>
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
  const W = 600;
  const H = 190;
  const PAD = 18;
  const [hoverT, setHoverT] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const span = Math.max(1, maxT - minT);
  const x = (t: number) => PAD + ((t - minT) / span) * (W - PAD * 2);
  const y = (v: number) => PAD + (H - PAD * 2) - (v / Math.max(1, maxY)) * (H - PAD * 2);

  const move = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
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

  const ticks = [0, 0.5, 1].map((f) => minT + f * span);
  const hx = hoverT == null ? 0 : Math.max(minT, Math.min(maxT, hoverT));

  return (
    <div>
      <div className="mb-2 min-h-[22px] font-body text-[13px]">
        {hoverT == null ? (
          <span className="text-dim">Плъзни по графиката, за да видиш сумата към дата.</span>
        ) : (
          <span className="text-muted">
            <span className="text-ivory">{fmtDate(hx)}</span>
            {series.map((s) => (
              <span key={s.id}>
                {"  ·  "}
                <span style={{ color: s.color }}>●</span> {s.name}:{" "}
                <span className="text-ivory">{formatCost(cumulativeAt(s.points, hx))}</span>
              </span>
            ))}
          </span>
        )}
      </div>

      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[190px] w-full touch-none"
        preserveAspectRatio="none"
        onMouseMove={(e) => move(e.clientX)}
        onMouseLeave={() => setHoverT(null)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) move(t.clientX);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) move(t.clientX);
        }}
        onTouchEnd={() => setHoverT(null)}
      >
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(255,255,255,0.08)" />
        {series.map((s) => (
          <path
            key={s.id}
            d={stepPath(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ))}
        {hoverT != null && (
          <>
            <line x1={x(hx)} y1={PAD} x2={x(hx)} y2={H - PAD} stroke="rgba(196,149,76,0.5)" strokeWidth={1} />
            {series.map((s) => (
              <circle key={s.id} cx={x(hx)} cy={y(cumulativeAt(s.points, hx))} r={4} fill={s.color} />
            ))}
          </>
        )}
      </svg>

      <div className="mt-1 flex justify-between font-mono text-[10px] text-dim">
        {ticks.map((t, i) => (
          <span key={i}>{fmtDate(t)}</span>
        ))}
      </div>

      {series.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-body text-[12px] text-muted">{s.name}</span>
            </span>
          ))}
        </div>
      )}
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
