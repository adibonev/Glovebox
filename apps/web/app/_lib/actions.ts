"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SupabaseAccountPurge,
  SupabaseUserRepository,
  canAddDocument,
  canAddService,
  canAddVehicle,
  purgeAccount,
} from "@glovebox/core";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { BODY_TYPES } from "./bodyType";
import type { FormState } from "./formState";
import { DELETE_ACCOUNT_CONFIRMATION, SERVICE_TYPE_ORDER } from "./labels";
import { countDocuments, countServices, countVehicles, getPlan } from "./plan";
import { WINDOW_OPTIONS } from "./reminderSettings";
import { documentTooLargeMessage } from "./upload";

/** Read a valid body type from the form, defaulting to "sedan". */
function readBodyType(formData: FormData): string {
  const value = String(formData.get("bodyType") ?? "");
  return (BODY_TYPES as string[]).includes(value) ? value : "sedan";
}

/** Read an optional cost (EUR) from the form; accepts comma or dot decimals. */
function readCost(formData: FormData): number | null {
  const raw = String(formData.get("cost") ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Upload a file to the private `documents` bucket and record it on a Service Record.
 * Returns `true` when the Document landed, so the caller can say so when it didn't.
 */
async function storeDocument(
  supabase: ServerClient,
  authUserId: string,
  userId: number,
  serviceId: number,
  file: File,
): Promise<boolean> {
  // Path prefix is the auth uid so Storage RLS keeps the file private to its owner.
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-120) || "file";
  const path = `${authUserId}/${serviceId}/${crypto.randomUUID()}__${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) {
    Sentry.captureException(uploadError);
    return false;
  }

  const { error: insertError } = await supabase.from("documents").insert({
    service_id: serviceId,
    user_id: userId,
    name: file.name.slice(0, 200),
    path,
    mime_type: file.type || null,
    size_bytes: file.size,
  });
  if (insertError) {
    Sentry.captureException(insertError);
    return false;
  }
  return true;
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
    await repo.findOrCreateByAuthId({ authUserId: user.id, email: user.email ?? "" });
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
  const vin = String(formData.get("vin") ?? "").trim().toUpperCase();
  if (!brand || !model) return;

  // Quota gate: Free is capped at 1 Vehicle → Paywall (ADR-0003).
  const plan = await getPlan(supabase, userId);
  if (!canAddVehicle(plan, await countVehicles(supabase, userId))) {
    redirect("/paywall?reason=vehicle");
  }

  const { data } = await supabase
    .from("cars")
    .insert({
      user_id: userId,
      brand,
      model,
      year: yearRaw ? Number(yearRaw) : null,
      license_plate: plate || null,
      vin: vin || null,
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
  const vin = String(formData.get("vin") ?? "").trim().toUpperCase();
  if (!id || !brand || !model) return;

  // `.eq("user_id")` + RLS ensure a User can only edit their own Vehicle.
  await supabase
    .from("cars")
    .update({
      brand,
      model,
      year: yearRaw ? Number(yearRaw) : null,
      license_plate: plate || null,
      vin: vin || null,
      body_type: readBodyType(formData),
    })
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/");
  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function uploadDocument(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const serviceId = Number(formData.get("serviceId"));
  const file = formData.get("file");
  if (!serviceId || !(file instanceof File) || file.size === 0) return { error: null };

  const tooLarge = documentTooLargeMessage(file);
  if (tooLarge) return { error: tooLarge };

  // The Service Record must belong to the User. Scope by `user_id` rather than trusting the
  // select: an Administrator's RLS policy can read every row, so a bare lookup would let a
  // Document be attached to somebody else's Service Record.
  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!service) return { error: "Услугата не е намерена." };

  // Quota gate: Free is capped at 1 Document per Service Record → Paywall (ADR-0003).
  const plan = await getPlan(supabase, userId);
  if (!canAddDocument(plan, await countDocuments(supabase, serviceId))) {
    redirect("/paywall?reason=document");
  }

  const stored = await storeDocument(supabase, authUser.id, userId, serviceId, file);

  revalidatePath("/documents");
  revalidatePath("/");
  return stored ? { error: null } : { error: "Документът не се качи. Опитай пак." };
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

export async function updateUserName(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  await supabase
    .from("users")
    .update({ name: name || null })
    .eq("id", userId);

  revalidatePath("/account");
  redirect("/account?saved=name");
}

export async function updatePassword(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const password = String(formData.get("password") ?? "");
  if (password.length < 6) redirect("/account?error=password");

  const { error } = await supabase.auth.updateUser({ password });
  redirect(error ? "/account?error=password" : "/account?saved=password");
}

export async function startProCheckout(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const period = formData.get("period") === "annual" ? "annual" : "monthly";
  const secret = process.env.STRIPE_SECRET_KEY;
  const price =
    period === "annual"
      ? process.env.STRIPE_PRICE_PRO_ANNUAL
      : process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!secret || !price) redirect("/paywall?error=soon"); // Stripe not configured yet

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host") ?? "localhost:3000"}`;

  // Hosted Stripe Checkout (REST — no SDK). The webhook flips the Plan to Pro on success.
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": "14",
    client_reference_id: String(userId),
    customer_email: user.email ?? "",
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/paywall`,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const session = (await res.json()) as { url?: string };
  if (!res.ok || !session.url) redirect("/paywall?error=checkout");
  redirect(session.url);
}

export async function openBillingPortal(): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  const customer = sub?.stripe_customer_id;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!customer || !secret) redirect("/account?error=portal");

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host") ?? "localhost:3000"}`;
  const body = new URLSearchParams({ customer, return_url: `${origin}/account` });

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const session = (await res.json()) as { url?: string };
  if (!res.ok || !session.url) redirect("/account?error=portal");
  redirect(session.url);
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

export async function addService(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const vehicleId = Number(formData.get("vehicleId"));
  const serviceType = String(formData.get("serviceType") ?? "");
  const expiryDate = String(formData.get("expiryDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!vehicleId || !serviceType || !expiryDate) {
    return { error: "Избери вид услуга и дата." };
  }

  // Refuse an oversized Document here too — the browser guards it, but a request that
  // slipped past must not lose the whole Service Record without a word.
  const file = formData.get("document");
  const tooLarge = file instanceof File ? documentTooLargeMessage(file) : null;
  if (tooLarge) return { error: tooLarge };

  // Quota gate: Free is capped at 2 Service Records per Vehicle → Paywall (ADR-0003).
  const plan = await getPlan(supabase, userId);
  if (!canAddService(plan, await countServices(supabase, vehicleId))) {
    redirect("/paywall?reason=service");
  }

  const { data: created, error } = await supabase
    .from("services")
    .insert({
      car_id: vehicleId,
      user_id: userId,
      service_type: serviceType,
      expiry_date: expiryDate,
      notes: notes || null,
      cost: readCost(formData),
    })
    .select("id")
    .single();

  if (error || !created) {
    Sentry.captureException(error ?? new Error("addService: insert returned no row"));
    return { error: "Услугата не беше записана. Провери връзката и опитай пак." };
  }

  // Optionally attach a Document supplied with the form (visible in /documents).
  if (file instanceof File && file.size > 0) {
    await storeDocument(supabase, authUser.id, userId, created.id, file);
  }

  revalidatePath("/");
  revalidatePath("/documents");
  redirect("/");
}

export async function updateService(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const serviceId = Number(formData.get("serviceId"));
  const serviceType = String(formData.get("serviceType") ?? "");
  const expiryDate = String(formData.get("expiryDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!serviceId || !serviceType || !expiryDate) return;

  // `.eq("user_id")` + RLS scope the update to the owner. Editing the Expiry Date (a renewal)
  // keeps the Service Record's Documents and re-derives reminders.
  await supabase
    .from("services")
    .update({
      service_type: serviceType,
      expiry_date: expiryDate,
      notes: notes || null,
      cost: readCost(formData),
    })
    .eq("id", serviceId)
    .eq("user_id", userId);

  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath("/reminders");
  redirect("/");
}

export async function deleteService(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = await resolveUserId(supabase);
  if (!userId) redirect("/login");

  const serviceId = Number(formData.get("serviceId"));
  if (!serviceId) return;

  // `.eq("user_id")` is what actually scopes this — an Administrator's RLS policy allows
  // deleting *any* Service Record, so RLS alone would let a crafted id remove someone else's.
  await supabase.from("services").delete().eq("id", serviceId).eq("user_id", userId);
  revalidatePath("/");
}

/**
 * Delete the signed-in User's account and every trace of their data (GDPR Art. 17).
 * Irreversible, so it is gated on typing DELETE_ACCOUNT_CONFIRMATION.
 *
 * The ordering rule (Storage objects before the Auth Identity, which cascades the rows)
 * lives in `@glovebox/core`; the mobile app runs the same purge via /api/account/delete.
 */
export async function deleteAccount(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (String(formData.get("confirm") ?? "").trim() !== DELETE_ACCOUNT_CONFIRMATION) {
    redirect("/account?error=confirm");
  }

  try {
    await purgeAccount(new SupabaseAccountPurge(createAdminClient()), user.id);
  } catch (error) {
    Sentry.captureException(error);
    redirect("/account?error=delete");
  }

  // The Auth Identity is gone; drop the stale session cookie before leaving.
  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
