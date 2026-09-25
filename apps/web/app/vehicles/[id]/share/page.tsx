import { SupabaseVehicleRepository, SupabaseVehicleSharingRepository, type VehiclePerson } from "@glovebox/core";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

import { writableCarOwner } from "../../../_lib/access";
import { currentAuthUser, currentUser } from "../../../_lib/session";

import { removeFromCar } from "./actions";
import { InviteForm } from "./InviteForm";

export const metadata = { title: "Glovebox — Споделяне на колата" };

const who = (person: VehiclePerson) => person.name?.trim() || person.email;

/**
 * Who follows a car. The owner makes a one-time link for a family member and can remove anyone;
 * a member sees who shared it and can stop following it.
 */
export default async function ShareVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await currentAuthUser();
  const user = await currentUser();
  if (!authUser || !user) redirect("/login");

  const supabase = await createClient();
  if (!(await writableCarOwner(supabase, Number(user.id), Number(id)))) redirect("/vehicles");
  const vehicle = await new SupabaseVehicleRepository(supabase).getById(id);
  if (!vehicle) redirect("/vehicles");

  let people: VehiclePerson[] = [];
  let unavailable = false;
  try {
    people = await new SupabaseVehicleSharingRepository(supabase).people(id);
  } catch {
    unavailable = true; // the sharing migration is not applied yet
  }

  const owner = vehicle.userId === user.id;
  const name = `${vehicle.brand} ${vehicle.model}`;
  const ownerPerson = people.find((person) => person.isOwner);

  return (
    <Shell email={authUser.email ?? ""}>
      <section className="mx-auto mt-2 max-w-xl">
        <Link href="/vehicles" className="font-body text-sm text-muted transition hover:text-ivory">
          ← Назад към гаража
        </Link>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.26em] text-copper">
          {owner ? "Сподели колата" : "Споделена с теб"}
        </p>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-bold text-ivory">{name}</h1>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-muted">
          {owner
            ? `Прати връзка на човека, с когото карате ${name}. Като я отвори в Glovebox, вижда и подновява сроковете и получава напомнянията.`
            : `Колата е споделена с теб${ownerPerson ? ` от ${who(ownerPerson)}` : ""}. Виждаш и подновяваш сроковете ѝ и получаваш напомнянията.`}
        </p>

        {unavailable ? (
          <p className="mt-6 font-body text-sm text-status-expiring">Споделянето още не е включено. Опитай по-късно.</p>
        ) : (
          <>
            {owner && (
              <div className="mt-7 rounded-card border border-white/10 bg-panel p-5">
                <InviteForm vehicleId={vehicle.id} />
              </div>
            )}

            <h2 className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Кой следи колата</h2>
            <ul className="mt-3 divide-y divide-white/[0.06] rounded-card border border-white/10 bg-panel">
              {people.map((person) => (
                <li key={person.userId} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-body text-[15px] text-ivory">
                      {person.userId === user.id ? "Ти" : who(person)}
                    </p>
                    <p className="font-body text-[12px] text-dim">
                      {person.isOwner ? "Собственик" : "Член на семейството"}
                    </p>
                  </div>
                  {!person.isOwner && (owner || person.userId === user.id) && (
                    <form action={removeFromCar}>
                      <input type="hidden" name="vehicleId" value={vehicle.id} />
                      <input type="hidden" name="userId" value={person.userId} />
                      <button type="submit" className="font-body text-sm text-status-expired hover:underline">
                        {person.userId === user.id ? "Спри да следиш" : "Премахни"}
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            {owner && people.length <= 1 && (
              <p className="mt-3 font-body text-sm text-dim">Още никой. Колата я следиш само ти.</p>
            )}
          </>
        )}
      </section>
    </Shell>
  );
}
