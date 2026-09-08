import {
  SupabaseServiceRecordRepository,
  SupabaseVehicleRepository,
  onboardingGaps,
} from "@glovebox/core";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { ServiceTypeIcon } from "../../../_components/ServiceTypeIcon";
import { SERVICE_TYPE_LABELS } from "../../../_lib/labels";
import { currentUser } from "../../../_lib/session";

export const metadata = { title: "Glovebox — Довърши колата" };

/** A line of encouragement per Service Type, so the list reads as help rather than homework. */
const WHY: Record<string, string> = {
  civil_liability: "Задължителна е. Глобата за изтекла е по-скъпа от самата полица.",
  casco: "Ако имаш каско, срокът му върви отделно от гражданската.",
  vignette: "Избираш вида и началната дата — срокът се смята сам.",
  inspection: "Годишният технически преглед.",
  tax: "Сроковете са по закон и важат за всички — 30 април, 30 юни и 31 октомври.",
  fire_extinguisher: "Пожарогасителят има срок на годност и се проверява при преглед.",
};

export default async function VehicleSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  // Scope to the owner explicitly — an Administrator's RLS policy grants SELECT on every row,
  // so a bare lookup by id would hand them someone else's Vehicle (see the note in add-service).
  const supabase = await createClient();
  const { id } = await params;
  const vehicles = await new SupabaseVehicleRepository(supabase).listByUser(user.id);
  const vehicle = vehicles.find((candidate) => candidate.id === id);
  if (!vehicle) redirect("/");

  const services = await new SupabaseServiceRecordRepository(supabase).listByVehicle(vehicle.id);
  const gaps = onboardingGaps(
    { brand: vehicle.brand, model: vehicle.model, year: vehicle.year, plate: vehicle.plate, vin: vehicle.vin },
    services.map((service) => service.serviceType),
  );

  const name = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
  const done = gaps.serviceTypes.length === 0;

  return (
    <Shell email={user.email}>
      <section className="anim-up anim-d1 mx-auto mt-2 max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">
          {name || "Нова кола"}
        </p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold tracking-tight text-ivory">
          {done ? "Колата е готова" : "Какво още да следим"}
        </h1>
        <p className="mb-6 mt-2 font-body text-muted">
          {done
            ? "Всички срокове са добавени. Остава да кажеш кога да те подсещаме."
            : "Добави ги сега или по-късно — нищо не е задължително на този екран."}
        </p>

        {!done && (
          <ul className="mb-6 flex flex-col gap-2">
            {gaps.serviceTypes.map((type) => (
              <li key={type}>
                <Link
                  href={`/add-service?v=${vehicle.id}&type=${type}&next=setup`}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-copper/40 hover:bg-white/[0.05]"
                >
                  <ServiceTypeIcon type={type} className="h-7 w-7 shrink-0" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-body font-medium text-ivory">
                      {SERVICE_TYPE_LABELS[type]}
                    </span>
                    <span className="font-body text-[13px] leading-snug text-silver/60">
                      {WHY[type]}
                    </span>
                  </span>
                  <span aria-hidden className="ml-auto font-body text-copper">
                    +
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/reminders"
            className="rounded-xl bg-emerald px-4 py-2.5 text-center font-body font-semibold text-ivory transition hover:bg-emerald/90"
          >
            Настрой напомнянията
          </Link>
          <Link
            href={`/?v=${vehicle.id}`}
            className="text-center font-body text-sm text-muted transition hover:text-ivory"
          >
            {done ? "Към таблото" : "Ще ги добавя по-късно"}
          </Link>
        </div>
      </section>
    </Shell>
  );
}
