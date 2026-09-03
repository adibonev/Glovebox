import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { ScanVehicleForm } from "../_components/ScanVehicleForm";

export const metadata = { title: "Glovebox — Сканирай документ" };

export default async function ScanVehiclePage() {
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
        <h1 className="mb-2 mt-4 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          Добави автоматично
        </h1>
        <p className="mb-6 font-body text-silver/70">
          Една снимка на удостоверението за преглед попълва колата и срока вместо теб.
        </p>
        <ScanVehicleForm />
      </section>
    </Shell>
  );
}
