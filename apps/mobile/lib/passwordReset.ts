import { createClient } from "@supabase/supabase-js";

import { SITE_URL } from "./config";

/**
 * Forgotten password: Supabase e-mails a link to the website's /auth/reset, where the new one is
 * set; the app is then signed into with it.
 *
 * A client of its own, without PKCE: the app's client uses PKCE for Google and Apple, and a PKCE
 * link only works on the device that asked. This link carries the session itself, so it works
 * wherever the mail is opened.
 */
const client = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: {
    flowType: "implicit",
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: "glovebox-password-reset",
  },
});

/** Ask for the e-mail. Resolves with the auth error, if any, for the caller to word. */
export async function requestPasswordReset(email: string) {
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${SITE_URL}/auth/reset`,
  });
  return error;
}
