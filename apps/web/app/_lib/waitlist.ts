"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type WaitlistState = { done: boolean; error: string | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Someone on Android asking to hear when the app reaches Google Play. Written with the service
 * role: the table has no client policies at all. Signing up twice is not an error.
 */
export async function joinAndroidWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const source = String(formData.get("source") ?? "").slice(0, 40) || null;
  if (!EMAIL.test(email) || email.length > 200) return { done: false, error: "Провери имейла." };

  const { error } = await createAdminClient()
    .from("android_waitlist")
    .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });
  return error ? { done: false, error: "Не се записа. Опитай пак." } : { done: true, error: null };
}
