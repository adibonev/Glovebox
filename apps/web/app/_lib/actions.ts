"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { SupabaseUserRepository } from "@glovebox/core";

import { createClient } from "@/lib/supabase/server";

import { BODY_TYPES } from "./bodyType";
import { SERVICE_TYPE_ORDER } from "./labels";
import { WINDOW_OPTIONS } from "./reminderSettings";

/** Read a valid body type from the form, defaulting to "sedan". */
function readBodyType(formData: FormData): string {
  const value = String(formData.get("bodyType") ?? "");
  return (BODY_TYPES as string[]).includes(value) ? value : "sedan";
}

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

  const { data } = await supabase
    .from("cars")
    .insert({
      user_id: userId,
      brand,
      model,
      year: yearRaw ? Number(yearRaw) : null,
      license_plate: plate || null,
      body_type: readBodyType(formData),
    })
    .select("id")
    .single();

  revalidatePath("/");
  revalidatePath("/vehicles");
  // Land on the freshly added Vehicle's dashboard.
  redirect(data ? `/?v=${data.id}` : "/");
}

export async function updateVehicle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const id = Number(formData.get("id"));
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const plate = String(formData.get("plate") ?? "").trim();
  if (!id || !brand || !model) return;

  // `.eq("user_id")` + RLS ensure a User can only edit their own Vehicle.
  await supabase
    .from("cars")
    .update({
      brand,
      model,
      year: yearRaw ? Number(yearRaw) : null,
      license_plate: plate || null,
      body_type: readBodyType(formData),
    })
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/");
  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function uploadDocument(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const serviceId = Number(formData.get("serviceId"));
  const file = formData.get("file");
  if (!serviceId || !(file instanceof File) || file.size === 0) return;

  // The Service Record must belong to the User (RLS-select returns null otherwise).
  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .maybeSingle();
  if (!service) return;

  // Path prefix is the auth uid so Storage RLS keeps the file private to its owner.
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-120) || "file";
  const path = `${authUser.id}/${serviceId}/${crypto.randomUUID()}__${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) return;

  await supabase.from("documents").insert({
    service_id: serviceId,
    user_id: userId,
    name: file.name.slice(0, 200),
    path,
    mime_type: file.type || null,
    size_bytes: file.size,
  });

  revalidatePath("/documents");
  revalidatePath("/");
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const id = Number(formData.get("id"));
  if (!id) return;

  // Look the path up server-side (don't trust the client); RLS scopes to the owner.
  const { data: doc } = await supabase
    .from("documents")
    .select("path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!doc) return;

  await supabase.storage.from("documents").remove([doc.path]);
  await supabase.from("documents").delete().eq("id", id).eq("user_id", userId);

  revalidatePath("/documents");
  revalidatePath("/");
}

export async function saveReminderSettings(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  // Build the per-Service-Type Reminder Windows, keeping only valid choices.
  const allowed = new Set<number>(WINDOW_OPTIONS);
  const settings: Record<string, number> = {};
  for (const serviceType of SERVICE_TYPE_ORDER) {
    const days = Number(formData.get(`window_${serviceType}`));
    if (allowed.has(days)) settings[serviceType] = days;
  }

  // An unchecked checkbox is absent from the form data.
  const enabled = formData.get("reminder_enabled") !== null;

  await supabase
    .from("users")
    .update({ reminder_settings: settings, reminder_enabled: enabled })
    .eq("id", userId);

  revalidatePath("/");
  revalidatePath("/vehicles");
  revalidatePath("/reminders");
  redirect("/reminders");
}

export async function deleteVehicle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const id = Number(formData.get("id"));
  if (!id) return;

  // Service Records cascade away with the car (FK ON DELETE CASCADE); RLS +
  // `.eq("user_id")` scope the delete to the owner.
  await supabase.from("cars").delete().eq("id", id).eq("user_id", userId);

  revalidatePath("/");
  revalidatePath("/vehicles");
  redirect("/vehicles");
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

export async function updateService(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceId = Number(formData.get("serviceId"));
  const serviceType = String(formData.get("serviceType") ?? "");
  const expiryDate = String(formData.get("expiryDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!serviceId || !serviceType || !expiryDate) return;

  // RLS ("update services for own cars") scopes the update to the owner. Editing the
  // Expiry Date (a renewal) keeps the Service Record's Documents and re-derives reminders.
  await supabase
    .from("services")
    .update({ service_type: serviceType, expiry_date: expiryDate, notes: notes || null })
    .eq("id", serviceId);

  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath("/reminders");
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
