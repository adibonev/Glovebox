"use server";

import { SupabasePassportLinkRepository, SupabaseVehicleRepository } from "@glovebox/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { currentUser } from "../../../_lib/session";

/**
 * The Vehicle, only if it is the signed-in User's own. RLS alone is not enough: an Administrator
 * can read every car, and must not publish a passport for someone else's.
 */
async function ownVehicle(vehicleId: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const vehicle = await new SupabaseVehicleRepository(supabase).getById(vehicleId);
  if (!vehicle || vehicle.userId !== user.id) redirect("/vehicles");
  return { supabase, user, vehicle };
}

/** Publish the Vehicle's passport. One live link per Vehicle: an existing one is replaced. */
export async function createPassportLink(formData: FormData): Promise<void> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const includeCosts = formData.get("includeCosts") === "on";
  const { supabase, user } = await ownVehicle(vehicleId);

  const links = new SupabasePassportLinkRepository(supabase);
  const existing = await links.activeForVehicle(vehicleId);
  if (existing) await links.revoke(existing.id);
  await links.create({ vehicleId, userId: user.id, includeCosts });

  revalidatePath(`/vehicles/${vehicleId}/passport`);
}

/** Stop the link at once. The PDFs already sent keep their QR code, which now leads nowhere. */
export async function revokePassportLink(formData: FormData): Promise<void> {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const { supabase } = await ownVehicle(vehicleId);

  const links = new SupabasePassportLinkRepository(supabase);
  const existing = await links.activeForVehicle(vehicleId);
  if (existing) await links.revoke(existing.id);

  revalidatePath(`/vehicles/${vehicleId}/passport`);
}
