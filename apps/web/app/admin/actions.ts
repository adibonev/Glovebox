"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user's `users.id` if they are an Administrator, else null. */
async function adminUserId(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Read the flag with the service-role client (independent of RLS) against the session user.
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return data?.is_admin ? data.id : null;
}

/** Set a User's Plan by email (admin only) — the manual "comp Pro" / revoke. */
async function setPlan(formData: FormData, plan: "pro" | "free"): Promise<void> {
  if (!(await adminUserId())) redirect("/"); // not an admin — bounce

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/admin?error=empty");

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (!target) redirect(`/admin?error=notfound&email=${encodeURIComponent(email)}`);

  await admin.from("subscriptions").upsert(
    {
      user_id: target.id,
      plan,
      status: plan === "pro" ? "comp" : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/admin");
  redirect(`/admin?ok=${plan}&email=${encodeURIComponent(email)}`);
}

export async function grantPro(formData: FormData): Promise<void> {
  await setPlan(formData, "pro");
}

export async function revokePro(formData: FormData): Promise<void> {
  await setPlan(formData, "free");
}
