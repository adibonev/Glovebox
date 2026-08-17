import Link from "next/link";

import { GaugePanel } from "@/components/GaugePanel";
import { Landing } from "@/components/Landing";
import { PlateBadge } from "@/components/PlateBadge";
import { Shell } from "@/components/Shell";
import { VehicleCard } from "@/components/VehicleCard";

import { AddVehicleForm } from "./_components/AddVehicleForm";
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
        Добави първата си кола, за да започнеш да следиш сроковете.
      </p>
      <AddVehicleForm />
    </section>
  );
}
