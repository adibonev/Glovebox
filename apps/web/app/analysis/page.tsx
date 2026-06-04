import { donutSlices } from "@glovebox/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";

import { getAnalysisData } from "../_lib/analysis";

export const metadata = { title: "Glovebox — Анализ" };

export default async function AnalysisPage() {
  const data = await getAnalysisData();
  if (!data) redirect("/login");

  const slices = donutSlices(
    data.byType.map((b) => b.total),
    { cx: 100, cy: 100, rOuter: 92, rInner: 60 },
  );

  return (
    <Shell email={data.userEmail}>
      <div className="anim-up anim-d1 mb-6 mt-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Анализ</p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          Къде отиват парите
        </h1>
        <p className="mt-2 font-body text-muted">
          Разходите по колите ти — общо и разпределени по вид услуга.
        </p>
      </div>

      {!data.hasCosts ? (
        <EmptyState />
      ) : (
        <>
          <section className="anim-up anim-d2 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col items-center justify-center rounded-[22px] border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6">
              <div className="relative h-[220px] w-[220px]">
                <svg viewBox="0 0 200 200" className="h-full w-full -rotate-0">
                  {data.byType.map((b, i) => (
                    <path key={b.serviceType} d={slices[i]} fill={b.color} />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Общо</span>
                  <span className="font-display text-[30px] font-semibold leading-none text-ivory">
                    {data.totalLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-gradient-to-b from-panel to-ink2 p-6">
              <h2 className="mb-4 font-display text-[18px] font-semibold text-ivory">По вид услуга</h2>
              <ul className="flex flex-col">
                {data.byType.map((b) => (
                  <li
                    key={b.serviceType}
                    className="flex items-center justify-between gap-3 border-t border-white/[0.06] py-3 first:border-t-0"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: b.color }} />
                      <span className="truncate font-body text-[15px] text-ivory">{b.label}</span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-2">
                      <span className="font-display text-[15px] font-semibold text-ivory">{b.totalLabel}</span>
                      <span className="font-mono text-[12px] text-dim">{b.percent}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {data.perVehicle.length > 1 && (
            <section className="anim-up anim-d3 mt-8">
              <h2 className="mb-4 font-display text-[20px] font-semibold tracking-tight text-ivory">
                По автомобил
              </h2>
              <div className="overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-panel to-ink2">
                {data.perVehicle.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-center justify-between border-t border-white/[0.05] px-5 py-4 first:border-t-0"
                  >
                    <span className="font-body text-ivory">{v.name}</span>
                    <span className="font-display font-semibold text-ivory">{v.totalLabel}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Shell>
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
