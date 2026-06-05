import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "@glovebox/core";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

// Public client keys (anon) — fine to ship in the app bundle (RLS protects the data).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * The mobile Supabase client. Same `core` repository seam as web — the repositories
 * take an injected SupabaseClient<Database>; here it persists the session in
 * AsyncStorage (no cookies on native).
 */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection on native (that's a web/OAuth-redirect concern).
    detectSessionInUrl: false,
    // PKCE for the OAuth (Google/Apple) deep-link flow: the redirect returns a `code`
    // we exchange for a session (see lib/oauth.ts).
    flowType: "pkce",
  },
});

// Refresh the token only while the app is in the foreground (Supabase RN guidance).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
