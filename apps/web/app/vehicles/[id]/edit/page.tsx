import Link from "next/link";
import { redirect } from "next/navigation";

import {
  SupabaseUserRepository,
  SupabaseVehicleRepository,
} from "@glovebox/core";

import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { EditVehicleForm } from "../../_components/EditVehicleForm";

export const metadata = { title: "Glovebox — Редакция на автомобил" };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const userRepo = new SupabaseUserRepository(supabase);
  const user = await userRepo.findByAuthId(authUser.id);
  if (!user) redirect("/vehicles");

  const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) redirect("/vehicles");

  return (
    <Shell email={authUser.email ?? ""}>
      <section className="anim-up anim-d1 mx-auto mt-2 max-w-xl">
        <Link href="/vehicles" className="font-body text-sm text-muted transition hover:text-ivory">
          ← Назад към гаража
        </Link>
        <h1 className="mb-6 mt-4 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          {vehicle.brand} {vehicle.model}
        </h1>
        <EditVehicleForm
          vehicle={{
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            plate: vehicle.plate,
            bodyType: vehicle.bodyType,
          }}
        />
      </section>
    </Shell>
  );
}
