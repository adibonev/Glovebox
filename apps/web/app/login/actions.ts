"use server";

import * as Sentry from "@sentry/nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { authErrorMessage } from "../_lib/labels";

export type AuthState = { error?: string; message?: string };

/** The forgotten-password form: the address a link went to, or what stopped it. */
export type ResetState = { sent?: string; error?: string };

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
    if (error) return { error: authErrorMessage(error) };
    if (!data.session) {
      return {
        message:
          "Регистрацията е приета. Отвори писмото, което ти пратихме, и потвърди имейла си.",
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: authErrorMessage(error) };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Forgotten password: Supabase e-mails a link to /auth/reset, where the new one is set.
 *
 * Asked without PKCE on purpose. A PKCE link only works in the browser that asked for it, and
 * people read that mail on their phone; this link carries the session itself, so it works
 * wherever it is opened. The answer is the same whether or not the address has a profile, so the
 * form cannot be used to find out who has one.
 */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Напиши имейла, с който влизаш." };

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host") ?? "localhost:3000"}`;
  const client = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` });
  if (error) {
    if (error.status !== 429) Sentry.captureException(error);
    return { error: authErrorMessage(error) };
  }
  return { sent: email };
}
