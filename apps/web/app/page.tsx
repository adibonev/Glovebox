import Link from "next/link";

import { GaugePanel } from "@/components/GaugePanel";
import { Landing } from "@/components/Landing";
import { PlateBadge } from "@/components/PlateBadge";
import { Shell } from "@/components/Shell";
import { VehicleCard } from "@/components/VehicleCard";

import { ServiceList } from "./_components/ServiceList";
import { VehicleSwitcher } from "./_components/VehicleSwitcher";
import { getDashboardData } from "./_lib/dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; upgraded?: string }>;
}) {
  const { v, upgraded } = await searchParams;
  const data = await getDashboardData(v);
  if (!data) return <Landing />;

  const { userEmail, vehicle, vehicles, urgent, counts, items } = data;

  return (
    <Shell email={userEmail}>
      {upgraded === "1" && (
        <div className="anim-up mb-4 flex items-center gap-3 rounded-2xl border border-copper/40 bg-gradient-to-r from-copper/[0.12] to-transparent px-5 py-3.5">
          <span aria-hidden className="text-lg">🎉</span>
          <p className="font-body text-sm text-ivory">
            <span className="font-semibold text-copper">Добре дошъл в Pro!</span> Вече имаш
            неограничено автомобили, услуги и push напомняния.
          </p>
        </div>
      )}

      {!vehicle ? (
        <EmptyHero />
      ) : (
        <>
          <section className="mt-2 grid gap-5 lg:grid-cols-[1.32fr_1fr]">
            <div className="anim-up anim-d1">
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">
                Табло на автомобила
              </p>
              <h1 className="mt-3 font-display text-[clamp(34px,4.6vw,52px)] font-semibold leading-[1.02] tracking-tight text-ivory">
                {vehicle.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {vehicle.plate && <PlateBadge plate={vehicle.plate} />}
                {vehicle.year && (
                  <span className="font-body text-sm text-muted">{vehicle.year}</span>
                )}
              </div>
              {vehicles.length > 1 && (
                <VehicleSwitcher vehicles={vehicles} activeId={vehicle.id} />
              )}
              <VehicleCard bodyType={vehicle.bodyType} alt={vehicle.name} />
            </div>

            <div className="anim-up anim-d2">
              <GaugePanel urgent={urgent} counts={counts} />
            </div>
          </section>

          <section className="mt-9">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-ivory">
                Услуги и документи
              </h2>
              <AddServiceButton vehicleId={vehicle.id} />
            </div>
            {items.length > 0 ? <ServiceList items={items} /> : <EmptyServices vehicleId={vehicle.id} />}
          </section>
        </>
      )}
    </Shell>
  );
}

function AddServiceButton({ vehicleId }: { vehicleId: string }) {
  return (
    <Link
      href={`/add-service?v=${vehicleId}`}
      className="group inline-flex items-center gap-2 rounded-xl border border-copper/40 bg-gradient-to-b from-copper/[0.13] to-copper/[0.04] px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:border-copper/70 hover:from-copper/20 hover:shadow-[0_10px_30px_-10px_rgba(196,149,76,0.6)]"
    >
      <span className="grid h-4 w-4 place-items-center rounded-full bg-copper/20 text-copper transition group-hover:rotate-90">
        <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M8 3.5v9M3.5 8h9" />
        </svg>
      </span>
      Добави услуга
    </Link>
  );
}

function EmptyServices({ vehicleId }: { vehicleId: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-12 text-center">
      <p className="font-body text-muted">Още нямаш добавени услуги.</p>
      <div className="mt-4 flex justify-center">
        <AddServiceButton vehicleId={vehicleId} />
      </div>
    </div>
  );
}

/**
 * What a User with no Vehicles sees — in practice, everyone who has just registered. It offers
 * the automatic route first (one photo of the Inspection certificate fills the Vehicle and its
 * Expiry Date) and keeps typing it in as an equal, visible alternative. Existing Users never
 * reach this: they already have a Vehicle, so their dashboard renders instead.
 */
function EmptyHero() {
  return (
    <section className="anim-up anim-d1 mx-auto mt-10 max-w-xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">
        Табло на автомобила
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ivory">
        Добре дошъл в Glovebox
      </h1>
      <p className="mb-6 mt-2 font-body text-muted">
        Как предпочиташ да добавиш първата си кола?
      </p>

      <Link
        href="/vehicles/scan"
        className="group mb-3 flex items-start gap-4 rounded-3xl border border-copper/40 bg-gradient-to-b from-copper/[0.13] to-copper/[0.04] p-6 transition hover:border-copper/70 hover:shadow-[0_14px_40px_-16px_rgba(196,149,76,0.6)]"
      >
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-copper/20 text-copper">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 5.5V3a1 1 0 0 1 1-1h2.5M14 5.5V3a1 1 0 0 0-1-1h-2.5M2 10.5V13a1 1 0 0 0 1 1h2.5M14 10.5V13a1 1 0 0 1-1 1h-2.5M4.5 8h7" />
          </svg>
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-display text-lg font-semibold text-ivory">Автоматично</span>
          <span className="font-body text-sm text-silver/70">
            Снимай или прикачи удостоверението за технически преглед. Марката, моделът, номерът,
            рамата и срокът се попълват сами.
          </span>
        </span>
      </Link>

      <Link
        href="/vehicles/new"
        className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25"
      >
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-silver/70">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2.5 12.5h11M4 10.5 11 3.5l1.5 1.5-7 7-2 .5z" />
          </svg>
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-display text-lg font-semibold text-ivory">Ръчно</span>
          <span className="font-body text-sm text-silver/70">
            Въведи марка, модел и дати сам. Винаги можеш да добавиш документ по-късно.
          </span>
        </span>
      </Link>
    </section>
  );
}
