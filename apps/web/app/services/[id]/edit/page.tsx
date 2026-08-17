import Link from "next/link";
import { redirect } from "next/navigation";

import { SERVICE_TYPE_LABELS } from "@/app/_lib/labels";
import { currentAuthUser, currentUser } from "@/app/_lib/session";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { EditServiceView } from "./EditServiceView";

export const metadata = { title: "Glovebox — Редакция на услуга" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await currentAuthUser();
  if (!user) redirect("/login");
  const profile = await currentUser();
  if (!profile) redirect("/login");

  // Scope to the owner explicitly: RLS is not enough, because an Administrator may SELECT
  // every Service Record. Not found / not theirs → back to the dashboard.
  const { data: service } = await supabase
    .from("services")
    .select("id, car_id, service_type, expiry_date, notes, cost")
    .eq("id", Number(id))
    .eq("user_id", Number(profile.id))
    .maybeSingle();
  if (!service || !service.expiry_date) redirect("/");

  const { data: car } = await supabase
    .from("cars")
    .select("brand, model")
    .eq("id", service.car_id)
    .maybeSingle();
  const vehicleName = car ? `${car.brand} ${car.model}` : "";

  return (
    <Shell email={user.email ?? ""}>
      <section className="anim-up anim-d1 mx-auto mt-2 max-w-xl">
        <Link href="/" className="font-body text-sm text-muted transition hover:text-ivory">
          ← Назад към таблото
        </Link>
        <h1 className="mb-1 mt-4 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          {SERVICE_TYPE_LABELS[service.service_type] ?? "Услуга"}
        </h1>
        {vehicleName && <p className="mb-6 font-body text-muted">{vehicleName}</p>}
        <EditServiceView
          serviceId={String(service.id)}
          serviceType={service.service_type}
          expiryDate={service.expiry_date.slice(0, 10)}
          notes={service.notes ?? ""}
          cost={service.cost != null ? String(service.cost) : ""}
        />
      </section>
    </Shell>
  );
}
