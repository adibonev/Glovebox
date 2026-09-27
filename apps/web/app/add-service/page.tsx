import Link from "next/link";
import { redirect } from "next/navigation";

import { SupabaseVehicleRepository, calendarDay } from "@glovebox/core";
import { addYears } from "@glovebox/core/schedule";

import { currentAuthUser, currentUser } from "@/app/_lib/session";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { AddServiceView } from "./AddServiceView";

export const metadata = { title: "Нов срок · Glovebox" };

export default async function AddServicePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; type?: string; next?: string }>;
}) {
  const authUser = await currentAuthUser();
  const user = await currentUser();
  if (!authUser || !user) redirect("/login");

  // Scope to the owner explicitly — RLS alone is NOT enough here: an Administrator's policy
  // grants SELECT on every `cars` row, so a bare select handed them someone else's Vehicle
  // and the form then tried to write a Service Record the INSERT policy rightly refused.
  const supabase = await createClient();
  const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);

  // Add to the Vehicle the dashboard was showing (`?v=`), otherwise the first one owned.
  const { v, type, next } = await searchParams;
  const vehicle = vehicles.find((candidate) => candidate.id === v) ?? vehicles[0];
  if (!vehicle) redirect("/");

  // Arriving from the setup checklist: start on the Service Type it asked for, and go back
  // there afterwards so the remaining ones stay in front of the User.
  const backToSetup = next === "setup";
  const back = backToSetup ? `/vehicles/${vehicle.id}/setup` : `/?v=${vehicle.id}`;

  // Today in Sofia, not on the server's clock: at 01:00 in Bulgaria it is still yesterday in UTC.
  const today = calendarDay(new Date());

  return (
    <Shell email={authUser.email ?? ""}>
      <section className="mx-auto mt-2 flex max-w-xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link href={back} className="font-body text-sm text-muted transition hover:text-ivory">
            ← {backToSetup ? "Назад" : "Табло"}
          </Link>
          <h1 className="font-display text-[clamp(30px,4vw,42px)] font-bold tracking-tight text-ivory">Нов срок</h1>
        </header>

        <div className="rounded-card border border-white/10 bg-panel p-6 sm:p-7">
          <AddServiceView
            // The setup checklist is about one car, so it offers no other.
            vehicles={(backToSetup ? [vehicle] : vehicles).map((candidate) => ({
              id: candidate.id,
              name: `${candidate.brand} ${candidate.model}`,
              plate: candidate.plate,
            }))}
            vehicleId={vehicle.id}
            initialType={type}
            today={today.toISOString().slice(0, 10)}
            yearOn={addYears(today, 1).toISOString().slice(0, 10)}
            returnTo={backToSetup ? `/vehicles/${vehicle.id}/setup` : null}
          />
        </div>
      </section>
    </Shell>
  );
}
