"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

/** Start the Google OAuth flow; Supabase returns the consent URL to redirect to. */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host") ?? "localhost:3000"}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

/** Email/password sign-in or sign-up, chosen by the form's `intent` button. */
export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const intent = formData.get("intent");

  if (!email || !password) {
    return { error: "Въведете имейл и парола." };
  }

  const supabase = await createClient();

  if (intent === "signup") {
    const confirm = String(formData.get("confirm") ?? "");
    if (password.length < 6) {
      return { error: "Паролата трябва да е поне 6 знака." };
    }
    if (password !== confirm) {
      return { error: "Паролите не съвпадат." };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.session) {
      return {
        message:
          "Регистрацията е приета. Ако имейл потвърждението е включено, проверете пощата си.",
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
