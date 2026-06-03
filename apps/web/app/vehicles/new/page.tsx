import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { AddVehicleForm } from "../../_components/AddVehicleForm";

export const metadata = { title: "Glovebox — Нов автомобил" };

export default async function NewVehiclePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <Shell email={user.email ?? ""}>
      <section className="anim-up anim-d1 mx-auto mt-2 max-w-xl">
        <Link href="/vehicles" className="font-body text-sm text-muted transition hover:text-ivory">
          ← Назад към гаража
        </Link>
        <h1 className="mb-6 mt-4 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          Нов автомобил
        </h1>
        <AddVehicleForm />
      </section>
    </Shell>
  );
}
