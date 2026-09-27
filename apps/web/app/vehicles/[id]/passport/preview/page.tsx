import { SupabaseVehicleRepository } from "@glovebox/core";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ownerPassport } from "../../../../_lib/passport";
import { currentUser } from "../../../../_lib/session";
import { PassportSheet } from "../../../../p/[token]/PassportSheet";

export const metadata: Metadata = {
  title: "Преглед на паспорта · Glovebox",
  robots: { index: false, follow: false },
};

/**
 * The passport exactly as a Passport Link would show it, before there is one: publishing makes it
 * public, so the owner sees first what a buyer will see, with or without the amounts.
 */
export default async function PassportPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ costs?: string }>;
}) {
  const { id } = await params;
  const { costs } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const vehicle = await new SupabaseVehicleRepository(supabase).getById(id);
  if (!vehicle || vehicle.userId !== user.id) redirect("/vehicles");
  const passport = await ownerPassport(supabase, vehicle, costs === "1");

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-3 sm:px-6">
        <p className="font-body text-sm text-ivory">
          Преглед. Така ще вижда паспорта човекът, на когото пратиш връзката.
        </p>
        <Link
          href={`/vehicles/${vehicle.id}/passport`}
          className="rounded-lg border border-white/15 px-3 py-1.5 font-body text-sm font-semibold text-ivory transition hover:border-white/30"
        >
          Назад
        </Link>
      </div>
      <PassportSheet passport={passport} pdfHref={null} />
    </>
  );
}
