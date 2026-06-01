import { redirect } from "next/navigation";

import { AddServiceForm } from "./_components/AddServiceForm";
import { AddVehicleForm } from "./_components/AddVehicleForm";
import { ExpiryGauge } from "./_components/ExpiryGauge";
import { ServiceList } from "./_components/ServiceList";
import { getDashboardData } from "./_lib/dashboard";
import { signOut } from "./login/actions";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  const { vehicle, urgent, items } = data;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-10%,rgba(20,80,58,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_118%,rgba(196,149,76,0.10),transparent_70%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-12 px-6 py-16 sm:py-20">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-copper">
              Табло на колата
            </p>
            <h1 className="font-display text-5xl leading-none text-ivory sm:text-6xl">
              {vehicle?.name ?? "Моята кола"}
            </h1>
            {vehicle && (
              <p className="font-mono text-sm tracking-wide text-silver/70">
                {[vehicle.plate, vehicle.year].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="font-mono text-[11px] uppercase tracking-wider text-silver/50 transition hover:text-copper"
            >
              Изход
            </button>
          </form>
        </header>

        {!vehicle ? (
          <AddVehicleForm />
        ) : (
          <>
            {urgent && (
              <section className="flex flex-col items-center gap-6">
                <ExpiryGauge days={urgent.days} fraction={urgent.fraction} color={urgent.color} />
                <div className="text-center">
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-silver/55">
                    Най-скоро изтича
                  </p>
                  <p className="mt-1.5 font-body text-lg text-ivory">{urgent.typeLabel}</p>
                  <p className="font-mono text-sm text-silver/70">{urgent.dateLabel}</p>
                </div>
              </section>
            )}

            <section className="flex flex-col gap-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-silver/45">
                Услуги и срокове
              </h2>
              {items.length > 0 ? (
                <ServiceList items={items} />
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center font-body text-silver/60 backdrop-blur-md">
                  Нямаш добавени услуги още.
                </p>
              )}
              <AddServiceForm vehicleId={vehicle.id} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
