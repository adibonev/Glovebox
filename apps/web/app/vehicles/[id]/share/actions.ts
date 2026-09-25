"use server";

import { SupabaseVehicleSharingRepository, shareLink } from "@glovebox/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

import { currentUser } from "../../../_lib/session";

export type InviteState = { link: string | null; error: string | null };

/** A fresh one-time link to the car, for the owner to send. The database refuses anyone else. */
export async function createCarInvite(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const vehicleId = String(formData.get("vehicleId") ?? "");
  try {
    const token = await new SupabaseVehicleSharingRepository(await createClient()).invite(vehicleId, user.id);
    return { link: shareLink(SITE_URL, token), error: null };
  } catch {
    return { link: null, error: "Поканата не беше създадена. Опитай пак." };
  }
}

/** The owner removing a member, or a member leaving (their own id). */
export async function removeFromCar(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  await new SupabaseVehicleSharingRepository(await createClient()).remove(vehicleId, userId);

  revalidatePath("/vehicles");
  if (userId === user.id) redirect("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}/share`);
}
