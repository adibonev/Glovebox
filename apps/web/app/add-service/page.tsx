import Link from "next/link";
import { redirect } from "next/navigation";

import { SupabaseVehicleRepository } from "@glovebox/core";

import { currentUser } from "@/app/_lib/session";
import { createClient } from "@/lib/supabase/server";

import { AddServiceView } from "./AddServiceView";

export default async function AddServicePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  // Scope to the owner explicitly — RLS alone is NOT enough here: an Administrator's policy
  // grants SELECT on every `cars` row, so a bare select handed them someone else's Vehicle
  // and the form then tried to write a Service Record the INSERT policy rightly refused.
  const supabase = await createClient();
  const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);

  // Add to the Vehicle the dashboard was showing (`?v=`), otherwise the first one owned.
  const { v } = await searchParams;
  const vehicle = vehicles.find((candidate) => candidate.id === v) ?? vehicles[0];
  if (!vehicle) redirect("/");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-10%,rgba(20,80,58,0.30),transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-silver/55 transition hover:text-copper"
          >
            ← Назад
          </Link>
          <h1 className="font-display text-4xl text-ivory">Нова услуга</h1>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md">
          <AddServiceView vehicleId={vehicle.id} plate={vehicle.plate} />
        </div>
      </div>
    </main>
  );
}
