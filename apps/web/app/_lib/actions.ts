"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { SupabaseUserRepository } from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** Resolve (and provision) the signed-in user's `users.id`. */
async function resolveUserId(supabase: ServerClient): Promise<number | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const repo = new SupabaseUserRepository(supabase);
  const profile =
    (await repo.findByAuthId(user.id)) ??
    (await repo.create({ authUserId: user.id, email: user.email ?? "" }));
  return Number(profile.id);
}

export async function addVehicle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const plate = String(formData.get("plate") ?? "").trim();
  if (!brand || !model) return;

  await supabase.from("cars").insert({
    user_id: userId,
    brand,
    model,
    year: yearRaw ? Number(yearRaw) : null,
    license_plate: plate || null,
  });
  revalidatePath("/");
}

export async function addService(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const vehicleId = Number(formData.get("vehicleId"));
  const serviceType = String(formData.get("serviceType") ?? "");
  const expiryDate = String(formData.get("expiryDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!vehicleId || !serviceType || !expiryDate) return;

  await supabase.from("services").insert({
    car_id: vehicleId,
    user_id: userId,
    service_type: serviceType,
    expiry_date: expiryDate,
    notes: notes || null,
  });
  revalidatePath("/");
  redirect("/");
}

export async function deleteService(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const serviceId = Number(formData.get("serviceId"));
  if (!serviceId) return;

  // RLS ("... for own cars") ensures only the user's own records can be deleted.
  await supabase.from("services").delete().eq("id", serviceId);
  revalidatePath("/");
}
