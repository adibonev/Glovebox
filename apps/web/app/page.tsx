import Link from "next/link";
import { redirect } from "next/navigation";

import { GaugePanel } from "@/components/GaugePanel";
import { Topbar } from "@/components/Topbar";
import { VehicleCard } from "@/components/VehicleCard";

import { AddVehicleForm } from "./_components/AddVehicleForm";
import { ServiceList } from "./_components/ServiceList";
import { getDashboardData } from "./_lib/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  const { userEmail, vehicle, urgent, counts, items } = data;

  return (
    <main className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-10%,rgba(20,80,58,0.30),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_45%_at_50%_115%,rgba(196,149,76,0.08),transparent_70%)]" />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-[1180px] px-5 pb-20 sm:px-6">
        <Topbar email={userEmail} />

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
                <AddServiceButton />
              </div>
              {items.length > 0 ? <ServiceList items={items} /> : <EmptyServices />}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function PlateBadge({ plate }: { plate: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] py-1.5 pl-1.5 pr-3 font-mono text-[15px] font-semibold tracking-[0.06em] text-ivory">
      {/* EU/BG plate emblem — fixed real-world flag colours, not brand tokens. */}
      <span className="flex h-[26px] w-[22px] flex-col items-center justify-end rounded-[4px] bg-[#0b3a8f] pb-1 text-[8px] font-bold leading-none text-[#ffcf3a]">
        <span aria-hidden className="mb-[2px] text-[7px]">
          ★
        </span>
        BG
      </span>
      {plate}
    </span>
  );
}

function AddServiceButton() {
  return (
    <Link
      href="/add-service"
      className="group inline-flex items-center gap-2 rounded-xl border border-copper/40 bg-gradient-to-b from-copper/[0.13] to-copper/[0.04] px-4 py-2.5 font-body text-sm font-semibold text-copper transition hover:border-copper/70 hover:from-copper/20 hover:shadow-[0_10px_30px_-10px_rgba(196,149,76,0.6)]"
    >
      <span className="grid h-4 w-4 place-items-center rounded-full bg-copper/20 text-copper transition group-hover:rotate-90">
        +
      </span>
      Добави услуга
    </Link>
  );
}

function EmptyServices() {
  return (
    <div className="rounded-[20px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-12 text-center">
      <p className="font-body text-muted">Още нямаш добавени услуги.</p>
      <div className="mt-4 flex justify-center">
        <AddServiceButton />
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
