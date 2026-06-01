import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { AddServiceView } from "./AddServiceView";

export default async function AddServicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS scopes `cars` to the signed-in user.
  const { data: car } = await supabase
    .from("cars")
    .select("id, brand, model")
    .order("id")
    .limit(1)
    .maybeSingle();
  if (!car) redirect("/");

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
          <p className="font-mono text-sm text-silver/70">
            {car.brand} {car.model}
          </p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md">
          <AddServiceView vehicleId={String(car.id)} />
        </div>
      </div>
    </main>
  );
}
