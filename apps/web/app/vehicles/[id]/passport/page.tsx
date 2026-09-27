import { SupabasePassportLinkRepository, SupabaseVehicleRepository } from "@glovebox/core";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CopyLink } from "@/components/CopyLink";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { passportUrl } from "../../../_lib/passport";
import { currentAuthUser, currentUser } from "../../../_lib/session";

import { revokePassportLink } from "./actions";
import { PublishForm } from "./PublishForm";

export const metadata = { title: "Паспорт на колата · Glovebox" };

/**
 * Where the owner publishes a Vehicle's passport: one link, with or without the amounts paid,
 * that can be stopped at any time.
 */
export default async function VehiclePassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await currentAuthUser();
  const user = await currentUser();
  if (!authUser || !user) redirect("/login");

  const supabase = await createClient();
  const vehicle = await new SupabaseVehicleRepository(supabase).getById(id);
  if (!vehicle || vehicle.userId !== user.id) redirect("/vehicles");
  const link = await new SupabasePassportLinkRepository(supabase).activeForVehicle(id);
  const url = link ? passportUrl(link.token) : null;

  return (
    <Shell email={authUser.email ?? ""}>
      <section className="mx-auto mt-2 max-w-xl">
        <Link href="/vehicles" className="font-body text-sm text-muted transition hover:text-ivory">
          ← Коли
        </Link>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.26em] text-copper">Паспорт на колата</p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-bold text-ivory">
          {vehicle.brand} {vehicle.model}
        </h1>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-muted">
          Всичко за колата на един лист: пробегът от всеки преглед, кога какво е подновявано и
          ремонтите. Пращаш връзката на купувач или сваляш PDF. На PDF-а има QR код към същата
          страница, така че купувачът вижда, че данните не са пипани.
        </p>

        {link && url ? (
          <div className="mt-7 rounded-card border border-white/10 bg-panel p-5">
            <p className="font-body text-sm text-silver">
              Връзката работи. Който я има, вижда паспорта{link.includeCosts ? " заедно със сумите" : " без сумите"}.
            </p>
            <div className="mt-4">
              <CopyLink url={url} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-emerald px-4 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
              >
                Отвори паспорта
              </a>
              <a
                href={`${url}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/12 px-4 py-2.5 font-body text-sm font-semibold text-ivory transition hover:border-white/30"
              >
                Свали PDF
              </a>
            </div>
            <form action={revokePassportLink} className="mt-5 border-t border-white/[0.06] pt-4">
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <button type="submit" className="font-body text-sm font-semibold text-status-expired hover:underline">
                Спри връзката
              </button>
              <p className="mt-1 font-body text-[13px] text-dim">
                Спира веднага. QR кодът на вече пратените PDF-и спира да води до паспорта.
              </p>
            </form>
          </div>
        ) : (
          <PublishForm vehicleId={vehicle.id} />
        )}
      </section>
    </Shell>
  );
}
